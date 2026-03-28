import fs from 'node:fs/promises';
import path from 'node:path';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function asRecord(v: unknown): Record<string, unknown> {
  return isRecord(v) ? v : {};
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : v == null ? fallback : String(v);
}

function parseDotPath(p: string): Array<string> {
  return p
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getByPath(obj: unknown, p: string): unknown {
  const parts = parseDotPath(p);
  let cur: unknown = obj;
  for (const part of parts) {
    if (Array.isArray(cur)) {
      const idx = Number(part);
      if (!Number.isFinite(idx)) return undefined;
      cur = cur[idx];
      continue;
    }
    if (!isRecord(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

async function findNodeOutputFile(opts: { runDir: string; nodeId: string }): Promise<string | null> {
  const nodeOutputsDir = path.join(opts.runDir, 'node-outputs');
  try {
    const files = await fs.readdir(nodeOutputsDir);
    // Pick the latest by lexical sort (prefix is numeric padded; good enough).
    const matches = files.filter((f) => f.endsWith(`-${opts.nodeId}.json`)).sort();
    const pick = matches[matches.length - 1];
    return pick ? path.join(nodeOutputsDir, pick) : null;
  } catch {
    return null;
  }
}

export async function loadNodeOutputPayload(opts: { runDir: string; nodeId: string }): Promise<unknown> {
  const file = await findNodeOutputFile(opts);
  if (!file) return undefined;
  const raw = await fs.readFile(file, 'utf8');
  const parsed = JSON.parse(raw) as unknown;

  // Common shape for llm/tool nodes: { text: "{...json...}" }
  const rec = asRecord(parsed);
  const text = asString(rec['text']).trim();
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      // fall through
    }
  }

  return parsed;
}

export type IfComparator =
  | 'truthy'
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'contains';

export type IfCondition = {
  lhs: string;
  op: IfComparator;
  rhs?: unknown;
};

export async function evalIfCondition(opts: { runDir: string; condition: IfCondition }): Promise<{ ok: true; value: boolean; detail: Record<string, unknown> }> {
  const lhsRaw = asString(opts.condition.lhs).trim();
  const op = asString(opts.condition.op).trim() as IfComparator;
  const rhs = opts.condition.rhs;

  // Supported v1 reference format:
  // - nodes.<nodeId>.output.<path>
  // Anything else is treated as a literal string (for now).
  let lhsValue: unknown = undefined;
  let source: Record<string, unknown> = { kind: 'literal', lhs: lhsRaw };

  const m = lhsRaw.match(/^nodes\.([^.]+)\.output\.(.+)$/);
  if (m) {
    const nodeId = m[1] ?? '';
    const outPath = m[2] ?? '';
    const payload = await loadNodeOutputPayload({ runDir: opts.runDir, nodeId });
    lhsValue = getByPath(payload, outPath);
    source = { kind: 'nodeOutput', nodeId, path: outPath };
  } else {
    lhsValue = lhsRaw;
  }

  let value = false;

  if (op === 'truthy') {
    value = !!lhsValue;
  } else if (op === '==') {
    value = lhsValue === rhs;
  } else if (op === '!=') {
    value = lhsValue !== rhs;
  } else if (op === '>' || op === '>=' || op === '<' || op === '<=') {
    const a = typeof lhsValue === 'number' ? lhsValue : Number(lhsValue);
    const b = typeof rhs === 'number' ? rhs : Number(rhs);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      if (op === '>') value = a > b;
      if (op === '>=') value = a >= b;
      if (op === '<') value = a < b;
      if (op === '<=') value = a <= b;
    } else {
      value = false;
    }
  } else if (op === 'contains') {
    if (typeof lhsValue === 'string') value = typeof rhs === 'string' && lhsValue.includes(rhs);
    else if (Array.isArray(lhsValue)) value = lhsValue.some((x) => x === rhs);
    else value = false;
  } else {
    // Unknown op => false.
    value = false;
  }

  return {
    ok: true,
    value,
    detail: {
      source,
      op,
      rhs,
      lhsValue,
    },
  };
}

export function lastIfValueFromRun(run: { nodeResults?: Array<Record<string, unknown>> }, nodeId: string): boolean | null {
  const results = Array.isArray(run.nodeResults) ? run.nodeResults : [];
  for (let i = results.length - 1; i >= 0; i--) {
    const r = asRecord(results[i]);
    if (asString(r['nodeId']).trim() !== nodeId) continue;
    if (asString(r['kind']).trim() !== 'if') continue;
    const v = r['value'];
    if (typeof v === 'boolean') return v;
    break;
  }
  return null;
}
