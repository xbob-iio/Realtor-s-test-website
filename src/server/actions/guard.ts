import 'server-only';

import { requireAdmin } from '@/server/auth/guard';
import type { SessionUser } from '@/server/auth/session';
import { RATE_LIMITS, rateLimit } from '@/server/security/rate-limit';

export class RateLimitedError extends Error {
  constructor() {
    super('rate_limited');
    this.name = 'RateLimitedError';
  }
}

/**
 * Обязательная прелюдия каждого admin-действия:
 * аутентификация + авторизация (роль) + ограничение частоты.
 */
export async function adminActionGuard(): Promise<SessionUser> {
  const user = await requireAdmin();
  const limit = await rateLimit(
    `admin:${user.id}`,
    RATE_LIMITS.adminMutation.limit,
    RATE_LIMITS.adminMutation.windowSeconds,
  );
  if (!limit.success) throw new RateLimitedError();
  return user;
}
