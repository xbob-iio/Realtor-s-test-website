import type { Currency } from '@/generated/prisma/enums';

export interface ExchangeRates {
  usdRate: number;
  eurRate: number;
}

/** Цена в гривнах — для единой фильтрации и сортировки объявлений в разных валютах */
export function toUah(price: number, currency: Currency, rates: ExchangeRates): number {
  switch (currency) {
    case 'USD':
      return Math.round(price * rates.usdRate);
    case 'EUR':
      return Math.round(price * rates.eurRate);
    default:
      return price;
  }
}
