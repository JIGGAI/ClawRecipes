# 0272 — Memory injection baseline

Measurement window: 2026-10-08 through 2026-10-14 UTC  
Candidate: `task/0272-memory-injection-baseline` at `f4445e8`

## Method

- Deployed measurement-only instrumentation for workflow LLM/media memory context construction.
- Ran 7 controlled workflow probes per day in each of three teams: `development-team`, `claw-marketing-team`, and `qa-0159-20260306`.
- Validated every daily JSONL record for the required invocation and memory-selection fields.
- Generated the aggregate with:

  ```text
  node scripts/memory-injection-report.mjs --date 2026-10-14 --days 7
  ```

## Results

- 147 runs across 21 daily team log files (49 runs per team, 7 distinct UTC dates).
- Injected tokens: p50 `0`, p95 `0`, maximum `0`.
- Runs hitting the 2,000-token cap: `0.0%`.
- Average items dropped by the cap: `0.00`.
- Pinned items available/included: `0` / `0` across the sample.
- `claw-marketing-team`: no eligible memory items; average available tokens `0`, average files scanned `0`.
- `development-team`: one eligible recent item per run; average available tokens `65`, average files scanned `4`, average items included by selection `1`, but injected context remained empty.
- `qa-0159-20260306`: one memory file scanned per run but no eligible `content`/`text` items; average available tokens `0`.

The summarizer output was:

```text
Memory injection report: 2026-10-08 to 2026-10-14
Runs: 147 (21 log files)
Tokens injected: p50 0, p95 0
Runs hitting cap: 0.0%
Average items dropped by cap: 0.00
Top teams by injection volume:
  claw-marketing-team: 0 tokens across 49 runs
  development-team: 0 tokens across 49 runs
  qa-0159-20260306: 0 tokens across 49 runs
```

## Interpretation

The measured teams are not experiencing high-token context rot. They are effectively receiving no team-memory context, so the current evidence does not justify a knowledge-graph rollout to reduce prompt volume or cost.

The instrumentation also exposed a current-path starvation case. In `buildMemoryContext()`, a recent-only selection with exactly one eligible item leaves `memoryParts.length === 1`; the function only emits context when the length is greater than one. That is why development-team records report one included item and 65 available tokens while `tokens_injected` remains zero. This ticket intentionally does not change injection behavior.

## Decision gate

- Keep graph memory at P2 based on this baseline; there is no measured cap pressure or token-volume case for P0.
- Fix and independently test the recent-only context suppression before evaluating retrieval relevance or graph memory. This is a higher-priority correctness issue than adding a new retrieval layer.
- Use the cheap extraction tier for exploratory graph work until realistic production traffic demonstrates enough memory volume and quality benefit to justify a mid-tier model.
- Repeat the measurement on teams with materially populated eligible memory after the suppression fix. The controlled sample establishes the current baseline but cannot measure relevance quality or cost savings when injected volume is zero.

## Verification and rollback

- All 147 telemetry records contain the required schema fields.
- Each team produced exactly seven records on each of seven UTC dates.
- The implementation candidate previously passed 373/373 tests, plugin build, and lint with warnings only.
- Rollback: revert the instrumentation commit, rebuild the plugin bundle, and restart the gateway. The append-only JSONL observations can be retained or archived.
