import type { Metadata } from 'next';

import { CatalogView } from '@/components/catalog/catalog-view';
import { parseCatalogFilters, type RawSearchParams } from '@/lib/catalog/filters';
import { buildCatalogMetadata } from '@/server/catalog-metadata';

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  return buildCatalogMetadata(parseCatalogFilters(await searchParams));
}

export default async function ApartmentsPage({ searchParams }: PageProps) {
  const filters = parseCatalogFilters(await searchParams);
  return <CatalogView filters={filters} />;
}
