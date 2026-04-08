import * as fs from 'fs/promises';
import * as path from 'path';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { toolsInvoke } from '../../../toolsInvoke';

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
 * Execute a script via the OpenClaw exec tool so this plugin package does not
 * directly import child_process. We still pass argv as discrete args and feed
 * prompt text via stdin through a small Python wrapper script.
 */
export interface RunScriptOpts {
  api: OpenClawPluginApi;
  runner: string;
  script: string;
  args?: string[];
  stdin?: string;
  env: Record<string, string>;
  cwd: string;
  timeout: number;
  sessionKey?: string;
}

function buildPythonExecSnippet(opts: RunScriptOpts): string {
  const { runner, script, args = [], stdin, env, cwd, timeout } = opts;
  const mergedEnv = {
    ...env,
    MEDIA_OUTPUT_DIR: cwd,
  };

  const payload = {
    runner,
    script,
    args,
    stdin: stdin ?? '',
    env: mergedEnv,
    cwd,
    timeoutMs: timeout,
  };

  // Base64-encode the payload to avoid shell injection and heredoc delimiter collisions.
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');

  return [
    `python3 -c '`,
    `import base64, json, os, subprocess, sys;`,
    `payload = json.loads(base64.b64decode("${payloadB64}").decode());`,
    `env = os.environ.copy();`,
    `env.update({k: str(v) for k, v in payload["env"].items()});`,
    `res = subprocess.run(`,
    `  [payload["runner"], payload["script"], *payload.get("args", [])],`,
    `  input=payload.get("stdin", ""),`,
    `  text=True,`,
    `  capture_output=True,`,
    `  cwd=payload["cwd"],`,
    `  env=env,`,
    `  timeout=max(1, int(payload.get("timeoutMs", 1000) / 1000))`,
    `);`,
    `sys.stdout.write(res.stdout);`,
    `sys.stderr.write(res.stderr);`,
    `raise SystemExit(res.returncode)`,
    `'`,
  ].join('\n');
}

export async function runScript(opts: RunScriptOpts): Promise<string> {
  const { api, timeout, sessionKey } = opts;
  const timeoutSeconds = Math.max(1, Math.ceil(timeout / 1000) + 5);
  const command = buildPythonExecSnippet(opts);
  const debugId = `media-run:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
  const logPrefix = `[recipes.media-driver] ${debugId}`;

  console.error(`${logPrefix} start script=${opts.script} cwd=${opts.cwd} timeoutSec=${timeoutSeconds}`);

  try {
    const toolRes = await toolsInvoke<unknown>(api, {
      tool: 'exec',
      ...(sessionKey ? { sessionKey } : {}),
      args: {
        command,
        workdir: opts.cwd,
        timeout: timeoutSeconds,
      },
    });

    if (typeof toolRes === 'string') {
      return toolRes.trim();
    }

    const rec = (toolRes && typeof toolRes === 'object') ? toolRes as Record<string, unknown> : {};
    const stdout = typeof rec.stdout === 'string'
      ? rec.stdout
      : typeof rec.output === 'string'
      ? rec.output
      : typeof rec.result === 'string'
      ? rec.result
      : '';
    const stderr = typeof rec.stderr === 'string' ? rec.stderr : '';
    const exitCode = typeof rec.exitCode === 'number'
      ? rec.exitCode
      : typeof rec.code === 'number'
      ? rec.code
      : 0;

    if (exitCode !== 0) {
      const msg = [
        `Script execution failed with exit code ${exitCode}`,
        stdout ? `\n--- stdout ---\n${stdout.trim()}` : '',
        stderr ? `\n--- stderr ---\n${stderr.trim()}` : '',
      ].filter(Boolean).join('');
      throw new Error(msg);
    }

    return stdout.trim();
  } catch (err) {
    const e = err as Error & { stdout?: unknown; stderr?: unknown };
    const stdout = typeof e?.stdout === 'string' ? e.stdout : '';
    const stderr = typeof e?.stderr === 'string' ? e.stderr : '';
    console.error(`${logPrefix} error: ${e?.message ?? 'Script execution failed'}`);
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
