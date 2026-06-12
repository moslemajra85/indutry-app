import { env } from "../src/shared/config/env";

export default function handler(_req: unknown, res: { status(code: number): { json(body: unknown): void } }) {
  res.status(200).json({
    status: "ok",
    checks: {
      api: "ok",
      database: env.demoMode ? "in-memory" : "ok",
    },
  });
}
