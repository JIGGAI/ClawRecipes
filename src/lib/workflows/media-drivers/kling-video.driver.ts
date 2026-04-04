import * as path from 'path';
import * as fs from 'fs';
import { MediaDriver, MediaDriverInvokeOpts, MediaDriverResult, DurationConstraints, parseDuration } from './types';
import { findSkillDir, runScript, parseMediaOutput } from './utils';

/**
 * Kling AI video driver — uses official `klingai` ClawHub skill.
 *
 * Auth: JWT via ~/.config/kling/.credentials (Access Key + Secret Key).
 * NOT a simple Bearer API key — the skill's auth.mjs handles JWT signing.
 * No env var needed; credentials file is the source of truth.
 */
export class KlingVideo implements MediaDriver {
  slug = 'klingai';
  mediaType = 'video' as const;
  displayName = 'Kling AI Video (Official)';
  // Auth is via ~/.config/kling/.credentials, not env vars.
  // We check for the credentials file in a custom availability method.
  requiredEnvVars: string[] = [];
  durationConstraints: DurationConstraints = { minSeconds: 3, maxSeconds: 15, defaultSeconds: 5, stepSeconds: 1 };

  /**
   * Check if Kling credentials are configured (credentials file exists with AK/SK).
   */
  isConfigured(): boolean {
    const home = process.env.HOME || '/home/control';
    const credPath = path.join(home, '.config', 'kling', '.credentials');
    try {
      const content = fs.readFileSync(credPath, 'utf8');
      return content.includes('access_key_id') && content.includes('secret_access_key');
    } catch {
      return false;
    }
  }

  async invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult> {
    const { prompt, outputDir, env, timeout, config } = opts;
    // Kling supports 3-15s; clamp to valid range
    const rawDuration = Math.max(3, Math.min(15, Number(parseDuration(config))));
    const duration = String(rawDuration);

    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(
        `Skill directory not found for ${this.slug}. Install it: clawhub install klingai --force`
      );
    }

    const scriptPath = path.join(skillDir, 'scripts', 'video.mjs');

    // The official skill is a Node.js script (not Python)
    const runner = 'node';

    const scriptOutput = runScript({
      runner,
      script: scriptPath,
      args: [
        '--prompt', prompt,
        '--output_dir', outputDir,
        '--duration', duration,
        '--aspect_ratio', String(config?.aspect_ratio ?? config?.size ?? '16:9'),
        '--mode', 'pro',
      ],
      env: {
        ...env,
        HOME: process.env.HOME || '/home/control',
      },
      cwd: outputDir,
      timeout,
    });

    // The script prints "Done: /path/to/file.mp4" or "Saved: /path/to/file.mp4"
    const doneMatch = scriptOutput.match(/(?:Done|完成|Saved|已保存):\s*(.+\.mp4)/m);
    if (doneMatch) {
      return {
        filePath: doneMatch[1].trim(),
        metadata: { skill: this.slug, prompt },
      };
    }

    // Fallback: check for MEDIA: prefix (in case a bridge wrapper is used)
    const mediaPath = parseMediaOutput(scriptOutput);
    if (mediaPath) {
      return {
        filePath: mediaPath,
        metadata: { skill: this.slug, prompt },
      };
    }

    // Last resort: look for any .mp4 in output dir
    try {
      const files = fs.readdirSync(outputDir)
        .filter(f => f.endsWith('.mp4'))
        .sort()
        .reverse();
      if (files.length > 0) {
        return {
          filePath: path.join(outputDir, files[0]),
          metadata: { skill: this.slug, prompt },
        };
      }
    } catch {
      // ignore
    }

    throw new Error(
      `Could not find generated video in output. Script output:\n${scriptOutput}`
    );
  }
}
