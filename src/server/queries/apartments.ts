import 'server-only';

import { cache } from 'react';

import { getCityByCode, getCityBySlug } from '@/config/cities';
import type { City } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { PAGE_SIZE, rentalPeriodsForTerm, type CatalogFilters } from '@/lib/catalog/filters';
import type { ApartmentCardData, ApartmentDetails } from '@/lib/catalog/types';
import { prisma } from '@/server/db';

const NEW_BADGE_DAYS = 7;

/** Только опубликованные объекты попадают на публичный сайт */
const PUBLISHED = { status: 'PUBLISHED' } as const;

const coverImageSelect = {
  orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
  take: 1,
  select: { url: true, alt: true, width: true, height: true, blurDataUrl: true },
} satisfies Prisma.Apartment$imagesArgs;

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  city: true,
  district: true,
  price: true,
  currency: true,
  priceUah: true,
  rooms: true,
  area: true,
  floor: true,
  totalFloors: true,
  description: true,
  furnished: true,
  childrenAllowed: true,
  petsAllowed: true,
  dogsAllowed: true,
  catsAllowed: true,
  publishedAt: true,
  isDemo: true,
  images: coverImageSelect,
} satisfies Prisma.ApartmentSelect;

type CardRow = Prisma.ApartmentGetPayload<{ select: typeof cardSelect }>;

