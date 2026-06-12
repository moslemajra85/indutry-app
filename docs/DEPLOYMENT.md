# Deployment Guide

## Local Infrastructure

The local stack contains:

- `app`: Node.js production build.
- `postgres`: PostgreSQL 16.
- `ollama`: optional local AI runtime, enabled with the `ai` profile.

The Compose file publishes PostgreSQL on host port `15432` by default while containers still use `postgres:5432` internally.

```bash
docker compose up --build
```

For local Docker demos, Compose runs the compiled migration before the API starts.
The same startup path is also available directly as `npm run start:prod`.

With AI:

```bash
AI_ENABLED=true docker compose --profile ai up --build
```

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime mode |
| `PORT` | No | `4000` | API port |
| `DATABASE_URL` | Yes | Local Compose URL | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | No | Local dev origins | CORS allow-list |
| `AUTH_TOKEN_SECRET` | Yes | Demo-only local secret | Signing secret for auth tokens; use a long random value in deployed environments |
| `AI_ENABLED` | No | `false` | Enables Ollama requests |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | No | `tinyllama` | Local model name |

## Build

```bash
npm run build
npm start
```

The backend is compiled to `dist/`. The frontend is compiled to `dist/public/` and served by Express in production.

## Database Migration

Run:

```bash
npm run db:migrate
```

The current migration creates tables and seeds demo data. For a production deployment, replace this with a versioned migration tool so each schema change is tracked and repeatable.

## Deployment Options

### Render Portfolio Demo

This repo includes a `render.yaml` blueprint so you can deploy the app and its PostgreSQL database from GitHub.

What the blueprint does:

- Creates a Docker-based web service.
- Creates a managed PostgreSQL instance.
- Generates `AUTH_TOKEN_SECRET` on first deployment.
- Sets the app to production mode.
- Points CORS at the Render subdomain for this app.

The blueprint is configured for Render's free tier:

- Web service: `free`
- Postgres: `free` tier with a 30-day limit

That is fine for a portfolio demo. It is not a long-term production database plan.

How to use it:

1. Push `main` to GitHub.
2. Create a new Render Blueprint from this repository.
3. Let Render provision the web service and database.
4. Open the web URL and sign in with `supervisor@industryops.local` / `IndustryOps123!`.

The blueprint uses the same Docker image that powers local demo runs, so the container behavior stays consistent between local and deployed environments.

### Small VPS

A single VPS is enough for a demo or small internal pilot:

- Run Docker Compose.
- Put Nginx or Caddy in front for HTTPS.
- Store `.env` securely on the server.
- Back up the PostgreSQL volume.

### Cloud Container Platform

For a stronger deployment story:

- Build and push the app Docker image.
- Use managed PostgreSQL.
- Configure environment variables in the platform.
- Run migrations as a release job.
- Add logs, metrics, and uptime checks.

## Operational Checks

Before showing this to an employer or using it as a portfolio demo:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. `docker compose up --build`
5. Visit `/health`
6. Open the dashboard and generate an AI insight

## Production Hardening Backlog

The detailed plan is documented in [Production Readiness](PRODUCTION_READINESS.md).

Highest-priority items:

- Harden authentication with production identity controls.
- Replace demo migration script with versioned migrations.
- Store secrets in a production secret manager.
- Use managed PostgreSQL backups and test restore.
- Add HTTPS/domain and secure cookie policy if token storage moves to cookies.
- Extend CI/CD from verification to deployment.
- Add monitoring, centralized logs, and uptime alerts.
