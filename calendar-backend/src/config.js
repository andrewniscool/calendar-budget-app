import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadEnv() {
  if (process.env.NODE_ENV !== 'test') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
  }
}

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3001),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  APP_ORIGIN: z.string().url().default('http://localhost:5173'),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  SENSITIVE_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  VERIFICATION_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(24),
  RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  LOCKOUT_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  MAIL_MODE: z.enum(['smtp', 'log']).default('log'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Calendar Budget <no-reply@example.com>'),
  SMTP_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  SMTP_SOCKET_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  DB_POOL_MAX: z.coerce.number().int().positive().max(100).default(10),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  DB_SSL: z.enum(['true', 'false']).default('false'),
  TRUST_PROXY_HOPS: z.coerce.number().int().nonnegative().max(10).default(0),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  HEADERS_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  KEEP_ALIVE_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1_000),
}).superRefine((config, context) => {
  if (config.MAIL_MODE === 'smtp' && !config.SMTP_HOST) {
    context.addIssue({
      code: 'custom',
      path: ['SMTP_HOST'],
      message: 'SMTP_HOST is required when MAIL_MODE is smtp',
    });
  }
  if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASS)) {
    context.addIssue({
      code: 'custom',
      path: ['SMTP_USER'],
      message: 'SMTP_USER and SMTP_PASS must be provided together',
    });
  }
  if (config.NODE_ENV === 'production' && config.COOKIE_SECURE !== 'true') {
    context.addIssue({
      code: 'custom',
      path: ['COOKIE_SECURE'],
      message: 'COOKIE_SECURE must be true in production',
    });
  }
  if (config.NODE_ENV === 'production' && config.MAIL_MODE !== 'smtp') {
    context.addIssue({
      code: 'custom',
      path: ['MAIL_MODE'],
      message: 'MAIL_MODE must be smtp in production',
    });
  }
  if (config.NODE_ENV === 'production' && config.DB_SSL !== 'true') {
    context.addIssue({
      code: 'custom',
      path: ['DB_SSL'],
      message: 'DB_SSL must be true in production',
    });
  }
});

export function getConfig(env = process.env) {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return {
    ...result.data,
    corsOrigins: result.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
    cookieSecure: result.data.COOKIE_SECURE === 'true',
    smtpSecure: result.data.SMTP_SECURE === 'true',
    databaseSsl: result.data.DB_SSL === 'true',
  };
}
