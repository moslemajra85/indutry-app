import { Pool } from "pg";
import { demoStore } from "../../demo/demo-store";
import { pool } from "../../infra/database/pool";
import { env } from "../../shared/config/env";
import type {
  CreateMaintenanceTicketInput,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
} from "./maintenance.types";

interface MaintenanceTicketRow {
  id: string;
  line_id: string;
  line_code: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  created_at: Date;
  resolved_at: Date | null;
}

function mapRow(row: MaintenanceTicketRow): MaintenanceTicket {
  return {
    id: row.id,
    lineId: row.line_id,
    lineCode: row.line_code,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString() ?? null,
  };
}

export class MaintenanceRepository {
  constructor(private readonly db: Pool = pool) {}

  async list(): Promise<MaintenanceTicket[]> {
    if (env.demoMode) {
      return demoStore.listMaintenanceTickets();
    }

    const result = await this.db.query<MaintenanceTicketRow>(
      `SELECT mt.id,
              mt.line_id,
              pl.code AS line_code,
              mt.title,
              mt.description,
              mt.priority,
              mt.status,
              mt.created_at,
              mt.resolved_at
       FROM maintenance_tickets mt
       JOIN production_lines pl ON pl.id = mt.line_id
       ORDER BY mt.created_at DESC`,
    );

    return result.rows.map(mapRow);
  }

  async create(input: CreateMaintenanceTicketInput): Promise<MaintenanceTicket> {
    if (env.demoMode) {
      return demoStore.createMaintenanceTicket(input);
    }

    const result = await this.db.query<MaintenanceTicketRow>(
      `INSERT INTO maintenance_tickets (line_id, title, description, priority, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING id,
                 line_id,
                 (SELECT code FROM production_lines WHERE id = line_id) AS line_code,
                 title,
                 description,
                 priority,
                 status,
                 created_at,
                 resolved_at`,
      [input.lineId, input.title, input.description, input.priority],
    );

    return mapRow(result.rows[0]);
  }

  async updateStatus(id: string, status: MaintenanceStatus): Promise<MaintenanceTicket | null> {
    if (env.demoMode) {
      return demoStore.updateMaintenanceTicketStatus(id, status);
    }

    const result = await this.db.query<MaintenanceTicketRow>(
      `UPDATE maintenance_tickets
       SET status = $2,
           resolved_at = CASE WHEN $2 = 'resolved' THEN now() ELSE NULL END
       WHERE id = $1
       RETURNING id,
                 line_id,
                 (SELECT code FROM production_lines WHERE id = line_id) AS line_code,
                 title,
                 description,
                 priority,
                 status,
                 created_at,
                 resolved_at`,
      [id, status],
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }
}
