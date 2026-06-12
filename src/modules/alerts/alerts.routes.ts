import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { AlertsService } from "./alerts.service";

export const alertsRouter = Router();
const service = new AlertsService();

alertsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ data: await service.listAlerts() });
  }),
);
