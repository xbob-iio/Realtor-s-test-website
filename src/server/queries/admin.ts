import 'server-only';

import type { ApartmentStatus, LeadStatus } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/server/db';

export const ADMIN_PAGE_SIZE = 20;

export async function getDashboardStats() {
  const [byStatus, newLeads, demoApartments, demoLeads] = await Promise.all([
    prisma.apartment.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.apartment.count({ where: { isDemo: true } }),
    prisma.lead.count({ where: { isDemo: true } }),
  ]);
  const count = (status: ApartmentStatus) =>
    byStatus.find((group) => group.status === status)?._count._all ?? 0;
  return {
    total: byStatus.reduce((sum, group) => sum + group._count._all, 0),
    published: count('PUBLISHED'),
    hidden: count('HIDDEN'),
    rented: count('RENTED'),
    drafts: count('DRAFT'),
    archived: count('ARCHIVED'),
    newLeads,
    demo: demoApartments + demoLeads,
  };
}

export function getNewLeadsCount() {
  return prisma.lead.count({ where: { status: 'NEW' } });
}

const leadSelect = {
  id: true,
  name: true,
  phone: true,
  messenger: true,
  message: true,
  status: true,
  source: true,
  isDemo: true,
  createdAt: true,
  apartment: { select: { id: true, title: true, slug: true, status: true } },
} satisfies Prisma.LeadSelect;

export type AdminLead = Prisma.LeadGetPayload<{ select: typeof leadSelect }>;

export function getRecentLeads(limit = 5) {
  return prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: limit, select: leadSelect });
}

export async function getAdminLeads(params: { status?: LeadStatus; page: number }) {
  const where: Prisma.LeadWhereInput = params.status ? { status: params.status } : {};
  const [items, total, counts] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: leadSelect,
    }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  return {
    items,
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    counts: Object.fromEntries(counts.map((group) => [group.status, group._count._all])) as Partial<
      Record<LeadStatus, number>
    >,
  };
}

const adminApartmentListSelect = {
  id: true,
  slug: true,
  title: true,
  city: true,
  district: true,
  price: true,
  currency: true,
  status: true,
  isDemo: true,
  updatedAt: true,
  _count: { select: { images: true } },
  images: {
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    take: 1,
    select: { url: true, blurDataUrl: true },
  },
} satisfies Prisma.ApartmentSelect;

export type AdminApartmentListItem = Prisma.ApartmentGetPayload<{
  select: typeof adminApartmentListSelect;
}>;

export async function getAdminApartments(params: { status?: ApartmentStatus; query?: string; page: number }) {
  const query = params.query?.trim().slice(0, 100);
  const where: Prisma.ApartmentWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query.toLowerCase() } },
          ],
        }
      : {}),
  };
  const [items, total, counts] = await Promise.all([
    prisma.apartment.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (params.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: adminApartmentListSelect,
    }),
    prisma.apartment.count({ where }),
    prisma.apartment.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  return {
    items,
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    counts: Object.fromEntries(counts.map((group) => [group.status, group._count._all])) as Partial<
      Record<ApartmentStatus, number>
    >,
  };
}

export function getRecentApartments(limit = 5) {
  return prisma.apartment.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: adminApartmentListSelect,
  });
}

export function getAdminApartment(id: string) {
  if (!/^[a-z0-9]{10,40}$/.test(id)) return Promise.resolve(null);
  return prisma.apartment.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
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
      },
    },
  });
}

export type AdminApartment = NonNullable<Awaited<ReturnType<typeof getAdminApartment>>>;

export function getAuditLog(limit = 20) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      details: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  });
}
