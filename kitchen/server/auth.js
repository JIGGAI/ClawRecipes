import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
const { compareSync, hashSync } = createRequire(import.meta.url)("bcryptjs");

/** Paths exempt from auth (relative to /api mount point) */
const EXEMPT_PATHS = ["/health", "/auth/status"];
const BCRYPT_COST = 10;

function isAuthEnabled() {
  return process.env.KITCHEN_AUTH_ENABLED === "true";
}

function getPassword() {
  const file = process.env.KITCHEN_AUTH_PASSWORD_FILE?.trim();
  if (file) {
    try {
      return readFileSync(file, "utf8").trim();
    } catch (err) {
      console.error("[kitchen] Failed to read KITCHEN_AUTH_PASSWORD_FILE:", err.message);
      return null;
    }
  }
  return process.env.KITCHEN_AUTH_PASSWORD ?? null;
}

function getAuthConfig() {
  const user = process.env.KITCHEN_AUTH_USER?.trim();
  const password = getPassword();
  return { user, password };
}

let passwordHash = null;

function getPasswordHash() {
  if (passwordHash) return passwordHash;
  const { password } = getAuthConfig();
  if (!password) return null;
  passwordHash = hashSync(password, BCRYPT_COST);
  return passwordHash;
}

export function authMiddleware() {
  if (!isAuthEnabled()) {
    return (_req, _res, next) => next();
  }

  const { user, password } = getAuthConfig();
  if (!user || !password) {
    console.error(
      "[kitchen] KITCHEN_AUTH_ENABLED=true but KITCHEN_AUTH_USER or KITCHEN_AUTH_PASSWORD/KITCHEN_AUTH_PASSWORD_FILE missing; auth disabled"
    );
    return (_req, _res, next) => next();
  }

  const hash = getPasswordHash();
  if (!hash) return (_req, _res, next) => next();

  return (req, res, next) => {
    if (EXEMPT_PATHS.includes(req.path)) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const encoded = authHeader.slice(6).trim();
    let decoded;
    try {
      decoded = Buffer.from(encoded, "base64").toString("utf8");
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const reqUser = decoded.slice(0, colonIndex);
    const reqPassword = decoded.slice(colonIndex + 1);

    const userBuf = Buffer.from(user, "utf8");
    const reqUserBuf = Buffer.from(reqUser, "utf8");
    let userMatch = userBuf.length === reqUserBuf.length && timingSafeEqual(userBuf, reqUserBuf);
    if (!userMatch) {
      compareSync(reqPassword, hash);
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!compareSync(reqPassword, hash)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    next();
  };
}

export { isAuthEnabled };

/**
 * For tests only: reset cached hash when switching auth config (e.g. PASSWORD vs PASSWORD_FILE).
 * Tests should import via tests/auth-test-utils.js (resetAuthCacheForTests) rather than this directly.
 */
export function _testOnlyResetPasswordHashCache() {
  if (process.env.VITEST) passwordHash = null;
}
