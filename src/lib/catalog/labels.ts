import type { City, Currency } from '@/generated/prisma/enums';
import type { ClientDictionary as Dictionary } from '@/i18n/client-dictionary';
import { fill, formatNumber, formatPrice } from '@/i18n/format';

export function cityName(t: Dictionary, city: City): string {
  return t.cities[city].name;
}

export function districtName(t: Dictionary, city: City, district: string): string {
  return t.districts[city][district] ?? district;
}

/** «Печерский район» */
export function districtFull(t: Dictionary, city: City, district: string): string {
  return fill(t.apartment.district, { name: districtName(t, city, district) });
}

export function roomsShort(t: Dictionary, rooms: number): string {
  return fill(t.apartment.roomsShort, { count: rooms });
}

export function areaLabel(t: Dictionary, area: number): string {
  return fill(t.apartment.areaValue, { value: formatNumber(area) });
}

export function floorShort(t: Dictionary, floor: number, total: number): string {
  return fill(t.apartment.floorShort, { floor: floor === 0 ? t.apartment.basement : floor, total });
}

export function floorFull(t: Dictionary, floor: number, total: number): string {
  return fill(t.apartment.floorValue, { floor: floor === 0 ? t.apartment.basement : floor, total });
}

export function priceLabel(price: number, currency: Currency): string {
  return formatPrice(price, currency);
}
