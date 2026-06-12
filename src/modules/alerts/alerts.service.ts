import { MaintenanceService } from "../maintenance/maintenance.service";
import { ProductionEventsService } from "../production-events/production-events.service";
import { ProductionService } from "../production/production.service";
import { QualityService } from "../quality/quality.service";
import type { OperationalAlert } from "./alerts.types";

export class AlertsService {
  constructor(
    private readonly productionService = new ProductionService(),
    private readonly productionEventsService = new ProductionEventsService(),
    private readonly maintenanceService = new MaintenanceService(),
    private readonly qualityService = new QualityService(),
  ) {}

  async listAlerts(): Promise<OperationalAlert[]> {
    const [lines, productionKpis, tickets, qualitySummary] = await Promise.all([
      this.productionService.listLines(),
      this.productionEventsService.getKpiSummary(),
      this.maintenanceService.listTickets(),
      this.qualityService.getSummary(),
    ]);

    const now = new Date().toISOString();
    const alerts: OperationalAlert[] = [];
    const stoppedLines = lines.filter((line) => line.status !== "running");
    const criticalTickets = tickets.filter(
      (ticket) => ticket.priority === "critical" && ticket.status !== "resolved",
    );

    if (stoppedLines.length > 0) {
      alerts.push({
        id: "production-lines-not-running",
        severity: "warning",
        title: "Line availability risk",
        message: `${stoppedLines.length} production line(s) are paused or under maintenance.`,
        source: "production",
        createdAt: now,
      });
    }

    if (productionKpis.scrapRate >= 0.05) {
      alerts.push({
        id: "scrap-rate-high",
        severity: "critical",
        title: "Scrap rate above threshold",
        message: `Scrap rate is ${Math.round(productionKpis.scrapRate * 1000) / 10}%. Investigate process drift.`,
        source: "quality",
        createdAt: now,
      });
    }

    if (productionKpis.availabilityRate > 0 && productionKpis.availabilityRate < 0.85) {
      alerts.push({
        id: "availability-low",
        severity: "warning",
        title: "Availability below target",
        message: `Availability is ${Math.round(productionKpis.availabilityRate * 1000) / 10}%. Review downtime reasons.`,
        source: "production",
        createdAt: now,
      });
    }

    if (qualitySummary.failedInspections + qualitySummary.blockedInspections > 0) {
      alerts.push({
        id: "quality-containment-needed",
        severity: qualitySummary.blockedInspections > 0 ? "critical" : "warning",
        title: "Quality containment signal",
        message: `${qualitySummary.failedInspections} failed and ${qualitySummary.blockedInspections} blocked inspection(s) are recorded.`,
        source: "quality",
        createdAt: now,
      });
    }

    if (criticalTickets.length > 0) {
      alerts.push({
        id: "critical-maintenance-open",
        severity: "critical",
        title: "Critical maintenance open",
        message: `${criticalTickets.length} critical maintenance ticket(s) require action.`,
        source: "maintenance",
        createdAt: now,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: "operations-stable",
        severity: "info",
        title: "No major operational alerts",
        message: "No current threshold breach was detected from production, quality, or maintenance data.",
        source: "ai",
        createdAt: now,
      });
    }

    return alerts;
  }
}
