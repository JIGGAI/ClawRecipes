import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';

export interface MediaDriverInvokeOpts {
  api: OpenClawPluginApi;
  prompt: string;
  outputDir: string;
  timeout: number;
  config?: Record<string, unknown>;
}

const DEFAULT_DURATION_SECONDS = 15;

/** Parse duration from node config (e.g. "5s", "10", 15) → seconds as string. */
export function parseDuration(config?: Record<string, unknown>): string {
  const raw = config?.duration;
  if (raw == null) return String(DEFAULT_DURATION_SECONDS);
  const s = String(raw).replace(/s$/i, '').trim();
  const n = parseInt(s, 10);
  if (Number.isNaN(n) || n <= 0) return String(DEFAULT_DURATION_SECONDS);
  return String(n);
}

export interface MediaDriverResult {
  filePath: string;
  metadata?: Record<string, unknown>;
}

export interface DurationConstraints {
  /** Minimum duration in seconds */
  minSeconds: number;
  /** Maximum duration in seconds */
  maxSeconds: number;
  /** Default duration in seconds */
  defaultSeconds: number;
  /** Allowed step increments (null = any integer) */
  stepSeconds?: number;
}

export interface MediaDriver {
  /** ClawHub slug or skill folder name */
  slug: string;
  /** What this driver produces */
  mediaType: 'image' | 'video' | 'audio';
  /** Display name for UI */
  displayName: string;
  /** Env vars needed (checked for availability in provider dropdown) */
  requiredEnvVars: string[];
  /** Duration constraints for video/audio providers (null for image) */
  durationConstraints: DurationConstraints | null;
  /** Run the generation */
  invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult>;
}