'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';

import { getCityByCode } from '@/config/cities';
import type { ApartmentStatus } from '@/generated/prisma/enums';
import { toUah } from '@/lib/pricing';
import { apartmentBaseSlug } from '@/lib/slug';
import { prisma } from '@/server/db';
import { getRequestMeta } from '@/server/security/request';
import { logAudit } from '@/server/security/audit';
import { getSiteSettings } from '@/server/settings';
import { deleteStoredFiles } from '@/server/storage';
import { apartmentInputSchema, apartmentStatusSchema } from '@/server/validation/apartment';
import { fieldErrorKeys, formDataToObject, idField } from '@/server/validation/common';

import { adminActionGuard, RateLimitedError } from './guard';
import type { ActionResult, ActionState } from './types';

function revalidateApartments() {
  revalidatePath('/', 'layout');
}

async function isSlugTaken(slug: string, exceptApartmentId?: string): Promise<boolean> {
  const [apartment, redirectEntry] = await Promise.all([
    prisma.apartment.findUnique({ where: { slug }, select: { id: true } }),
    prisma.apartmentSlugRedirect.findUnique({ where: { slug }, select: { apartmentId: true } }),
  ]);
  if (apartment && apartment.id !== exceptApartmentId) return true;
  if (redirectEntry && redirectEntry.apartmentId !== exceptApartmentId) return true;
  return false;
}

