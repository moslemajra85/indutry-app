import { describe, expect, it, vi } from "vitest";
import { ProductionService } from "./production.service";
import type { ProductionLine } from "./production.types";

const sampleLine: ProductionLine = {
  id: "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
  code: "WH-01",
  name: "Wire Harness Assembly 1",
  area: "Assembly Hall A",
  targetPerHour: 120,
  status: "running",
  createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
};

describe("ProductionService", () => {
  it("normalizes line codes before creating a line", async () => {
    const repository = {
      create: vi.fn().mockResolvedValue(sampleLine),
      list: vi.fn(),
      updateStatus: vi.fn(),
    };
    const service = new ProductionService(repository);

    await service.createLine({
      code: "wh-01",
      name: "Wire Harness Assembly 1",
      area: "Assembly Hall A",
      targetPerHour: 120,
      status: "running",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "WH-01",
      }),
    );
  });

  it("throws a domain error when a production line does not exist", async () => {
    const repository = {
      create: vi.fn(),
      list: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue(null),
    };
    const service = new ProductionService(repository);

    await expect(
      service.changeLineStatus("0d768de2-e0ce-43a7-9f43-bf3de66d2b22", "paused"),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "PRODUCTION_LINE_NOT_FOUND",
    });
  });
});
