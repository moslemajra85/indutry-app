import { Router } from "express";
import { AuditService } from "../audit/audit.service";
import { getAuthUser, requireRole } from "../auth/auth.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { ProductionService } from "./production.service";
import {
  createProductionLineSchema,
  updateProductionLineStatusSchema,
} from "./production.validation";
import type { CreateProductionLineInput } from "./production.types";

export const productionRouter = Router();
const service = new ProductionService();
const auditService = new AuditService();

productionRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ data: await service.listLines() });
  }),
);

productionRouter.post(
  "/",
  requireRole("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const input = createProductionLineSchema.parse(req.body) as CreateProductionLineInput;
    const line = await service.createLine(input);

    await auditService.record({
      actor: user.email,
      action: "production_line.created",
      entityType: "production_line",
      entityId: line.id,
      summary: `Created production line ${line.code}`,
      metadata: { status: line.status, targetPerHour: line.targetPerHour },
    });

    res.status(201).json({ data: line });
  }),
);

productionRouter.patch(
  "/:id/status",
  requireRole("admin", "supervisor"),
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const input = updateProductionLineStatusSchema.parse(req.body);
    const line = await service.changeLineStatus(req.params.id, input.status);

    await auditService.record({
      actor: user.email,
      action: "production_line.status_changed",
      entityType: "production_line",
      entityId: line.id,
      summary: `Changed ${line.code} status to ${line.status}`,
      metadata: { status: line.status },
    });

    res.json({ data: line });
  }),
);
