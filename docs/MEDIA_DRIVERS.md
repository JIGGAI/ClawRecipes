# Media Drivers (ClawRecipes)

ClawRecipes implements media generation via a **driver architecture**. Drivers are used by the workflow worker when executing `media-image`, `media-video`, and `media-audio` nodes.

This doc is for developers adding new providers.

## Key Concepts

- A **skill** is a folder on disk (usually installed from ClawHub) that contains scripts and docs.
- A **driver** is a small TypeScript adapter that knows how to invoke a given skill reliably.
- Drivers provide:
  - Stable display name and slug
  - Required env-var list (availability checks)
  - Invocation details (stdin vs CLI args, scripts/ subdir, venv detection)

## CLI: List drivers

ClawKitchen uses this command to populate its provider dropdown:

```bash
openclaw recipes workflows media-drivers
```

It returns JSON like:

```json
[
  {
    "slug": "nano-banana-pro",
    "displayName": "Nano Banana Pro (Gemini Image Generation)",
    "mediaType": "image",
    "requiredEnvVars": ["GEMINI_API_KEY"],
    "available": true,
    "missingEnvVars": []
  }
]
```

Availability is computed from **merged env**:
- `process.env` (ClawRecipes process)
- `~/.openclaw/openclaw.json` → `env.vars`

## Where the code lives

```
src/lib/workflows/media-drivers/
  types.ts
  registry.ts
  utils.ts
  nano-banana-pro.driver.ts
  openai-image-gen.driver.ts
  runway-video.driver.ts
  kling-video.driver.ts
  luma-video.driver.ts
  generic.driver.ts
```

## MediaDriver interface

```ts
export interface MediaDriver {
  slug: string;                       // Skill folder name
  mediaType: 'image' | 'video' | 'audio';
  displayName: string;                // UI dropdown label
  requiredEnvVars: string[];          // Availability check

  invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult>;
}
```

The `invoke()` method should:
- Write output into `opts.outputDir`
- Return `{ filePath }` pointing at the generated file
- Throw on failure with a useful error message (stderr/stdout included when possible)

## Adding a new driver

### 1) Add or install the underlying skill

A skill should live in one of:
- `~/.openclaw/skills/<slug>`
- `~/.openclaw/workspace/skills/<slug>`
- `~/.openclaw/workspace/<slug>` (ClawHub sometimes installs here)

The worker and driver utils search these roots via `findSkillDir(slug)`.

### 2) Create the driver file

Create:

```
src/lib/workflows/media-drivers/my-provider.driver.ts
```

Example pattern (stdin → `MEDIA:` output):

```ts
import * as path from 'path';
import { MediaDriver, MediaDriverInvokeOpts, MediaDriverResult } from './types';
import { findSkillDir, findVenvPython, runScript, parseMediaOutput } from './utils';

export class MyProvider implements MediaDriver {
  slug = 'my-provider';
  mediaType = 'image' as const;
  displayName = 'My Provider';
  requiredEnvVars = ['MY_PROVIDER_API_KEY'];

  async invoke(opts: MediaDriverInvokeOpts): Promise<MediaDriverResult> {
    const { prompt, outputDir, env, timeout } = opts;

    const skillDir = await findSkillDir(this.slug);
    if (!skillDir) throw new Error(`Skill dir not found for ${this.slug}`);

    const scriptPath = path.join(skillDir, 'generate_image.py');
    const runner = await findVenvPython(skillDir);

    const stdout = runScript({
      runner,
      script: scriptPath,
      stdin: prompt,
      env: { ...env, HOME: process.env.HOME || '/home/control' },
      cwd: outputDir,
      timeout,
    });

    const filePath = parseMediaOutput(stdout);
    if (!filePath) throw new Error(`No MEDIA: path in output: ${stdout}`);

    return { filePath };
  }
}
```

Example pattern (CLI args → script prints direct path):
- See `nano-banana-pro.driver.ts`.

### 3) Register it

Add the driver to `registry.ts` in `knownDrivers`:

```ts
import { MyProvider } from './my-provider.driver';

const knownDrivers: MediaDriver[] = [
  // ...
  new MyProvider(),
];
```

### 4) Done

- The workflow worker can now invoke it by setting `provider` to `skill-my-provider`.
- The CLI `workflows media-drivers` will list it.
- ClawKitchen will show it automatically (Kitchen pulls the list from the CLI).

## Script contract (skills)

Drivers can invoke scripts in different ways, but the recommended contract is:

- Prompt via stdin
- Print `MEDIA:/absolute/or/relative/path` to stdout
- Write the file into `MEDIA_OUTPUT_DIR` if provided

Notes:
- Some ClawHub skills place scripts under `scripts/`. Use `findScriptInSkill()` or direct paths accordingly.
- Venv support: worker/driver utils will prefer `.venv/bin/python` when present.

## Troubleshooting

- If the dropdown says a driver is unavailable, run:
  ```bash
  openclaw recipes workflows media-drivers
  ```
  and check `missingEnvVars`.
- If a skill isn't found, verify the folder name matches `slug` and is inside a scanned root.
