#!/usr/bin/env node
/**
 * Parses Vitest/Istanbul coverage-final.json and prints a full list of
 * uncovered lines per file. Run after `npm run test:coverage`.
 *
 * Usage: node scripts/coverage-gaps.js [--json]
 *
 * With --json: output machine-readable JSON
 * Without: human-readable grouped by file
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const kitchenRoot = join(__dirname, '..');
const coveragePath = join(kitchenRoot, 'coverage', 'coverage-final.json');

// Only report on these paths (matches vitest coverage.include)
const INCLUDE_PATTERNS = [/^server\//, /^app\/src\//];
const EXCLUDE_PATTERNS = [/server\/openclaw\.js$/];

function shouldInclude(relPath) {
  if (EXCLUDE_PATTERNS.some((p) => p.test(relPath))) return false;
  return INCLUDE_PATTERNS.some((p) => p.test(relPath));
}

function toRanges(sorted) {
  if (sorted.length === 0) return [];
  const ranges = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (n !== prev + 1) {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = n;
    }
    prev = n;
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges;
}

function extractUncovered(entry) {
  const { statementMap = {}, s = {}, branchMap = {}, b = {} } = entry;
  const uncoveredLines = new Set();

  for (const [id, map] of Object.entries(statementMap)) {
    const hits = s[id];
    if (hits === 0 || hits === undefined) {
      uncoveredLines.add(map.start.line);
      if (map.end && map.end.line !== map.start.line) {
        for (let l = map.start.line; l <= map.end.line; l++) uncoveredLines.add(l);
      }
    }
  }

  for (const [id, map] of Object.entries(branchMap)) {
    const hits = b[id];
    if (Array.isArray(hits)) {
      hits.forEach((h, i) => {
        if (h === 0 && map.locations?.[i]) {
          const loc = map.locations[i];
          uncoveredLines.add(loc.start.line);
        }
      });
    }
  }

  return [...uncoveredLines].sort((a, b) => a - b);
}

function main() {
  const jsonOut = process.argv.includes('--json');

  if (!existsSync(coveragePath)) {
    console.error('No coverage data found. Run: npm run test:coverage');
    process.exit(1);
  }

  const raw = readFileSync(coveragePath, 'utf8');
  const coverage = JSON.parse(raw);

  let totalStmts = 0;
  let coveredStmts = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalFuncs = 0;
  let coveredFuncs = 0;
  const allLines = new Map();
  const coveredLines = new Map();

  for (const [absPath, entry] of Object.entries(coverage)) {
    const relPath = relative(kitchenRoot, absPath).replace(/\\/g, '/');
    if (!shouldInclude(relPath)) continue;

    const { statementMap = {}, s = {}, branchMap = {}, b = {}, fnMap = {}, f = {} } = entry;
    let fileLines = allLines.get(relPath) || new Set();
    let fileCovered = coveredLines.get(relPath) || new Set();
    for (const [id, map] of Object.entries(statementMap)) {
      totalStmts++;
      if (s[id] > 0) coveredStmts++;
      const endLine = map.end?.line ?? map.start.line;
      for (let l = map.start.line; l <= endLine; l++) {
        fileLines.add(l);
        if (s[id] > 0) fileCovered.add(l);
      }
    }
    allLines.set(relPath, fileLines);
    coveredLines.set(relPath, fileCovered);
    for (const [id, map] of Object.entries(branchMap)) {
      const hits = b[id];
      const locs = map.locations || [];
      for (let i = 0; i < locs.length; i++) {
        totalBranches++;
        if (hits?.[i] > 0) coveredBranches++;
      }
    }
    for (const id of Object.keys(fnMap)) {
      totalFuncs++;
      if (f[id] > 0) coveredFuncs++;
    }
  }

  let totalLineCount = 0;
  let coveredLineCount = 0;
  for (const [path, lines] of allLines) {
    const cov = coveredLines.get(path) || new Set();
    totalLineCount += lines.size;
    coveredLineCount += [...lines].filter((l) => cov.has(l)).length;
  }

  const stmtPct = totalStmts ? (100 * coveredStmts / totalStmts) : 100;
  const branchPct = totalBranches ? (100 * coveredBranches / totalBranches) : 100;
  const funcPct = totalFuncs ? (100 * coveredFuncs / totalFuncs) : 100;
  const linePct = totalLineCount ? (100 * coveredLineCount / totalLineCount) : 100;

  const gaps = {};

  for (const [absPath, entry] of Object.entries(coverage)) {
    const relPath = relative(kitchenRoot, absPath).replace(/\\/g, '/');
    if (!shouldInclude(relPath)) continue;

    const uncovered = extractUncovered(entry);
    if (uncovered.length > 0) {
      gaps[relPath] = {
        uncoveredLines: uncovered,
        ranges: toRanges(uncovered),
        count: uncovered.length,
      };
    }
  }

  const files = Object.keys(gaps).sort();

  if (jsonOut) {
    console.log(JSON.stringify({ files: gaps }, null, 2));
    return;
  }

  const THRESHOLD = 95;
  const fail = stmtPct < THRESHOLD || branchPct < THRESHOLD || funcPct < THRESHOLD || linePct < THRESHOLD;
  if (fail) {
    console.error(`\nCoverage for viable files (server/**, app/src/**, excl. openclaw):`);
    console.error(`  statements: ${stmtPct.toFixed(2)}% (need ${THRESHOLD}%)`);
    console.error(`  branches:   ${branchPct.toFixed(2)}% (need ${THRESHOLD}%)`);
    console.error(`  functions:  ${funcPct.toFixed(2)}% (need ${THRESHOLD}%)`);
    console.error(`  lines:      ${linePct.toFixed(2)}% (need ${THRESHOLD}%)`);
  }

  if (files.length > 0) {
    console.log('\nUncovered lines (run `npm run test:coverage` first)\n');
    for (const f of files) {
    const { ranges, count } = gaps[f];
    console.log(`${f}`);
    console.log(`  Lines: ${ranges.join(', ')} (${count} uncovered)`);
    console.log();
    }
  }

  if (files.length === 0 && !fail) {
    console.log('No uncovered lines in server/** or app/src/**');
  }
  if (fail) process.exit(1);
}

main();
