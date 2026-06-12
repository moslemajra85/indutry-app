import { randomUUID } from "node:crypto";
import { hashPassword } from "../modules/auth/password";
import type { AuditEvent, CreateAuditEventInput } from "../modules/audit/audit.types";
import type { AuthUser, UserRecord } from "../modules/auth/auth.types";
import type {
  CreateMaintenanceTicketInput,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
} from "../modules/maintenance/maintenance.types";
import type {
  CreateProductionEventInput,
  ProductionEvent,
  ProductionKpiSummary,
  ProductionShift,
} from "../modules/production-events/production-events.types";
import type {
  CreateProductionLineInput,
  ProductionLine,
  ProductionLineStatus,
} from "../modules/production/production.types";
import type {
  CreateQualityInspectionInput,
  QualityInspection,
  QualitySeverity,
  QualityStatus,
  QualitySummary,
} from "../modules/quality/quality.types";
import { AppError } from "../shared/http/app-error";

function timestamp(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function createUser(
  name: string,
  email: string,
  role: AuthUser["role"],
  password: string,
): UserRecord {
  return {
    id: randomUUID(),
    name,
    email,
    role,
    passwordHash: hashPassword(password, `demo-${email}`),
    createdAt: timestamp(60),
  };
}

function createLine(
  code: string,
  name: string,
  area: string,
  targetPerHour: number,
  status: ProductionLineStatus,
): ProductionLine {
  return {
    id: randomUUID(),
    code,
    name,
    area,
    targetPerHour,
    status,
    createdAt: timestamp(180),
  };
}

function roundMetric(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

class DemoStore {
  private readonly users: UserRecord[] = [
    createUser("Admin User", "admin@industryops.local", "admin", "IndustryOps123!"),
    createUser("Factory Supervisor", "supervisor@industryops.local", "supervisor", "IndustryOps123!"),
    createUser("Line Leader", "line.leader@industryops.local", "line_leader", "IndustryOps123!"),
    createUser("Quality Inspector", "quality@industryops.local", "quality", "IndustryOps123!"),
    createUser(
      "Maintenance Technician",
      "maintenance@industryops.local",
      "maintenance",
      "IndustryOps123!",
    ),
    createUser("Read Only Viewer", "viewer@industryops.local", "viewer", "IndustryOps123!"),
  ];

  private readonly productionLines: ProductionLine[] = [
    createLine("WH-01", "Wire Harness Assembly 1", "Assembly Hall A", 120, "running"),
    createLine("CUT-02", "Cable Cutting Cell 2", "Preparation Area", 180, "paused"),
    createLine("QA-01", "End-of-Line Quality Gate", "Quality Lab", 95, "running"),
  ];

  private readonly productionEvents: ProductionEvent[] = [];
  private readonly qualityInspections: QualityInspection[] = [];
  private readonly maintenanceTickets: MaintenanceTicket[] = [];
  private readonly auditEvents: AuditEvent[] = [];

  constructor() {
    const wh01 = this.getLineByCode("WH-01");
    const cut02 = this.getLineByCode("CUT-02");
    const qa01 = this.getLineByCode("QA-01");

    if (wh01 && cut02 && qa01) {
      this.productionEvents.unshift(
        this.createSeedProductionEvent(wh01, {
          shift: "morning",
          operatorName: "Demo Supervisor",
          plannedMinutes: 480,
          goodUnits: 780,
          scrapUnits: 22,
          downtimeMinutes: 35,
          downtimeReason: "Material changeover and sensor verification",
          recordedAt: timestamp(240),
        }),
        this.createSeedProductionEvent(cut02, {
          shift: "morning",
          operatorName: "Demo Supervisor",
          plannedMinutes: 480,
          goodUnits: 620,
          scrapUnits: 18,
          downtimeMinutes: 70,
          downtimeReason: "Blade adjustment and feeder inspection",
          recordedAt: timestamp(180),
        }),
      );

      this.qualityInspections.unshift(
        this.createSeedInspection(wh01, {
          inspectorName: "Quality Team A",
          sampleSize: 50,
          defectCount: 2,
          severity: "medium",
          status: "passed",
          notes: "Minor cosmetic defects inside accepted threshold",
          createdAt: timestamp(150),
        }),
        this.createSeedInspection(qa01, {
          inspectorName: "Quality Team A",
          sampleSize: 40,
          defectCount: 6,
          severity: "high",
          status: "failed",
          notes: "False rejects and connector alignment issue require containment check",
          createdAt: timestamp(120),
        }),
      );

      this.maintenanceTickets.unshift({
        id: randomUUID(),
        lineId: qa01.id,
        lineCode: qa01.code,
        title: "Sensor calibration drift",
        description: "Optical sensor requires recalibration after repeated false rejects.",
        priority: "high",
        status: "open",
        createdAt: timestamp(90),
        resolvedAt: null,
      });
    }

    this.auditEvents.unshift({
      id: randomUUID(),
      actor: "system",
      action: "seed",
      entityType: "database",
      entityId: "initial-seed",
      summary: "Seeded demo production, maintenance, quality, and auth records",
      metadata: {},
      createdAt: timestamp(75),
    });
  }

  findUserByEmail(email: string): UserRecord | null {
    return this.users.find((user) => user.email === email.toLowerCase()) ?? null;
  }

  listProductionLines(): ProductionLine[] {
    return [...this.productionLines].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  createProductionLine(input: CreateProductionLineInput): ProductionLine {
    const line: ProductionLine = {
      id: randomUUID(),
      code: input.code,
      name: input.name,
      area: input.area,
      targetPerHour: input.targetPerHour,
      status: input.status,
      createdAt: new Date().toISOString(),
    };

    this.productionLines.push(line);
    return line;
  }

  updateProductionLineStatus(id: string, status: ProductionLineStatus): ProductionLine | null {
    const line = this.productionLines.find((item) => item.id === id);

    if (!line) {
      return null;
    }

    line.status = status;
    return line;
  }

  listProductionEvents(limit = 20): ProductionEvent[] {
    return [...this.productionEvents]
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .slice(0, limit);
  }

  createProductionEvent(input: CreateProductionEventInput): ProductionEvent {
    const line = this.requireLine(input.lineId);

    const event: ProductionEvent = {
      id: randomUUID(),
      lineId: line.id,
      lineCode: line.code,
      lineName: line.name,
      shift: input.shift,
      operatorName: input.operatorName,
      plannedMinutes: input.plannedMinutes,
      goodUnits: input.goodUnits,
      scrapUnits: input.scrapUnits,
      downtimeMinutes: input.downtimeMinutes,
      downtimeReason: input.downtimeReason ?? null,
      recordedAt: new Date().toISOString(),
    };

    this.productionEvents.push(event);
    return event;
  }

  getProductionKpiSummary(): ProductionKpiSummary {
    const loggedEvents = this.productionEvents.length;
    const totalGoodUnits = this.productionEvents.reduce((sum, event) => sum + event.goodUnits, 0);
    const totalScrapUnits = this.productionEvents.reduce((sum, event) => sum + event.scrapUnits, 0);
    const downtimeMinutes = this.productionEvents.reduce((sum, event) => sum + event.downtimeMinutes, 0);
    const plannedMinutes = this.productionEvents.reduce((sum, event) => sum + event.plannedMinutes, 0);
    const totalUnits = totalGoodUnits + totalScrapUnits;
    const productiveMinutes = Math.max(plannedMinutes - downtimeMinutes, 0);

    return {
      loggedEvents,
      totalGoodUnits,
      totalScrapUnits,
      totalUnits,
      scrapRate: totalUnits > 0 ? roundMetric(totalScrapUnits / totalUnits) : 0,
      downtimeMinutes,
      plannedMinutes,
      availabilityRate: plannedMinutes > 0 ? roundMetric(productiveMinutes / plannedMinutes) : 0,
      averageUnitsPerHour:
        productiveMinutes > 0 ? roundMetric(totalGoodUnits / (productiveMinutes / 60)) : 0,
    };
  }

  listQualityInspections(limit = 20): QualityInspection[] {
    return [...this.qualityInspections]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  createQualityInspection(input: CreateQualityInspectionInput): QualityInspection {
    const line = this.requireLine(input.lineId);

    const inspection: QualityInspection = {
      id: randomUUID(),
      lineId: line.id,
      lineCode: line.code,
      lineName: line.name,
      inspectorName: input.inspectorName,
      sampleSize: input.sampleSize,
      defectCount: input.defectCount,
      severity: input.severity,
      status: input.status,
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
    };

    this.qualityInspections.push(inspection);
    return inspection;
  }

  getQualitySummary(): QualitySummary {
    const totalInspections = this.qualityInspections.length;
    const failedInspections = this.qualityInspections.filter((inspection) => inspection.status === "failed").length;
    const blockedInspections = this.qualityInspections.filter((inspection) => inspection.status === "blocked").length;
    const totalSamples = this.qualityInspections.reduce((sum, inspection) => sum + inspection.sampleSize, 0);
    const totalDefects = this.qualityInspections.reduce((sum, inspection) => sum + inspection.defectCount, 0);

    return {
      totalInspections,
      failedInspections,
      blockedInspections,
      totalSamples,
      totalDefects,
      defectRate: totalSamples > 0 ? roundMetric(totalDefects / totalSamples) : 0,
    };
  }

  listMaintenanceTickets(): MaintenanceTicket[] {
    return [...this.maintenanceTickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createMaintenanceTicket(input: CreateMaintenanceTicketInput): MaintenanceTicket {
    const line = this.requireLine(input.lineId);

    const ticket: MaintenanceTicket = {
      id: randomUUID(),
      lineId: line.id,
      lineCode: line.code,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: "open",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    this.maintenanceTickets.push(ticket);
    return ticket;
  }

  updateMaintenanceTicketStatus(id: string, status: MaintenanceStatus): MaintenanceTicket | null {
    const ticket = this.maintenanceTickets.find((item) => item.id === id);

    if (!ticket) {
      return null;
    }

    ticket.status = status;
    ticket.resolvedAt = status === "resolved" ? new Date().toISOString() : null;
    return ticket;
  }

  listAuditEvents(limit = 30): AuditEvent[] {
    return [...this.auditEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }

  createAuditEvent(input: CreateAuditEventInput): AuditEvent {
    const event: AuditEvent = {
      id: randomUUID(),
      actor: input.actor.trim() || "system",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary.trim(),
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
    };

    this.auditEvents.push(event);
    return event;
  }

  private requireLine(lineId: string): ProductionLine {
    const line = this.productionLines.find((item) => item.id === lineId);

    if (!line) {
      throw new AppError("Production line not found", 404, "PRODUCTION_LINE_NOT_FOUND");
    }

    return line;
  }

  private getLineByCode(code: string) {
    return this.productionLines.find((line) => line.code === code);
  }

  private createSeedProductionEvent(
    line: ProductionLine,
    input: {
      shift: ProductionShift;
      operatorName: string;
      plannedMinutes: number;
      goodUnits: number;
      scrapUnits: number;
      downtimeMinutes: number;
      downtimeReason: string;
      recordedAt: string;
    },
  ): ProductionEvent {
    return {
      id: randomUUID(),
      lineId: line.id,
      lineCode: line.code,
      lineName: line.name,
      shift: input.shift,
      operatorName: input.operatorName,
      plannedMinutes: input.plannedMinutes,
      goodUnits: input.goodUnits,
      scrapUnits: input.scrapUnits,
      downtimeMinutes: input.downtimeMinutes,
      downtimeReason: input.downtimeReason,
      recordedAt: input.recordedAt,
    };
  }

  private createSeedInspection(
    line: ProductionLine,
    input: {
      inspectorName: string;
      sampleSize: number;
      defectCount: number;
      severity: QualitySeverity;
      status: QualityStatus;
      notes: string;
      createdAt: string;
    },
  ): QualityInspection {
    return {
      id: randomUUID(),
      lineId: line.id,
      lineCode: line.code,
      lineName: line.name,
      inspectorName: input.inspectorName,
      sampleSize: input.sampleSize,
      defectCount: input.defectCount,
      severity: input.severity,
      status: input.status,
      notes: input.notes,
      createdAt: input.createdAt,
    };
  }
}

export const demoStore = new DemoStore();
