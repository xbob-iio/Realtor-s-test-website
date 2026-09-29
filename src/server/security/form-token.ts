import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import { getEnv } from '@/server/env';

/**
 * Подписанная метка времени рендера формы — простая защита от ботов:
 * заявка, отправленная быстрее чем через пару секунд после загрузки
 * страницы или с поддельной меткой, отклоняется.
 */
const MIN_AGE_MS = 2_500;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function sign(payload: string): string {
  return createHmac('sha256', getEnv().AUTH_SECRET)
    .update(`form:${payload}`)
    .digest('base64url')
    .slice(0, 32);
}

export function createFormToken(now = Date.now()): string {
  const payload = now.toString(36);
  return `${payload}.${sign(payload)}`;
}

export type FormTokenCheck = 'ok' | 'invalid' | 'too-fast' | 'expired';

export function verifyFormToken(token: unknown, now = Date.now()): FormTokenCheck {
  if (typeof token !== 'string' || token.length > 64) return 'invalid';
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return 'invalid';

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return 'invalid';

  const issuedAt = Number.parseInt(payload, 36);
  if (!Number.isFinite(issuedAt)) return 'invalid';
  const age = now - issuedAt;
  if (age < MIN_AGE_MS) return 'too-fast';
  if (age > MAX_AGE_MS) return 'expired';
  return 'ok';
}
