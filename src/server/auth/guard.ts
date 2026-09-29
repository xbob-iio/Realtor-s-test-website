import 'server-only';

import { redirect } from 'next/navigation';

import { getCurrentSession, type SessionUser } from './session';

/**
 * Серверная проверка доступа. Вызывается в КАЖДОЙ admin-странице, server action
 * и route handler — скрытие элементов интерфейса защитой не является.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const current = await getCurrentSession();
  if (!current || current.user.role !== 'ADMIN') {
    redirect('/admin/login');
  }
  return current.user;
}

/** Для route handlers: пользователь или null (ответ 401 формирует вызывающий код) */
export async function getAdminOrNull(): Promise<SessionUser | null> {
  const current = await getCurrentSession();
  if (!current || current.user.role !== 'ADMIN') return null;
  return current.user;
}
