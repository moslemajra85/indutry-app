# Architecture

## Goal

IndustryOps AI gives a factory supervisor a compact view of production line status, shift output, scrap, downtime, quality containment, active maintenance risk, audit trail, operational alerts, and a generated shift insight. The project is designed to look and behave like an early production system, not a tutorial CRUD app.

## Architectural Style

The app is a modular monolith:

- One deployable Node.js process.
- One PostgreSQL database.
- Business capabilities split into modules.
- Shared infrastructure kept outside business modules.
- Optional local AI kept behind a dedicated module.

This is a good fit for an early industrial application because the domain is still evolving. A microservice design would add networking, deployment, observability, and data consistency complexity before the product has proven it needs that complexity.

## Module Boundaries

```mermaid
flowchart TB
  App[Express App Composition]
  Shared[Shared Config, Logger, HTTP Errors]
  Infra[Infrastructure: PostgreSQL Pool]
  Production[Production Module]
  ProductionEvents[Production Events Module]
  Quality[Quality Module]
  Maintenance[Maintenance Module]
  Alerts[Alerts Module]
  Auth[Auth Module]
  Audit[Audit Module]
  AI[AI Module]
  Health[Health Module]

  App --> Production
  App --> ProductionEvents
  App --> Quality
  App --> Maintenance
  App --> Alerts
  App --> Auth
  App --> Audit
  App --> AI
  App --> Health
  Production --> Infra
  ProductionEvents --> Infra
  Quality --> Infra
  Maintenance --> Infra
  Auth --> Infra
  Audit --> Infra
  AI --> Production
  AI --> ProductionEvents
  AI --> Quality
  AI --> Alerts
  AI --> Maintenance
  Alerts --> Production
  Alerts --> ProductionEvents
  Alerts --> Quality
  Alerts --> Maintenance
  Production --> Shared
  Maintenance --> Shared
  ProductionEvents --> Shared
  Quality --> Shared
  Audit --> Shared
  Auth --> Shared
  AI --> Shared
  Health --> Infra
```

## Request Flow

```mermaid
sequenceDiagram
  actor Supervisor
  participant Web as Web Dashboard
  participant Auth as Auth Module
  participant API as Express API
  participant Module as Business Module
  participant DB as PostgreSQL

  Supervisor->>Web: Opens dashboard
  Supervisor->>Web: Signs in
  Web->>Auth: POST /api/auth/login
  Auth-->>Web: User role and bearer token
  Web->>API: GET /api/production-lines with token
  Web->>API: GET /api/maintenance-tickets with token
  API->>API: Verify authentication
  API->>Module: Execute use case
  Module->>DB: Query factory data
  DB-->>Module: Rows
  Module-->>API: Typed domain response
  API-->>Web: JSON
  Web-->>Supervisor: Render operational view
```

## Folder Structure

```text
src/
  app.ts                    Express app composition
  server.ts                 Process entry point
  infra/
    database/               PostgreSQL connection and migration
  modules/
    ai/                     Local AI insight capability
    alerts/                 Derived operational alert capability
    auth/                   Sign-in, token verification, and role checks
    audit/                  Operational audit trail
    health/                 Health checks
    maintenance/            Maintenance ticket capability
    quality/                Quality inspection capability
    production-events/      Shift production logging and KPI capability
    production/             Production line capability
  shared/
    config/                 Environment parsing
    http/                   Error and async route helpers
    logger/                 Structured logging
web/
  src/                      TypeScript frontend
docs/                       Engineering documentation
```

## Data Model

```mermaid
erDiagram
  PRODUCTION_LINES ||--o{ MAINTENANCE_TICKETS : has
  PRODUCTION_LINES ||--o{ PRODUCTION_EVENTS : records
  PRODUCTION_LINES ||--o{ QUALITY_INSPECTIONS : checks

  PRODUCTION_LINES {
    uuid id PK
    text code UK
    text name
    text area
    int target_per_hour
    text status
    timestamptz created_at
  }

  MAINTENANCE_TICKETS {
    uuid id PK
    uuid line_id FK
    text title
    text description
    text priority
    text status
    timestamptz created_at
    timestamptz resolved_at
  }

  PRODUCTION_EVENTS {
    uuid id PK
    uuid line_id FK
    text shift
    text operator_name
    int planned_minutes
    int good_units
    int scrap_units
    int downtime_minutes
    text downtime_reason
    timestamptz recorded_at
  }

  QUALITY_INSPECTIONS {
    uuid id PK
    uuid line_id FK
    text inspector_name
    int sample_size
    int defect_count
    text severity
    text status
    text notes
    timestamptz created_at
  }

  AUDIT_EVENTS {
    uuid id PK
    text actor
    text action
    text entity_type
    text entity_id
    text summary
    jsonb metadata
    timestamptz created_at
  }
```

## Why These Choices

Express is simple, stable, and widely understood. TypeScript adds compile-time safety around request validation, domain types, and module contracts. PostgreSQL is a realistic default for industrial operations data because relational integrity matters. Docker Compose gives a reproducible local environment without pretending this needs Kubernetes on day one.

## Known Limitations

- Authentication and role-based authorization are implemented for demo/staging use, but not yet enterprise SSO or full user administration.
- Database migrations are intentionally simple and not versioned.
- The frontend is intentionally lightweight and does not use a component framework.
- AI output is advisory only and must not be treated as an automated production decision.
- Production and quality events are manually entered; there is no PLC, MES, ERP, barcode, or machine sensor integration yet.
- Alerts are derived on request and do not yet support assignment, acknowledgement, or escalation.

## Next Engineering Milestones

1. Add admin user management and production-grade identity hardening.
2. Replace the simple migration script with versioned migrations.
3. Replace derived-only alerts with assignable alerts and acknowledgement workflow.
4. Add line-level KPI filters by date range and shift.
5. Add integration tests using a real PostgreSQL test container.
6. Add deployment pipeline and environment-specific configuration.
  APP_USERS {
    uuid id PK
    text name
    text email UK
    text role
    text password_hash
    timestamptz created_at
  }
