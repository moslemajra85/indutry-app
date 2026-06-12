import { AuditRepository } from "./audit.repository";
import type { AuditEvent, CreateAuditEventInput } from "./audit.types";

export interface AuditRepositoryPort {
  listRecent(limit?: number): Promise<AuditEvent[]>;
  create(input: CreateAuditEventInput): Promise<AuditEvent>;
}

export class AuditService {
  constructor(private readonly repository: AuditRepositoryPort = new AuditRepository()) {}

  listRecentEvents(): Promise<AuditEvent[]> {
    return this.repository.listRecent(30);
  }

  record(input: CreateAuditEventInput): Promise<AuditEvent> {
    return this.repository.create({
      ...input,
      actor: input.actor.trim() || "system",
      summary: input.summary.trim(),
    });
  }
}
