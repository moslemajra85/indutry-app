import { Router } from "express";
import { AuditService } from "../audit/audit.service";
import { getAuthUser, requireRole } from "../auth/auth.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { QualityService } from "./quality.service";
import { createQualityInspectionSchema } from "./quality.validation";
import type { CreateQualityInspectionInput } from "./quality.types";

export const qualityRouter = Router();
const service = new QualityService();
const auditService = new AuditService();

qualityRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ data: await service.listRecentInspections() });
  }),
);

qualityRouter.post(
  "/",
  requireRole("admin", "supervisor", "quality"),
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const input = createQualityInspectionSchema.parse(req.body) as CreateQualityInspectionInput;
    const inspection = await service.createInspection(input);

    await auditService.record({
      actor: user.email,
      action: "quality.inspection.created",
      entityType: "quality_inspection",
      entityId: inspection.id,
      summary: `${inspection.status} inspection recorded for ${inspection.lineCode}`,
      metadata: {
        lineId: inspection.lineId,
        severity: inspection.severity,
        sampleSize: inspection.sampleSize,
        defectCount: inspection.defectCount,
      },
    });

    res.status(201).json({ data: inspection });
  }),
);

qualityRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    res.json({ data: await service.getSummary() });
  }),
);
