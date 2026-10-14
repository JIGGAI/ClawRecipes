#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function usage() {
  return [
    'Usage: node scripts/memory-injection-report.mjs [--date YYYY-MM-DD] [--days N] [team-root|log-dir|jsonl ...]',
    '',
    'Defaults to a 7-day window ending today and discovers ~/.openclaw/workspace-* team roots.',
  ].join('\n');
}

export function parseArgs(argv) {
  const options = { date: new Date().toISOString().slice(0, 10), days: 7, inputs: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--date') options.date = argv[++index];
    else if (arg === '--days') options.days = Number(argv[++index]);
    else if (arg === '--help' || arg === '-h') options.help = true;
    else options.inputs.push(arg);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date || '')) throw new Error('--date must be YYYY-MM-DD');
  if (!Number.isInteger(options.days) || options.days < 1) throw new Error('--days must be a positive integer');
  return options;
}

function dateRange(endDate, days) {
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(end.getTime())) throw new Error(`Invalid date: ${endDate}`);
  const dates = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    dates.push(new Date(end.getTime() - offset * 86_400_000).toISOString().slice(0, 10));
  }
  return dates;
}

async function exists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function defaultInputs() {
  const stateDir = process.env.OPENCLAW_STATE_DIR || path.join(os.homedir(), '.openclaw');
  let entries = [];
  try {
    entries = await fs.readdir(stateDir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('workspace-'))
    .map((entry) => path.join(stateDir, entry.name));
}

async function logFilesForInput(input, dates) {
  const resolved = path.resolve(input);
  let stat;
  try {
    stat = await fs.stat(resolved);
  } catch {
    return [];
  }
  if (stat.isFile()) return resolved.endsWith('.jsonl') ? [resolved] : [];

  const candidates = [
    resolved,
    path.join(resolved, 'memory-injection-log'),
    path.join(resolved, 'agent-outputs', 'memory-injection-log'),
    path.join(resolved, 'shared-context', 'agent-outputs', 'memory-injection-log'),
  ];
  for (const candidate of candidates) {
    if (!await exists(candidate)) continue;
    const candidateStat = await fs.stat(candidate);
    if (!candidateStat.isDirectory()) continue;
    const files = [];
    for (const date of dates) {
      const logFile = path.join(candidate, `${date}.jsonl`);
      if (await exists(logFile)) files.push(logFile);
    }
    if (files.length || path.basename(candidate) === 'memory-injection-log') return files;
  }
  return [];
}

async function readRecords(files) {
  const records = [];
  let malformed = 0;
  for (const file of [...new Set(files)]) {
    const content = await fs.readFile(file, 'utf8');
    for (const line of content.split('\n').filter(Boolean)) {
      try {
        const record = JSON.parse(line);
        if (record && typeof record === 'object') records.push(record);
        else malformed++;
      } catch {
        malformed++;
      }
    }
  }
  return { records, malformed };
}

function percentile(values, fraction) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

export function summarize(records) {
  const tokens = records.map((record) => Number(record.tokens_injected) || 0);
  const dropped = records.map((record) => Number(record.items_dropped_by_cap) || 0);
  const capHits = records.filter((record) => {
    const injected = Number(record.tokens_injected) || 0;
    const cap = Number(record.token_cap) || 2000;
    return (Number(record.items_dropped_by_cap) || 0) > 0 || injected >= cap;
  }).length;
  const teamVolumes = new Map();
  for (const record of records) {
    const teamId = String(record.teamId || 'unknown');
    const current = teamVolumes.get(teamId) || { runs: 0, tokens: 0 };
    current.runs++;
    current.tokens += Number(record.tokens_injected) || 0;
    teamVolumes.set(teamId, current);
  }
  return {
    runs: records.length,
    p50: percentile(tokens, 0.5),
    p95: percentile(tokens, 0.95),
    capHitPercent: records.length ? capHits / records.length * 100 : 0,
    averageDropped: records.length ? dropped.reduce((sum, value) => sum + value, 0) / records.length : 0,
    teams: [...teamVolumes.entries()]
      .map(([teamId, volume]) => ({ teamId, ...volume }))
      .sort((a, b) => b.tokens - a.tokens || a.teamId.localeCompare(b.teamId)),
  };
}

export function formatReport(summary, dates, fileCount, malformed) {
  const lines = [
    `Memory injection report: ${dates[0]} to ${dates[dates.length - 1]}`,
    `Runs: ${summary.runs} (${fileCount} log files${malformed ? `, ${malformed} malformed lines skipped` : ''})`,
    `Tokens injected: p50 ${summary.p50.toFixed(0)}, p95 ${summary.p95.toFixed(0)}`,
    `Runs hitting cap: ${summary.capHitPercent.toFixed(1)}%`,
    `Average items dropped by cap: ${summary.averageDropped.toFixed(2)}`,
    'Top teams by injection volume:',
  ];
  if (summary.teams.length === 0) lines.push('  (no data)');
  for (const team of summary.teams.slice(0, 10)) {
    lines.push(`  ${team.teamId}: ${team.tokens.toFixed(0)} tokens across ${team.runs} runs`);
  }
  return lines.join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const dates = dateRange(options.date, options.days);
  const inputs = options.inputs.length ? options.inputs : await defaultInputs();
  const nestedFiles = await Promise.all(inputs.map((input) => logFilesForInput(input, dates)));
  const files = [...new Set(nestedFiles.flat())];
  const { records, malformed } = await readRecords(files);
  console.log(formatReport(summarize(records), dates, files.length, malformed));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`memory-injection-report: ${error.message}`);
    process.exitCode = 1;
  });
}
