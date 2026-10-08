import fs from 'node:fs/promises';
import path from 'node:path';
import { fileExists, ensureDir } from './workflow-utils';
import { readTextFile } from './workflow-runner-io';

const MAX_MEMORY_TOKENS = 2000;
const TOKEN_ESTIMATE_FACTOR = 0.25;

export type MemoryContextInvocation = {
  teamId: string;
  runId: string;
  nodeId: string;
};

type MemoryStats = {
  filesScanned: string[];
  totalAvailableTokens: number;
  itemsAvailable: number;
  pinnedAvailable: number;
  pinnedIncluded: number;
  itemsIncluded: number;
  itemsDroppedByCap: number;
};

function estimateTokens(value: string): number {
  return value.length * TOKEN_ESTIMATE_FACTOR;
}

function summarizeMemoryLine(line: string): string | null {
  try {
    const item = JSON.parse(line) as Record<string, unknown>;
    const body = item.content || item.text;
    if (!body) return null;
    return `- ${String(body)} (${String(item.type || 'note')}, ${String(item.ts || '').slice(0, 10)})`;
  } catch {
    return null;
  }
}

function nonEmptyLines(content: string): string[] {
  return content.trim().split('\n').filter(Boolean);
}

async function appendMeasurement(
  teamDir: string,
  invocation: MemoryContextInvocation,
  stats: MemoryStats,
  context: string,
): Promise<void> {
  const timestamp = new Date().toISOString();
  const logDir = path.join(teamDir, 'shared-context', 'agent-outputs', 'memory-injection-log');
  await ensureDir(logDir);
  const record = {
    timestamp,
    teamId: invocation.teamId,
    runId: invocation.runId,
    nodeId: invocation.nodeId,
    tokens_injected: context ? Math.ceil(estimateTokens(context)) : 0,
    token_cap: MAX_MEMORY_TOKENS,
    items_included: stats.itemsIncluded,
    items_dropped_by_cap: stats.itemsDroppedByCap,
    pinned_included: stats.pinnedIncluded,
    pinned_available: stats.pinnedAvailable,
    files_scanned: stats.filesScanned,
    files_scanned_count: stats.filesScanned.length,
    total_available_tokens: Math.ceil(stats.totalAvailableTokens),
    items_available: stats.itemsAvailable,
  };
  await fs.appendFile(path.join(logDir, `${timestamp.slice(0, 10)}.jsonl`), `${JSON.stringify(record)}\n`, 'utf8');
}

/**
 * Build the existing pinned-first, recent-per-file memory context and record
 * measurement data without changing the context selection policy.
 */
export async function buildMemoryContext(
  teamDir: string,
  invocation: MemoryContextInvocation,
): Promise<string> {
  const stats: MemoryStats = {
    filesScanned: [],
    totalAvailableTokens: 0,
    itemsAvailable: 0,
    pinnedAvailable: 0,
    pinnedIncluded: 0,
    itemsIncluded: 0,
    itemsDroppedByCap: 0,
  };
  let context = '';

  try {
    const memoryDir = path.join(teamDir, 'shared-context', 'memory');
    if (await fileExists(memoryDir)) {
      const files = await fs.readdir(memoryDir);
      const jsonlFiles = files.filter((filename) => filename.endsWith('.jsonl'));
      const contents = new Map<string, string>();

      // Scan every memory JSONL for availability metrics. Read failures remain
      // best-effort here and retain the original injection failure behavior below.
      for (const filename of jsonlFiles) {
        try {
          const content = await readTextFile(path.join(memoryDir, filename));
          contents.set(filename, content);
          stats.filesScanned.push(filename);
          for (const line of nonEmptyLines(content)) {
            const summary = summarizeMemoryLine(line);
            if (!summary) continue;
            stats.itemsAvailable++;
            stats.totalAvailableTokens += estimateTokens(summary);
            if (filename === 'pinned.jsonl') stats.pinnedAvailable++;
          }
        } catch (error) {
          console.warn(`Memory measurement scan failed for ${filename}:`, error);
        }
      }

      const readMemoryFile = async (filename: string): Promise<string> => {
        const cached = contents.get(filename);
        if (cached !== undefined) return cached;
        return readTextFile(path.join(memoryDir, filename));
      };

      const memoryParts: string[] = [];
      let currentTokens = 0;
      const pinnedPath = path.join(memoryDir, 'pinned.jsonl');
      if (await fileExists(pinnedPath)) {
        const pinnedContent = await readMemoryFile('pinned.jsonl');
        const pinnedItems = nonEmptyLines(pinnedContent);
        if (pinnedItems.length > 0) {
          memoryParts.push('[Team Memory — Pinned]');
          for (const line of pinnedItems.slice(-5)) {
            const summary = summarizeMemoryLine(line);
            if (!summary) continue;
            const tokens = estimateTokens(summary);
            if (currentTokens + tokens < MAX_MEMORY_TOKENS) {
              memoryParts.push(summary);
              currentTokens += tokens;
              stats.itemsIncluded++;
              stats.pinnedIncluded++;
            } else {
              stats.itemsDroppedByCap++;
            }
          }
        }
      }

      const recentFiles = files.filter((filename) => filename.endsWith('.jsonl') && filename !== 'pinned.jsonl');
      for (let fileIndex = 0; fileIndex < recentFiles.length; fileIndex++) {
        if (currentTokens > MAX_MEMORY_TOKENS * 0.8) {
          for (const skippedFilename of recentFiles.slice(fileIndex)) {
            const skippedContent = contents.get(skippedFilename);
            if (skippedContent === undefined) continue;
            stats.itemsDroppedByCap += nonEmptyLines(skippedContent)
              .slice(-3)
              .filter((line) => summarizeMemoryLine(line) !== null)
              .length;
          }
          break;
        }

        const content = await readMemoryFile(recentFiles[fileIndex]!);
        const items = nonEmptyLines(content);
        if (items.length === 0) continue;
        for (const line of items.slice(-3)) {
          const summary = summarizeMemoryLine(line);
          if (!summary) continue;
          const tokens = estimateTokens(summary);
          if (currentTokens + tokens < MAX_MEMORY_TOKENS) {
            if (memoryParts.length === 1) memoryParts.push('', '[Team Memory — Recent]');
            memoryParts.push(summary);
            currentTokens += tokens;
            stats.itemsIncluded++;
          } else {
            stats.itemsDroppedByCap++;
          }
        }
      }

      if (memoryParts.length > 1) context = `${memoryParts.join('\n')}\n\n[Task]`;
    }
  } catch (error) {
    console.warn('Memory context injection failed:', error);
    context = '';
  }

  try {
    await appendMeasurement(teamDir, invocation, stats, context);
  } catch (error) {
    // Measurement must never prevent an LLM node from running.
    console.warn('Memory injection measurement failed:', error);
  }

  return context;
}
