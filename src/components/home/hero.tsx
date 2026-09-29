import { Check, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { LogoMark } from '@/components/layout/logo';
import type { CitySlug } from '@/config/cities';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { fill, plural } from '@/i18n/format';
import type { ImageData } from '@/lib/catalog/types';
import { cn } from '@/lib/utils';

import { SearchForm } from './search-form';

interface HeroProps {
  t: Dictionary;
  totalAvailable: number;
  defaultCity: CitySlug;
  images: { slug: string; title: string; image: ImageData }[];
}

export function Hero({ t, totalAvailable, defaultCity, images }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Мягкий фон */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-32 size-[36rem] rounded-full bg-brand-soft blur-3xl" />
        <div className="absolute top-40 -left-40 size-[28rem] rounded-full bg-secondary blur-3xl" />
      </div>

      <div className="container-page pt-8 pb-14 sm:pt-12 lg:pt-16 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3.5 py-1.5 text-sm font-semibold text-foreground/80 backdrop-blur">
              <MapPin className="size-4 text-brand" />
              {t.home.heroEyebrow}
            </p>
            <h1
              id="hero-title"
              className="mt-5 text-[2.5rem] leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-[4.25rem]"
            >
              {t.home.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t.home.heroSubtitle}
            </p>
            <ul className="mt-7 grid gap-2.5 sm:grid-cols-3 sm:gap-4">
              {t.home.heroPoints.map((point) => (
                <li key={point} className="flex items-center gap-2 text-[15px] font-medium">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-graphite text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* На мобильных форма поиска идёт сразу после заголовка, коллаж — ниже */}
          <div className="order-3 lg:order-none">
            <HeroMosaic t={t} images={images} totalAvailable={totalAvailable} />
          </div>

          <SearchForm
            defaultCity={defaultCity}
            className="relative z-10 order-2 lg:order-none lg:col-span-2 lg:mt-4"
          />
        </div>
      </div>
    </section>
  );
}

function HeroMosaic({
  t,
  images,
  totalAvailable,
}: {
  t: Dictionary;
  images: HeroProps['images'];
  totalAvailable: number;
}) {
  const availableLabel = fill(t.home.heroAvailable, {
    count: totalAvailable,
    noun: plural(totalAvailable, t.plurals.apartments),
  });

  if (images.length === 0) {
    return (
      <div
        className="relative hidden aspect-[5/4] overflow-hidden rounded-[2rem] bg-graphite lg:block"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.55_0.115_45/0.45),transparent_55%)]" />
        <LogoMark inverted className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2" />
      </div>
    );
  }

  const [main, ...rest] = images;
  return (
    <div className="relative">
      <div
        className={cn(
          'grid h-[280px] gap-3 sm:h-[380px] lg:h-[480px]',
          rest.length ? 'grid-cols-[1.35fr_1fr] grid-rows-2' : 'grid-cols-1',
        )}
      >
        {main && (
          <Link
            href={`/apartments/${main.slug}`}
            className={cn(
              'group relative overflow-hidden rounded-[1.75rem] bg-muted',
              rest.length && 'row-span-2',
            )}
            aria-label={main.title}
          >
            <Image
              src={main.image.url}
              alt={main.image.alt ?? main.title}
              fill
              priority
              sizes="(min-width: 1024px) 34vw, 60vw"
              placeholder={main.image.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={main.image.blurDataUrl ?? undefined}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </Link>
        )}
        {rest.slice(0, 2).map((item) => (
          <Link
            key={item.slug}
            href={`/apartments/${item.slug}`}
            className="group relative overflow-hidden rounded-[1.75rem] bg-muted"
            aria-label={item.title}
          >
            <Image
              src={item.image.url}
              alt={item.image.alt ?? item.title}
              fill
              sizes="(min-width: 1024px) 22vw, 40vw"
              placeholder={item.image.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={item.image.blurDataUrl ?? undefined}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </Link>
        ))}
      </div>

      {totalAvailable > 0 && (
        <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border bg-background/95 px-4 py-3 shadow-elevated backdrop-blur sm:left-6">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2.5 rounded-full bg-success" />
          </span>
          <span className="text-sm font-semibold">{availableLabel}</span>
        </div>
      )}
    </div>
  );
}
