import 'server-only';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';

import { getEnv } from '@/server/env';

const IP_PATTERN = /^[0-9a-fA-F:.]{2,45}$/;

/**
 * IP клиента. Доверяем заголовкам, которые выставляет ближайший обратный прокси
 * (nginx: X-Real-IP; Vercel/Cloudflare выставляют свои). Из X-Forwarded-For
 * берём последний адрес — его добавил наш прокси, а не клиент.
 */
export function getClientIpFromHeaders(source: Headers): string {
  const candidates = [
    source.get('x-real-ip'),
    source.get('x-vercel-forwarded-for')?.split(',')[0],
    source.get('x-forwarded-for')?.split(',').at(-1),
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && IP_PATTERN.test(value)) return value;
  }
  return 'unknown';
}

export async function getClientIp(): Promise<string> {
  return getClientIpFromHeaders(await headers());
}

/** HMAC от значения — чтобы не хранить IP и email в открытом виде */
export function hashIdentifier(value: string): string {
  return createHmac('sha256', getEnv().AUTH_SECRET).update(value).digest('hex').slice(0, 40);
}

export async function getRequestMeta() {
  const source = await headers();
  const ip = getClientIpFromHeaders(source);
  return {
    ip,
    ipHash: hashIdentifier(ip),
    userAgent: source.get('user-agent')?.slice(0, 300) ?? null,
  };
}

/**
 * Защита route handlers от CSRF: запрос должен прийти с нашего же origin.
 * Server Actions Next.js проверяет сам (Origin vs Host).
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');
  if (host && originHost === host) return true;

  try {
    return originHost === new URL(getEnv().SITE_URL).host;
  } catch {
    return false;
  }
}
