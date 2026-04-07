# Media Generation

ClawRecipes supports AI-powered image, video, and audio generation through a driver-based architecture. This runtime-focused guide covers setup, configuration, and troubleshooting.

## Architecture Overview

### Driver Registry System

ClawRecipes uses a **driver registry** that maps providers to skill scripts:

```
Provider Name → MediaDriver → Skill Script → Generated Media
```

**Key Components:**
- **MediaDriver** — TypeScript adapter with provider-specific logic
- **Skill** — Folder containing scripts, dependencies, and documentation  
- **Registry** — Maps provider names to drivers for runtime lookup
- **Worker** — Executes media nodes using appropriate drivers

### Execution Flow

1. **Workflow node** specifies provider (e.g., `"provider": "nano-banana-pro"`)
2. **Worker** looks up driver in registry by slug
3. **Driver** locates skill directory and script
4. **Script** executes with prompt and config
5. **Output file** saved to workflow run media directory

## Setup Instructions

### Image Generation

#### Nano Banana Pro (Gemini)

**Requirements:**
- GEMINI_API_KEY environment variable
- ClawHub skill: `nano-banana-pro`

**Setup:**
```bash
# Install skill
clawhub install nano-banana-pro

# Set API key in OpenClaw config
openclaw gateway config update env.vars.GEMINI_API_KEY "your-gemini-api-key"
```

**Configuration:**
```json
{
  "kind": "media-image",
  "config": {
    "provider": "nano-banana-pro",
    "size": "2048x2048",
    "promptTemplate": "{{content_draft.title}}: professional product photo"
  }
}
```

**Supported sizes:**
- `1024x1024` → 1K resolution
- `1792x1792` → 2K resolution  
- `3840x3840` → 4K resolution

#### DALL-E (OpenAI)

**Requirements:**
- OPENAI_API_KEY environment variable
- ClawHub skill: `openai-dalle`

**Setup:**
```bash
clawhub install openai-dalle
openclaw gateway config update env.vars.OPENAI_API_KEY "sk-your-openai-key"
```

**Configuration:**
```json
{
  "config": {
    "provider": "openai-dalle",
    "size": "1024x1024",
    "quality": "hd",
    "style": "natural"
  }
}
```

**Supported options:**
- **size:** `1024x1024`, `1024x1792`, `1792x1024`
- **quality:** `standard`, `hd`
- **style:** `natural`, `vivid`

### Video Generation

#### Kling AI

**Requirements:**
- Kling AI credentials file (NOT environment variables)
- ClawHub skill: `klingai`

**Setup:**
```bash
# Install skill  
clawhub install klingai --force

# Configure credentials
mkdir -p ~/.config/kling
cat > ~/.config/kling/.credentials << EOF
{
  "access_key_id": "your-access-key",
  "secret_access_key": "your-secret-key"
}
EOF
```

**Configuration:**
```json
{
  "kind": "media-video",
  "config": {
    "provider": "klingai",
    "duration": "10",
    "aspect_ratio": "16:9",
    "promptTemplate": "{{content_brief.style}}: {{content_brief.video_description}}"
  }
}
```

**Constraints:**
- **Duration:** 3-15 seconds
- **Aspect ratios:** `16:9`, `9:16`, `1:1`
- **Mode:** pro (fixed)

#### Runway

**Requirements:**
- RUNWAYML_API_SECRET environment variable
- ClawHub skill: `runway-video`

**Setup:**
```bash
clawhub install runway-video
openclaw gateway config update env.vars.RUNWAYML_API_SECRET "your-runway-secret"
```

**Configuration:**
```json
{
  "config": {
    "provider": "runway-video", 
    "duration": "8",
    "size": "1280x768",
    "addRefinement": "true"
  }
}
```

#### Luma AI

**Requirements:**
- LUMAAI_API_KEY environment variable
- ClawHub skill: `luma-video`

**Setup:**
```bash
clawhub install luma-video
openclaw gateway config update env.vars.LUMAAI_API_KEY "luma-your-api-key"
```

**Configuration:**
```json
{
  "config": {
    "provider": "luma-video",
    "duration": "5",
    "aspect_ratio": "16:9"
  }
}
```

## Configuration Fields

### Core Fields

**promptTemplate** — Template string with variable substitution
```json
"promptTemplate": "Create {{media_type}} for: {{content_draft.title}}\nStyle: {{brand_guide.style}}"
```

