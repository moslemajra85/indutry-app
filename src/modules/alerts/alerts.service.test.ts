import { describe, expect, it, vi } from "vitest";
import { AlertsService } from "./alerts.service";

describe("AlertsService", () => {
  it("creates critical alerts for high scrap and critical maintenance", async () => {
    const service = new AlertsService(
      {
        listLines: vi.fn().mockResolvedValue([
          {
            id: "line-1",
            code: "WH-01",
            name: "Wire Harness Assembly",
            area: "Assembly",
            targetPerHour: 120,
            status: "running",
            createdAt: new Date().toISOString(),
          },
        ]),
      } as any,
      {
        getKpiSummary: vi.fn().mockResolvedValue({
          loggedEvents: 1,
          totalGoodUnits: 100,
          totalScrapUnits: 10,
          totalUnits: 110,
          scrapRate: 0.091,
          downtimeMinutes: 10,
          plannedMinutes: 480,
          availabilityRate: 0.97,
          averageUnitsPerHour: 13,
        }),
      } as any,
      {
        listTickets: vi.fn().mockResolvedValue([
          {
            id: "ticket-1",
            lineId: "line-1",
            lineCode: "WH-01",
            title: "Critical fault",
            description: "Station down",
            priority: "critical",
            status: "open",
            createdAt: new Date().toISOString(),
            resolvedAt: null,
          },
        ]),
      } as any,
      {
        getSummary: vi.fn().mockResolvedValue({
          totalInspections: 1,
          failedInspections: 0,
          blockedInspections: 0,
          totalSamples: 50,
          totalDefects: 0,
          defectRate: 0,
        }),
      } as any,
    );

    const alerts = await service.listAlerts();

    expect(alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "scrap-rate-high",
          severity: "critical",
        }),
        expect.objectContaining({
          id: "critical-maintenance-open",
          severity: "critical",
        }),
      ]),
    );
  });
});
