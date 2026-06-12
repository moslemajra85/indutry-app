import { Pool } from "pg";
import { pool } from "../../infra/database/pool";
import type {
  CreateProductionLineInput,
  ProductionLine,
  ProductionLineStatus,
} from "./production.types";

interface ProductionLineRow {
  id: string;
  code: string;
  name: string;
  area: string;
  target_per_hour: number;
  status: ProductionLineStatus;
  created_at: Date;
}

function mapRow(row: ProductionLineRow): ProductionLine {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    area: row.area,
    targetPerHour: row.target_per_hour,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export class ProductionRepository {
  constructor(private readonly db: Pool = pool) {}

  async list(): Promise<ProductionLine[]> {
    const result = await this.db.query<ProductionLineRow>(
      `SELECT id, code, name, area, target_per_hour, status, created_at
       FROM production_lines
       ORDER BY created_at ASC`,
    );

    return result.rows.map(mapRow);
  }

  async create(input: CreateProductionLineInput): Promise<ProductionLine> {
    const result = await this.db.query<ProductionLineRow>(
      `INSERT INTO production_lines (code, name, area, target_per_hour, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, name, area, target_per_hour, status, created_at`,
      [input.code, input.name, input.area, input.targetPerHour, input.status],
    );

    return mapRow(result.rows[0]);
  }

  async updateStatus(id: string, status: ProductionLineStatus): Promise<ProductionLine | null> {
    const result = await this.db.query<ProductionLineRow>(
      `UPDATE production_lines
       SET status = $2
       WHERE id = $1
       RETURNING id, code, name, area, target_per_hour, status, created_at`,
      [id, status],
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }
}
