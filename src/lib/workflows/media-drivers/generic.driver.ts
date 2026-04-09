import { MediaDriver, MediaDriverInvokeOpts, MediaDriverResult } from './types';
import { findSkillDir, findVenvPython, runScript, parseMediaOutput, findScriptInSkill, loadConfigEnv } from './utils';

export class GenericDriver implements MediaDriver {
  slug: string;
  mediaType: 'image' | 'video' | 'audio';
  displayName: string;
  requiredEnvVars: string[] = [];
  durationConstraints = null;

  constructor(slug: string, mediaType: 'image' | 'video' | 'audio', displayName?: string) {
    this.slug = slug;
    this.mediaType = mediaType;
    this.displayName = displayName || `Generic ${mediaType} driver for ${slug}`;
  }

  async invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult> {
    const { prompt, outputDir, timeout } = opts;
    const env = await loadConfigEnv();

    // Find the skill directory
    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) {
      throw new Error(`Skill directory not found for ${this.slug}`);
    }

    // Determine script candidates based on media type
    const scriptCandidates = this.mediaType === 'image'
      ? ['generate_image.py', 'generate_image.sh', 'generate.sh']
      : this.mediaType === 'video'
      ? ['generate_video.py', 'generate_video.sh', 'generate.py', 'generate.sh']
      : ['generate_audio.py', 'generate_audio.sh', 'generate.py', 'generate.sh'];

    // Find the script
    const scriptPath = await findScriptInSkill(skillDir, scriptCandidates);
    if (!scriptPath) {
      throw new Error(`No generation script found in ${skillDir}. Looked for: ${scriptCandidates.join(', ')}`);
    }

    // Determine runner
    let runner = 'bash';
    if (scriptPath.endsWith('.py')) {
      runner = await findVenvPython(skillDir);
    }

    // Execute the script with stdin input (most common interface)
    const scriptOutput = await runScript({
      api: opts.api,
      runner,
      script: scriptPath,
      stdin: prompt,
      env: {
        ...env,
        HOME: process.env.HOME || '/home/control',
      },
      cwd: outputDir,
      timeout,
    });

    // Try to parse MEDIA: output first
    let filePath = parseMediaOutput(scriptOutput);
    
    // If no MEDIA: prefix, try to find the actual file path in the output
    if (!filePath) {
      const lines = scriptOutput.split('\n').map(line => line.trim()).filter(Boolean);
      // Look for lines that look like file paths
      for (const line of lines.reverse()) {
        if (line.includes('/') && (line.includes('.') || line.includes(outputDir))) {
          filePath = line;
          break;
        }
      }
    }
    
    if (!filePath) {
      throw new Error(`No file path found in script output. Output: ${scriptOutput}`);
    }

    return {
      filePath,
      metadata: {
        skill: this.slug,
        prompt,
        script_output: scriptOutput,
        script_path: scriptPath,
      },
    };
  }

  /**
   * Create a generic driver by auto-detecting a skill's capabilities
   */
  static async createFromSkill(slug: string): Promise<GenericDriver | null> {
    const skillDir = await findSkillDir(slug);
    if (!skillDir) {
      return null;
    }

    // Check what types of scripts are available
    const imageScripts = ['generate_image.py', 'generate_image.sh'];
    const videoScripts = ['generate_video.py', 'generate_video.sh'];
    const audioScripts = ['generate_audio.py', 'generate_audio.sh'];

    // Check for image generation capability
    const imageScript = await findScriptInSkill(skillDir, imageScripts);
    if (imageScript) {
      return new GenericDriver(slug, 'image', `${slug} Image Generation`);
    }

    // Check for video generation capability
    const videoScript = await findScriptInSkill(skillDir, videoScripts);
    if (videoScript) {
      return new GenericDriver(slug, 'video', `${slug} Video Generation`);
    }

    // Check for audio generation capability
    const audioScript = await findScriptInSkill(skillDir, audioScripts);
    if (audioScript) {
      return new GenericDriver(slug, 'audio', `${slug} Audio Generation`);
    }

    // Fall back to generic generate script
    const genericScript = await findScriptInSkill(skillDir, ['generate.py', 'generate.sh']);
    if (genericScript) {
      return new GenericDriver(slug, 'image', `${slug} Generic Generation`);
    }

    return null;
  }
}