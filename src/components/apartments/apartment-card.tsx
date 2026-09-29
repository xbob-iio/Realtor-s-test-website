import { ArrowUpRight, BedDouble, Building, House, MapPin, Ruler } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { ClientDictionary as Dictionary } from '@/i18n/client-dictionary';
import { fill, formatPrice } from '@/i18n/format';
import { areaLabel, cityName, districtName, floorShort, roomsShort } from '@/lib/catalog/labels';
import type { ApartmentCardData } from '@/lib/catalog/types';
import { cn } from '@/lib/utils';

import { ApartmentBadges } from './apartment-badges';

interface ApartmentCardProps {
  apartment: ApartmentCardData;
  t: Dictionary;
  /** Первые карточки на экране загружаем с приоритетом (LCP) */
  priority?: boolean;
  className?: string;
}

/**
 * Карточка квартиры. Без хуков — работает и в серверных, и в клиентских компонентах.
 * Вся карточка кликабельна (растянутая ссылка), кнопка «Подробнее» — визуальный акцент.
 */
export function ApartmentCard({ apartment, t, priority = false, className }: ApartmentCardProps) {
  const href = `/apartments/${apartment.slug}`;
  const titleId = `apartment-${apartment.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-border hover:shadow-elevated',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {apartment.image ? (
          <Image
            src={apartment.image.url}
            alt={apartment.image.alt ?? apartment.title}
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            priority={priority}
            placeholder={apartment.image.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={apartment.image.blurDataUrl ?? undefined}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <House className="size-10 opacity-40" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
        <ApartmentBadges apartment={apartment} t={t} className="absolute top-3 right-3 left-3" />
        {apartment.isDemo && (
          <Badge variant="secondary" className="absolute right-3 bottom-3 bg-white/90 backdrop-blur">
            {t.apartment.demoBadge}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[22px] leading-none font-bold tracking-tight">
            {formatPrice(apartment.price, apartment.currency)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">{t.common.perMonth}</span>
          </p>
        </div>

        <h3 id={titleId} className="line-clamp-2 text-[17px] leading-snug font-semibold">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
          >
            {apartment.title}
          </Link>
        </h3>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">
            {fill(t.apartment.district, { name: districtName(t, apartment.city, apartment.district) })},{' '}
            {cityName(t, apartment.city)}
          </span>
        </p>

        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-medium text-foreground/80">
          <li className="flex items-center gap-1.5">
            <BedDouble className="size-4 text-muted-foreground" />
            {roomsShort(t, apartment.rooms)}
          </li>
          <li className="flex items-center gap-1.5">
            <Ruler className="size-4 text-muted-foreground" />
            {areaLabel(t, apartment.area)}
          </li>
          <li className="flex items-center gap-1.5">
            <Building className="size-4 text-muted-foreground" />
            {floorShort(t, apartment.floor, apartment.totalFloors)}
          </li>
        </ul>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{apartment.excerpt}</p>

        <div className="mt-auto pt-2">
          <span
            aria-hidden
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors group-hover:text-brand"
          >
            {t.common.details}
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ApartmentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card" aria-hidden>
      <div className="skeleton-shimmer aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="skeleton-shimmer h-6 w-2/5 rounded-lg" />
        <div className="skeleton-shimmer h-5 w-4/5 rounded-lg" />
        <div className="skeleton-shimmer h-4 w-3/5 rounded-lg" />
        <div className="flex gap-3">
          <div className="skeleton-shimmer h-4 w-16 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-16 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-16 rounded-lg" />
        </div>
        <div className="skeleton-shimmer h-4 w-full rounded-lg" />
      </div>
    </div>
  );
}
