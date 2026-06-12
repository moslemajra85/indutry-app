import { Router } from "express";
import { AuditService } from "../audit/audit.service";
import { asyncHandler } from "../../shared/http/async-handler";
import { ProductionEventsService } from "./production-events.service";
import { createProductionEventSchema } from "./production-events.validation";

export const productionEventsRouter = Router();
const service = new ProductionEventsService();
const auditService = new AuditService();

productionEventsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ data: await service.listRecentEvents() });
  }),
);

productionEventsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createProductionEventSchema.parse(req.body);
    const event = await service.createEvent(input);

    await auditService.record({
      actor: event.operatorName,
      action: "production_event.created",
      entityType: "production_event",
      entityId: event.id,
      summary: `Logged ${event.goodUnits} good units for ${event.lineCode}`,
      metadata: {
        lineId: event.lineId,
        shift: event.shift,
        goodUnits: event.goodUnits,
        scrapUnits: event.scrapUnits,
        downtimeMinutes: event.downtimeMinutes,
      },
    });

    res.status(201).json({ data: event });
  }),
);

productionEventsRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    res.json({ data: await service.getKpiSummary() });
  }),
);
