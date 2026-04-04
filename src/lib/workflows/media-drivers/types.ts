export interface MediaDriverInvokeOpts {
  prompt: string;
  outputDir: string;
  env: Record<string, string>;
  timeout: number;
  config?: Record<string, unknown>;
}

export interface MediaDriverResult {
  filePath: string;
  metadata?: Record<string, unknown>;
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
  /** Run the generation */
  invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult>;
}