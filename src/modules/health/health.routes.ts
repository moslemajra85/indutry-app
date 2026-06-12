import { Router } from "express";
import { pool } from "../../infra/database/pool";
import { env } from "../../shared/config/env";
import { asyncHandler } from "../../shared/http/async-handler";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    if (!env.demoMode) {
      await pool.query("SELECT 1");
    }

    res.json({
      status: "ok",
      checks: {
        api: "ok",
        database: env.demoMode ? "in-memory" : "ok",
      },
    });
  }),
);
