import * as fs from 'fs/promises';
import * as path from 'path';
import { execFileSync } from 'child_process';

/**
 * Find a skill directory by searching common skill roots
 */
export async function findSkillDir(slug: string): Promise<string | null> {
  const homedir = process.env.HOME || '/home/control';
  const skillRoots = [
    path.join(homedir, '.openclaw', 'skills'),
    path.join(homedir, '.openclaw', 'workspace', 'skills'),
    path.join(homedir, '.openclaw', 'workspace'),
  ];

  for (const root of skillRoots) {
    const skillDir = path.join(root, slug);
    try {
      const stat = await fs.stat(skillDir);
      if (stat.isDirectory()) {
        return skillDir;
      }
    } catch {
      // Directory doesn't exist, continue searching
    }
  }

  return null;
}

/**
 * Find the appropriate Python runner for a skill directory
 */
export async function findVenvPython(skillDir: string): Promise<string> {
  const venvPython = path.join(skillDir, '.venv', 'bin', 'python');
  
  try {
    await fs.access(venvPython);
    return venvPython;
  } catch {
    return 'python3';
  }
}

/**
 * Load environment variables from OpenClaw config
 */
export async function loadConfigEnv(): Promise<Record<string, string>> {
  const homedir = process.env.HOME || '/home/control';
  const configPath = path.join(homedir, '.openclaw', 'openclaw.json');
  
  try {
    const cfgRaw = await fs.readFile(configPath, 'utf8');
    const cfgParsed = JSON.parse(cfgRaw);

    // openclaw.json supports multiple shapes historically:
    // - { env: { KEY: "..." } }
    // - { env: { vars: { KEY: "..." } } }  (current)
    const envBlock = (cfgParsed as any)?.env;
    const maybeVars = envBlock && typeof envBlock === 'object' ? (envBlock as any).vars : null;
    const rawVars = (maybeVars && typeof maybeVars === 'object') ? maybeVars : envBlock;

    if (rawVars && typeof rawVars === 'object') {
      return Object.fromEntries(
        Object.entries(rawVars).filter(([, v]) => typeof v === 'string')
      ) as Record<string, string>;
    }

    return {};
  } catch {
    // Config read failed — proceed with empty env
    return {};
  }
}

/**
 * Parse media file path from script output
 */
export function parseMediaOutput(stdout: string): string {
  const mediaMatch = stdout.match(/MEDIA:(.+)$/m);
  return mediaMatch ? mediaMatch[1].trim() : '';
}

/**
 * Execute a script with proper error handling and output capture
 */
export interface RunScriptOpts {
  runner: string;
  script: string;
  args?: string[];
  stdin?: string;
  env: Record<string, string>;
  cwd: string;
  timeout: number;
}

export function runScript(opts: RunScriptOpts): string {
  const { runner, script, args = [], stdin, env, cwd, timeout } = opts;

  try {
    // Use execFileSync (array args, no shell) to avoid quoting issues
    return execFileSync(runner, [script, ...args], {
      cwd,
      timeout,
      encoding: 'utf8',
      input: stdin,
      env: {
        ...process.env,
        ...env,
        MEDIA_OUTPUT_DIR: cwd,
      },
    }).trim();
  } catch (err) {
    // Surface stderr/stdout to make debugging skill scripts possible
    const e = err as any;
    const stdout = typeof e?.stdout === 'string' ? e.stdout : (Buffer.isBuffer(e?.stdout) ? e.stdout.toString('utf8') : '');
    const stderr = typeof e?.stderr === 'string' ? e.stderr : (Buffer.isBuffer(e?.stderr) ? e.stderr.toString('utf8') : '');
    const msg = [
      e?.message ? String(e.message) : 'Script execution failed',
      stdout ? `\n--- stdout ---\n${stdout.trim()}` : '',
      stderr ? `\n--- stderr ---\n${stderr.trim()}` : '',
    ].filter(Boolean).join('');
    throw new Error(msg);
  }
}

/**
 * Search for a script file in skill directory and scripts/ subdirectory
 */
export async function findScriptInSkill(skillDir: string, scriptCandidates: string[]): Promise<string | null> {
  const searchDirs = [skillDir, path.join(skillDir, 'scripts')];
  
  for (const dir of searchDirs) {
    for (const candidate of scriptCandidates) {
      const scriptPath = path.join(dir, candidate);
      try {
        await fs.access(scriptPath);
        return scriptPath;
      } catch {
        // File doesn't exist, continue searching
      }
    }
  }
  
  return null;
}