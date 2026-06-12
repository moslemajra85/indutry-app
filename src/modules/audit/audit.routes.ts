import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { AuditService } from "./audit.service";

export const auditRouter = Router();
const service = new AuditService();

auditRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ data: await service.listRecentEvents() });
  }),
);
