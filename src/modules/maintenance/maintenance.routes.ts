import { Router } from "express";
import { AuditService } from "../audit/audit.service";
import { getAuthUser, requireRole } from "../auth/auth.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { MaintenanceService } from "./maintenance.service";
import {
  createMaintenanceTicketSchema,
  updateMaintenanceStatusSchema,
} from "./maintenance.validation";
import type { CreateMaintenanceTicketInput } from "./maintenance.types";

export const maintenanceRouter = Router();
const service = new MaintenanceService();
const auditService = new AuditService();

maintenanceRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ data: await service.listTickets() });
  }),
);

maintenanceRouter.post(
  "/",
  requireRole("admin", "supervisor", "line_leader", "maintenance"),
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const input = createMaintenanceTicketSchema.parse(req.body) as CreateMaintenanceTicketInput;
    const ticket = await service.createTicket(input);

    await auditService.record({
      actor: user.email,
      action: "maintenance_ticket.created",
      entityType: "maintenance_ticket",
      entityId: ticket.id,
      summary: `Created ${ticket.priority} maintenance ticket for ${ticket.lineCode}`,
      metadata: { lineId: ticket.lineId, priority: ticket.priority },
    });

    res.status(201).json({ data: ticket });
  }),
);

maintenanceRouter.patch(
  "/:id/status",
  requireRole("admin", "supervisor", "maintenance"),
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const input = updateMaintenanceStatusSchema.parse(req.body);
    const ticket = await service.changeTicketStatus(req.params.id, input.status);

    await auditService.record({
      actor: user.email,
      action: "maintenance_ticket.status_changed",
      entityType: "maintenance_ticket",
      entityId: ticket.id,
      summary: `Changed maintenance ticket ${ticket.id} to ${ticket.status}`,
      metadata: { lineId: ticket.lineId, status: ticket.status },
    });

    res.json({ data: ticket });
  }),
);
