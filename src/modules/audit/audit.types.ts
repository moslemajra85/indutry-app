export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateAuditEventInput {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}
