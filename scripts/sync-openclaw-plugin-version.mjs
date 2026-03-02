import fs from "node:fs";
import path from "node:path";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const repoRoot = process.cwd();
const pkgPath = path.join(repoRoot, "package.json");
const pluginPath = path.join(repoRoot, "openclaw.plugin.json");

const pkg = readJson(pkgPath);
const plugin = readJson(pluginPath);

const pkgVer = String(pkg.version || "").trim();
if (!pkgVer) {
  console.error(`[version-sync] package.json is missing version (${pkgPath})`);
  process.exit(1);
}

const prev = String(plugin.version || "").trim();
if (prev !== pkgVer) {
  plugin.version = pkgVer;
  fs.writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + "\n");
  console.log(`[version-sync] updated openclaw.plugin.json version: ${prev || "(missing)"} -> ${pkgVer}`);
} else {
  console.log(`[version-sync] OK: openclaw.plugin.json already matches ${pkgVer}`);
}
