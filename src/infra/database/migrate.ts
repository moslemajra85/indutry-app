import { pool } from "./pool";
import { logger } from "../../shared/logger/logger";
import { hashPassword } from "../../modules/auth/password";

const schema = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'line_leader', 'quality', 'maintenance', 'viewer')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  target_per_hour INTEGER NOT NULL CHECK (target_per_hour > 0),
  status TEXT NOT NULL CHECK (status IN ('running', 'paused', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_line_id
  ON maintenance_tickets(line_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status
  ON maintenance_tickets(status);

CREATE TABLE IF NOT EXISTS production_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'evening', 'night')),
  operator_name TEXT NOT NULL,
  planned_minutes INTEGER NOT NULL CHECK (planned_minutes > 0),
  good_units INTEGER NOT NULL CHECK (good_units >= 0),
  scrap_units INTEGER NOT NULL CHECK (scrap_units >= 0),
  downtime_minutes INTEGER NOT NULL CHECK (downtime_minutes >= 0),
  downtime_reason TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_events_line_id
  ON production_events(line_id);

CREATE INDEX IF NOT EXISTS idx_production_events_recorded_at
  ON production_events(recorded_at DESC);

CREATE TABLE IF NOT EXISTS quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  inspector_name TEXT NOT NULL,
  sample_size INTEGER NOT NULL CHECK (sample_size > 0),
  defect_count INTEGER NOT NULL CHECK (defect_count >= 0),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'blocked')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quality_defects_not_greater_than_sample CHECK (defect_count <= sample_size)
);

CREATE INDEX IF NOT EXISTS idx_quality_inspections_line_id
  ON quality_inspections(line_id);

CREATE INDEX IF NOT EXISTS idx_quality_inspections_created_at
  ON quality_inspections(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created_at
  ON audit_events(created_at DESC);

INSERT INTO production_lines (code, name, area, target_per_hour, status)
VALUES
  ('WH-01', 'Wire Harness Assembly 1', 'Assembly Hall A', 120, 'running'),
  ('CUT-02', 'Cable Cutting Cell 2', 'Preparation Area', 180, 'paused'),
  ('QA-01', 'End-of-Line Quality Gate', 'Quality Lab', 95, 'running')
ON CONFLICT (code) DO NOTHING;

INSERT INTO maintenance_tickets (line_id, title, description, priority, status)
SELECT id, 'Sensor calibration drift', 'Optical sensor requires recalibration after repeated false rejects.', 'high', 'open'
FROM production_lines
WHERE code = 'QA-01'
ON CONFLICT DO NOTHING;

INSERT INTO production_events (
  line_id,
  shift,
  operator_name,
  planned_minutes,
  good_units,
  scrap_units,
  downtime_minutes,
  downtime_reason
)
SELECT id, 'morning', 'Demo Supervisor', 480, 780, 22, 35, 'Material changeover and sensor verification'
FROM production_lines
WHERE code = 'WH-01'
  AND NOT EXISTS (SELECT 1 FROM production_events)
UNION ALL
SELECT id, 'morning', 'Demo Supervisor', 480, 620, 18, 70, 'Blade adjustment and feeder inspection'
FROM production_lines
WHERE code = 'CUT-02'
  AND NOT EXISTS (SELECT 1 FROM production_events);

INSERT INTO quality_inspections (
  line_id,
  inspector_name,
  sample_size,
  defect_count,
  severity,
  status,
  notes
)
SELECT id, 'Quality Team A', 50, 2, 'medium', 'passed', 'Minor cosmetic defects inside accepted threshold'
FROM production_lines
WHERE code = 'WH-01'
  AND NOT EXISTS (SELECT 1 FROM quality_inspections)
UNION ALL
SELECT id, 'Quality Team A', 40, 6, 'high', 'failed', 'False rejects and connector alignment issue require containment check'
FROM production_lines
WHERE code = 'QA-01'
  AND NOT EXISTS (SELECT 1 FROM quality_inspections);

INSERT INTO audit_events (actor, action, entity_type, entity_id, summary, metadata)
SELECT 'system', 'seed', 'database', 'initial-seed', 'Seeded demo production, maintenance, and quality records', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM audit_events);
`;

const demoUsers = [
  {
    name: "Admin User",
    email: "admin@industryops.local",
    role: "admin",
    password: "IndustryOps123!",
  },
  {
    name: "Factory Supervisor",
    email: "supervisor@industryops.local",
    role: "supervisor",
    password: "IndustryOps123!",
  },
  {
    name: "Line Leader",
    email: "line.leader@industryops.local",
    role: "line_leader",
    password: "IndustryOps123!",
  },
  {
    name: "Quality Inspector",
    email: "quality@industryops.local",
    role: "quality",
    password: "IndustryOps123!",
  },
  {
    name: "Maintenance Technician",
    email: "maintenance@industryops.local",
    role: "maintenance",
    password: "IndustryOps123!",
  },
  {
    name: "Read Only Viewer",
    email: "viewer@industryops.local",
    role: "viewer",
    password: "IndustryOps123!",
  },
] as const;

async function seedDemoUsers() {
  for (const user of demoUsers) {
    await pool.query(
      `INSERT INTO app_users (name, email, role, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [user.name, user.email, user.role, hashPassword(user.password)],
    );
  }
}

async function migrate() {
  await pool.query(schema);
  await seedDemoUsers();
  logger.info("Database migration completed");
  await pool.end();
}

migrate().catch(async (error) => {
  logger.error({ error }, "Database migration failed");
  await pool.end();
  process.exit(1);
});
