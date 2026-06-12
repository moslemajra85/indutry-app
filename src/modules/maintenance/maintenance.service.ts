import { AppError } from "../../shared/http/app-error";
import { MaintenanceRepository } from "./maintenance.repository";
import type {
  CreateMaintenanceTicketInput,
  MaintenanceStatus,
  MaintenanceTicket,
} from "./maintenance.types";

export interface MaintenanceRepositoryPort {
  list(): Promise<MaintenanceTicket[]>;
  create(input: CreateMaintenanceTicketInput): Promise<MaintenanceTicket>;
  updateStatus(id: string, status: MaintenanceStatus): Promise<MaintenanceTicket | null>;
}

export class MaintenanceService {
  constructor(private readonly repository: MaintenanceRepositoryPort = new MaintenanceRepository()) {}

  listTickets(): Promise<MaintenanceTicket[]> {
    return this.repository.list();
  }

  createTicket(input: CreateMaintenanceTicketInput): Promise<MaintenanceTicket> {
    return this.repository.create(input);
  }

  async changeTicketStatus(id: string, status: MaintenanceStatus): Promise<MaintenanceTicket> {
    const ticket = await this.repository.updateStatus(id, status);

    if (!ticket) {
      throw new AppError("Maintenance ticket not found", 404, "MAINTENANCE_TICKET_NOT_FOUND");
    }

    return ticket;
  }
}
