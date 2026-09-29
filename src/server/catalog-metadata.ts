import 'server-only';

import type { Metadata } from 'next';

import { getCityBySlug } from '@/config/cities';
import { getDictionary } from '@/i18n';
import { fill } from '@/i18n/format';
import { catalogBasePath, countActiveFilters, type CatalogFilters } from '@/lib/catalog/filters';
import { getCityStats } from '@/server/queries/apartments';
import { buildMetadata } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

/**
 * SEO каталога: базовые страницы и пагинация индексируются,
 * комбинации фильтров — noindex, follow с canonical на базовую страницу
 * (чтобы не плодить дубли в поиске, но ссылки оставались рабочими).
 */
export async function buildCatalogMetadata(filters: CatalogFilters): Promise<Metadata> {
  const t = getDictionary();
  const [settings, stats] = await Promise.all([getSiteSettings(), getCityStats()]);
  const city = getCityBySlug(filters.city);
  const hasFilters = countActiveFilters(filters) > 0 || filters.sort !== 'new';

  const cityIn = city ? t.cities[city.code].in : null;
  const count = city
    ? (stats.find((item) => item.city === city.code)?.count ?? 0)
    : stats.reduce((sum, item) => sum + item.count, 0);

  let title = cityIn ? fill(t.catalog.metaTitleCity, { city: cityIn }) : t.catalog.metaTitle;
  if (filters.page > 1) title = `${title} — ${fill(t.catalog.metaPage, { page: filters.page })}`;

  const description = cityIn
    ? fill(t.catalog.metaDescriptionCity, { city: cityIn, count })
    : t.catalog.metaDescription;

  const basePath = catalogBasePath(filters.city);
  const path = !hasFilters && filters.page > 1 ? `${basePath}?page=${filters.page}` : basePath;

  return buildMetadata({
    title,
    description,
    path,
    siteName: settings.siteName,
    noindex: hasFilters,
  });
}
