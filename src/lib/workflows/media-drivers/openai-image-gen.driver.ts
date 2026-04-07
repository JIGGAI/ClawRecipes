import * as path from 'path';
import { MediaDriver, MediaDriverInvokeOpts, MediaDriverResult } from './types';
import { findSkillDir, findVenvPython, runScript, parseMediaOutput } from './utils';

export class OpenAIImageGen implements MediaDriver {
  slug = 'openai-image-gen';
  mediaType = 'image' as const;
  displayName = 'OpenAI Image Generation (DALL-E)';
  requiredEnvVars = ['OPENAI_API_KEY'];
  durationConstraints = null;

  async invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult> {
    const { prompt, outputDir, env, timeout, config } = opts;

    // Find the skill directory
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }

    // Find the script
    const scriptPath = path.join(skillDir, 'generate_image.py');
    
    // Find Python runner
    const runner = await findVenvPython(skillDir);

    // Pass size via env var (script reads DALL_E_SIZE, defaults to 1024x1024)
    const size = String(config?.size ?? '1024x1024');

    // Execute the script with stdin input
    const scriptOutput = runScript({
      runner,
      script: scriptPath,
      stdin: prompt,
      env: {
        ...env,
        HOME: process.env.HOME || '/home/control',
        DALL_E_SIZE: size,
      },
      cwd: outputDir,
      timeout,
    });

    // Parse the MEDIA: output
    const filePath = parseMediaOutput(scriptOutput);
    
    if (!filePath) {
      throw new Error(`No MEDIA: path found in script output. Output: ${scriptOutput}`);
    }

    return {
      filePath,
      metadata: {
        skill: this.slug,
        prompt,
        script_output: scriptOutput,
      },
    };
  }
}