#!/usr/bin/env node
/**
 * CI/guard: bundled team recipes must include "## Files" and "## Tooling" in the markdown body.
 *
 * We only check recipes/default/*.md where frontmatter kind: team.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function splitFrontmatter(md, file) {
  if (!md.startsWith("---\n")) throw new Error(`${file}: must start with YAML frontmatter (---)`);
  const end = md.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${file}: frontmatter not terminated (---)`);
  return { frontmatter: md.slice(4, end + 1), body: md.slice(end + 5) };
}

function isTeamRecipe(frontmatter) {
  // cheap parse: look for kind: team at line start
  return /^kind:\s*team\s*$/m.test(frontmatter);
}

function hasRequiredHeadings(body) {
  return body.includes("## Files") && body.includes("## Tooling");
}

const root = path.join(__dirname, "..", "recipes", "default");
const files = fs.readdirSync(root).filter((f) => f.endsWith(".md"));

const failures = [];

for (const f of files) {
  const full = path.join(root, f);
  const md = fs.readFileSync(full, "utf8");
  const { frontmatter, body } = splitFrontmatter(md, f);
  if (!isTeamRecipe(frontmatter)) continue;
  if (!hasRequiredHeadings(body)) {
    failures.push(`${f}: missing required headings (## Files and/or ## Tooling)`);
  }
}

if (failures.length) {
  console.error("Bundled team recipe guard FAILED:\n" + failures.map((x) => `- ${x}`).join("\n"));
  process.exit(1);
}

console.log("Bundled team recipe guard OK (all team recipes include ## Files and ## Tooling)");
