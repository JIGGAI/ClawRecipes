#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const die = (msg) => {
  console.error(`\n[provenance-smoke] ERROR: ${msg}`);
  process.exitCode = 1;
};

const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (res.status !== 0) {
    const stderr = String(res.stderr ?? "").trim();
    const stdout = String(res.stdout ?? "").trim();
    throw new Error(
      `Command failed (exit=${res.status}): ${cmd} ${args.join(" ")}\n` +
        (stdout ? `stdout:\n${stdout}\n` : "") +
        (stderr ? `stderr:\n${stderr}\n` : "")
    );
  }
  return { stdout: String(res.stdout ?? ""), stderr: String(res.stderr ?? "") };
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
  const recipeId = process.env.RECIPE_ID || "product-team";
  const teamId = `smoke-provenance-${ts}-team`;

  // Resolve team workspace dir: sibling of agents.defaults.workspace -> workspace-<teamId>
  const wsOut = run("openclaw", ["config", "get", "agents.defaults.workspace"]).stdout.trim();
  assert(wsOut, "agents.defaults.workspace not set");
  const teamDir = path.resolve(wsOut, "..", `workspace-${teamId}`);

  console.log(`[provenance-smoke] recipeId=${recipeId}`);
  console.log(`[provenance-smoke] teamId=${teamId}`);
  console.log(`[provenance-smoke] teamDir=${teamDir}`);

  let scaffoldOk = false;
  try {
    run("openclaw", ["recipes", "scaffold-team", recipeId, "-t", teamId, "--overwrite"]);
    scaffoldOk = true;

    const metaPath = path.join(teamDir, "team.json");
    assert(await fileExists(metaPath), `Missing team.json at ${metaPath}`);

    const raw = await fs.readFile(metaPath, "utf8");
    const meta = JSON.parse(raw);

    assert(meta && typeof meta === "object", "team.json must parse as an object");
    assert(meta.teamId === teamId, `team.json teamId mismatch: expected=${teamId} got=${meta.teamId}`);
    assert(meta.recipeId === recipeId, `team.json recipeId mismatch: expected=${recipeId} got=${meta.recipeId}`);
    assert(typeof meta.scaffoldedAt === "string" && meta.scaffoldedAt.length > 0, "team.json scaffoldedAt must be a non-empty string");

    console.log("[provenance-smoke] OK");
  } finally {
    // Best-effort cleanup to avoid littering ~/.openclaw/workspace-*
    if (scaffoldOk) {
      try {
        await fs.rm(teamDir, { recursive: true, force: true });
        console.log(`[provenance-smoke] cleaned up ${teamDir}`);
      } catch (e) {
        console.error(`[provenance-smoke] cleanup failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
}

main().catch((e) => {
  die(e instanceof Error ? e.message : String(e));
});
