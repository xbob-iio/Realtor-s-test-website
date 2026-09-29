'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import { prisma } from '@/server/db';
import { deleteStoredFiles } from '@/server/storage';
import { cleanLine, idField } from '@/server/validation/common';

import { adminActionGuard, RateLimitedError } from './guard';
import type { ActionResult } from './types';

function handleError(scope: string, error: unknown): ActionResult {
  if (error instanceof RateLimitedError) return { ok: false, message: 'rateLimited' };
  unstable_rethrow(error);
  console.error(`[images:${scope}]`, error);
  return { ok: false, message: 'error' };
}

/**
 * Применяет порядок фотографий. Первое фото всегда главное (isPrimary),
 * поэтому порядок в админке и в галерее на сайте совпадает.
 */
async function applyOrder(apartmentId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((imageId, index) =>
      prisma.apartmentImage.update({
        where: { id: imageId, apartmentId },
        data: { sortOrder: index, isPrimary: index === 0 },
      }),
    ),
  );
}

async function getImageIds(apartmentId: string): Promise<string[]> {
  const images = await prisma.apartmentImage.findMany({
    where: { apartmentId },
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    select: { id: true },
  });
  return images.map((image) => image.id);
}

export async function reorderImagesAction(apartmentId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await adminActionGuard();
    const id = idField.safeParse(apartmentId);
    const ids = z.array(idField).max(100).safeParse(orderedIds);
    if (!id.success || !ids.success) return { ok: false, message: 'error' };

    // Защита от IDOR: список должен совпадать с фото именно этой квартиры
    const current = await getImageIds(id.data);
    const sameSet =
      current.length === ids.data.length &&
      new Set(ids.data).size === ids.data.length &&
      ids.data.every((imageId) => current.includes(imageId));
    if (!sameSet) return { ok: false, message: 'error' };

    await applyOrder(id.data, ids.data);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    return handleError('reorder', error);
  }
}

export async function setPrimaryImageAction(apartmentId: string, imageId: string): Promise<ActionResult> {
  try {
    await adminActionGuard();
    const id = idField.safeParse(apartmentId);
    const image = idField.safeParse(imageId);
    if (!id.success || !image.success) return { ok: false, message: 'error' };

    const current = await getImageIds(id.data);
    if (!current.includes(image.data)) return { ok: false, message: 'error' };

    await applyOrder(id.data, [image.data, ...current.filter((item) => item !== image.data)]);
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    return handleError('primary', error);
  }
}

export async function deleteImageAction(apartmentId: string, imageId: string): Promise<ActionResult> {
  try {
    await adminActionGuard();
    const id = idField.safeParse(apartmentId);
    const imageIdParsed = idField.safeParse(imageId);
    if (!id.success || !imageIdParsed.success) return { ok: false, message: 'error' };

    const image = await prisma.apartmentImage.findFirst({
      where: { id: imageIdParsed.data, apartmentId: id.data },
      select: {
        id: true,
        storageKey: true,
        apartment: { select: { status: true, _count: { select: { images: true } } } },
      },
    });
    if (!image) return { ok: false, message: 'error' };

    // Опубликованная квартира не должна остаться без фотографий
    if (image.apartment.status === 'PUBLISHED' && image.apartment._count.images <= 1) {
      return { ok: false, message: 'lastPhoto' };
    }

    await prisma.apartmentImage.delete({ where: { id: image.id } });
    await deleteStoredFiles([image.storageKey]);

    const remaining = await getImageIds(id.data);
    if (remaining.length) await applyOrder(id.data, remaining);

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    return handleError('delete', error);
  }
}

export async function updateImageAltAction(
  apartmentId: string,
  imageId: string,
  alt: string,
): Promise<ActionResult> {
  try {
    await adminActionGuard();
    const id = idField.safeParse(apartmentId);
    const image = idField.safeParse(imageId);
    const text = z
      .string()
      .max(200)
      .safeParse(cleanLine(String(alt ?? '')));
    if (!id.success || !image.success || !text.success) return { ok: false, message: 'error' };

    const result = await prisma.apartmentImage.updateMany({
      where: { id: image.data, apartmentId: id.data },
      data: { alt: text.data || null },
    });
    if (result.count === 0) return { ok: false, message: 'error' };

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    return handleError('alt', error);
  }
}
