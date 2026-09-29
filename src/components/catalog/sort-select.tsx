'use client';

import { ArrowUpDown } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDictionary } from '@/i18n/client';
import { buildCatalogHref, SORT_OPTIONS, type CatalogFilters, type SortOption } from '@/lib/catalog/filters';

import { useCatalog } from './catalog-shell';

export function SortSelect({ filters }: { filters: CatalogFilters }) {
  const t = useDictionary();
  const { navigate } = useCatalog();

  return (
    <Select
      value={filters.sort}
      onValueChange={(sort) => navigate(buildCatalogHref({ ...filters, sort: sort as SortOption, page: 1 }))}
    >
      <SelectTrigger
        size="sm"
        aria-label={t.catalog.sort.label}
        className="h-11 w-full min-w-0 rounded-full sm:w-auto sm:min-w-48"
      >
        <ArrowUpDown className="text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {t.catalog.sort[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
