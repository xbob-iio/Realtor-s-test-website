import 'server-only';

import { prisma } from '@/server/db';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

/**
 * Ограничение частоты запросов (fixed window) на PostgreSQL:
 * работает одинаково на нескольких инстансах и переживает перезапуск.
 * Атомарный upsert — без гонок между параллельными запросами.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const rows = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}::int))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE
        WHEN rate_limits.reset_at <= now() THEN now() + make_interval(secs => ${windowSeconds}::int)
        ELSE rate_limits.reset_at
      END
    RETURNING count, reset_at
  `;

  // Изредка чистим устаревшие счётчики
  if (Math.random() < 0.02) {
    void prisma.$executeRaw`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`.catch(
      () => undefined,
    );
  }

  const row = rows[0];
  const count = Number(row?.count ?? limit + 1);
  const resetAt = row?.reset_at ? new Date(row.reset_at) : new Date(Date.now() + windowSeconds * 1000);
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
  };
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

/** Готовые профили ограничений */
export const RATE_LIMITS = {
  loginByIp: { limit: 20, windowSeconds: 15 * 60 },
  loginByEmail: { limit: 5, windowSeconds: 15 * 60 },
  leadByIp: { limit: 5, windowSeconds: 10 * 60 },
  adminMutation: { limit: 120, windowSeconds: 60 },
  adminUpload: { limit: 100, windowSeconds: 10 * 60 },
  passwordChange: { limit: 5, windowSeconds: 15 * 60 },
} as const;
