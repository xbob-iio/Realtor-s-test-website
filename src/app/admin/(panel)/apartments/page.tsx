import { Building, ImageOff, Plus, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { AdminPagination } from '@/components/admin/admin-pagination';
import { ApartmentRowActions } from '@/components/admin/apartment-actions';
import { AdminPageHeader } from '@/components/admin/page-header';
import { ApartmentStatusBadge } from '@/components/admin/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ApartmentStatus } from '@/generated/prisma/enums';
import { getAdminDictionary, getDictionary } from '@/i18n';
import { fill, formatDateTime, formatPrice } from '@/i18n/format';
import { districtName } from '@/lib/catalog/labels';
import { cn } from '@/lib/utils';
import { requireAdmin } from '@/server/auth/guard';
import { getAdminApartments, type AdminApartmentListItem } from '@/server/queries/admin';
import { APARTMENT_STATUSES } from '@/server/validation/apartment';

export const metadata: Metadata = { title: getAdminDictionary().apartments.title };

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

function Thumb({ item, className }: { item: AdminApartmentListItem; className?: string }) {
  const image = item.images[0];
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-xl bg-muted', className)}>
      {image ? (
        <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-muted-foreground">
          <ImageOff className="size-5" />
        </span>
      )}
    </span>
  );
}

export default async function AdminApartmentsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const ta = getAdminDictionary();
  const t = getDictionary();
  const params = await searchParams;

  const status = APARTMENT_STATUSES.includes(params.status as ApartmentStatus)
    ? (params.status as ApartmentStatus)
    : undefined;
  const query = typeof params.q === 'string' ? params.q.slice(0, 100) : '';
  const page = Math.max(1, Math.min(10_000, Number.parseInt(params.page ?? '1', 10) || 1));

  const { items, total, pageCount, counts } = await getAdminApartments({ status, query, page });
  const allCount = Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0);

  const hrefFor = (next: { status?: string; page?: number }) => {
    const search = new URLSearchParams();
    if (next.status) search.set('status', next.status);
    if (query) search.set('q', query);
    if (next.page && next.page > 1) search.set('page', String(next.page));
    const qs = search.toString();
    return qs ? `/admin/apartments?${qs}` : '/admin/apartments';
  };

  const tabs: { key: string; status?: ApartmentStatus; label: string; count: number }[] = [
    { key: 'all', label: ta.apartments.tabs.all, count: allCount },
    ...(['PUBLISHED', 'DRAFT', 'HIDDEN', 'RENTED', 'ARCHIVED'] as const).map((value) => ({
      key: value,
      status: value,
      label: ta.apartments.tabs[value],
      count: counts[value] ?? 0,
    })),
  ];

  return (
    <>
      <AdminPageHeader
        title={ta.apartments.title}
        description={ta.apartments.subtitle}
        actions={
          <Button asChild variant="brand">
            <Link href="/admin/apartments/new">
              <Plus />
              {ta.apartments.add}
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label={ta.apartments.title} className="-mx-1 overflow-x-auto px-1">
          <ul className="flex gap-1.5">
            {tabs.map((tab) => {
              const active = tab.status === status;
              return (
                <li key={tab.key}>
                  <Link
                    href={hrefFor({ status: tab.status })}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-foreground/75 hover:bg-secondary',
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        active ? 'text-white/70' : 'text-muted-foreground',
                      )}
                    >
                      {tab.count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <form role="search" className="relative w-full lg:w-80" action="/admin/apartments">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder={ta.apartments.searchPlaceholder}
            aria-label={ta.apartments.search}
            className="h-11 pl-11"
          />
        </form>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Building}
          title={query || status ? ta.apartments.emptyFiltered : ta.apartments.empty}
          description={query || status ? undefined : ta.apartments.emptyHint}
          className="bg-background"
        >
          {!query && !status && (
            <Button asChild variant="brand">
              <Link href="/admin/apartments/new">
                <Plus />
                {ta.apartments.add}
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          {/* Десктоп: таблица */}
          <div className="hidden overflow-hidden rounded-3xl border bg-background md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-surface text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="py-3.5 pr-3 pl-5">
                    {ta.apartments.table.apartment}
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    {ta.apartments.table.location}
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    {ta.apartments.table.price}
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    {ta.apartments.table.status}
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    {ta.apartments.table.updated}
                  </th>
                  <th scope="col" className="py-3.5 pr-5 pl-3 text-right">
                    <span className="sr-only">{ta.apartments.table.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-surface/60">
                    <td className="py-3 pr-3 pl-5">
                      <Link href={`/admin/apartments/${item.id}`} className="group flex items-center gap-3">
                        <Thumb item={item} className="h-14 w-20" />
                        <span className="min-w-0">
                          <span className="line-clamp-1 font-semibold group-hover:text-brand">
                            {item.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            {item._count.images > 0
                              ? fill(ta.apartments.photosCount, { count: item._count.images })
                              : ta.apartments.noPhotos}
                            {item.isDemo && <Badge variant="secondary">{ta.apartments.demo}</Badge>}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {t.cities[item.city].name}
                      <br />
                      <span className="text-xs">{districtName(t, item.city, item.district)}</span>
                    </td>
                    <td className="px-3 py-3 font-semibold whitespace-nowrap">
                      {formatPrice(item.price, item.currency)}
                    </td>
                    <td className="px-3 py-3">
                      <ApartmentStatusBadge status={item.status} label={ta.status[item.status]} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(item.updatedAt)}
                    </td>
                    <td className="py-3 pr-5 pl-3 text-right">
                      <ApartmentRowActions
                        apartment={{ id: item.id, title: item.title, slug: item.slug, status: item.status }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобильные: карточки */}
          <ul className="grid gap-3 md:hidden">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 rounded-3xl border bg-background p-3">
                <Link href={`/admin/apartments/${item.id}`} className="shrink-0">
                  <Thumb item={item} className="size-20" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/apartments/${item.id}`} className="line-clamp-2 font-semibold">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPrice(item.price, item.currency)} · {t.cities[item.city].name}
                  </p>
                  <div className="mt-2">
                    <ApartmentStatusBadge status={item.status} label={ta.status[item.status]} />
                  </div>
                </div>
                <ApartmentRowActions
                  apartment={{ id: item.id, title: item.title, slug: item.slug, status: item.status }}
                />
              </li>
            ))}
          </ul>

          <p className="mt-4 text-center text-sm text-muted-foreground lg:text-left">
            {ta.apartments.tabs.all}: {total}
          </p>
          <AdminPagination
            page={page}
            pageCount={pageCount}
            hrefFor={(next) => hrefFor({ status, page: next })}
            label={ta.common.page}
          />
        </>
      )}
    </>
  );
}
