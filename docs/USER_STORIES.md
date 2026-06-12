# User Stories

## Personas

### Factory Supervisor

Responsible for monitoring production performance, reacting to downtime, and communicating shift status.

### Line Leader

Responsible for entering shift production output and reporting issues from the line.

### Maintenance Technician

Responsible for reviewing technical tickets and resolving equipment-related problems.

### Quality Inspector

Responsible for recording inspection results, defects, containment status, and customer-risk signals.

### Plant Manager

Responsible for reviewing operational KPIs and understanding risk across lines.

## Core User Stories

### 1. Sign In With A Role

As an operations user, I want to sign in with my assigned role so that I only see and perform actions that match my responsibility.

Acceptance criteria:

- I can sign in with email and password.
- The dashboard shows my name and role.
- Operational APIs reject unauthenticated requests.
- Write actions are limited by role.

### 2. Create a Production Line

As a factory supervisor, I want to register a production line so that production and maintenance activity can be linked to a real factory resource.

Acceptance criteria:

- I can enter a line code, name, area, target per hour, and initial status.
- The line appears in the production line list.
- The line becomes available in production-log and maintenance-ticket forms.

### 3. Change Line Status

As a factory supervisor, I want to change a line status so that the dashboard reflects whether the line is running, paused, or under maintenance.

Acceptance criteria:

- I can change status from the line card.
- The dashboard refreshes after the change.
- KPI and AI context uses the latest line status.

### 4. Log Shift Output

As a line leader, I want to log shift production output so that supervisors can review good units, scrap, downtime, and shift performance.

Acceptance criteria:

- I can select a production line and shift.
- I can enter planned minutes, good units, scrap units, downtime minutes, and downtime reason.
- The system rejects downtime greater than planned production time.
- The new log appears in recent production logs.
- KPI cards update after the log is saved.

### 5. Create a Maintenance Ticket

As a supervisor, I want to create a maintenance ticket when a line has a technical issue so that maintenance work is visible and prioritized.

Acceptance criteria:

- I can select the affected production line.
- I can enter title, description, and priority.
- The ticket appears in the maintenance list.
- The ticket is included in AI insight context.

### 6. Update Maintenance Status

As a maintenance technician, I want to update ticket status so that the team can see whether work is open, in progress, or resolved.

Acceptance criteria:

- I can update status from the ticket card.
- Resolved tickets no longer count as active open tickets.
- AI insight considers unresolved tickets as operational risk.

### 7. Review Production KPIs

As a plant manager, I want to see aggregate KPIs so that I can understand production performance quickly.

Acceptance criteria:

- I can see good units, scrap rate, downtime, availability, and average units per hour.
- Metrics update after production logs are created.
- KPI definitions are documented.

### 8. Generate Shift Insight

As a factory supervisor, I want to generate a shift insight so that I can quickly identify the most important operational risk.

Acceptance criteria:

- The insight uses line status, production logs, KPI summary, and maintenance tickets.
- The button works even when Ollama is disabled.
- If AI is disabled, a rules-based fallback is returned.
- The insight recommends one next action.

### 9. Record Quality Inspection

As a quality inspector, I want to record sample inspections so that the supervisor can see defect risk and containment status.

Acceptance criteria:

- I can select a production line.
- I can enter sample size, defect count, severity, status, and notes.
- The system rejects defects greater than sample size.
- Failed and blocked inspections create operational alert signals.
- The inspection appears in the quality history list.

### 10. Review Operational Alerts

As a supervisor, I want alerts to highlight production, quality, and maintenance risk so that I know where to act first.

Acceptance criteria:

- Alerts are generated from current operational data.
- Critical alerts are visually distinct.
- Alerts include a clear title and action-oriented message.

### 11. Review Audit Trail

As a plant manager or quality responsible, I want an audit trail so that important operational changes are traceable.

Acceptance criteria:

- Production, maintenance, and quality actions create audit events.
- Audit events show actor, action, summary, and timestamp.

## Future User Stories

### Date and Shift Filtering

As a plant manager, I want to filter KPIs by date and shift so that I can compare performance across time.

### Line-Level Drilldown

As a supervisor, I want to click a production line and see its production history, downtime reasons, and tickets.

### Admin User Management

As an admin, I want to invite, disable, and change users so that role access can be managed without database scripts.

### Audit Log

As a quality manager, I want every operational change to be audited so that production decisions can be reviewed later.

### Export Reports

As a supervisor, I want to export shift summaries so that I can send handover reports to managers.
