import { z } from "zod";

export const productionStatusSchema = z.enum(["running", "paused", "maintenance"]);

export const createProductionLineSchema = z.object({
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  area: z.string().trim().min(2).max(120),
  targetPerHour: z.number().int().positive().max(10000),
  status: productionStatusSchema.default("running"),
});

export const updateProductionLineStatusSchema = z.object({
  status: productionStatusSchema,
});
