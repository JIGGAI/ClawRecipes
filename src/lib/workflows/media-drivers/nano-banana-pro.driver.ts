import * as path from 'path';
import { MediaDriver, MediaDriverInvokeOpts, MediaDriverResult } from './types';
import { findSkillDir, findVenvPython, runScript, loadConfigEnv } from './utils';

export class NanoBananaPro implements MediaDriver {
  slug = 'nano-banana-pro';
  mediaType = 'image' as const;
  displayName = 'Nano Banana Pro (Gemini Image Generation)';
  requiredEnvVars = ['GEMINI_API_KEY'];
  durationConstraints = null;

  async invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult> {
    const { prompt, outputDir, timeout, config } = opts;
    const env = await loadConfigEnv();

    // Find the skill directory
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }

    // Find the script
    const scriptPath = path.join(skillDir, 'scripts', 'generate_image.py');
    
    // Find Python runner - check for venv first, fallback to uv run
    let runner: string;
    try {
      runner = await findVenvPython(skillDir);
    } catch {
      // Fallback to uv run if no venv
      runner = 'uv run python';
    }

    // Generate a filename for the output
    const filename = 'output.png';

    // Map pixel size to resolution tier (nano-banana-pro uses 1K/2K/4K)
    const sizeStr = String(config?.size ?? '1024x1024');
    const maxDim = Math.max(...sizeStr.split('x').map(Number).filter(n => !isNaN(n)), 1024);
    const resolution = maxDim >= 3840 ? '4K' : maxDim >= 1792 ? '2K' : '1K';

    // Execute the script with argparse CLI interface
    const scriptOutput = await runScript({
      api: opts.api,
      runner,
      script: scriptPath,
      args: ['--prompt', prompt, '--filename', filename, '--resolution', resolution],
      env: {
        ...env,
        HOME: process.env.HOME || '/home/control',
      },
      cwd: outputDir,
      timeout,
    });

    // nano-banana-pro prints the full path on stdout
    const outputPath = scriptOutput.trim();
    
    if (!outputPath || !outputPath.includes('.')) {
      throw new Error(`No valid file path returned from script. Output: ${scriptOutput}`);
    }

    return {
      filePath: outputPath,
      metadata: {
        skill: this.slug,
        prompt,
        script_output: scriptOutput,
      },
    };
  }
}