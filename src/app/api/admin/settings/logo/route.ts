import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { MAX_LOGO_BYTES } from '@/lib/images';
import { getAdminOrNull } from '@/server/auth/guard';
import { prisma } from '@/server/db';
import { ImageValidationError, processLogo } from '@/server/images/process';
import { logAudit } from '@/server/security/audit';
import { RATE_LIMITS, rateLimit } from '@/server/security/rate-limit';
import { isSameOriginRequest } from '@/server/security/request';
import { deleteStoredFiles, getStorage } from '@/server/storage';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };

function error(status: number, code: string) {
  return NextResponse.json({ error: code }, { status, headers: NO_STORE });
}

/** Загрузка логотипа сайта. SVG не принимается (может содержать скрипты). */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return error(403, 'forbidden');

  const user = await getAdminOrNull();
  if (!user) return error(401, 'unauthorized');

  const limit = await rateLimit(
    `upload:${user.id}`,
    RATE_LIMITS.adminUpload.limit,
    RATE_LIMITS.adminUpload.windowSeconds,
  );
  if (!limit.success) return error(429, 'rate_limited');

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (!contentLength || contentLength > MAX_LOGO_BYTES + 64 * 1024) return error(413, 'too_large');

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get('file');
  } catch {
    return error(400, 'invalid_form');
  }
  if (!(file instanceof File) || file.size === 0) return error(400, 'no_file');
  if (file.size > MAX_LOGO_BYTES) return error(413, 'too_large');

  let processed;
  try {
    processed = await processLogo(Buffer.from(await file.arrayBuffer()));
  } catch (caught) {
    if (caught instanceof ImageValidationError) return error(415, caught.reason);
    console.error('[logo] processing failed', caught);
    return error(500, 'processing_failed');
  }

  const storage = getStorage();
  const storageKey = `site/logo-${randomUUID()}.${processed.extension}`;
  await storage.put(storageKey, processed.data, processed.contentType);

  try {
    const previous = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { logoStorageKey: true },
    });
    const logoUrl = storage.publicUrl(storageKey);
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, logoUrl, logoStorageKey: storageKey },
      update: { logoUrl, logoStorageKey: storageKey },
    });
    if (previous?.logoStorageKey) await deleteStoredFiles([previous.logoStorageKey]);
    await logAudit({ action: 'settings_updated', userId: user.id, details: 'logo uploaded' });
    revalidatePath('/', 'layout');
    return NextResponse.json({ logoUrl }, { status: 201, headers: NO_STORE });
  } catch (caught) {
    await storage.delete(storageKey).catch(() => undefined);
    console.error('[logo] save failed', caught);
    return error(500, 'save_failed');
  }
}
