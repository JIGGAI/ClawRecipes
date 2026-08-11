/**
 * Verifier primitives for workflow nodes.
 *
 * Motivation: workflow loops and graph extraction need machine-checkable
 * verifiers, not "looks good" model self-review. These are pure functions
 * with a common result shape so they can be composed into node output
 * validation, loop stop conditions, and (later) graph extraction gates.
 *
 * Design rules:
 *   - No I/O. Verifiers take already-loaded data.
 *   - No throws. Failures become {ok:false, errors:[...]}.
 *   - Deterministic. Same input -> same result.
 *   - Composable via `all()` / `any()`.
 */

export type VerifierResult = {
  ok: boolean;
  verifier: string;
  errors: string[];
  details?: Record<string, unknown>;
};

function ok(verifier: string, details?: Record<string, unknown>): VerifierResult {
  return { ok: true, verifier, errors: [], ...(details ? { details } : {}) };
}

function fail(verifier: string, errors: string[], details?: Record<string, unknown>): VerifierResult {
  return { ok: false, verifier, errors, ...(details ? { details } : {}) };
}

/**
 * Verify that a string is valid JSON. Returns the parsed value in details.
 */
export function verifyJsonParse(input: string): VerifierResult {
  if (typeof input !== 'string') {
    return fail('json-parse', ['input is not a string']);
  }
  try {
    const parsed = JSON.parse(input);
    return ok('json-parse', { parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return fail('json-parse', [`invalid JSON: ${msg}`]);
  }
}

/**
 * Verify that a value has all required top-level fields (non-empty).
 * A field is "present" if it is not undefined, not null, and not an empty string.
 * Empty arrays/objects count as present (caller can add stricter checks).
 */
export function verifyRequiredFields(
  value: unknown,
  fields: string[],
): VerifierResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail('required-fields', ['value is not a plain object']);
  }
  const obj = value as Record<string, unknown>;
  const missing: string[] = [];
  for (const f of fields) {
    const v = obj[f];
    if (v === undefined || v === null || v === '') {
      missing.push(f);
    }
  }
  if (missing.length > 0) {
    return fail('required-fields', missing.map((f) => `missing field: ${f}`), { missing });
  }
  return ok('required-fields');
}

/**
 * Verify that a string matches a regex.
 */
export function verifyRegex(input: string, pattern: RegExp): VerifierResult {
  if (typeof input !== 'string') {
    return fail('regex', ['input is not a string']);
  }
  if (!(pattern instanceof RegExp)) {
    return fail('regex', ['pattern is not a RegExp']);
  }
  if (!pattern.test(input)) {
    return fail('regex', [`input does not match ${pattern.toString()}`]);
  }
  return ok('regex');
}

/**
 * Verify that a string length falls within [min, max] (inclusive).
 * Pass Infinity for no upper bound.
 */
export function verifyLength(input: string, min: number, max: number): VerifierResult {
  if (typeof input !== 'string') {
    return fail('length', ['input is not a string']);
  }
  const n = input.length;
  if (n < min) return fail('length', [`length ${n} < min ${min}`], { length: n });
  if (n > max) return fail('length', [`length ${n} > max ${max}`], { length: n });
  return ok('length', { length: n });
}

/**
 * Verify that a value is one of the allowed values (strict equality).
 */
export function verifyEnum<T>(value: T, allowed: readonly T[]): VerifierResult {
  if (!allowed.includes(value)) {
    return fail('enum', [`value ${JSON.stringify(value)} not in allowed set`], {
      allowed: [...allowed],
    });
  }
  return ok('enum');
}

/**
 * Verify a temporal edge: valid_from must be a parseable date, and if
 * valid_until is present it must be a parseable date >= valid_from.
 * Accepts either ISO strings or numeric epoch millis.
 */
export function verifyTemporalEdge(edge: {
  valid_from?: unknown;
  valid_until?: unknown;
}): VerifierResult {
  const errors: string[] = [];
  const from = parseTime(edge.valid_from);
  if (edge.valid_from !== undefined && from === null) {
    errors.push(`valid_from is not a parseable date: ${JSON.stringify(edge.valid_from)}`);
  }
  let until: number | null = null;
  if (edge.valid_until !== undefined && edge.valid_until !== null && edge.valid_until !== '') {
    until = parseTime(edge.valid_until);
    if (until === null) {
      errors.push(`valid_until is not a parseable date: ${JSON.stringify(edge.valid_until)}`);
    }
  }
  if (from !== null && until !== null && until < from) {
    errors.push(`valid_until (${edge.valid_until}) is before valid_from (${edge.valid_from})`);
  }
  if (errors.length > 0) return fail('temporal-edge', errors);
  return ok('temporal-edge');
}

function parseTime(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

/**
 * Verify that a value is a non-empty array where every item passes `itemCheck`.
 * Errors are aggregated with array indices.
 */
export function verifyArrayItems<T>(
  value: unknown,
  itemCheck: (item: unknown, index: number) => VerifierResult,
  opts?: { allowEmpty?: boolean },
): VerifierResult {
  if (!Array.isArray(value)) {
    return fail('array-items', ['value is not an array']);
  }
  if (value.length === 0 && !opts?.allowEmpty) {
    return fail('array-items', ['array is empty']);
  }
  const errors: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const r = itemCheck(value[i], i);
    if (!r.ok) {
      for (const e of r.errors) errors.push(`[${i}] ${e}`);
    }
  }
  if (errors.length > 0) return fail('array-items', errors);
  return ok('array-items', { count: value.length });
  void 0 as unknown as T; // keep generic parameter reachable for callers
}

/**
 * Compose verifiers with AND semantics. Stops aggregating at first error type
 * but collects all errors from all verifiers so callers see the full picture.
 */
export function all(results: VerifierResult[]): VerifierResult {
  const errors: string[] = [];
  const names: string[] = [];
  for (const r of results) {
    names.push(r.verifier);
    if (!r.ok) {
      for (const e of r.errors) errors.push(`${r.verifier}: ${e}`);
    }
  }
  if (errors.length > 0) return fail('all', errors, { checked: names });
  return ok('all', { checked: names });
}

/**
 * Compose verifiers with OR semantics. Passes if any child passes.
 */
export function any(results: VerifierResult[]): VerifierResult {
  if (results.length === 0) return fail('any', ['no verifiers provided']);
  if (results.some((r) => r.ok)) return ok('any', { checked: results.map((r) => r.verifier) });
  const errors: string[] = [];
  for (const r of results) {
    for (const e of r.errors) errors.push(`${r.verifier}: ${e}`);
  }
  return fail('any', errors);
}
