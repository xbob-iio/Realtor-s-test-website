'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

import { prisma } from '@/server/db';
import { logAudit } from '@/server/security/audit';
import { deleteStoredFiles } from '@/server/storage';
import { formDataToObject } from '@/server/validation/common';
import { settingsInputSchema } from '@/server/validation/settings';

import { adminActionGuard, RateLimitedError } from './guard';
import type { ActionResult, ActionState } from './types';

const FIELD_ERROR_BY_FIELD: Record<string, string> = {
  siteName: 'siteName',
  phone: 'phone',
  legalPhone: 'phone',
  email: 'email',
  legalEmail: 'email',
  telegramUrl: 'telegram',
  viberUrl: 'viber',
  whatsappUrl: 'whatsapp',
  socialLinks: 'url',
  gaMeasurementId: 'ga',
  metaPixelId: 'pixel',
  usdRate: 'rate',
  eurRate: 'rate',
};

export async function saveSettingsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await adminActionGuard();
    const parsed = settingsInputSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? '_form');
        fieldErrors[field] ??= FIELD_ERROR_BY_FIELD[field] ?? 'text';
      }
      return { status: 'error', message: 'generic', fieldErrors };
    }
    const input = parsed.data;

    const previous = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { usdRate: true, eurRate: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.siteSettings.upsert({
        where: { id: 1 },
        create: { id: 1, ...input },
        update: input,
      });
      // Пересчёт цен в гривнах для объявлений в валюте, если курс изменился
      if (!previous || previous.usdRate !== input.usdRate) {
        await tx.$executeRaw`UPDATE apartments SET price_uah = ROUND(price * ${input.usdRate}::float8)::int WHERE currency = 'USD'`;
      }
      if (!previous || previous.eurRate !== input.eurRate) {
        await tx.$executeRaw`UPDATE apartments SET price_uah = ROUND(price * ${input.eurRate}::float8)::int WHERE currency = 'EUR'`;
      }
    });

    await logAudit({ action: 'settings_updated', userId: user.id });
    revalidatePath('/', 'layout');
    return { status: 'success', message: 'saved' };
  } catch (error) {
    if (error instanceof RateLimitedError) return { status: 'error', message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[saveSettings]', error);
    return { status: 'error', message: 'generic' };
  }
}

/** Новая версия согласия — баннер cookies снова появится у всех посетителей */
export async function resetCookieConsentAction(): Promise<ActionResult> {
  try {
    const user = await adminActionGuard();
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, cookieConsentVersion: 2 },
      update: { cookieConsentVersion: { increment: 1 } },
    });
    await logAudit({ action: 'settings_updated', userId: user.id, details: 'cookie consent reset' });
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[resetCookieConsent]', error);
    return { ok: false, message: 'error' };
  }
}

export async function removeLogoAction(): Promise<ActionResult> {
  try {
    const user = await adminActionGuard();
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { logoStorageKey: true },
    });
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: { logoUrl: null, logoStorageKey: null },
    });
    if (settings?.logoStorageKey) await deleteStoredFiles([settings.logoStorageKey]);
    await logAudit({ action: 'settings_updated', userId: user.id, details: 'logo removed' });
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[removeLogo]', error);
    return { ok: false, message: 'error' };
  }
}
