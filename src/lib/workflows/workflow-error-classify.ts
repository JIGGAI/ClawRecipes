import { ToolsInvokeError } from '../../toolsInvoke.js';

export type ErrorCategory = 'funding' | 'rate-limit' | 'auth' | 'timeout' | 'unknown';

const FUNDING_PATTERNS = [
  /insufficient.*(credits?|funds?|balance)/i,
  /billing/i,
  /payment\s+required/i,
  /quota\s+exceeded/i,
  /out\s+of\s+credits/i,
  /budget\s+(exceeded|limit)/i,
  /no\s+(active\s+)?subscription/i,
  /plan\s+(limit|exceeded)/i,
];

const RATE_LIMIT_PATTERNS = [
  /rate\s+limit/i,
  /too\s+many\s+requests/i,
  /throttl/i,
];

const AUTH_PATTERNS = [
  /unauthorized/i,
  /invalid.*api.?key/i,
  /forbidden/i,
  /authentication\s+failed/i,
  /access\s+denied/i,
];

function classifyByHttpStatus(status: number): ErrorCategory | null {
  if (status === 402) return 'funding';
  if (status === 429) return 'rate-limit';
  if (status === 401 || status === 403) return 'auth';
  if (status === 408 || status === 504) return 'timeout';
  return null;
}

function classifyByMessage(message: string, error: unknown): ErrorCategory | null {
  if (FUNDING_PATTERNS.some((p) => p.test(message))) return 'funding';
  if (RATE_LIMIT_PATTERNS.some((p) => p.test(message))) return 'rate-limit';
  if (AUTH_PATTERNS.some((p) => p.test(message))) return 'auth';
  if (error instanceof Error && error.name === 'AbortError') return 'timeout';
  if (/timed?\s*out/i.test(message)) return 'timeout';
  return null;
}

/**
 * Classify an error into a category based on HTTP status and message content.
 * Returns 'unknown' if the error doesn't match any known pattern.
 */
export function classifyError(error: unknown): ErrorCategory {
  const httpStatus = error instanceof ToolsInvokeError ? error.httpStatus : 0;
  const message = error instanceof Error ? error.message : String(error ?? '');

  return classifyByHttpStatus(httpStatus) ?? classifyByMessage(message, error) ?? 'unknown';
}

const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  'funding': 'Funding issue — the model provider may be out of credits or require payment',
  'rate-limit': 'Rate limit — the model provider is throttling requests',
  'auth': 'Authentication failure — the API key may be invalid or expired',
  'timeout': 'Timeout — the request took too long to complete',
  'unknown': 'Unknown error',
};

/** Human-readable label for an error category. */
export function errorCategoryLabel(category: ErrorCategory): string {
  return CATEGORY_LABELS[category] ?? CATEGORY_LABELS['unknown'];
}
