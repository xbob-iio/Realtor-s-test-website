'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { useOptionalConsent } from '@/components/cookies/consent-provider';
import { useDictionary } from '@/i18n/client';
import type { ApartmentCardData } from '@/lib/catalog/types';
import { cn } from '@/lib/utils';

import { ApartmentCard } from './apartment-card';

/**
 * «Недавно просмотренные» — функциональная возможность: данные хранятся
 * только в браузере посетителя и только при согласии на функциональные cookies.
 */
const STORAGE_KEY = 'recently-viewed';
const MAX_ITEMS = 8;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

function isCardData(value: unknown): value is ApartmentCardData {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  const image = item.image as Record<string, unknown> | null;
  return (
    typeof item.id === 'string' &&
    typeof item.slug === 'string' &&
    /^[a-z0-9-]+$/.test(item.slug) &&
    typeof item.title === 'string' &&
    typeof item.price === 'number' &&
    (image === null ||
      (typeof image === 'object' && typeof image.url === 'string' && /^(\/|https:\/\/)/.test(image.url)))
  );
}

function parse(raw: string): ApartmentCardData[] {
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isCardData).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function rememberApartment(apartment: ApartmentCardData) {
  const items = parse(readRaw()).filter((item) => item.id !== apartment.id);
  const next = [
    { ...apartment, image: apartment.image ? { ...apartment.image, blurDataUrl: null } : null },
    ...items,
  ];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_ITEMS)));
    listeners.forEach((listener) => listener());
  } catch {
    // хранилище переполнено или недоступно — функция просто не работает
  }
}

function useRecentlyViewedItems(): ApartmentCardData[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => '[]');
  return useMemo(() => parse(raw), [raw]);
}

/** Запоминает квартиру при просмотре страницы (если есть согласие) */
export function TrackRecentlyViewed({ apartment }: { apartment: ApartmentCardData }) {
  const consent = useOptionalConsent();
  const allowed = Boolean(consent?.consent?.functional);
  useEffect(() => {
    if (allowed) rememberApartment(apartment);
  }, [allowed, apartment]);
  return null;
}

export function RecentlyViewed({ excludeId, className }: { excludeId?: string; className?: string }) {
  const t = useDictionary();
  const consent = useOptionalConsent();
  const items = useRecentlyViewedItems().filter((item) => item.id !== excludeId);

  if (!consent?.consent?.functional || items.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-title" className={cn(className)}>
      <h2 id="recently-viewed-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
        {t.recentlyViewed.title}
      </h2>
      <ul className="-mx-4 mt-6 flex snap-x snap-mandatory [scrollbar-width:thin] gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {items.map((apartment) => (
          <li key={apartment.id} className="w-[280px] shrink-0 snap-start sm:w-[320px]">
            <ApartmentCard apartment={apartment} t={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
