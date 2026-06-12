# API Reference

All successful resource responses use:

```json
{
  "data": {}
}
```

Validation and application errors use:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

All `/api/*` endpoints require a bearer token except `POST /api/auth/login`. Get a token by signing in with one of the demo accounts documented in [Authentication And Roles](AUTHENTICATION.md).

```http
Authorization: Bearer <token>
```

## Health

### `GET /health`

Checks that the API process is alive and PostgreSQL can be queried.

```json
{
  "status": "ok",
  "checks": {
    "api": "ok",
    "database": "ok"
  }
}
```

## Authentication

### `POST /api/auth/login`

Signs in with email and password.

```json
{
  "email": "supervisor@industryops.local",
  "password": "IndustryOps123!"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
      "name": "Factory Supervisor",
      "email": "supervisor@industryops.local",
      "role": "supervisor"
    },
    "token": "signed-token"
  }
}
```

### `GET /api/auth/me`

Returns the authenticated user from the bearer token.

## Alerts

### `GET /api/alerts`

Returns derived operational alerts from production, quality, and maintenance data.

Alert severities:

- `info`
- `warning`
- `critical`

## Audit Events

### `GET /api/audit-events`

Returns recent audit events for operational traceability.

## Production Lines

### `GET /api/production-lines`

Returns all production lines.

### `POST /api/production-lines`

Creates a new production line.

Allowed roles: `admin`, `supervisor`.

```json
{
  "code": "WH-02",
  "name": "Wire Harness Assembly 2",
  "area": "Assembly Hall B",
  "targetPerHour": 130,
  "status": "running"
}
```

Allowed statuses:

- `running`
- `paused`
- `maintenance`

### `PATCH /api/production-lines/:id/status`

Changes a production line status.

Allowed roles: `admin`, `supervisor`.

```json
{
  "status": "maintenance"
}
```

## Maintenance Tickets

### `GET /api/maintenance-tickets`

Returns all maintenance tickets with their production line code.

### `POST /api/maintenance-tickets`

Creates a maintenance ticket for a production line.

Allowed roles: `admin`, `supervisor`, `line_leader`, `maintenance`.

```json
{
  "lineId": "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
  "title": "Crimping pressure drift",
  "description": "Crimping station requires inspection because pressure readings moved outside tolerance.",
  "priority": "high"
}
```

Allowed priorities:

- `low`
- `medium`
- `high`
- `critical`

### `PATCH /api/maintenance-tickets/:id/status`

Changes a ticket status.

Allowed roles: `admin`, `supervisor`, `maintenance`.

```json
{
  "status": "in_progress"
}
```

Allowed statuses:

- `open`
- `in_progress`
- `resolved`

## Production Events

### `GET /api/production-events`

Returns the latest production logs. These logs represent shift-level reporting from a team leader or supervisor.

### `POST /api/production-events`

Logs output, scrap, and downtime for a production line.

Allowed roles: `admin`, `supervisor`, `line_leader`.

```json
{
  "lineId": "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
  "shift": "morning",
  "operatorName": "Shift Leader A",
  "plannedMinutes": 480,
  "goodUnits": 760,
  "scrapUnits": 18,
  "downtimeMinutes": 35,
  "downtimeReason": "Material changeover and sensor adjustment"
}
```

Allowed shifts:

- `morning`
- `evening`
- `night`

Important validation rule:

- `downtimeMinutes` cannot be greater than `plannedMinutes`.

### `GET /api/production-events/summary`

Returns aggregate KPIs calculated from all logged production events.

```json
{
  "data": {
    "loggedEvents": 2,
    "totalGoodUnits": 1400,
    "totalScrapUnits": 40,
    "totalUnits": 1440,
    "scrapRate": 0.0278,
    "downtimeMinutes": 105,
    "plannedMinutes": 960,
    "availabilityRate": 0.8906,
    "averageUnitsPerHour": 98.2456
  }
}
```

Metric definitions:

- `scrapRate`: scrap units divided by total produced units.
- `availabilityRate`: productive minutes divided by planned minutes.
- `averageUnitsPerHour`: good units divided by productive hours.

## Quality Inspections

### `GET /api/quality-inspections`

Returns recent quality inspections.

### `POST /api/quality-inspections`

Records a quality inspection.

Allowed roles: `admin`, `supervisor`, `quality`.

```json
{
  "lineId": "0d768de2-e0ce-43a7-9f43-bf3de66d2b22",
  "inspectorName": "Quality Team A",
  "sampleSize": 50,
  "defectCount": 3,
  "severity": "medium",
  "status": "failed",
  "notes": "Connector alignment issue found during end-of-line check"
}
```

Validation rule:

- `defectCount` cannot be greater than `sampleSize`.

### `GET /api/quality-inspections/summary`

Returns aggregate quality KPIs.

```json
{
  "data": {
    "totalInspections": 2,
    "failedInspections": 1,
    "blockedInspections": 0,
    "totalSamples": 90,
    "totalDefects": 8,
    "defectRate": 0.0889
  }
}
```

## AI

### `GET /api/ai/status`

Checks AI availability.

If `AI_ENABLED=false`, the response reports deterministic fallback availability. If `AI_ENABLED=true`, the response checks Ollama and whether the configured model is pulled.

### `POST /api/ai/factory-insight`

Builds a snapshot from production lines, production events, KPI summary, quality inspections, quality summary, alerts, and maintenance tickets, then asks the configured local model for a concise shift insight. If AI is disabled or unavailable, the endpoint returns a deterministic fallback.

```json
{
  "data": {
    "provider": "deterministic",
    "model": "rules-based-fallback",
    "summary": "Local AI is disabled. 3 production lines are registered...",
    "generatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```
