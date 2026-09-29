import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Reveal } from '@/components/motion/reveal';
import { getCityByCode } from '@/config/cities';
import type { City } from '@/generated/prisma/enums';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { fill, formatPrice, plural } from '@/i18n/format';
import type { ImageData } from '@/lib/catalog/types';

export interface CityCardData {
  city: City;
  count: number;
  minPriceUah: number | null;
  image: ImageData | null;
}

export function CityCards({ t, cities }: { t: Dictionary; cities: CityCardData[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {cities.map((item, index) => {
        const config = getCityByCode(item.city);
        return (
          <Reveal key={item.city} delay={index * 0.08}>
            <Link
              href={`/${config.slug}`}
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[2rem] bg-graphite p-6 text-white shadow-card sm:aspect-[16/10] sm:p-8"
            >
              {item.image && (
                <Image
                  src={item.image.url}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  placeholder={item.image.blurDataUrl ? 'blur' : 'empty'}
                  blurDataURL={item.image.blurDataUrl ?? undefined}
                  className="object-cover opacity-85 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
              <div className="relative flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {t.cities[item.city].name}
                  </h3>
                  <p className="mt-2 text-[15px] text-white/85">
                    {item.count > 0
                      ? fill(t.home.cityCardCount, {
                          count: item.count,
                          noun: plural(item.count, t.plurals.apartments),
                        })
                      : t.home.cityCardEmpty}
                    {item.minPriceUah !== null && (
                      <>
                        {' · '}
                        {fill(t.home.cityCardFrom, { price: formatPrice(item.minPriceUah) })}
                      </>
                    )}
                  </p>
                </div>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-graphite transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <ArrowUpRight className="size-5" />
                  <span className="sr-only">{t.home.cityCardCta}</span>
                </span>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
