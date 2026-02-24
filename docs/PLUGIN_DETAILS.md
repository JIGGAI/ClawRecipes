# Plugin details (shared content)

This repo is the **source of truth** for the “plugin details” pages shown inside **ClawKitchen**.

- Data file: [`docs/plugin-details.json`](./plugin-details.json)
- ClawKitchen reads it from GitHub raw:
  - <https://raw.githubusercontent.com/JIGGAI/ClawRecipes/main/docs/plugin-details.json>

## What’s in here

- Quick Start install commands (OpenClaw + npm)
- Features list
- Links
- Optional screenshots list (URLs)

## Updating screenshots

Add screenshot URLs under:

- `plugins.kitchen.screenshots[]`
- `plugins.recipes.screenshots[]`

ClawKitchen will automatically pick them up (it revalidates periodically).
