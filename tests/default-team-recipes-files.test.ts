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

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

type FileDecl = { path: string; template: string };

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

function getFiles(frontmatter: AnyObj): FileDecl[] {
  const files = asArr(frontmatter.files);
  const out: FileDecl[] = [];
  for (const f of files) {
    const o = asObj(f);
    const p = String(o.path ?? "").trim();
    const t = String(o.template ?? "").trim();
    if (p && t) out.push({ path: p, template: t });
  }
  return out;
}

describe("default team recipes files", () => {
  test("for each default team recipe: every role can resolve templates for every declared file", async () => {
    const dir = repoPath("recipes", "default");
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md")).sort();

    const failures: string[] = [];

    for (const file of files) {
      const full = path.join(dir, file);
      const md = await fs.readFile(full, "utf8");
      const { frontmatter } = parseFrontmatter(md);
      const fm = asObj(frontmatter);

      if (String(fm.kind ?? "") !== "team") continue;

      const roles = getAgentRoles(fm);
      const decls = getFiles(fm);
      const templates = getTemplates(fm);

      // If a team recipe declares files, every role should be able to resolve a template for each.
      // Resolution rule we enforce:
      // - prefer `${role}.${template}`
      // - else fall back to `${template}`
      for (const role of roles) {
        for (const d of decls) {
          const roleKey = `${role}.${d.template}`;
          const baseKey = d.template;
          const ok =
            (typeof templates[roleKey] === "string" && String(templates[roleKey]).trim().length > 0) ||
            (typeof templates[baseKey] === "string" && String(templates[baseKey]).trim().length > 0);

          if (!ok) failures.push(`${file}: role=${role} file=${d.path} template=${d.template} (missing ${roleKey} or ${baseKey})`);
        }
      }
    }

    expect(failures, failures.join("\n")).toEqual([]);
  });
});
