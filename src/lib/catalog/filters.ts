/**
 * Фильтры каталога ⇄ URL. Код общий для сервера (фильтрация в БД)
 * и клиента (панель фильтров). Невалидные значения из URL молча отбрасываются.
 *
 * Пример: /apartments?city=kyiv&rooms=2&pets=dog&maxPrice=25000
 */
import { getCityBySlug, type CitySlug } from '@/config/cities';

export const SORT_OPTIONS = ['new', 'price_asc', 'price_desc'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const PET_OPTIONS = ['any', 'dog', 'cat'] as const;
export type PetOption = (typeof PET_OPTIONS)[number];

/** Планируемый срок аренды, мес. */
export const TERM_OPTIONS = ['1', '3', '6', '12'] as const;
export type TermOption = (typeof TERM_OPTIONS)[number];

/** 4 означает «4 и больше» */
export const ROOM_OPTIONS = [1, 2, 3, 4] as const;

export const PAGE_SIZE = 12;
export const MAX_PRICE = 10_000_000;

export interface CatalogFilters {
  city?: CitySlug;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  rooms: number[];
  minArea?: number;
  maxArea?: number;
  minFloor?: number;
  maxFloor?: number;
  notFirstFloor: boolean;
  notLastFloor: boolean;
  furnished: boolean;
  appliances: boolean;
  children: boolean;
  pets: PetOption[];
  term?: TermOption;
  sort: SortOption;
  page: number;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const EMPTY_FILTERS: CatalogFilters = {
  rooms: [],
  notFirstFloor: false,
  notLastFloor: false,
  furnished: false,
  appliances: false,
  children: false,
  pets: [],
  sort: 'new',
  page: 1,
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: string | string[] | undefined, min: number, max: number): number | undefined {
  const raw = first(value)?.trim();
  if (!raw || !/^\d{1,9}$/.test(raw)) return undefined;
  const number = Number.parseInt(raw, 10);
  return number >= min && number <= max ? number : undefined;
}

function toFlag(value: string | string[] | undefined): boolean {
  const raw = first(value);
  return raw === '1' || raw === 'true';
}

function toList(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function orderRange(min?: number, max?: number): [number | undefined, number | undefined] {
  if (min !== undefined && max !== undefined && min > max) return [max, min];
  return [min, max];
}

function isOneOf<T extends string>(options: readonly T[], value: string | undefined): value is T {
  return value !== undefined && (options as readonly string[]).includes(value);
}

export function parseCatalogFilters(params: RawSearchParams, lockedCity?: CitySlug): CatalogFilters {
  const city = lockedCity ?? getCityBySlug(first(params.city))?.slug;
  const cityConfig = getCityBySlug(city);
  const districtRaw = first(params.district);
  const district =
    cityConfig && districtRaw && cityConfig.districts.includes(districtRaw) ? districtRaw : undefined;

  const [minPrice, maxPrice] = orderRange(
    toInt(params.minPrice, 0, MAX_PRICE),
    toInt(params.maxPrice, 0, MAX_PRICE),
  );
  const [minArea, maxArea] = orderRange(toInt(params.minArea, 1, 1000), toInt(params.maxArea, 1, 1000));
  const [minFloor, maxFloor] = orderRange(toInt(params.minFloor, 0, 200), toInt(params.maxFloor, 0, 200));

  const rooms = [
    ...new Set(
      toList(params.rooms)
        .map((value) => (value === '4+' ? 4 : Number.parseInt(value, 10)))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 4),
    ),
  ].sort((a, b) => a - b);

  const pets = [...new Set(toList(params.pets).filter((value) => isOneOf(PET_OPTIONS, value)))]
    .map((value) => value as PetOption)
    .sort((a, b) => PET_OPTIONS.indexOf(a) - PET_OPTIONS.indexOf(b));

  const termRaw = first(params.term);
  const sortRaw = first(params.sort);

  return {
    city,
    district,
    minPrice,
    maxPrice,
    rooms,
    minArea,
    maxArea,
    minFloor,
    maxFloor,
    notFirstFloor: toFlag(params.notFirstFloor),
    notLastFloor: toFlag(params.notLastFloor),
    furnished: toFlag(params.furnished),
    appliances: toFlag(params.appliances),
    children: toFlag(params.children),
    pets,
    term: isOneOf(TERM_OPTIONS, termRaw) ? termRaw : undefined,
    sort: isOneOf(SORT_OPTIONS, sortRaw) ? sortRaw : 'new',
    page: toInt(params.page, 1, 10_000) ?? 1,
  };
}

/** Канонический порядок параметров — одинаковые фильтры дают одинаковый URL */
export function filtersToSearchParams(
  filters: CatalogFilters,
  options: { includeCity?: boolean; includePage?: boolean } = {},
): URLSearchParams {
  const { includeCity = false, includePage = true } = options;
  const params = new URLSearchParams();
  const setNumber = (key: string, value: number | undefined) => {
    if (value !== undefined) params.set(key, String(value));
  };
  const setFlag = (key: string, value: boolean) => {
    if (value) params.set(key, '1');
  };

  if (includeCity && filters.city) params.set('city', filters.city);
  if (filters.district) params.set('district', filters.district);
  setNumber('minPrice', filters.minPrice);
  setNumber('maxPrice', filters.maxPrice);
  if (filters.rooms.length) params.set('rooms', filters.rooms.join(','));
  setNumber('minArea', filters.minArea);
  setNumber('maxArea', filters.maxArea);
  setNumber('minFloor', filters.minFloor);
  setNumber('maxFloor', filters.maxFloor);
  setFlag('notFirstFloor', filters.notFirstFloor);
  setFlag('notLastFloor', filters.notLastFloor);
  setFlag('furnished', filters.furnished);
  setFlag('appliances', filters.appliances);
  setFlag('children', filters.children);
  if (filters.pets.length) params.set('pets', filters.pets.join(','));
  if (filters.term) params.set('term', filters.term);
  if (filters.sort !== 'new') params.set('sort', filters.sort);
  if (includePage && filters.page > 1) params.set('page', String(filters.page));
  return params;
}

export function catalogBasePath(city?: CitySlug): string {
  return city ? `/${city}/apartments` : '/apartments';
}

/** Красивый URL каталога: город — в пути, остальное — в query */
export function buildCatalogHref(filters: CatalogFilters): string {
  const query = filtersToSearchParams(filters).toString();
  const base = catalogBasePath(filters.city);
  return query ? `${base}?${query}` : base;
}

export function buildFilterKey(filters: CatalogFilters): string {
  return filtersToSearchParams(filters, { includeCity: true }).toString();
}

/** Количество активных фильтров (без города, сортировки и страницы) */
export function countActiveFilters(filters: CatalogFilters): number {
  let count = 0;
  if (filters.district) count++;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
  if (filters.rooms.length) count++;
  if (filters.minArea !== undefined || filters.maxArea !== undefined) count++;
  if (filters.minFloor !== undefined || filters.maxFloor !== undefined) count++;
  if (filters.notFirstFloor) count++;
  if (filters.notLastFloor) count++;
  if (filters.furnished) count++;
  if (filters.appliances) count++;
  if (filters.children) count++;
  count += filters.pets.length;
  if (filters.term) count++;
  return count;
}

export function resetFilters(filters: CatalogFilters): CatalogFilters {
  return { ...EMPTY_FILTERS, city: filters.city, sort: filters.sort };
}

/** Какие минимальные сроки аренды подходят под планируемый срок */
export function rentalPeriodsForTerm(term: TermOption) {
  const months = Number(term);
  const all = [
    { period: 'MONTHS_1', months: 1 },
    { period: 'MONTHS_3', months: 3 },
    { period: 'MONTHS_6', months: 6 },
    { period: 'MONTHS_12', months: 12 },
  ] as const;
  return all.filter((item) => item.months <= months).map((item) => item.period);
}