**provider** — Driver slug (matches skill folder name)
```json
"provider": "nano-banana-pro"
```

**outputPath** — Custom output file path (optional)
```json  
"outputPath": "media/{{run.id}}/hero-{{content_draft.slug}}.png"
```

### Size Configuration

**For Images:**
```json
"size": "1024x1024"
"size": "1792x1792"  
"size": "3840x3840"
```

**For Videos:**
```json
"aspect_ratio": "16:9"
"aspect_ratio": "9:16"
"aspect_ratio": "1:1"
"size": "1280x768"
```

### Duration Configuration (Videos)

```json
"duration": "5"      // seconds as string
"duration": "10"     // clamp to provider limits
```

**Provider Constraints:**
- **Kling AI:** 3-15 seconds
- **Runway:** 1-10 seconds  
- **Luma AI:** 2-10 seconds

### Prompt Refinement

**addRefinement** — Enable LLM prompt enhancement (opt-in)
```json
"addRefinement": "true"
```

**When enabled:**
1. Input prompt processed by LLM for enhancement
2. Enhanced prompt sent to media provider
3. Results in more detailed, production-ready prompts

**Default:** `false` (upstream LLM nodes should produce ready prompts)

## Environment Variables

### Loading Hierarchy

ClawRecipes loads environment variables from:

1. **Process environment** — `process.env` (highest priority)
2. **OpenClaw config** — `~/.openclaw/openclaw.json` → `env.vars`

### OpenClaw Config Format

**Modern format:** (recommended)
```json
{
  "env": {
    "vars": {
      "GEMINI_API_KEY": "your-key",
      "OPENAI_API_KEY": "your-key",
      "RUNWAYML_API_SECRET": "your-secret"
    }
  }
}
```

**Legacy format:** (still supported)  
```json
{
  "env": {
    "GEMINI_API_KEY": "your-key"
  }
}
```

### Setting Environment Variables

```bash
# Via OpenClaw CLI
openclaw gateway config update env.vars.GEMINI_API_KEY "your-key"

# Via direct edit
$EDITOR ~/.openclaw/openclaw.json

# Via shell environment
export GEMINI_API_KEY="your-key"
openclaw gateway restart
```

## Skill Installation

### ClawHub Installation

```bash
# Global installation (recommended)
clawhub install nano-banana-pro
clawhub install klingai --force

# Agent-specific installation
openclaw recipes install-skill nano-banana-pro --agent-id marketing-lead

# Team-specific installation  
openclaw recipes install-skill nano-banana-pro --team-id marketing-team
```

### Installation Roots

Skills are discovered from these directories:
- `~/.openclaw/skills/` — Global shared skills
- `~/.openclaw/workspace/skills/` — Workspace-local skills  
- `~/.openclaw/workspace/` — ClawHub sometimes installs here

### Verification

```bash
# List available drivers
openclaw recipes workflows media-drivers

# Expected output:
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

## Template Variables

Media nodes support full template variable substitution in:
- **promptTemplate** — AI generation prompt
- **outputPath** — Custom file paths

### Available Variables

**Global variables:**
```
{{date}}             — Current timestamp
{{run.id}}           — Workflow run ID
{{workflow.name}}    — Workflow display name
{{node.id}}          — Current node ID
```

**Upstream node outputs:**
```
{{content_draft.text}}        — Text from LLM node
{{brand_guide.style}}         — Extracted JSON field
{{research_brief.video_concept}} — Nested field extraction
```

### Example Templates

**Product marketing image:**
```json
{
  "promptTemplate": "Professional product photo: {{product_brief.name}}\n\nStyle: {{brand_guide.visual_style}}\nMood: {{campaign_goals.target_emotion}}\nComposition: {{art_direction.composition_notes}}"
}
```

**Social video:**
```json
{
  "promptTemplate": "Short social media video: {{content_calendar.post_topic}}\n\nHook: {{copywriting.video_hook}}\nVisual style: {{brand_assets.video_style}}\nDuration: energetic {{duration}}s clip"
}
```

## Troubleshooting

### Driver Not Found

**Error:**
```
No media driver found for provider "nano-banana-pro"
```

**Diagnosis:**
```bash
# Check if skill is installed
ls ~/.openclaw/skills/nano-banana-pro
ls ~/.openclaw/workspace/skills/nano-banana-pro

