# Workflow Node Reference (ClawRecipes)

This document is the **runtime** reference for workflow node configuration in ClawRecipes.

ClawKitchen (the UI) edits workflow JSON files, but the actual execution semantics live here.

If you’re new to the file format, start with:
- [WORKFLOW_RUNS_FILE_FIRST.md](WORKFLOW_RUNS_FILE_FIRST.md)

---

## Mental model

A workflow run is a directory on disk containing a `run.json` (and logs/deliverables). The worker executes nodes in order, persists each node’s output, and downstream nodes reference upstream outputs via `{{ }}` template variables.

### Template variables

At runtime, ClawRecipes replaces `{{vars}}` in strings inside node configs.

There are two broad categories:

**Global vars** (always available):
- `{{date}}`
- `{{run.id}}`
- `{{workflow.id}}`
- `{{workflow.name}}`
- `{{node.id}}`

**Upstream node vars** (depend on prior nodes):
- `{{someNode.output}}` — the full stored output envelope
- `{{someNode.text}}` — the most common “payload string” field
- `{{someNode.someField}}` — a field extracted from JSON inside the node’s `text` (when applicable)

Notes:
- If an upstream node stores JSON inside its `text` field, the template system can extract nested fields (e.g. `{{draft_assets.video_brief}}`).
- If you see “garbled JSON” showing up in a media prompt, you’re usually templating the *envelope* (e.g. `{{draft_assets.output}}`) instead of the intended field (e.g. `{{draft_assets.text}}` or `{{draft_assets.video_brief}}`).

---

## Node types

This section describes the important node types and the config fields the worker actually reads.

### LLM nodes

LLM nodes execute via the `llm-task` tool.

Common config fields (stored under `node.config`):
- `promptTemplate` (string): the prompt content, after template-var substitution
- `timeoutMs` (number, optional)
- `model` (string, optional): provider/model selection (node → workflow → global precedence)

#### outputFields (structured output)

If `node.config.outputFields` is present, ClawRecipes will:
1) Append an explicit OUTPUT FORMAT section to the prompt
2) Derive a JSON Schema and pass it to `llm-task`

That means the LLM output is **validated**.

Shape:

```json
{
  "outputFields": [
    {"name": "summary", "type": "text"},
    {"name": "angles", "type": "list"},
    {"name": "metadata", "type": "json"}
  ]
}
```

Types:
- `text` → JSON string
- `list` → array of strings
- `json` → JSON object

---

### Media nodes (image/video/audio)

Media nodes ultimately produce a file deliverable. ClawRecipes invokes a **MediaDriver** selected by `provider`.

Provider selection:
- In workflow JSON, providers are referenced as `skill-<slug>`
- At runtime the worker strips `skill-` and looks up a driver by slug

#### Common media config fields

These are passed through to drivers as `opts.config`:

- `size` (string):
  - For images, typically pixel size like `1024x1024`, `1792x1024`, `1024x1792`
  - Some providers interpret this differently (drivers may map pixel sizes to tiers)

- `duration` (string or number): duration in seconds, e.g. `"5s"`, `"10s"`, or `10`

- `aspect_ratio` (string): e.g. `"16:9"`, `"9:16"` (provider-specific)

- `quality` / `style`: image-provider-specific fields (ex: OpenAI)

- `addRefinement` (boolean): **opt-in** prompt refinement pass for video/audio.
  - Default is OFF. When enabled, the worker runs an extra `llm-task` call to refine the prompt before invoking the driver.

#### Driver constraints

Drivers can optionally declare duration constraints (`minSeconds/maxSeconds/defaultSeconds`).

Kitchen surfaces these constraints as UX hints, but the runtime is the source of truth.

---

### Tool nodes

Tool nodes call a tool by name with JSON args. Example:
- `fs.append`
- `outbound.post`
- `message.send`

Tool nodes support template vars inside string args.

---

### Human approval nodes

Human approval nodes pause execution until an approval is granted in the UI.

Common pattern:
- Upstream LLM generates a draft
- Approval node shows a `messageTemplate` (with template vars)
- Downstream nodes continue only after approval

---

## Adding new capabilities (where to change code)

- LLM output shaping/validation: `src/lib/workflows/workflow-worker.ts`
- Media providers: `src/lib/workflows/media-drivers/`
- CLI for Kitchen dropdown: `openclaw recipes workflows media-drivers` (handler: `src/handlers/media-drivers.ts`)

---

## Troubleshooting quick hits

- **Provider missing in dropdown**: run `openclaw recipes workflows media-drivers` and check `available` / `missingEnvVars`.
- **Media node ignores config**: confirm the driver reads `opts.config` (not all scripts support every knob).
- **Bad video quality**: ensure your prompt is a single clear scene brief; avoid multi-scene paragraphs when the provider needs a seed frame.
