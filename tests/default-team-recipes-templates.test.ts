import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { parseFrontmatter } from "../src/lib/recipe-frontmatter";

function repoPath(...parts: string[]) {
  return path.resolve(__dirname, "..", ...parts);
}

type AnyObj = Record<string, unknown>;

function asObj(v: unknown): AnyObj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as AnyObj) : {};
}

function getAgentRoles(frontmatter: AnyObj): string[] {
  const agents = frontmatter.agents;
  if (!Array.isArray(agents)) return [];
  const roles: string[] = [];
  for (const a of agents) {
    const o = asObj(a);
    const role = String(o.role ?? "").trim();
    if (role) roles.push(role);
  }
  return roles;
}

function getTemplates(frontmatter: AnyObj): AnyObj {
  return asObj(frontmatter.templates);
}

describe("default team recipes templates", () => {
  test("team recipes with a lead role must define templates.lead.tools", async () => {
    const dir = repoPath("recipes", "default");
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md")).sort();

    const missing: string[] = [];

    for (const file of files) {
      const full = path.join(dir, file);
      const md = await fs.readFile(full, "utf8");
      const { frontmatter } = parseFrontmatter(md);
      const fm = asObj(frontmatter);

      if (String(fm.kind ?? "") !== "team") continue;

      const roles = new Set(getAgentRoles(fm));
      if (!roles.has("lead")) continue;

      const templates = getTemplates(fm);
      // YAML keys like "lead.tools" remain string keys after parse.
      const hasLeadTools = typeof templates["lead.tools"] === "string" && String(templates["lead.tools"]).trim().length > 0;

      if (!hasLeadTools) missing.push(file);
    }

    expect(missing, `Missing templates.lead.tools in: ${missing.join(", ")}`).toEqual([]);
  });
});
