import { describe, expect, it } from "vitest";
import { createQualityInspectionSchema } from "./quality.validation";

describe("createQualityInspectionSchema", () => {
  it("rejects inspections where defects exceed sample size", () => {
    const result = createQualityInspectionSchema.safeParse({
      lineId: "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
      inspectorName: "Quality Inspector",
      sampleSize: 10,
      defectCount: 11,
      severity: "high",
      status: "failed",
      notes: "Invalid inspection",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid inspection payload", () => {
    const result = createQualityInspectionSchema.safeParse({
      lineId: "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
      inspectorName: "Quality Inspector",
      sampleSize: 50,
      defectCount: 3,
      severity: "medium",
      status: "failed",
      notes: "Connector alignment issue",
    });

    expect(result.success).toBe(true);
  });
});
