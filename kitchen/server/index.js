import dotenv from "dotenv";
if (!process.env.VITEST) dotenv.config();
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createTeamsRouter } from "./routes/teams.js";
import { createRecipesRouter } from "./routes/recipes.js";
import { createBindingsRouter } from "./routes/bindings.js";
import { createCleanupRouter } from "./routes/cleanup.js";
import { createCoreRouter } from "./routes/core.js";
import { formatError } from "./validation.js";
import { authMiddleware } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3456;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 100;
const isProd = process.env.NODE_ENV === "production";

export { formatError };

/**
 * @param {{ production?: boolean }} [opts] - For tests: set production: true to simulate NODE_ENV=production
 */
export function createApp(opts = {}) {
  const prod = opts.production === true || isProd;
  const app = express();
  const corsOpts = prod
    ? {
        origin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN || false,
        allowedHeaders: ["Content-Type", "Authorization", "X-Confirm-Destructive"],
      }
    : {};
  app.use(cors(corsOpts));
  app.use(express.json({ limit: "256kb" }));

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    if (prod) {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"
      );
    }
    next();
  });

  if (prod) {
    app.use(
      rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX,
        skip: (req) => req.path === "/api/health",
      })
    );
  }

  if (process.env.KITCHEN_AUTH_ENABLED === "true") {
    app.use("/api", authMiddleware());
  }

  // API routes
  app.use("/api", createCoreRouter());
  app.use("/api/teams", createTeamsRouter(prod));
  app.use("/api/recipes", createRecipesRouter());
  app.use("/api/bindings", createBindingsRouter());
  app.use("/api/cleanup", createCleanupRouter(prod));

  // Static frontend and SPA fallback
  const appDist = join(__dirname, "..", "app", "dist");
  const distExists = existsSync(appDist);

  if (distExists) {
    app.use(express.static(appDist));
  }

  app.get("*", (req, res, next) => {
    if (!distExists) {
      res.status(503).type("html").send(
        `<!DOCTYPE html><html><head><title>Kitchen</title></head><body>` +
          `<p>Kitchen frontend not built.</p>` +
          `<p>Run: <code>cd kitchen && npm run build</code></p>` +
          `</body></html>`
      );
      return;
    }
    res.sendFile(join(appDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });

  app.use((err, _req, res, _next) => {
    console.error("[kitchen] Unhandled error:", err);
    res.status(500).json({ error: formatError(err) });
  });

  return app;
}

const app = createApp();
if (!process.env.VITEST) {
  const server = app.listen(PORT, () => {
    console.log(`[kitchen] Server running at http://localhost:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[kitchen] Port ${PORT} is in use. Stop the process (e.g. kill $(lsof -t -i:${PORT})) or run with PORT=<other>`
      );
      process.exit(1);
    }
    throw err;
  });
}
