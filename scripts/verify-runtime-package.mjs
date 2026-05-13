import { execFileSync } from "node:child_process";

const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

const jsonStart = output.lastIndexOf("\n[");
const payload = JSON.parse(jsonStart >= 0 ? output.slice(jsonStart + 1) : output.slice(output.indexOf("[")));
const files = new Set(payload[0]?.files?.map((entry) => entry.path) ?? []);

for (const required of ["dist/index.js", "package.json", "openclaw.plugin.json"]) {
  if (!files.has(required)) {
    throw new Error(`npm package is missing required runtime artifact: ${required}`);
  }
}

console.log("[runtime-package] OK: dist/index.js is included in npm pack output");
