# Production Readiness Plan

This project is ready for a portfolio demo and staging deployment. It is not yet ready for a real factory production environment. The gap is not the UI; the gap is operational hardening, security, data safety, and repeatable delivery.

## Current Status

Implemented:

- Modular TypeScript/Express backend.
- PostgreSQL persistence.
- Docker and Docker Compose.
- Production line management.
- Shift production logging.
- Quality inspections.
- Maintenance tickets.
- Operational alerts.
- Audit trail.
- Demo authentication and role-based authorization.
- Local AI integration path with deterministic fallback.
- CI workflow for type-checking, tests, build, and Docker image build.

Still required before real production:

- Production-grade identity management.
- Versioned migration tooling.
- Secure secret handling.
- Managed database backups.
- HTTPS and domain setup.
- Deployment pipeline.
- Monitoring and logging.
- Stronger automated tests.
- Final AI runtime decision.

## Authentication And Roles

Why it matters:

Factory data is operationally sensitive. Not every user should be able to create lines, change maintenance status, or record quality decisions.

Current implementation:

- `app_users` table with seeded demo users.
- PBKDF2 password hashes.
- Signed bearer token returned from login.
- `requireAuth` middleware on operational APIs.
- `requireRole` middleware on write actions.
- Audit events now use the authenticated user's email for protected writes.
- UI locks forms that the current role cannot use.

Implemented roles:

- `admin`: manage users, environment settings, and master data.
- `supervisor`: manage lines, review KPIs, generate AI insight, create tickets.
- `line_leader`: log shift output and downtime.
- `quality`: record inspections and containment status.
- `maintenance`: update maintenance tickets.
- `viewer`: read-only dashboard access.

Still needed for real production:

1. Replace demo account seeding with admin-managed users or SSO.
2. Use Argon2id or bcrypt with a reviewed password policy.
3. Prefer secure HTTP-only cookies or short-lived access tokens with refresh-token rotation.
4. Add rate limiting and account lockout for login attempts.
5. Store actor user IDs in audit events with a real foreign key, not only actor email text.

Minimum acceptance criteria:

- Unauthenticated users cannot access operational APIs.
- Role checks protect write actions.
- Audit trail records the authenticated actor.

## Real Migration Tooling

Why it matters:

The current migration script is useful for demos, but production schema changes must be versioned, repeatable, and reversible.

Recommended options:

- `node-pg-migrate`
- `drizzle-kit`
- `kysely-codegen` plus a migration runner
- Prisma migrations if the project later adopts Prisma

Recommended approach for this codebase:

- Keep raw SQL migrations because the app already uses `pg`.
- Add a `migrations/` directory.
- Create one migration file per schema change.
- Run migrations as a release step before starting the new app version.

Minimum acceptance criteria:

- Every schema change has a versioned migration.
- Migrations run exactly once.
- Failed migrations stop deployment.
- Seed/demo data is separate from production migrations.

## Secure Secrets Handling

Why it matters:

Production secrets must not live in Git, Docker images, screenshots, or docs.

Secrets in this app:

- `DATABASE_URL`
- `AUTH_TOKEN_SECRET`
- AI runtime URLs or API keys if external AI is added later
- SMTP/webhook credentials if notifications are added

Recommended implementation:

- Local development: `.env`, never committed.
- Staging/production: platform secret manager.
- Docker/VPS: restricted `.env` file owned by deploy user.
- CI/CD: GitHub Actions encrypted secrets.

Minimum acceptance criteria:

- `.env` is ignored.
- `.env.example` contains only safe placeholders.
- Production secrets are injected at runtime.
- Logs never print full secrets.

## Managed Database Backups

Why it matters:

Factory operations data is historical evidence. Losing shift logs, quality inspection records, or maintenance history is unacceptable.

Recommended implementation:

