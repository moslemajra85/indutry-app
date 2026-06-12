import { Pool } from "pg";
import { demoStore } from "../../demo/demo-store";
import { pool } from "../../infra/database/pool";
import { env } from "../../shared/config/env";
import type {
  CreateQualityInspectionInput,
  QualityInspection,
  QualitySeverity,
  QualityStatus,
  QualitySummary,
} from "./quality.types";

interface QualityInspectionRow {
  id: string;
  line_id: string;
  line_code: string;
  line_name: string;
  inspector_name: string;
  sample_size: number;
  defect_count: number;
  severity: QualitySeverity;
  status: QualityStatus;
  notes: string | null;
  created_at: Date;
}

interface QualitySummaryRow {
  total_inspections: string;
  failed_inspections: string | null;
  blocked_inspections: string | null;
  total_samples: string | null;
  total_defects: string | null;
}

function mapInspection(row: QualityInspectionRow): QualityInspection {
  return {
    id: row.id,
    lineId: row.line_id,
    lineCode: row.line_code,
    lineName: row.line_name,
    inspectorName: row.inspector_name,
    sampleSize: row.sample_size,
    defectCount: row.defect_count,
    severity: row.severity,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
  };
}

function mapSummary(row: QualitySummaryRow): QualitySummary {
  const totalInspections = Number(row.total_inspections ?? 0);
  const failedInspections = Number(row.failed_inspections ?? 0);
  const blockedInspections = Number(row.blocked_inspections ?? 0);
  const totalSamples = Number(row.total_samples ?? 0);
  const totalDefects = Number(row.total_defects ?? 0);

  return {
    totalInspections,
    failedInspections,
    blockedInspections,
    totalSamples,
    totalDefects,
    defectRate: totalSamples > 0 ? Math.round((totalDefects / totalSamples) * 10_000) / 10_000 : 0,
  };
}

export class QualityRepository {
  constructor(private readonly db: Pool = pool) {}

  async listRecent(limit = 20): Promise<QualityInspection[]> {
    if (env.demoMode) {
      return demoStore.listQualityInspections(limit);
    }

    const result = await this.db.query<QualityInspectionRow>(
      `SELECT qi.id,
              qi.line_id,
              pl.code AS line_code,
              pl.name AS line_name,
              qi.inspector_name,
              qi.sample_size,
              qi.defect_count,
              qi.severity,
              qi.status,
              qi.notes,
              qi.created_at
       FROM quality_inspections qi
       JOIN production_lines pl ON pl.id = qi.line_id
       ORDER BY qi.created_at DESC
       LIMIT $1`,
      [limit],
    );

    return result.rows.map(mapInspection);
  }

  async create(input: CreateQualityInspectionInput): Promise<QualityInspection> {
    if (env.demoMode) {
      return demoStore.createQualityInspection(input);
    }

    const result = await this.db.query<QualityInspectionRow>(
      `INSERT INTO quality_inspections (
         line_id,
         inspector_name,
         sample_size,
         defect_count,
         severity,
         status,
         notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''))
       RETURNING id,
                 line_id,
                 (SELECT code FROM production_lines WHERE id = line_id) AS line_code,
                 (SELECT name FROM production_lines WHERE id = line_id) AS line_name,
                 inspector_name,
                 sample_size,
                 defect_count,
                 severity,
                 status,
                 notes,
                 created_at`,
      [
        input.lineId,
        input.inspectorName,
        input.sampleSize,
        input.defectCount,
        input.severity,
        input.status,
        input.notes ?? "",
      ],
    );

    return mapInspection(result.rows[0]);
  }

  async getSummary(): Promise<QualitySummary> {
    if (env.demoMode) {
      return demoStore.getQualitySummary();
    }

    const result = await this.db.query<QualitySummaryRow>(
      `SELECT COUNT(*) AS total_inspections,
              COUNT(*) FILTER (WHERE status = 'failed') AS failed_inspections,
              COUNT(*) FILTER (WHERE status = 'blocked') AS blocked_inspections,
              COALESCE(SUM(sample_size), 0) AS total_samples,
              COALESCE(SUM(defect_count), 0) AS total_defects
       FROM quality_inspections`,
    );

    return mapSummary(result.rows[0]);
  }
}