function makeExcerpt(text: string, maxLength = 150): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : maxLength).replace(/[,.;:!?-]+$/, '')}…`;
}

function isRecentlyPublished(publishedAt: Date | null, now: number): boolean {
  if (!publishedAt) return false;
  return now - publishedAt.getTime() < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
}

function toCard(row: CardRow, now: number): ApartmentCardData {
  const { description, images, publishedAt, ...rest } = row;
  return {
    ...rest,
    excerpt: makeExcerpt(description),
    isNew: isRecentlyPublished(publishedAt, now),
    image: images[0] ?? null,
  };
}

export function buildCatalogWhere(filters: CatalogFilters): Prisma.ApartmentWhereInput {
  const and: Prisma.ApartmentWhereInput[] = [];
  const where: Prisma.ApartmentWhereInput = { ...PUBLISHED, AND: and };

  const city = getCityBySlug(filters.city);
  if (city) where.city = city.code;
  if (city && filters.district) where.district = filters.district;

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.priceUah = { gte: filters.minPrice, lte: filters.maxPrice };
  }

  if (filters.rooms.length) {
    const exact = filters.rooms.filter((rooms) => rooms < 4);
    const or: Prisma.ApartmentWhereInput[] = [];
    if (exact.length) or.push({ rooms: { in: exact } });
    if (filters.rooms.includes(4)) or.push({ rooms: { gte: 4 } });
    and.push({ OR: or });
  }

  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    where.area = { gte: filters.minArea, lte: filters.maxArea };
  }

  if (filters.minFloor !== undefined || filters.maxFloor !== undefined) {
    and.push({ floor: { gte: filters.minFloor, lte: filters.maxFloor } });
  }
  if (filters.notFirstFloor) and.push({ floor: { gt: 1 } });
  if (filters.notLastFloor) and.push({ floor: { lt: prisma.apartment.fields.totalFloors } });

  if (filters.furnished) where.furnished = true;
  if (filters.appliances) where.hasAppliances = true;
  if (filters.children) where.childrenAllowed = true;

  if (filters.pets.includes('any')) where.petsAllowed = true;
  if (filters.pets.includes('dog')) where.dogsAllowed = true;
  if (filters.pets.includes('cat')) where.catsAllowed = true;

  if (filters.term) where.rentalPeriod = { in: [...rentalPeriodsForTerm(filters.term)] };

  return where;
}

function buildOrderBy(sort: CatalogFilters['sort']): Prisma.ApartmentOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ priceUah: 'asc' }, { id: 'asc' }];
    case 'price_desc':
      return [{ priceUah: 'desc' }, { id: 'asc' }];
    default:
      return [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }];
  }
}

export interface CatalogResult {
  items: ApartmentCardData[];
  total: number;
  page: number;
  pageCount: number;
}

export async function getCatalog(filters: CatalogFilters): Promise<CatalogResult> {
  const where = buildCatalogWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.apartment.findMany({
      where,
      orderBy: buildOrderBy(filters.sort),
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: cardSelect,
    }),
    prisma.apartment.count({ where }),
  ]);
  const now = Date.now();
  return {
    items: rows.map((row) => toCard(row, now)),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export function countCatalog(filters: CatalogFilters): Promise<number> {
  return prisma.apartment.count({ where: buildCatalogWhere(filters) });
}

export async function getLatestApartments(limit: number, city?: City): Promise<ApartmentCardData[]> {
  const rows = await prisma.apartment.findMany({
    where: { ...PUBLISHED, ...(city ? { city } : {}) },
    orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
    take: limit,
    select: cardSelect,
  });
  const now = Date.now();
  return rows.map((row) => toCard(row, now));
}

export const getPublishedApartmentBySlug = cache(async (slug: string): Promise<ApartmentDetails | null> => {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return null;
  const row = await prisma.apartment.findFirst({
    where: { slug, ...PUBLISHED },
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      district: true,
      address: true,
      price: true,
      currency: true,
      priceUah: true,
      rooms: true,
      area: true,
      floor: true,
      totalFloors: true,
      description: true,
      furnished: true,
      hasAppliances: true,
      childrenAllowed: true,
      petsAllowed: true,
      dogsAllowed: true,
      catsAllowed: true,
      rentalPeriod: true,
      deposit: true,
      utilities: true,
      utilitiesNote: true,
      publishedAt: true,
      updatedAt: true,
      isDemo: true,
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        select: { id: true, url: true, alt: true, width: true, height: true, blurDataUrl: true },
      },
    },
  });
  if (!row) return null;
  return { ...row, isNew: isRecentlyPublished(row.publishedAt, Date.now()) };
});

/** Если slug меняли вручную — находим актуальный адрес для 301-редиректа */
export async function findRedirectSlug(slug: string): Promise<string | null> {
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return null;
  const redirect = await prisma.apartmentSlugRedirect.findUnique({
    where: { slug },
    select: { apartment: { select: { slug: true, status: true } } },
  });
  if (!redirect || redirect.apartment.status !== 'PUBLISHED') return null;
  return redirect.apartment.slug;
}

export async function getSimilarApartments(
  apartment: Pick<ApartmentDetails, 'id' | 'city' | 'rooms' | 'priceUah'>,
  limit = 3,
): Promise<ApartmentCardData[]> {
  const rows = await prisma.apartment.findMany({
    where: {
      ...PUBLISHED,
      city: apartment.city,
      id: { not: apartment.id },
      rooms: { gte: Math.max(1, apartment.rooms - 1), lte: apartment.rooms + 1 },
    },
    orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }],
    take: 24,
    select: cardSelect,
  });

  let candidates = rows;
  if (candidates.length < limit) {
    const extra = await prisma.apartment.findMany({
      where: {
        ...PUBLISHED,
        city: apartment.city,
        id: { notIn: [apartment.id, ...rows.map((row) => row.id)] },
      },
      orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }],
      take: limit - candidates.length,
      select: cardSelect,
    });
    candidates = [...candidates, ...extra];
  }

  const now = Date.now();
  return candidates
    .sort((a, b) => Math.abs(a.priceUah - apartment.priceUah) - Math.abs(b.priceUah - apartment.priceUah))
    .slice(0, limit)
    .map((row) => toCard(row, now));
}

export interface CityStats {
  city: City;
  count: number;
  minPriceUah: number | null;
}

export const getCityStats = cache(async (): Promise<CityStats[]> => {
  const groups = await prisma.apartment.groupBy({
    by: ['city'],
    where: PUBLISHED,
    _count: { _all: true },
    _min: { priceUah: true },
  });
  return (['KYIV', 'DNIPRO'] as const).map((city) => {
    const group = groups.find((item) => item.city === city);
    return { city, count: group?._count._all ?? 0, minPriceUah: group?._min.priceUah ?? null };
  });
});

/** Количество опубликованных квартир по районам города (для фильтров и страниц городов) */
export const getDistrictCounts = cache(async (city: City): Promise<Record<string, number>> => {
  const groups = await prisma.apartment.groupBy({
    by: ['district'],
    where: { ...PUBLISHED, city },
    _count: { _all: true },
  });
  const known = getCityByCode(city).districts;
  return Object.fromEntries(
    groups
      .filter((group) => known.includes(group.district))
      .map((group) => [group.district, group._count._all]),
  );
});

export async function getSitemapApartments() {
  return prisma.apartment.findMany({
    where: PUBLISHED,
    orderBy: { publishedAt: 'desc' },
    select: {
      slug: true,
      updatedAt: true,
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 5, select: { url: true } },
    },
  });
}

/** Есть ли на сайте опубликованные демо-объекты (для пометки в подвале) */
export const hasPublishedDemo = cache(async (): Promise<boolean> => {
  const count = await prisma.apartment.count({ where: { ...PUBLISHED, isDemo: true } });
  return count > 0;
});

/** Картинки для коллажа на главной */
export async function getHeroImages(limit = 3) {
  const rows = await prisma.apartment.findMany({
    where: { ...PUBLISHED, images: { some: {} } },
    orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }],
    take: limit,
    select: { slug: true, title: true, images: coverImageSelect },
  });
  return rows
    .filter((row) => row.images[0])
    .map((row) => ({ slug: row.slug, title: row.title, image: row.images[0]! }));
}
