import type { City } from '@/generated/prisma/enums';

export type CitySlug = 'kyiv' | 'dnipro';

export interface CityConfig {
  code: City;
  slug: CitySlug;
  /** Ключи районов. Названия — в словаре i18n (districts.<CITY>.<key>) */
  districts: readonly string[];
  geo: { latitude: number; longitude: number };
}

/**
 * Города, в которых работает сервис. Чтобы добавить город:
 * 1) добавьте значение в enum City (prisma/schema.prisma) и миграцию;
 * 2) добавьте запись сюда;
 * 3) добавьте названия города и районов в словари (src/i18n/dictionaries).
 */
export const CITIES: readonly CityConfig[] = [
  {
    code: 'KYIV',
    slug: 'kyiv',
    geo: { latitude: 50.4501, longitude: 30.5234 },
    districts: [
      'golosiivskyi',
      'darnytskyi',
      'desnianskyi',
      'dniprovskyi',
      'obolonskyi',
      'pecherskyi',
      'podilskyi',
      'sviatoshynskyi',
      'solomianskyi',
      'shevchenkivskyi',
    ],
  },
  {
    code: 'DNIPRO',
    slug: 'dnipro',
    geo: { latitude: 48.4647, longitude: 35.0462 },
    districts: [
      'amur-nyzhnodniprovskyi',
      'industrialnyi',
      'novokodatskyi',
      'samarskyi',
      'sobornyi',
      'tsentralnyi',
      'chechelivskyi',
      'shevchenkivskyi',
    ],
  },
];

export const CITY_SLUGS = CITIES.map((city) => city.slug);

export function getCityBySlug(slug: string | undefined | null): CityConfig | undefined {
  if (!slug) return undefined;
  return CITIES.find((city) => city.slug === slug);
}

export function getCityByCode(code: City): CityConfig {
  const city = CITIES.find((item) => item.code === code);
  if (!city) throw new Error(`Unknown city: ${code}`);
  return city;
}

export function isValidDistrict(city: City, district: string): boolean {
  return getCityByCode(city).districts.includes(district);
}
