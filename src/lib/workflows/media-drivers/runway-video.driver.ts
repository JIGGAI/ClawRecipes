import * as path from 'path';
import { MediaDriver, MediaDriverInvokeOpts, MediaDriverResult, DurationConstraints, parseDuration } from './types';
import { findSkillDir, findVenvPython, runScript, parseMediaOutput } from './utils';

export class RunwayVideo implements MediaDriver {
  slug = 'runway-video';
  mediaType = 'video' as const;
  displayName = 'Runway Video Generation';
  requiredEnvVars = ['RUNWAYML_API_SECRET'];
  durationConstraints: DurationConstraints = { minSeconds: 5, maxSeconds: 10, defaultSeconds: 10, stepSeconds: 5 };

  async invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult> {
    const { prompt, outputDir, env, timeout, config } = opts;
    const duration = parseDuration(config);

    // Find the skill directory
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }

    // Find the script
    const scriptPath = path.join(skillDir, 'generate_video.py');
    
    // Find Python runner
    const runner = await findVenvPython(skillDir);

    // Execute the script with stdin input
    const scriptOutput = runScript({
      runner,
      script: scriptPath,
      stdin: prompt,
      env: {
        ...env,
        HOME: process.env.HOME || '/home/control',
        MEDIA_DURATION: duration,
        MEDIA_ASPECT_RATIO: String(config?.aspect_ratio ?? config?.size ?? '1280:768'),
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