- Use managed PostgreSQL for deployment when possible.
- Enable daily automated backups.
- Define retention, for example 7 daily backups and 4 weekly backups.
- Test restore into a separate environment.
- Document Recovery Point Objective and Recovery Time Objective.

Minimum acceptance criteria:

- Backups run automatically.
- Restore is tested.
- Production database is not only a Docker volume on one machine.

## HTTPS And Domain Setup

Why it matters:

Authentication cookies, operational data, and AI prompts must not travel over plain HTTP in production.

Recommended implementation:

- Use a reverse proxy such as Caddy, Nginx, Traefik, or the cloud platform's HTTPS layer.
- Use a real domain, for example `ops.example.com`.
- Redirect HTTP to HTTPS.
- Set secure cookie flags after authentication exists.

Minimum acceptance criteria:

- Public deployment uses HTTPS.
- Health check remains available.
- CORS allow-list uses the real domain.
- No mixed-content browser warnings.

## CI/CD Pipeline

What exists now:

`.github/workflows/ci.yml` runs:

- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `docker build`

Recommended next step:

- Add deployment workflow after choosing a host.
- Build and push Docker image to a registry.
- Run migrations as a release job.
- Deploy only after CI passes.
- Add environment protection for production.

Minimum acceptance criteria:

- Every pull request runs CI.
- Broken tests block merge.
- Production deploys are traceable to a Git commit.

## Monitoring And Logging

Why it matters:

In production, "it does not work" is not enough. You need logs, metrics, and alerts that explain what failed.

Current state:

- The API uses Pino structured logging.
- `/health` checks API and database.

Recommended additions:

- Request IDs in logs.
- Central log collection.
- Error tracking.
- Uptime monitoring.
- Metrics for request latency, error rate, database latency, and AI latency.
- Alerting for health-check failure and high error rate.

Minimum acceptance criteria:

- You can see API errors after deployment.
- You can tell if the database is down.
- You can tell if AI is unavailable.
- Logs do not expose secrets or sensitive factory details unnecessarily.

## Stronger Test Coverage

Current tests:

- Production service behavior.
- Production event normalization.
- Quality validation.
- Alert generation.
- Password hashing and token verification.

Recommended additions:

- Route tests for validation and error responses.
- Repository integration tests against PostgreSQL.
- Migration tests from an empty database.
- AI fallback tests.
- UI smoke tests for key forms.

Minimum acceptance criteria:

- Core business rules are unit tested.
- API endpoints are integration tested.
- CI runs tests automatically.

## Real AI Runtime Decision

Why it matters:

AI must be reliable enough for the selected deployment environment. Local AI protects data but can be heavy. Hosted AI is easier to run but may create data-governance concerns.

Current behavior:

- `AI_ENABLED=false`: deterministic fallback works.
- `AI_ENABLED=true`: app calls Ollama.
- `/api/ai/status`: tells the UI whether AI is enabled and available.

Observed constraint:

The Ollama Docker image can pull a multi-GB runtime layer. That may be too heavy for a small demo VPS or weak laptop, even if the selected model is small.

Recommended decision options:

- Demo/staging: keep fallback enabled by default and document Ollama as optional.
- Local plant network: run Ollama on a dedicated workstation or internal GPU server.
- Cloud staging: use a hosted model only after checking data privacy requirements.
- Production factory: define what data is allowed in prompts and require human approval for actions.

Minimum acceptance criteria:

- AI failure does not break the dashboard.
- The UI clearly shows AI availability.
- AI output is advisory only.
- Sensitive data policy is documented before hosted AI is used.

## Recommended Deployment Sequence

1. Push repository to GitHub.
2. Use CI on every push.
3. Deploy staging with managed PostgreSQL.
4. Harden authentication and add admin user management.
5. Replace demo migration script with versioned migrations.
6. Add backups and restore test.
7. Add HTTPS/domain.
8. Add monitoring and central logs.
9. Decide AI runtime for the target environment.
10. Only then consider real production use.
