'use server';

import { redirect, unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import { requireAdmin } from '@/server/auth/guard';
import {
  hashPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  verifyAgainstDummy,
  verifyPassword,
} from '@/server/auth/password';
import {
  createSession,
  deleteSessionCookie,
  getCurrentSession,
  invalidateSession,
  invalidateUserSessions,
  setSessionCookie,
} from '@/server/auth/session';
import { prisma } from '@/server/db';
import { logAudit } from '@/server/security/audit';
import { RATE_LIMITS, rateLimit, resetRateLimit } from '@/server/security/rate-limit';
import { getRequestMeta, hashIdentifier } from '@/server/security/request';

import type { ActionState } from './types';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  next: z.string().max(300).optional(),
});

/** Разрешаем возврат только на страницы админки (защита от open redirect) */
function safeRedirectTarget(next: string | undefined): string {
  if (!next || !next.startsWith('/admin') || next.startsWith('//') || next.includes('\\')) {
    return '/admin';
  }
  if (next.startsWith('/admin/login')) return '/admin';
  return next;
}

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let target = '/admin';

  try {
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      next: formData.get('next') ?? undefined,
    });
    if (!parsed.success) return { status: 'error', message: 'input' };
    const { email, password, next } = parsed.data;

    const meta = await getRequestMeta();
    const emailKey = `login:email:${hashIdentifier(email)}`;
    const [byIp, byEmail] = await Promise.all([
      rateLimit(`login:ip:${meta.ipHash}`, RATE_LIMITS.loginByIp.limit, RATE_LIMITS.loginByIp.windowSeconds),
      rateLimit(emailKey, RATE_LIMITS.loginByEmail.limit, RATE_LIMITS.loginByEmail.windowSeconds),
    ]);
    if (!byIp.success || !byEmail.success) {
      await logAudit({ action: 'login_rate_limited', details: email, ipHash: meta.ipHash });
      const seconds = Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds);
      return { status: 'error', message: `rateLimited:${Math.ceil(seconds / 60)}` };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, role: true },
    });
    const valid = user
      ? await verifyPassword(user.passwordHash, password)
      : await verifyAgainstDummy(password);

    if (!user || !valid || user.role !== 'ADMIN') {
      await logAudit({ action: 'login_failed', userId: user?.id, details: email, ipHash: meta.ipHash });
      return { status: 'error', message: 'invalid' };
    }

    await resetRateLimit(emailKey);
    const { token, session } = await createSession(user.id, meta);
    await setSessionCookie(token, session.expiresAt);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await logAudit({ action: 'login_success', userId: user.id, ipHash: meta.ipHash });

    target = safeRedirectTarget(next);
  } catch (error) {
    unstable_rethrow(error);
    console.error('[login]', error);
    return { status: 'error', message: 'generic' };
  }

  redirect(target);
}

export async function logoutAction(): Promise<void> {
  const current = await getCurrentSession();
  if (current) {
    await invalidateSession(current.session.id);
    const meta = await getRequestMeta();
    await logAudit({ action: 'logout', userId: current.user.id, ipHash: meta.ipHash });
  }
  await deleteSessionCookie();
  redirect('/admin/login');
}

export async function logoutAllAction(): Promise<void> {
  const user = await requireAdmin();
  await invalidateUserSessions(user.id);
  const meta = await getRequestMeta();
  await logAudit({ action: 'logout_all', userId: user.id, ipHash: meta.ipHash });
  await deleteSessionCookie();
  redirect('/admin/login');
}

const passwordSchema = z
  .object({
    current: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    next: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    confirm: z.string().max(PASSWORD_MAX_LENGTH),
  })
  .superRefine((data, ctx) => {
    if (data.next !== data.confirm) ctx.addIssue({ code: 'custom', path: ['confirm'], message: 'mismatch' });
    if (data.next === data.current) ctx.addIssue({ code: 'custom', path: ['next'], message: 'same' });
  });

export async function changePasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireAdmin();
    const current = await getCurrentSession();

    const limit = await rateLimit(
      `password:${user.id}`,
      RATE_LIMITS.passwordChange.limit,
      RATE_LIMITS.passwordChange.windowSeconds,
    );
    if (!limit.success) return { status: 'error', message: 'rateLimited' };

    const parsed = passwordSchema.safeParse({
      current: formData.get('current'),
      next: formData.get('next'),
      confirm: formData.get('confirm'),
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        fieldErrors[field] ??=
          issue.code === 'custom' ? issue.message : field === 'next' ? 'length' : 'current';
      }
      return { status: 'error', fieldErrors };
    }

    const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!record || !(await verifyPassword(record.passwordHash, parsed.data.current))) {
      return { status: 'error', fieldErrors: { current: 'current' } };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.next), passwordChangedAt: new Date() },
    });
    // Все остальные сессии завершаются — на случай, если пароль был скомпрометирован
    await invalidateUserSessions(user.id, current?.session.id);
    const meta = await getRequestMeta();
    await logAudit({ action: 'password_changed', userId: user.id, ipHash: meta.ipHash });

    return { status: 'success', message: 'success' };
  } catch (error) {
    unstable_rethrow(error);
    console.error('[changePassword]', error);
    return { status: 'error', message: 'generic' };
  }
}
