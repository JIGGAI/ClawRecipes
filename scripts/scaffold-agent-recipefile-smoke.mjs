#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const die = (msg) => {
  console.error(`\n[agent-recipefile-smoke] ERROR: ${msg}`);
  process.exitCode = 1;
};

const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  return {
    status: res.status,
    stdout: String(res.stdout ?? ""),
    stderr: String(res.stderr ?? ""),
  };
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const fileExists = async (p) => {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
};

async function main() {
  const ts = Date.now();
  const parentRecipeId = process.env.PARENT_RECIPE_ID || "researcher";
  const agentId = `smoke-agent-${ts}`;

  const wsOut = run("openclaw", ["config", "get", "agents.defaults.workspace"]).stdout.trim();
  assert(wsOut, "agents.defaults.workspace not set");

  const recipesDir = path.join(wsOut, "recipes");
  const recipePath = path.join(recipesDir, `${agentId}.md`);
  const recipePath2 = path.join(recipesDir, `${agentId}-2.md`);

  await fs.rm(recipePath, { force: true });
  await fs.rm(recipePath2, { force: true });

  console.log(`[agent-recipefile-smoke] parentRecipeId=${parentRecipeId}`);
  console.log(`[agent-recipefile-smoke] agentId=${agentId}`);
  console.log(`[agent-recipefile-smoke] recipesDir=${recipesDir}`);

  try {
    // 1) Default create
    const r1 = run("openclaw", ["recipes", "scaffold", parentRecipeId, "--agent-id", agentId, "--overwrite"]);
    assert(r1.status === 0, `scaffold failed unexpectedly: ${r1.stderr || r1.stdout}`);
    assert(await fileExists(recipePath), `Missing workspace recipe file: ${recipePath}`);

    // 2) Collision should fail + suggestions
    const r2 = run("openclaw", ["recipes", "scaffold", parentRecipeId, "--agent-id", agentId, "--overwrite"]);
    assert(r2.status !== 0, "Expected collision run to fail");
    const combined = `${r2.stdout}\n${r2.stderr}`;
    assert(combined.includes(`${agentId}-2`) && combined.includes(`${agentId}-3`) && combined.includes(`${agentId}-4`), "Expected -2/-3/-4 suggestions in error output");

    // 3) Auto-increment should succeed (creates -2)
    const r3 = run("openclaw", ["recipes", "scaffold", parentRecipeId, "--agent-id", agentId, "--overwrite", "--auto-increment"]);
    assert(r3.status === 0, `auto-increment run failed: ${r3.stderr || r3.stdout}`);
    assert(await fileExists(recipePath2), `Missing auto-increment recipe file: ${recipePath2}`);

    // 4) Overwrite-recipe should overwrite recipePath
    await fs.writeFile(recipePath, "# MARKER\n", "utf8");
    const r4 = run("openclaw", ["recipes", "scaffold", parentRecipeId, "--agent-id", agentId, "--overwrite", "--overwrite-recipe"]);
    assert(r4.status === 0, `overwrite-recipe run failed: ${r4.stderr || r4.stdout}`);
    const after = await fs.readFile(recipePath, "utf8");
    assert(!after.startsWith("# MARKER"), "Expected overwrite-recipe to replace existing recipe file content");

    console.log("[agent-recipefile-smoke] OK");
  } finally {
    await fs.rm(recipePath, { force: true });
    await fs.rm(recipePath2, { force: true });
  }
}

main().catch((e) => {
  die(e instanceof Error ? e.message : String(e));
});