async function generateUniqueSlug(base: string): Promise<string> {
  if (!(await isSlugTaken(base))) return base;
  for (let suffix = 2; suffix < 200; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!(await isSlugTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Создание (apartmentId = null) и редактирование квартиры */
export async function saveApartmentAction(
  apartmentId: string | null,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let createdId: string | null = null;

  try {
    const user = await adminActionGuard();

    if (apartmentId !== null && !idField.safeParse(apartmentId).success) {
      return { status: 'error', message: 'notFound' };
    }

    const parsed = apartmentInputSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { status: 'error', message: 'errorSummary', fieldErrors: fieldErrorKeys(parsed.error) };
    }
    const input = parsed.data;
    const settings = await getSiteSettings();
    const priceUah = toUah(input.price, input.currency, settings);

    const data = {
      title: input.title,
      city: input.city,
      district: input.district,
      address: input.address,
      price: input.price,
      currency: input.currency,
      priceUah,
      rooms: input.rooms,
      area: input.area,
      floor: input.floor,
      totalFloors: input.totalFloors,
      description: input.description,
      furnished: input.furnished,
      hasAppliances: input.hasAppliances,
      childrenAllowed: input.childrenAllowed,
      petsAllowed: input.petsAllowed,
      dogsAllowed: input.dogsAllowed,
      catsAllowed: input.catsAllowed,
      rentalPeriod: input.rentalPeriod,
      deposit: input.deposit,
      utilities: input.utilities,
      utilitiesNote: input.utilitiesNote,
      status: input.status,
    };

    if (apartmentId === null) {
      // Новая квартира ещё без фото — опубликовать её сразу нельзя
      if (input.status === 'PUBLISHED') {
        return { status: 'error', message: 'needPhoto', fieldErrors: { status: 'needPhoto' } };
      }
      if (input.slug && (await isSlugTaken(input.slug))) {
        return { status: 'error', message: 'errorSummary', fieldErrors: { slug: 'slugTaken' } };
      }
      const slug =
        input.slug ||
        (await generateUniqueSlug(
          apartmentBaseSlug({
            rooms: input.rooms,
            district: input.district,
            citySlug: getCityByCode(input.city).slug,
          }),
        ));

      const created = await prisma.apartment.create({ data: { ...data, slug }, select: { id: true } });
      createdId = created.id;
      await logAudit({
        action: 'apartment_created',
        userId: user.id,
        entityType: 'apartment',
        entityId: created.id,
        details: input.title,
      });
    } else {
      const existing = await prisma.apartment.findUnique({
        where: { id: apartmentId },
        select: {
          id: true,
          slug: true,
          status: true,
          publishedAt: true,
          _count: { select: { images: true } },
        },
      });
      if (!existing) return { status: 'error', message: 'notFound' };

      if (input.status === 'PUBLISHED' && existing._count.images === 0) {
        return { status: 'error', message: 'needPhoto', fieldErrors: { status: 'needPhoto' } };
      }

      const newSlug = input.slug || existing.slug;
      if (newSlug !== existing.slug && (await isSlugTaken(newSlug, existing.id))) {
        return { status: 'error', message: 'errorSummary', fieldErrors: { slug: 'slugTaken' } };
      }

      await prisma.$transaction(async (tx) => {
        await tx.apartment.update({
          where: { id: existing.id },
          data: {
            ...data,
            slug: newSlug,
            publishedAt: input.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : undefined,
          },
        });
        if (newSlug !== existing.slug) {
          // Старый адрес продолжает работать через 301-редирект
          await tx.apartmentSlugRedirect.deleteMany({ where: { slug: newSlug } });
          await tx.apartmentSlugRedirect.upsert({
            where: { slug: existing.slug },
            create: { slug: existing.slug, apartmentId: existing.id },
            update: { apartmentId: existing.id },
          });
        }
      });

      if (existing.status !== input.status) {
        await logAudit({
          action: 'apartment_status',
          userId: user.id,
          entityType: 'apartment',
          entityId: existing.id,
          details: `${existing.status} → ${input.status}`,
        });
      }
    }

    revalidateApartments();
  } catch (error) {
    if (error instanceof RateLimitedError) return { status: 'error', message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[saveApartment]', error);
    return { status: 'error', message: 'generic' };
  }

  if (createdId) redirect(`/admin/apartments/${createdId}?created=1`);
  return { status: 'success', message: 'saved' };
}

export async function changeApartmentStatusAction(
  apartmentId: string,
  nextStatus: ApartmentStatus,
): Promise<ActionResult> {
  try {
    const user = await adminActionGuard();
    const id = idField.safeParse(apartmentId);
    const status = apartmentStatusSchema.safeParse(nextStatus);
    if (!id.success || !status.success) return { ok: false, message: 'error' };

    const apartment = await prisma.apartment.findUnique({
      where: { id: id.data },
      select: { status: true, publishedAt: true, _count: { select: { images: true } } },
    });
    if (!apartment) return { ok: false, message: 'notFound' };
    if (status.data === 'PUBLISHED' && apartment._count.images === 0) {
      return { ok: false, message: 'needPhoto' };
    }

    await prisma.apartment.update({
      where: { id: id.data },
      data: {
        status: status.data,
        publishedAt: status.data === 'PUBLISHED' && !apartment.publishedAt ? new Date() : undefined,
      },
    });
    const meta = await getRequestMeta();
    await logAudit({
      action: 'apartment_status',
      userId: user.id,
      entityType: 'apartment',
      entityId: id.data,
      details: `${apartment.status} → ${status.data}`,
      ipHash: meta.ipHash,
    });
    revalidateApartments();
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[changeApartmentStatus]', error);
    return { ok: false, message: 'error' };
  }
}

export async function deleteApartmentAction(apartmentId: string): Promise<ActionResult> {
  try {
    const user = await adminActionGuard();
    const id = idField.safeParse(apartmentId);
    if (!id.success) return { ok: false, message: 'notFound' };

    const apartment = await prisma.apartment.findUnique({
      where: { id: id.data },
      select: { title: true, images: { select: { storageKey: true } } },
    });
    if (!apartment) return { ok: false, message: 'notFound' };

    await prisma.apartment.delete({ where: { id: id.data } });
    await deleteStoredFiles(apartment.images.map((image) => image.storageKey));

    const meta = await getRequestMeta();
    await logAudit({
      action: 'apartment_deleted',
      userId: user.id,
      entityType: 'apartment',
      entityId: id.data,
      details: apartment.title,
      ipHash: meta.ipHash,
    });
    revalidateApartments();
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[deleteApartment]', error);
    return { ok: false, message: 'error' };
  }
}

/** Удаление всех демонстрационных данных, созданных seed-скриптом */
export async function deleteDemoDataAction(): Promise<ActionResult> {
  try {
    const user = await adminActionGuard();
    const images = await prisma.apartmentImage.findMany({
      where: { apartment: { isDemo: true } },
      select: { storageKey: true },
    });
    const [apartments, leads] = await prisma.$transaction([
      prisma.apartment.deleteMany({ where: { isDemo: true } }),
      prisma.lead.deleteMany({ where: { isDemo: true } }),
    ]);
    await deleteStoredFiles(images.map((image) => image.storageKey));
    await logAudit({
      action: 'demo_deleted',
      userId: user.id,
      details: `apartments: ${apartments.count}, leads: ${leads.count}`,
    });
    revalidateApartments();
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, message: 'rateLimited' };
    unstable_rethrow(error);
    console.error('[deleteDemoData]', error);
    return { ok: false, message: 'error' };
  }
}