# Verify driver registry
openclaw recipes workflows media-drivers | grep nano-banana-pro
```

**Solutions:**
1. Install missing skill: `clawhub install nano-banana-pro`
2. Check skill directory permissions
3. Restart gateway if skill was just installed

### Missing Environment Variables

**Error:**
```json
{
  "slug": "nano-banana-pro",
  "available": false,
  "missingEnvVars": ["GEMINI_API_KEY"]
}
```

**Diagnosis:**
```bash
# Check current environment
echo $GEMINI_API_KEY

# Check OpenClaw config
cat ~/.openclaw/openclaw.json | jq '.env.vars'
```

**Solutions:**
1. Set via config: `openclaw gateway config update env.vars.GEMINI_API_KEY "your-key"`
2. Export in shell before starting gateway
3. Restart gateway after config changes

### Script Execution Failures

**Error:**
```
Script execution failed: nano-banana-pro generate_image.py
--- stderr ---
ModuleNotFoundError: No module named 'google.generativeai'
```

**Diagnosis:**
```bash
# Check skill venv
ls ~/.openclaw/skills/nano-banana-pro/.venv/

# Test script manually
cd ~/.openclaw/skills/nano-banana-pro
./.venv/bin/python scripts/generate_image.py --help
```

**Solutions:**
1. Reinstall skill: `clawhub install nano-banana-pro --force`  
2. Manually setup venv: `cd skill && python -m venv .venv && .venv/bin/pip install -r requirements.txt`
3. Check skill documentation for dependencies

### Prompt Too Long

**Error:**
```
400 Bad Request: prompt exceeds maximum length (4000 characters)
```

**Solutions:**
1. **Enable refinement:** `"addRefinement": "true"` — let LLM condense the prompt
2. **Shorten templates:** Remove verbose instructions from prompt template
3. **Upstream editing:** Have prior LLM nodes produce concise briefs

### Output Path Issues

**Error:**  
```
fs.write path must be within the team workspace
```

**Solutions:**
1. Use relative paths: `"outputPath": "media/{{node.id}}.png"`
2. Don't include `../` in paths
3. Paths are resolved relative to workflow run directory

### Permission Errors

**Error:**
```
EACCES: permission denied, open '/home/control/.openclaw/skills/nano-banana-pro'
```

**Solutions:**
1. Fix ownership: `sudo chown -R control:control ~/.openclaw/`
2. Check directory permissions: `chmod 755 ~/.openclaw/skills/`
3. Reinstall skill if corrupted

### Timeout Issues

**Error:**
```
Script execution timeout (300000ms)
```

**Solutions:**
1. **Increase timeout:** Add `"timeoutMs": 600000` to node config
2. **Check API status:** Verify provider service availability
3. **Reduce complexity:** Simplify prompts for faster generation

## Advanced Configuration

### Custom Output Directories

```json
{
  "config": {
    "outputPath": "assets/{{workflow.name}}/{{run.id}}/hero.png"
  }
}
```

Creates: `workspace-team/assets/Content Pipeline/2025-04-04T03-53-00-123Z/hero.png`

### Model Selection (Provider-Specific)

Some drivers support model selection:
```json
{
  "config": {
    "provider": "openai-dalle",
    "model": "dall-e-3",
    "quality": "hd"
  }
}
```

### Provider Fallbacks

Use LLM nodes to implement fallback logic:
```json
{
  "action": {
    "promptTemplate": "Generate an image using primary provider: {{image_config.primary_provider}}\n\nIf unavailable, fallback to: {{image_config.fallback_provider}}"
  }
}
```

## Related Documentation

- [MEDIA_DRIVERS.md](MEDIA_DRIVERS.md) — Developer guide for adding new providers
- [TEMPLATE_VARIABLES.md](TEMPLATE_VARIABLES.md) — Template variable syntax and examples
- [WORKFLOW_NODES.md](WORKFLOW_NODES.md) — Complete node configuration reference
- [INSTALLATION.md](INSTALLATION.md) — Installing ClawRecipes and dependencies

## Implementation Details

**Core Code Locations:**
- `src/lib/workflows/media-drivers/` — Driver implementations
- `src/lib/workflows/workflow-worker.ts` — Media node execution
- `src/handlers/media-drivers.ts` — CLI media-drivers command

**Driver Interface:**
- `MediaDriver` — TypeScript interface for all providers
- `MediaDriverInvokeOpts` — Standardized invocation parameters
- `MediaDriverResult` — Standardized return format

**Registry System:**
- Known drivers registered in `registry.ts`
- Generic driver auto-discovery for unlisted skills
- Runtime environment variable availability checking