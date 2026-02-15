import { Router } from "express";
import { checkOpenClaw } from "../openclaw.js";
import { getRecentEvents, MAX_EVENTS } from "../activity.js";
import { withErrorHandler } from "../middleware.js";
import { isAuthEnabled } from "../auth.js";

export function createCoreRouter() {
  const router = Router();

  router.get("/auth/status", (_req, res) => {
    res.json({ authRequired: isAuthEnabled() });
  });

  router.get("/health", async (_req, res) => {
    try {
      const openclaw = await checkOpenClaw();
      res.json({ ok: true, openclaw });
    } catch (err) {
      console.error("[kitchen] Health check failed:", err);
      res.status(503).json({ ok: false, openclaw: false });
    }
  });

  router.get("/activity", withErrorHandler((req, res) => {
    const raw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(1, raw), MAX_EVENTS) : 50;
    const events = getRecentEvents(limit);
    res.json(events);
  }, "GET /api/activity", 500));

  return router;
}
