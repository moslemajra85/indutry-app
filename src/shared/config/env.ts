import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DEMO_MODE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgres://industry:industry@localhost:5432/industry_ops"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://localhost:4000"),
  AUTH_TOKEN_SECRET: z.string().min(32).default("development-auth-secret-change-before-production"),
  AI_ENABLED: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("tinyllama"),
});

const parsed = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  demoMode: parsed.DEMO_MODE,
  databaseUrl: parsed.DATABASE_URL,
  allowedOrigins: parsed.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
  authTokenSecret: parsed.AUTH_TOKEN_SECRET,
  aiEnabled: parsed.AI_ENABLED,
  ollamaBaseUrl: parsed.OLLAMA_BASE_URL,
  ollamaModel: parsed.OLLAMA_MODEL,
};
