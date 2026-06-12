import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { aiRouter } from "./modules/ai/ai.routes";
import { alertsRouter } from "./modules/alerts/alerts.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { requireAuth } from "./modules/auth/auth.middleware";
import { auditRouter } from "./modules/audit/audit.routes";
import { healthRouter } from "./modules/health/health.routes";
import { maintenanceRouter } from "./modules/maintenance/maintenance.routes";
import { productionEventsRouter } from "./modules/production-events/production-events.routes";
import { productionRouter } from "./modules/production/production.routes";
import { qualityRouter } from "./modules/quality/quality.routes";
import { env } from "./shared/config/env";
import { errorHandler } from "./shared/http/error-handler";
import { logger } from "./shared/logger/logger";

export function createApp() {
  const app = express();
  const exposeRootApi = env.demoMode || process.env.VERCEL === "1";

  app.use(helmet());
  app.use(
    cors({
      origin: env.allowedOrigins,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(pinoHttp({ logger }));

  app.use("/health", healthRouter);
  mountApiRoutes(app, "/api");

  if (exposeRootApi) {
    mountApiRoutes(app, "");
  }

  const publicDir = path.join(process.cwd(), "dist", "public");
  const indexFile = path.join(publicDir, "index.html");

  if (fs.existsSync(indexFile)) {
    app.use(express.static(publicDir));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
        next();
        return;
      }

      res.sendFile(indexFile);
    });
  }

  app.use(errorHandler);

  return app;
}

function mountApiRoutes(app: express.Express, prefix: string) {
  app.use(`${prefix}/auth`, authRouter);
  app.use(prefix || "/", requireAuth);
  app.use(`${prefix}/alerts`, alertsRouter);
  app.use(`${prefix}/audit-events`, auditRouter);
  app.use(`${prefix}/production-lines`, productionRouter);
  app.use(`${prefix}/production-events`, productionEventsRouter);
  app.use(`${prefix}/quality-inspections`, qualityRouter);
  app.use(`${prefix}/maintenance-tickets`, maintenanceRouter);
  app.use(`${prefix}/ai`, aiRouter);
}
