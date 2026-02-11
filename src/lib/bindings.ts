// Minimal extracted binding helper so we can test precedence without running the CLI.

import crypto from 'node:crypto';

export type BindingMatch = {
  channel?: string;
  peer?: string;
  [k: string]: any;
};

export type BindingSnippet = {
  agentId: string;
  match: BindingMatch;
  to: any;
  enabled?: boolean;
};

function stableStringify(obj: any) {
  const seen = new WeakSet();
  const walk = (x: any): any => {
    if (x && typeof x === 'object') {
      if (seen.has(x)) return '[Circular]';
      seen.add(x);
      if (Array.isArray(x)) return x.map(walk);
      const keys = Object.keys(x).sort();
      const out: any = {};
      for (const k of keys) out[k] = walk(x[k]);
      return out;
    }
    return x;
  };
  return JSON.stringify(walk(obj));
}

export function upsertBindingInConfig(cfgObj: any, binding: BindingSnippet) {
  if (!Array.isArray(cfgObj.bindings)) cfgObj.bindings = [];
  const list: any[] = cfgObj.bindings;

  const sigPayload = stableStringify({ agentId: binding.agentId, match: binding.match });
  const sig = crypto.createHash('sha256').update(sigPayload).digest('hex');

  const idx = list.findIndex((b: any) => {
    const payload = stableStringify({ agentId: b.agentId, match: b.match });
    const bsig = crypto.createHash('sha256').update(payload).digest('hex');
    return bsig === sig;
  });

  if (idx >= 0) {
    // Update in place (preserve ordering)
    list[idx] = { ...list[idx], ...binding };
    return { changed: false as const, note: 'already-present' as const };
  }

  // Most-specific-first: if a peer match is specified, insert at front so it wins.
  if (binding.match?.peer) list.unshift(binding);
  else list.push(binding);

  return { changed: true as const, note: 'added' as const };
}
