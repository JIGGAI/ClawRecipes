import fs from 'node:fs/promises';
import path from 'node:path';
import type { Workflow, WorkflowNode } from './workflow-types';

async function fileExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function assertPathWithinDir(baseDir: string, candidatePath: string, label = 'path') {
  const baseResolved = path.resolve(baseDir);
  const candResolved = path.resolve(candidatePath);
  const basePrefix = baseResolved + path.sep;
  if (candResolved !== baseResolved && !candResolved.startsWith(basePrefix)) {
    throw new Error(`${label} must be within ${baseResolved}: ${candResolved}`);
  }
}

function safeJsonStringify(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v ?? '');
  }
}

export async function loadProposedPostTextFromPriorNode(opts: {
  runDir: string;
  nodeOutputsDir: string;
  priorNodeId: string;
  platform?: string;
}): Promise<string> {
  const { runDir, nodeOutputsDir, priorNodeId } = opts;
  const platform = String(opts.platform ?? 'x').trim() || 'x';

  // Explicitly scope all reads to the run directory to avoid accidental broad workspace access.
  assertPathWithinDir(runDir, nodeOutputsDir, 'nodeOutputsDir');

  // Node outputs are stored as JSON with { text: "..." } where text may itself be JSON.
  const files = await fs.readdir(nodeOutputsDir);

  // Only allow the canonical node-output naming scheme.
  const safe = files.filter((f) => /^\d{3}-[a-z0-9_-]+\.json$/i.test(f));
  const match = safe.find((f) => f.endsWith(`-${priorNodeId}.json`));
  if (!match) return '';

  const outputPath = path.join(nodeOutputsDir, match);
  assertPathWithinDir(runDir, outputPath, 'node output');

  const outRaw = await fs.readFile(outputPath, 'utf8');
  const outObj = JSON.parse(outRaw) as { text?: string };
  const rawText = String(outObj.text ?? '').trim();
  if (!rawText) return '';

  // Try to parse { platforms: { <platform>: { hook, body } } }.
  try {
    const packet = JSON.parse(rawText) as unknown;
    const packetObj = (packet && typeof packet === 'object') ? (packet as Record<string, unknown>) : {};
    const platformsObj = (packetObj.platforms && typeof packetObj.platforms === 'object') ? (packetObj.platforms as Record<string, unknown>) : {};
    const pObj = (platformsObj[platform] && typeof platformsObj[platform] === 'object') ? (platformsObj[platform] as Record<string, unknown>) : {};

    const hook = typeof pObj.hook === 'string' ? pObj.hook.trim() : '';
    const body = typeof pObj.body === 'string' ? pObj.body.trim() : '';
    const combined = [hook, body].filter(Boolean).join('\n\n').trim();
    return combined || rawText;
  } catch {
    return rawText;
  }
}

export async function loadPriorLlmInput(opts: {
  runDir: string;
  workflow: Workflow;
  currentNode: WorkflowNode;
  currentNodeIndex: number;
}): Promise<Record<string, unknown>> {
  const { runDir, workflow, currentNode, currentNodeIndex } = opts;
  const nodeOutputsDir = path.join(runDir, 'node-outputs');
  if (!(await fileExists(nodeOutputsDir))) return {};

  assertPathWithinDir(runDir, nodeOutputsDir, 'nodeOutputsDir');

  const files = (await fs.readdir(nodeOutputsDir)).filter((f) => /^\d{3}-[a-z0-9_-]+\.json$/i.test(f)).sort();

  // Map nodeId -> { idx, path } where idx is the numeric prefix from the filename.
  const byNodeId = new Map<string, { idx: number; p: string }>();
  for (const f of files) {
    const m = f.match(/^(\d{3})-([a-z0-9_-]+)\.json$/i);
    if (!m) continue;
    byNodeId.set(String(m[2]), { idx: Number(m[1]), p: path.join(nodeOutputsDir, f) });
  }

  // Determine upstream nodes.
  const upstreamNodeIds = new Set<string>();
  for (const e of Array.isArray(workflow.edges) ? workflow.edges : []) {
    if (String(e.to ?? '').trim() === String(currentNode.id ?? '').trim()) {
      const from = String(e.from ?? '').trim();
      if (from) upstreamNodeIds.add(from);
    }
  }
  // Sequential fallback for legacy/no-edge workflows.
  if (!upstreamNodeIds.size && currentNodeIndex > 0) {
    const prev = workflow.nodes[currentNodeIndex - 1];
    const prevId = String(prev?.id ?? '').trim();
    if (prevId) upstreamNodeIds.add(prevId);
  }

  const parseNodeOutput = async (nodeId: string) => {
    const hit = byNodeId.get(nodeId);
    if (!hit) return null;
    const { idx, p } = hit;

    assertPathWithinDir(runDir, p, 'node output');
    const raw = await fs.readFile(p, 'utf8');
    const obj = JSON.parse(raw) as { text?: string; [k: string]: unknown };
    const text = String(obj.text ?? '').trim();

    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // leave as string
    }

    return {
      nodeId,
      idx,
      path: path.relative(runDir, p),
      parsed,
      text,
      raw: obj,
    };
  };

  const inputs: Array<Record<string, unknown> & { idx: number; nodeId: string }> = [];
  for (const nodeId of upstreamNodeIds) {
    const loaded = await parseNodeOutput(nodeId);
    if (loaded) inputs.push(loaded);
  }

  // IMPORTANT: when there are multiple upstream nodes, pick the most recently-executed one
  // (highest idx from node-output filename) as "previousNode".
  inputs.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
  const latest = inputs.length ? inputs[inputs.length - 1] : null;

  const previousNodeOutput = latest?.parsed ?? null;

  // Back-compat / prompt ergonomics: many prompt templates refer to INPUT_JSON explicitly.
  // Provide it as a JSON string of the immediate prior node output.
  const INPUT_JSON = latest ? safeJsonStringify(previousNodeOutput) : '';

  return {
    priorNodeIds: Array.from(upstreamNodeIds),
    upstream: inputs,
    previousNode: latest,
    previousNodeId: latest?.nodeId ?? null,
    previousNodeOutput,
    INPUT_JSON,
    inputJson: previousNodeOutput,
  };
}
