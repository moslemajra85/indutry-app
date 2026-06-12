import { Pool } from "pg";
import { demoStore } from "../../demo/demo-store";
import { pool } from "../../infra/database/pool";
import { env } from "../../shared/config/env";
import type { AuditEvent, CreateAuditEventInput } from "./audit.types";

interface AuditEventRow {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

function mapRow(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    actor: row.actor,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  };
}

export class AuditRepository {
  constructor(private readonly db: Pool = pool) {}

  async listRecent(limit = 30): Promise<AuditEvent[]> {
    if (env.demoMode) {
      return demoStore.listAuditEvents(limit);
    }

    const result = await this.db.query<AuditEventRow>(
      `SELECT id, actor, action, entity_type, entity_id, summary, metadata, created_at
       FROM audit_events
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );

    return result.rows.map(mapRow);
  }

  async create(input: CreateAuditEventInput): Promise<AuditEvent> {
    if (env.demoMode) {
      return demoStore.createAuditEvent(input);
    }

    const result = await this.db.query<AuditEventRow>(
      `INSERT INTO audit_events (actor, action, entity_type, entity_id, summary, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, actor, action, entity_type, entity_id, summary, metadata, created_at`,
      [
        input.actor,
        input.action,
        input.entityType,
        input.entityId,
        input.summary,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return mapRow(result.rows[0]);
  }
}
