# Test Coverage Progress

Target: 95% line coverage.

## Baseline (before cleanup)

| File | % Stmts | % Branch | % Funcs | % Lines | Notes |
|------|---------|----------|---------|---------|-------|
| index.ts | 4.16 | 61.53 | 18.42 | 4.16 | God file; most logic untested |
| src/marketplaceFetch.ts | 0 | 100 | 100 | 0 | Needs fetch mock |
| src/toolsInvoke.ts | 0 | 100 | 0 | 0 | Needs fetch mock |
| src/lib/bindings.ts | 91.42 | 66.66 | 100 | 91.42 | Lines 50-52 uncovered |
| src/lib/cleanup-workspaces.ts | 78.51 | 61.9 | 100 | 78.51 | |
| src/lib/lanes.ts | 60 | 83.33 | 66.66 | 60 | |
| src/lib/recipe-frontmatter.ts | 93.54 | 70.83 | 100 | 93.54 | |
| src/lib/remove-team.ts | 81.51 | 70.58 | 63.63 | 81.51 | |
| src/lib/scaffold-templates.ts | 100 | 100 | 100 | 100 | |
| src/lib/shared-context.ts | 100 | 85.71 | 100 | 100 | |
| src/lib/ticket-finder.ts | 0 | 0 | 0 | 0 | Not yet exercised by tests |
| src/lib/ticket-workflow.ts | 96.52 | 37.5 | 100 | 96.52 | |
| **All files** | **18.25** | **58.85** | **48.83** | **18.25** | |

## Gaps to address

- index.ts: extract logic to src/lib and test there; add integration tests for command handlers
- ticket-finder.ts: add tests
- marketplaceFetch, toolsInvoke: mock fetch, add tests
- lanes.ts, cleanup-workspaces, remove-team: expand tests

## Updates

- **Baseline**: Initial coverage run before cleanup work.
- **Post-cleanup**: 25% overall; src/lib at 91.53%, src/ at 98.36%. index.ts remains low (3.91%) — extraction moved logic to lib. Thresholds set at 25% baseline; target 95% as further index extraction proceeds.
- **Index handler extraction (Phase 2–3)**: Handler logic moved to src/handlers/; exercised via __internal in integration tests.
- **Post-extraction baseline** (npm run test:coverage): 56.55% overall; src/ at 98.36%; src/handlers at 66.44%; src/lib at 94.63%; index.ts at 9.62% (thin CLI wiring).
- **Comprehensive coverage plan** (Phase 1–3): cron-handler, install-handler, prompt, workspace, scaffold, team, tickets, recipes tests added. Thresholds raised to 60% lines/statements, 90% functions. index.ts remains thin wiring; logic exercised via __internal.
- **CI coverage enforcement** (Feb 2026): CI now runs `npm run test:coverage`; build fails if thresholds are not met. Thresholds: lines 60%, statements 60%, functions 90%, branches 65%.
