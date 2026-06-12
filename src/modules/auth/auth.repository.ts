import { Pool } from "pg";
import { pool } from "../../infra/database/pool";
import type { UserRecord, UserRole } from "./auth.types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
  created_at: Date;
}

function mapRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
  };
}

export class AuthRepository {
  constructor(private readonly db: Pool = pool) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRow>(
      `SELECT id, name, email, role, password_hash, created_at
       FROM app_users
       WHERE email = $1`,
      [email.toLowerCase()],
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }
}
