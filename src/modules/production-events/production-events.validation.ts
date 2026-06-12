import { z } from "zod";

export const productionShiftSchema = z.enum(["morning", "evening", "night"]);

export const createProductionEventSchema = z
  .object({
    lineId: z.string().uuid(),
    shift: productionShiftSchema,
    operatorName: z.string().trim().min(2).max(120),
    plannedMinutes: z.number().int().positive().max(1440),
    goodUnits: z.number().int().min(0).max(1_000_000),
    scrapUnits: z.number().int().min(0).max(1_000_000),
    downtimeMinutes: z.number().int().min(0).max(1440),
    downtimeReason: z.string().trim().max(500).optional().nullable(),
  })
  .refine((input) => input.downtimeMinutes <= input.plannedMinutes, {
    message: "Downtime cannot be greater than planned production time",
    path: ["downtimeMinutes"],
  });
