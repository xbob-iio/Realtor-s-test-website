import 'server-only';

import { z } from 'zod';

const optional = z.string().trim().optional();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    SITE_URL: z
      .url({ protocol: /^https?$/ })
      .default('http://localhost:3000')
      .transform((url) => url.replace(/\/+$/, '')),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),

    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    UPLOAD_DIR: z.string().default('storage/uploads'),
    STORAGE_ENDPOINT: optional,
    STORAGE_REGION: z.string().default('auto'),
    STORAGE_ACCESS_KEY: optional,
    STORAGE_SECRET_KEY: optional,
    STORAGE_BUCKET: optional,
    STORAGE_PUBLIC_URL: optional,
    STORAGE_FORCE_PATH_STYLE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),

    LEAD_NOTIFY_TELEGRAM_BOT_TOKEN: optional,
    LEAD_NOTIFY_TELEGRAM_CHAT_ID: optional,
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER !== 's3') return;
    for (const key of [
      'STORAGE_ACCESS_KEY',
      'STORAGE_SECRET_KEY',
      'STORAGE_BUCKET',
      'STORAGE_PUBLIC_URL',
    ] as const) {
      if (!env[key]) {
        ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required for s3 storage` });
      }
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | undefined;

/**
 * Проверенные переменные окружения. Вызывается лениво, чтобы сборка
 * не падала там, где переменные не нужны. В сообщении об ошибке —
 * только имена переменных, без значений.
 */
export function getEnv(): ServerEnv {
  if (cached) return cached;

  const raw = Object.fromEntries(
    Object.entries(process.env).map(([key, value]) => [key, value === '' ? undefined : value]),
  );
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
