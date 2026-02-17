# Cleanup TODO

## Infrastructure

- [x] Add @vitest/coverage-v8, test:coverage script
- [x] Create TEST_COVERAGE_PROGRESS.md, CODE_SMELLS_TRACKER.md
- [x] Run baseline coverage, populate progress doc
- [x] Update TEST_COVERAGE_PROGRESS.md after each coverage batch

## Code Smells

- [x] Extract fileExists to src/lib/fs-utils
- [x] Extract stableStringify to src/lib/stable-stringify
- [x] Unify parseFrontmatter/normalizeCronJobs (use recipe-frontmatter)
- [x] Replace magic numbers in toolsInvoke

## Test Coverage

- [x] lanes.ts
- [x] ticket-finder.ts
- [x] cleanup-workspaces (expand)
- [x] remove-team (expand)
- [x] marketplaceFetch (with fetch mock)
- [x] toolsInvoke (with fetch mock)
- [x] Extracted config, template, cron-utils, agent-config
- [x] index.ts handlers (via extraction or integration)

## Final

- [x] Set coverage thresholds (phased: 25% baseline; target 95%)
- [x] Verify npm run test:coverage passes
