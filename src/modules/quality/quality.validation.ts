import { z } from "zod";

export const qualitySeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const qualityStatusSchema = z.enum(["passed", "failed", "blocked"]);

export const createQualityInspectionSchema = z
  .object({
    lineId: z.string().uuid(),
    inspectorName: z.string().trim().min(2).max(120),
    sampleSize: z.number().int().positive().max(100_000),
    defectCount: z.number().int().min(0).max(100_000),
    severity: qualitySeveritySchema,
    status: qualityStatusSchema,
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((input) => input.defectCount <= input.sampleSize, {
    message: "Defect count cannot be greater than sample size",
    path: ["defectCount"],
  });
