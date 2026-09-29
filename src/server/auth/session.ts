import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';

import type { UserRole } from '@/generated/prisma/enums';
import { prisma } from '@/server/db';

import {
  getSessionCookieName,
  getSessionCookieOptions,
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_REFRESH_THRESHOLD_MS,
  SESSION_TTL_MS,
} from './cookie';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface SessionData {
  id: string;
  expiresAt: Date;
}

/** Токен — 256 бит случайности. В БД хранится только его SHA-256. */
function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ipHash?: string | null },
): Promise<{ token: string; session: SessionData }> {
  const token = generateSessionToken();
  const session = await prisma.session.create({
    data: {
      id: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: meta.userAgent ?? null,
      ipHash: meta.ipHash ?? null,
    },
    select: { id: true, expiresAt: true },
  });
  return { token, session };
}

export async function validateSessionToken(
  token: string,
): Promise<{ session: SessionData; user: SessionUser } | null> {
  const id = hashToken(token);
  const row = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });
  if (!row) return null;

  const now = Date.now();
  const absoluteDeadline = row.createdAt.getTime() + SESSION_ABSOLUTE_TTL_MS;
  if (row.expiresAt.getTime() <= now || absoluteDeadline <= now) {
    await prisma.session.deleteMany({ where: { id } });
    return null;
  }

  let expiresAt = row.expiresAt;
  if (expiresAt.getTime() - now < SESSION_REFRESH_THRESHOLD_MS) {
    expiresAt = new Date(Math.min(now + SESSION_TTL_MS, absoluteDeadline));
    await prisma.session.update({ where: { id }, data: { expiresAt } });
  }

  return { session: { id: row.id, expiresAt }, user: row.user };
}

/** Текущая сессия (один запрос к БД на HTTP-запрос благодаря React cache) */
export const getCurrentSession = cache(async () => {
  const store = await cookies();
  const token = store.get(getSessionCookieName())?.value;
  if (!token || token.length > 128) return null;
  return validateSessionToken(token);
});

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(getSessionCookieName(), token, getSessionCookieOptions(expiresAt));
}

export async function deleteSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(getSessionCookieName(), '', { ...getSessionCookieOptions(new Date(0)), maxAge: 0 });
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function invalidateUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
}
