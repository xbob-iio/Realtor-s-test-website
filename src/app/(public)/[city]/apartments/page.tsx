import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogView } from '@/components/catalog/catalog-view';
import { getCityBySlug } from '@/config/cities';
import { parseCatalogFilters, type RawSearchParams } from '@/lib/catalog/filters';
import { buildCatalogMetadata } from '@/server/catalog-metadata';

interface PageProps {
  params: Promise<{ city: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const city = getCityBySlug((await params).city);
  if (!city) return {};
  return buildCatalogMetadata(parseCatalogFilters(await searchParams, city.slug));
}

/** Каталог города: /kyiv/apartments, /dnipro/apartments */
export default async function CityApartmentsPage({ params, searchParams }: PageProps) {
  const city = getCityBySlug((await params).city);
  if (!city) notFound();
  const filters = parseCatalogFilters(await searchParams, city.slug);
  return <CatalogView filters={filters} />;
}
