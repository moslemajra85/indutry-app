import { z } from "zod";

export const maintenanceStatusSchema = z.enum(["open", "in_progress", "resolved"]);

export const createMaintenanceTicketSchema = z.object({
  lineId: z.string().uuid(),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(1000),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export const updateMaintenanceStatusSchema = z.object({
  status: maintenanceStatusSchema,
});
