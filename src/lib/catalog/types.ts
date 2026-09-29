import type { City, Currency, RentalPeriod, UtilitiesPayment } from '@/generated/prisma/enums';

export interface ImageData {
  url: string;
  alt: string | null;
  width: number;
  height: number;
  blurDataUrl: string | null;
}

/** Данные для карточки квартиры в каталоге */
export interface ApartmentCardData {
  id: string;
  slug: string;
  title: string;
  city: City;
  district: string;
  price: number;
  currency: Currency;
  priceUah: number;
  rooms: number;
  area: number;
  floor: number;
  totalFloors: number;
  excerpt: string;
  furnished: boolean;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  dogsAllowed: boolean;
  catsAllowed: boolean;
  isNew: boolean;
  isDemo: boolean;
  image: ImageData | null;
}

export interface ApartmentImageData extends ImageData {
  id: string;
}

/** Полные данные для страницы квартиры */
export interface ApartmentDetails extends Omit<ApartmentCardData, 'image' | 'excerpt'> {
  address: string;
  description: string;
  hasAppliances: boolean;
  rentalPeriod: RentalPeriod;
  deposit: number | null;
  utilities: UtilitiesPayment;
  utilitiesNote: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  images: ApartmentImageData[];
}
