import { Pool } from "pg";
import { pool } from "../../infra/database/pool";
import type {
  CreateProductionEventInput,
  ProductionEvent,
  ProductionKpiSummary,
  ProductionShift,
} from "./production-events.types";

interface ProductionEventRow {
  id: string;
  line_id: string;
  line_code: string;
  line_name: string;
  shift: ProductionShift;
  operator_name: string;
  planned_minutes: number;
  good_units: number;
  scrap_units: number;
  downtime_minutes: number;
  downtime_reason: string | null;
  recorded_at: Date;
}

interface ProductionKpiSummaryRow {
  logged_events: string;
  total_good_units: string | null;
  total_scrap_units: string | null;
  downtime_minutes: string | null;
  planned_minutes: string | null;
}

function mapEvent(row: ProductionEventRow): ProductionEvent {
  return {
    id: row.id,
    lineId: row.line_id,
    lineCode: row.line_code,
    lineName: row.line_name,
    shift: row.shift,
    operatorName: row.operator_name,
    plannedMinutes: row.planned_minutes,
    goodUnits: row.good_units,
    scrapUnits: row.scrap_units,
    downtimeMinutes: row.downtime_minutes,
    downtimeReason: row.downtime_reason,
    recordedAt: row.recorded_at.toISOString(),
  };
}

function mapSummary(row: ProductionKpiSummaryRow): ProductionKpiSummary {
  const loggedEvents = Number(row.logged_events ?? 0);
  const totalGoodUnits = Number(row.total_good_units ?? 0);
  const totalScrapUnits = Number(row.total_scrap_units ?? 0);
  const downtimeMinutes = Number(row.downtime_minutes ?? 0);
  const plannedMinutes = Number(row.planned_minutes ?? 0);
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

function roundMetric(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

export class ProductionEventsRepository {
  constructor(private readonly db: Pool = pool) {}

  async listRecent(limit = 20): Promise<ProductionEvent[]> {
    const result = await this.db.query<ProductionEventRow>(
      `SELECT pe.id,
              pe.line_id,
              pl.code AS line_code,
              pl.name AS line_name,
              pe.shift,
              pe.operator_name,
              pe.planned_minutes,
              pe.good_units,
              pe.scrap_units,
              pe.downtime_minutes,
              pe.downtime_reason,
              pe.recorded_at
       FROM production_events pe
       JOIN production_lines pl ON pl.id = pe.line_id
       ORDER BY pe.recorded_at DESC
       LIMIT $1`,
      [limit],
    );

    return result.rows.map(mapEvent);
  }

  async create(input: CreateProductionEventInput): Promise<ProductionEvent> {
    const result = await this.db.query<ProductionEventRow>(
      `INSERT INTO production_events (
         line_id,
         shift,
         operator_name,
         planned_minutes,
         good_units,
         scrap_units,
         downtime_minutes,
         downtime_reason
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, ''))
       RETURNING id,
                 line_id,
                 (SELECT code FROM production_lines WHERE id = line_id) AS line_code,
                 (SELECT name FROM production_lines WHERE id = line_id) AS line_name,
                 shift,
                 operator_name,
                 planned_minutes,
                 good_units,
                 scrap_units,
                 downtime_minutes,
                 downtime_reason,
                 recorded_at`,
      [
        input.lineId,
        input.shift,
        input.operatorName,
        input.plannedMinutes,
        input.goodUnits,
        input.scrapUnits,
        input.downtimeMinutes,
        input.downtimeReason ?? "",
      ],
    );

    return mapEvent(result.rows[0]);
  }

  async getSummary(): Promise<ProductionKpiSummary> {
    const result = await this.db.query<ProductionKpiSummaryRow>(
      `SELECT COUNT(*) AS logged_events,
              COALESCE(SUM(good_units), 0) AS total_good_units,
              COALESCE(SUM(scrap_units), 0) AS total_scrap_units,
              COALESCE(SUM(downtime_minutes), 0) AS downtime_minutes,
              COALESCE(SUM(planned_minutes), 0) AS planned_minutes
       FROM production_events`,
    );

    return mapSummary(result.rows[0]);
  }
}
