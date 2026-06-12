import { describe, expect, it, vi } from "vitest";
import { ProductionEventsService } from "./production-events.service";
import type { ProductionEvent } from "./production-events.types";

const sampleEvent: ProductionEvent = {
  id: "b1a40a18-b8d4-4598-8fb0-2e602c85468c",
  lineId: "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
  lineCode: "WH-01",
  lineName: "Wire Harness Assembly 1",
  shift: "morning",
  operatorName: "Shift Leader",
  plannedMinutes: 480,
  goodUnits: 700,
  scrapUnits: 12,
  downtimeMinutes: 20,
  downtimeReason: "Material changeover",
  recordedAt: "2026-01-01T00:00:00.000Z",
};

describe("ProductionEventsService", () => {
  it("normalizes operator and downtime reason input before creating an event", async () => {
    const repository = {
      listRecent: vi.fn(),
      create: vi.fn().mockResolvedValue(sampleEvent),
      getSummary: vi.fn(),
    };
    const service = new ProductionEventsService(repository);

    await service.createEvent({
      lineId: sampleEvent.lineId,
      shift: "morning",
      operatorName: "  Shift Leader  ",
      plannedMinutes: 480,
      goodUnits: 700,
      scrapUnits: 12,
      downtimeMinutes: 20,
      downtimeReason: "   Material changeover   ",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        operatorName: "Shift Leader",
        downtimeReason: "Material changeover",
      }),
    );
  });
});
