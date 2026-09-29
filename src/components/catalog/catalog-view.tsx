import { MessageCircle, RotateCcw, SearchX } from 'lucide-react';
import Link from 'next/link';

import { ApartmentCard } from '@/components/apartments/apartment-card';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { EmptyState } from '@/components/common/empty-state';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { getCityBySlug } from '@/config/cities';
import { getDictionary } from '@/i18n';
import { fill, plural } from '@/i18n/format';
import {
  buildCatalogHref,
  catalogBasePath,
  countActiveFilters,
  resetFilters,
  type CatalogFilters,
} from '@/lib/catalog/filters';
import { getCatalog, getDistrictCounts } from '@/server/queries/apartments';
import { breadcrumbJsonLd, itemListJsonLd } from '@/server/seo';

import { ActiveFilters } from './active-filters';
import { CatalogPagination } from './catalog-pagination';
import { CatalogResults, CatalogShell } from './catalog-shell';
import { DesktopFilters, MobileFilters } from './catalog-filters';
import { SortSelect } from './sort-select';

export async function CatalogView({ filters }: { filters: CatalogFilters }) {
  const t = getDictionary();
  const city = getCityBySlug(filters.city);

  const [result, kyivCounts, dniproCounts] = await Promise.all([
    getCatalog(filters),
    getDistrictCounts('KYIV'),
    getDistrictCounts('DNIPRO'),
  ]);

  const districtCounts = { KYIV: kyivCounts, DNIPRO: dniproCounts };
  const cityIn = city ? t.cities[city.code].in : null;
  const title = cityIn ? fill(t.catalog.titleCity, { city: cityIn }) : t.catalog.title;
  const subtitle = cityIn ? fill(t.catalog.subtitleCity, { city: cityIn }) : t.catalog.subtitle;
  const hasFilters = countActiveFilters(filters) > 0;

  const breadcrumbs = [
    { name: t.common.home, path: '/' },
    ...(city ? [{ name: t.cities[city.code].name, path: `/${city.slug}` }] : []),
    { name: city ? title : t.nav.apartments, path: catalogBasePath(filters.city) },
  ];

  return (
    <CatalogShell>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), itemListJsonLd(result.items)]} />
      <div className="container-page py-8 lg:py-12">
        <Breadcrumbs items={breadcrumbs} label={t.common.breadcrumbs} />

        <header className="mt-5 max-w-3xl space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
          <p className="text-base text-muted-foreground sm:text-lg">{subtitle}</p>
        </header>

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label={t.filters.title}>
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] [scrollbar-width:thin] overflow-y-auto overscroll-contain rounded-3xl">
              <DesktopFilters filters={filters} districtCounts={districtCounts} />
            </div>
          </aside>

          <section aria-labelledby="catalog-results" className="min-w-0 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p id="catalog-results" aria-live="polite" className="text-[15px] font-semibold">
                {fill(t.catalog.found, {
                  count: `${result.total} ${plural(result.total, t.plurals.apartments)}`,
                })}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <MobileFilters filters={filters} districtCounts={districtCounts} total={result.total} />
                <SortSelect filters={filters} />
              </div>
            </div>

            <ActiveFilters filters={filters} />

            <CatalogResults>
              {result.items.length === 0 && result.total > 0 ? (
                <EmptyState icon={SearchX} title={t.catalog.pageMissing}>
                  <Button asChild>
                    <Link href={buildCatalogHref({ ...filters, page: 1 })}>{t.catalog.toFirstPage}</Link>
                  </Button>
                </EmptyState>
              ) : result.items.length > 0 ? (
                <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {result.items.map((apartment, index) => (
                    <li
                      key={apartment.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                    >
                      <ApartmentCard apartment={apartment} t={t} priority={index < 3} />
                    </li>
                  ))}
                </ul>
              ) : hasFilters ? (
                <EmptyState
                  icon={SearchX}
                  title={t.catalog.empty.title}
                  description={t.catalog.empty.description}
                >
                  <Button asChild>
                    <Link href={buildCatalogHref(resetFilters(filters))}>
                      <RotateCcw />
                      {t.catalog.empty.reset}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/contacts#lead-form">
                      <MessageCircle />
                      {t.catalog.empty.request}
                    </Link>
                  </Button>
                </EmptyState>
              ) : (
                <EmptyState
                  icon={SearchX}
                  title={t.catalog.emptyAll.title}
                  description={t.catalog.emptyAll.description}
                >
                  <Button asChild variant="brand">
                    <Link href="/contacts#lead-form">
                      <MessageCircle />
                      {t.catalog.empty.request}
                    </Link>
                  </Button>
                </EmptyState>
              )}
            </CatalogResults>

            <CatalogPagination t={t} filters={filters} pageCount={result.pageCount} />
          </section>
        </div>
      </div>
    </CatalogShell>
  );
}
