'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

import { formatPrice } from '@/i18n/format';
import { prisma } from '@/server/db';
import { getEnv } from '@/server/env';
import { notifyNewLead } from '@/server/notifications/telegram';
import { logAudit } from '@/server/security/audit';
import { verifyFormToken } from '@/server/security/form-token';
import { RATE_LIMITS, rateLimit } from '@/server/security/rate-limit';
import { getRequestMeta } from '@/server/security/request';
import { formDataToObject, idField } from '@/server/validation/common';
import { leadInputSchema, leadStatusSchema } from '@/server/validation/lead';

import { adminActionGuard, RateLimitedError } from './guard';
import type { ActionResult, ActionState } from './types';

/** Публичная форма заявки */
export async function submitLeadAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const raw = formDataToObject(formData);

    // Honeypot: скрытое поле, которое заполняют только боты. Делаем вид, что всё хорошо.
    if (raw.website) return { status: 'success' };

    const token = verifyFormToken(raw.formToken);
    if (token === 'too-fast') return { status: 'success' };
    if (token !== 'ok') return { status: 'error', message: 'expired' };

    const parsed = leadInputSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? '_form');
        fieldErrors[field] ??= field;
      }
      return { status: 'error', message: 'validation', fieldErrors };
    }
    const input = parsed.data;

    // Лимит считаем только для валидных заявок — опечатки пользователя не «сжигают» попытки
    const meta = await getRequestMeta();
    const limit = await rateLimit(
      `lead:${meta.ipHash}`,
      RATE_LIMITS.leadByIp.limit,
      RATE_LIMITS.leadByIp.windowSeconds,
    );
    if (!limit.success) return { status: 'error', message: 'rateLimited' };

    // Привязываем заявку только к существующей опубликованной квартире
    const apartment = input.apartmentId
      ? await prisma.apartment.findFirst({
          where: { id: input.apartmentId, status: 'PUBLISHED' },
          select: { id: true, title: true, slug: true, price: true, currency: true },
        })
      : null;

    await prisma.lead.create({
      data: {
        name: input.name,
        phone: input.phone,
        messenger: input.messenger ?? null,
        message: input.message,
        apartmentId: apartment?.id ?? null,
        source: input.source,
        consentAt: new Date(),
        ipHash: meta.ipHash,
      },
    });

    revalidatePath('/admin', 'layout');

    const siteUrl = getEnv().SITE_URL;
    const lines = [
      '🏠 Новая заявка с сайта',
      `Имя: ${input.name}`,
      `Телефон: ${input.phone}`,
      input.messenger ? `Связь: ${input.messenger}` : null,
      apartment
        ? `Квартира: ${apartment.title} (${formatPrice(apartment.price, apartment.currency)})\n${siteUrl}/apartments/${apartment.slug}`
        : null,
      input.message ? `Сообщение: ${input.message}` : null,
      `Заявки: ${siteUrl}/admin/leads`,
    ].filter(Boolean);
    await notifyNewLead(lines.join('\n'));

    return { status: 'success' };
  } catch (error) {
    unstable_rethrow(error);
    console.error('[submitLead]', error);
    return { status: 'error', message: 'generic' };
  }
}

export async function updateLeadStatusAction(leadId: string, status: string): Promise<ActionResult> {
  try {
    await adminActionGuard();
    const id = idField.safeParse(leadId);
    const nextStatus = leadStatusSchema.safeParse(status);
    if (!id.success || !nextStatus.success) return { ok: false, message: 'error' };

    const result = await prisma.lead.updateMany({
      where: { id: id.data },
      data: { status: nextStatus.data },
    });
    if (result.count === 0) return { ok: false, message: 'error' };

    revalidatePath('/admin', 'layout');
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[updateLeadStatus]', error);
    return { ok: false, message: 'error' };
  }
}

export async function deleteLeadAction(leadId: string): Promise<ActionResult> {
  try {
    const user = await adminActionGuard();
    const id = idField.safeParse(leadId);
    if (!id.success) return { ok: false, message: 'error' };

    const result = await prisma.lead.deleteMany({ where: { id: id.data } });
    if (result.count === 0) return { ok: false, message: 'error' };

    await logAudit({ action: 'lead_deleted', userId: user.id, entityType: 'lead', entityId: id.data });
    revalidatePath('/admin', 'layout');
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[deleteLead]', error);
    return { ok: false, message: 'error' };
  }
}
