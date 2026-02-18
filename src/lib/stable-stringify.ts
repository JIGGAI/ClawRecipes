/**
 * JSON.stringify with deterministic key ordering and circular reference handling.
 * Used for generating stable hashes/signatures of objects.
 */
export function stableStringify(x: unknown): string {
  const seen = new WeakSet<object>();
  const sortObj = (v: unknown): unknown => {
    if (v !== null && typeof v === "object") {
      if (seen.has(v as object)) return "[Circular]";
      seen.add(v as object);
      if (Array.isArray(v)) return v.map(sortObj);
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) {
        out[k] = sortObj((v as Record<string, unknown>)[k]);
      }
      return out;
    }
    return v;
  };
  return JSON.stringify(sortObj(x));
}
