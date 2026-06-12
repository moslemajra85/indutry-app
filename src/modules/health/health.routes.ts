import { Router } from "express";
import { pool } from "../../infra/database/pool";
import { asyncHandler } from "../../shared/http/async-handler";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      checks: {
        api: "ok",
        database: "ok",
      },
    });
  }),
);
