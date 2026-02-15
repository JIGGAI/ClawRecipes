import { describe, expect, test, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  readKitchenAuthEnv,
  writeKitchenAuthEnv,
  getKitchenEnvPath,
} from "../src/lib/kitchen-auth-env";

describe("kitchen-auth-env", () => {
  let pluginDir: string;

  beforeEach(async () => {
    pluginDir = await fs.mkdtemp(path.join(os.tmpdir(), "kitchen-auth-env-test-"));
  });

  afterEach(async () => {
    await fs.rm(pluginDir, { recursive: true, force: true });
  });

  test("getKitchenEnvPath returns kitchen/.env under pluginDir", () => {
    expect(getKitchenEnvPath(pluginDir)).toBe(path.join(pluginDir, "kitchen", ".env"));
  });

  test("readKitchenAuthEnv returns {} when .env does not exist", async () => {
    const env = await readKitchenAuthEnv(pluginDir);
    expect(env).toEqual({});
  });

  test("writeKitchenAuthEnv creates .env and dir when missing", async () => {
    await writeKitchenAuthEnv(pluginDir, {
      KITCHEN_AUTH_ENABLED: "true",
      KITCHEN_AUTH_USER: "admin",
      KITCHEN_AUTH_PASSWORD: "secret",
    });
    const env = await readKitchenAuthEnv(pluginDir);
    expect(env).toEqual({
      KITCHEN_AUTH_ENABLED: "true",
      KITCHEN_AUTH_USER: "admin",
      KITCHEN_AUTH_PASSWORD: "secret",
    });
  });

  test("roundtrip: passwords with =, quotes, backslashes", async () => {
    const password = 'foo=bar "baz" \\quux';
    await writeKitchenAuthEnv(pluginDir, {
      KITCHEN_AUTH_ENABLED: "true",
      KITCHEN_AUTH_USER: "user",
      KITCHEN_AUTH_PASSWORD: password,
    });
    const env = await readKitchenAuthEnv(pluginDir);
    expect(env.KITCHEN_AUTH_PASSWORD).toBe(password);
  });

  test("roundtrip: username with special chars", async () => {
    const user = "admin@example.com";
    await writeKitchenAuthEnv(pluginDir, {
      KITCHEN_AUTH_ENABLED: "true",
      KITCHEN_AUTH_USER: user,
      KITCHEN_AUTH_PASSWORD: "pwd",
    });
    const env = await readKitchenAuthEnv(pluginDir);
    expect(env.KITCHEN_AUTH_USER).toBe(user);
  });

  test("preserves comments and non-auth vars", async () => {
    await fs.mkdir(path.join(pluginDir, "kitchen"), { recursive: true });
    await fs.writeFile(
      getKitchenEnvPath(pluginDir),
      `# Optional Basic Auth
PORT=3456
KITCHEN_AUTH_ENABLED=true
KITCHEN_AUTH_USER=old
KITCHEN_AUTH_PASSWORD=oldpass
`,
      "utf8"
    );
    await writeKitchenAuthEnv(pluginDir, { KITCHEN_AUTH_PASSWORD: "newpass" });
    const content = await fs.readFile(getKitchenEnvPath(pluginDir), "utf8");
    expect(content).toContain("# Optional Basic Auth");
    expect(content).toContain("PORT=3456");
    expect(content).toContain("KITCHEN_AUTH_PASSWORD=");
    const env = await readKitchenAuthEnv(pluginDir);
    expect(env.KITCHEN_AUTH_PASSWORD).toBe("newpass");
    expect(env.KITCHEN_AUTH_USER).toBe("old");
  });

  test("roundtrip: KITCHEN_AUTH_PASSWORD_FILE", async () => {
    const filePath = "/run/secrets/kitchen-password";
    await writeKitchenAuthEnv(pluginDir, {
      KITCHEN_AUTH_ENABLED: "true",
      KITCHEN_AUTH_USER: "admin",
      KITCHEN_AUTH_PASSWORD_FILE: filePath,
    });
    const env = await readKitchenAuthEnv(pluginDir);
    expect(env.KITCHEN_AUTH_PASSWORD_FILE).toBe(filePath);
    expect(env.KITCHEN_AUTH_PASSWORD).toBeUndefined();
  });

  test("disable: sets KITCHEN_AUTH_ENABLED=false", async () => {
    await writeKitchenAuthEnv(pluginDir, {
      KITCHEN_AUTH_ENABLED: "true",
      KITCHEN_AUTH_USER: "admin",
      KITCHEN_AUTH_PASSWORD: "pwd",
    });
    await writeKitchenAuthEnv(pluginDir, { KITCHEN_AUTH_ENABLED: "false" });
    const env = await readKitchenAuthEnv(pluginDir);
    expect(env.KITCHEN_AUTH_ENABLED).toBe("false");
  });
});
