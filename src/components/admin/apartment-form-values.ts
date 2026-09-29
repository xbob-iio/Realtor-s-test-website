import type {
  ApartmentStatus,
  City,
  Currency,
  RentalPeriod,
  UtilitiesPayment,
} from '@/generated/prisma/enums';

/**
 * Значения формы квартиры. Отдельный модуль без 'use client': серверные страницы
 * импортируют отсюда данные (из клиентского модуля пришла бы лишь ссылка).
 */
export interface ApartmentFormValues {
  title: string;
  city: City;
  district: string;
  address: string;
  price: number | null;
  currency: Currency;
  rooms: number | null;
  area: number | null;
  floor: number | null;
  totalFloors: number | null;
  description: string;
  furnished: boolean;
  hasAppliances: boolean;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  dogsAllowed: boolean;
  catsAllowed: boolean;
  rentalPeriod: RentalPeriod;
  deposit: number | null;
  utilities: UtilitiesPayment;
  utilitiesNote: string | null;
  status: ApartmentStatus;
  slug: string;
}

export const EMPTY_APARTMENT: ApartmentFormValues = {
  title: '',
  city: 'KYIV',
  district: '',
  address: '',
  price: null,
  currency: 'UAH',
  rooms: null,
  area: null,
  floor: null,
  totalFloors: null,
  description: '',
  furnished: false,
  hasAppliances: false,
  childrenAllowed: false,
  petsAllowed: false,
  dogsAllowed: false,
  catsAllowed: false,
  rentalPeriod: 'MONTHS_6',
  deposit: null,
  utilities: 'SEPARATE',
  utilitiesNote: null,
  status: 'DRAFT',
  slug: '',
};
