import { Router } from "express";
import { AlertsService } from "../alerts/alerts.service";
import { MaintenanceService } from "../maintenance/maintenance.service";
import { ProductionEventsService } from "../production-events/production-events.service";
import { ProductionService } from "../production/production.service";
import { QualityService } from "../quality/quality.service";
import { asyncHandler } from "../../shared/http/async-handler";
import { AiService } from "./ai.service";

export const aiRouter = Router();

const aiService = new AiService();
const alertsService = new AlertsService();
const productionService = new ProductionService();
const productionEventsService = new ProductionEventsService();
const maintenanceService = new MaintenanceService();
const qualityService = new QualityService();

aiRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    res.json({ data: await aiService.getStatus() });
  }),
);

aiRouter.post(
  "/factory-insight",
  asyncHandler(async (_req, res) => {
    const [
      productionLines,
      maintenanceTickets,
      productionEvents,
      productionKpis,
      qualityInspections,
      qualitySummary,
      alerts,
    ] = await Promise.all([
      productionService.listLines(),
      maintenanceService.listTickets(),
      productionEventsService.listRecentEvents(),
      productionEventsService.getKpiSummary(),
      qualityService.listRecentInspections(),
      qualityService.getSummary(),
      alertsService.listAlerts(),
    ]);

    const insight = await aiService.generateFactoryInsight({
      productionLines,
      maintenanceTickets,
      productionEvents,
      productionKpis,
      qualityInspections,
      qualitySummary,
      alerts,
    });

    res.json({ data: insight });
  }),
);
