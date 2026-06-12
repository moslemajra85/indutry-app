export type MaintenancePriority = "low" | "medium" | "high" | "critical";
export type MaintenanceStatus = "open" | "in_progress" | "resolved";

export interface MaintenanceTicket {
  id: string;
  lineId: string;
  lineCode: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreateMaintenanceTicketInput {
  lineId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
}
