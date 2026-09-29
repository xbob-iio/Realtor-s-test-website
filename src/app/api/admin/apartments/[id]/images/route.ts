import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { MAX_PHOTO_BYTES, MAX_PHOTOS_PER_APARTMENT } from '@/lib/images';
import { getAdminOrNull } from '@/server/auth/guard';
import { prisma } from '@/server/db';
import { ImageValidationError, processApartmentPhoto } from '@/server/images/process';
import { RATE_LIMITS, rateLimit } from '@/server/security/rate-limit';
import { isSameOriginRequest } from '@/server/security/request';
import { getStorage } from '@/server/storage';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };

function error(status: number, code: string) {
  return NextResponse.json({ error: code }, { status, headers: NO_STORE });
}

/**
 * Загрузка одной фотографии квартиры (multipart/form-data, поле «file»).
 * Порядок проверок: origin (CSRF) → сессия и роль → лимит частоты →
 * существование квартиры → размер → сигнатура и декодирование файла.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return error(403, 'forbidden');

  const user = await getAdminOrNull();
  if (!user) return error(401, 'unauthorized');

  const limit = await rateLimit(
    `upload:${user.id}`,
    RATE_LIMITS.adminUpload.limit,
    RATE_LIMITS.adminUpload.windowSeconds,
  );
  if (!limit.success) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const { id } = await context.params;
  if (!/^[a-z0-9]{10,40}$/.test(id)) return error(404, 'not_found');

  const apartment = await prisma.apartment.findUnique({
    where: { id },
    select: { id: true, title: true, _count: { select: { images: true } } },
  });
  if (!apartment) return error(404, 'not_found');
  if (apartment._count.images >= MAX_PHOTOS_PER_APARTMENT) return error(400, 'too_many');

  // Не читаем тело, если заявленный размер заведомо больше лимита
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (!contentLength || contentLength > MAX_PHOTO_BYTES + 64 * 1024) return error(413, 'too_large');

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get('file');
  } catch {
    return error(400, 'invalid_form');
  }
  if (!(file instanceof File) || file.size === 0) return error(400, 'no_file');
  if (file.size > MAX_PHOTO_BYTES) return error(413, 'too_large');

  let processed;
  try {
    processed = await processApartmentPhoto(Buffer.from(await file.arrayBuffer()));
  } catch (caught) {
    if (caught instanceof ImageValidationError) return error(415, caught.reason);
    console.error('[upload] processing failed', caught);
    return error(500, 'processing_failed');
  }

  const storage = getStorage();
  const storageKey = `apartments/${apartment.id}/${randomUUID()}.${processed.extension}`;
  await storage.put(storageKey, processed.data, processed.contentType);

  try {
    const image = await prisma.$transaction(async (tx) => {
      const count = await tx.apartmentImage.count({ where: { apartmentId: apartment.id } });
      if (count >= MAX_PHOTOS_PER_APARTMENT) throw new Error('too_many');
      const last = await tx.apartmentImage.aggregate({
        where: { apartmentId: apartment.id },
        _max: { sortOrder: true },
      });
      return tx.apartmentImage.create({
        data: {
          apartmentId: apartment.id,
          url: storage.publicUrl(storageKey),
          storageKey,
          width: processed.width,
          height: processed.height,
          blurDataUrl: processed.blurDataUrl,
          alt: null,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
          isPrimary: count === 0,
        },
        select: {
          id: true,
          url: true,
          alt: true,
          width: true,
          height: true,
          blurDataUrl: true,
          isPrimary: true,
          sortOrder: true,
        },
      });
    });

    revalidatePath('/', 'layout');
    return NextResponse.json({ image }, { status: 201, headers: NO_STORE });
  } catch (caught) {
    // Запись в БД не удалась — удаляем уже сохранённый файл
    await storage.delete(storageKey).catch(() => undefined);
    if (caught instanceof Error && caught.message === 'too_many') return error(400, 'too_many');
    console.error('[upload] db insert failed', caught);
    return error(500, 'save_failed');
  }
}
