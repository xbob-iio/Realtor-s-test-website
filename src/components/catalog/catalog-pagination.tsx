import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import type { Dictionary } from '@/i18n/dictionaries/ru';
import { fill } from '@/i18n/format';
import { buildCatalogHref, type CatalogFilters } from '@/lib/catalog/filters';
import { cn } from '@/lib/utils';

/** Номера страниц с многоточиями: 1 … 4 5 6 … 12 */
function pageItems(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set(
    [1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  for (const page of sorted) {
    const previous = result.at(-1);
    if (typeof previous === 'number' && page - previous > 1) result.push('gap');
    result.push(page);
  }
  return result;
}

const itemClass =
  'inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors';

export function CatalogPagination({
  t,
  filters,
  pageCount,
}: {
  t: Dictionary;
  filters: CatalogFilters;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const current = filters.page;
  const href = (page: number) => buildCatalogHref({ ...filters, page });

  return (
    <nav aria-label={t.catalog.pagination.label} className="flex items-center justify-center gap-1.5 pt-4">
      {current > 1 ? (
        <Link href={href(current - 1)} rel="prev" className={cn(itemClass, 'border hover:bg-secondary')}>
          <ChevronLeft className="size-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">{t.catalog.pagination.previous}</span>
        </Link>
      ) : (
        <span aria-hidden className={cn(itemClass, 'border opacity-40')}>
          <ChevronLeft className="size-4" />
        </span>
      )}

      <ol className="hidden items-center gap-1.5 sm:flex">
        {pageItems(current, pageCount).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                aria-current={item === current ? 'page' : undefined}
                aria-label={fill(t.catalog.pagination.page, { page: item })}
                className={cn(
                  itemClass,
                  item === current ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>
      <p className="px-3 text-sm font-medium text-muted-foreground sm:hidden">
        {fill(t.catalog.pagination.pageOf, { page: current, total: pageCount })}
      </p>

      {current < pageCount ? (
        <Link href={href(current + 1)} rel="next" className={cn(itemClass, 'border hover:bg-secondary')}>
          <span className="sr-only sm:not-sr-only sm:mr-1">{t.catalog.pagination.next}</span>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className={cn(itemClass, 'border opacity-40')}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
