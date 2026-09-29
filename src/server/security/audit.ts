import 'server-only';

import { prisma } from '@/server/db';

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'login_rate_limited'
  | 'logout'
  | 'logout_all'
  | 'password_changed'
  | 'apartment_created'
  | 'apartment_deleted'
  | 'apartment_status'
  | 'settings_updated'
  | 'demo_deleted'
  | 'lead_deleted';

interface AuditEntry {
  action: AuditAction;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipHash?: string | null;
}

/** Запись в журнал безопасности. Ошибка записи не должна ломать основное действие. */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId ?? null,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details?.slice(0, 500),
        ipHash: entry.ipHash ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] failed to write entry', entry.action, error);
  }
}
