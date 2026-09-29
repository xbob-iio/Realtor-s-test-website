'use client';

import { X } from 'lucide-react';

import { getCityBySlug } from '@/config/cities';
import { useDictionary } from '@/i18n/client';
import { fill, formatNumber } from '@/i18n/format';
import { buildCatalogHref, resetFilters, type CatalogFilters } from '@/lib/catalog/filters';

import { useCatalog } from './catalog-shell';

interface Chip {
  key: string;
  label: string;
  next: CatalogFilters;
}

function rangeLabel(
  from: number | undefined,
  to: number | undefined,
  templates: { range: string; from: string; to: string },
): string {
  if (from !== undefined && to !== undefined) {
    return fill(templates.range, { from: formatNumber(from), to: formatNumber(to) });
  }
  if (from !== undefined) return fill(templates.from, { value: formatNumber(from) });
  return fill(templates.to, { value: formatNumber(to ?? 0) });
}

/** Чипы активных фильтров с быстрым удалением */
export function ActiveFilters({ filters }: { filters: CatalogFilters }) {
  const t = useDictionary();
  const { navigate } = useCatalog();
  const base = { ...filters, page: 1 };
  const chips: Chip[] = [];
  const city = getCityBySlug(filters.city);

  if (city && filters.district) {
    chips.push({
      key: 'district',
      label: fill(t.apartment.district, {
        name: t.districts[city.code][filters.district] ?? filters.district,
      }),
      next: { ...base, district: undefined },
    });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    chips.push({
      key: 'price',
      label: rangeLabel(filters.minPrice, filters.maxPrice, {
        range: t.filters.chips.priceRange,
        from: t.filters.chips.priceFrom,
        to: t.filters.chips.priceTo,
      }),
      next: { ...base, minPrice: undefined, maxPrice: undefined },
    });
  }
  if (filters.rooms.length) {
    chips.push({
      key: 'rooms',
      label: fill(t.filters.chips.rooms, {
        value: filters.rooms.map((room) => (room === 4 ? '4+' : room)).join(', '),
      }),
      next: { ...base, rooms: [] },
    });
  }
  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    chips.push({
      key: 'area',
      label: rangeLabel(filters.minArea, filters.maxArea, {
        range: t.filters.chips.areaRange,
        from: t.filters.chips.areaFrom,
        to: t.filters.chips.areaTo,
      }),
      next: { ...base, minArea: undefined, maxArea: undefined },
    });
  }
  if (filters.minFloor !== undefined || filters.maxFloor !== undefined) {
    chips.push({
      key: 'floor',
      label: rangeLabel(filters.minFloor, filters.maxFloor, {
        range: t.filters.chips.floorRange,
        from: t.filters.chips.floorFrom,
        to: t.filters.chips.floorTo,
      }),
      next: { ...base, minFloor: undefined, maxFloor: undefined },
    });
  }
  if (filters.notFirstFloor) {
    chips.push({ key: 'notFirst', label: t.filters.notFirstFloor, next: { ...base, notFirstFloor: false } });
  }
  if (filters.notLastFloor) {
    chips.push({ key: 'notLast', label: t.filters.notLastFloor, next: { ...base, notLastFloor: false } });
  }
  if (filters.furnished) {
    chips.push({ key: 'furnished', label: t.filters.furnished, next: { ...base, furnished: false } });
  }
  if (filters.appliances) {
    chips.push({ key: 'appliances', label: t.filters.appliances, next: { ...base, appliances: false } });
  }
  if (filters.children) {
    chips.push({ key: 'children', label: t.filters.children, next: { ...base, children: false } });
  }
  for (const pet of filters.pets) {
    chips.push({
      key: `pet-${pet}`,
      label: pet === 'any' ? t.filters.petsAny : pet === 'dog' ? t.filters.petsDog : t.filters.petsCat,
      next: { ...base, pets: filters.pets.filter((item) => item !== pet) },
    });
  }
  if (filters.term) {
    chips.push({
      key: 'term',
      label: fill(t.filters.chips.term, { value: t.filters.terms[filters.term] ?? filters.term }),
      next: { ...base, term: undefined },
    });
  }

  if (!chips.length) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.key} className="animate-in duration-200 fade-in-0 zoom-in-95">
          <button
            type="button"
            onClick={() => navigate(buildCatalogHref(chip.next))}
            aria-label={fill(t.filters.chips.remove, { label: chip.label })}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-secondary pr-2.5 pl-3.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            {chip.label}
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() => navigate(buildCatalogHref(resetFilters(filters)))}
          className="h-9 px-2 text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {t.filters.resetAll}
        </button>
      </li>
    </ul>
  );
}
