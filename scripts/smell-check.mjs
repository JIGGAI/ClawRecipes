#!/usr/bin/env node
/**
 * Smell-check script for CI: runs lint, jscpd, and pattern greps.
 * Fails if thresholds are exceeded.
 * Usage: node scripts/smell-check.mjs
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");

const THRESHOLDS = {
  asAnyInSrc: 10,
  todoFixme: 20,
  jscpdMaxDuplication: 10,
  eslintMaxWarnings: 80,
};

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: root, ...opts });
  return r.status;
}

function grepInDir(dir, pattern) {
  const regex = new RegExp(pattern, "g");
  const results = [];
  function walk(d) {
    const entries = readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (e.name !== "node_modules" && e.name !== ".git") walk(p);
      } else if (e.name.endsWith(".ts")) {
        const content = readFileSync(p, "utf8");
        const matches = content.match(regex);
        if (matches) results.push({ file: relative(root, p), count: matches.length });
      }
    }
  }
  walk(dir);
  return results;
}

function countTotal(matches) {
  return matches.reduce((s, m) => s + m.count, 0);
}

let failed = false;

console.log("=== Smell check ===\n");

// 1. ESLint
console.log("1. Running ESLint...");
const lintStatus = run("npx", [
  "eslint",
  "src/",
  "index.ts",
  "--max-warnings",
  String(THRESHOLDS.eslintMaxWarnings),
]);
if (lintStatus !== 0) {
  console.error(`\n[FAIL] ESLint reported issues (max ${THRESHOLDS.eslintMaxWarnings} warnings allowed)`);
  failed = true;
} else {
  console.log("   OK\n");
}

// 2. jscpd (duplicate code)
console.log("2. Running jscpd (duplicate code detection)...");
const jscpdStatus = run("npx", [
  "jscpd",
  "src/",
  "index.ts",
  "--min-lines",
  "8",
  "--min-tokens",
  "50",
  "--format",
  "compact",
  "--threshold",
  String(THRESHOLDS.jscpdMaxDuplication),
]);
if (jscpdStatus !== 0) {
  console.error("\n[FAIL] jscpd found too much duplication");
  failed = true;
} else {
  console.log("   OK\n");
}

// 3. Pattern grep: as any in src
console.log("3. Checking 'as any' in src/...");
const asAnyMatches = grepInDir(join(root, "src"), "as any");
const asAnyCount = countTotal(asAnyMatches);
if (asAnyCount > THRESHOLDS.asAnyInSrc) {
  console.error(`   [FAIL] Found ${asAnyCount} 'as any' in src/ (max ${THRESHOLDS.asAnyInSrc})`);
  asAnyMatches.forEach((m) => console.error(`     ${m.file}: ${m.count}`));
  failed = true;
} else {
  console.log(`   OK (${asAnyCount} occurrences, max ${THRESHOLDS.asAnyInSrc})\n`);
}

// 4. Pattern grep: TODO/FIXME/XXX
console.log("4. Checking TODO/FIXME/XXX in src/...");
const todoMatches = grepInDir(join(root, "src"), "TODO|FIXME|XXX");
const todoCount = countTotal(todoMatches);
if (todoCount > THRESHOLDS.todoFixme) {
  console.error(`   [FAIL] Found ${todoCount} TODO/FIXME/XXX in src/ (max ${THRESHOLDS.todoFixme})`);
  failed = true;
} else {
  console.log(`   OK (${todoCount} occurrences, max ${THRESHOLDS.todoFixme})\n`);
}

if (failed) {
  console.error("\n=== Smell check FAILED ===\n");
  process.exit(1);
}

console.log("=== Smell check PASSED ===\n");
