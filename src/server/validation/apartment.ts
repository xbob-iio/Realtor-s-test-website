import 'server-only';

import { z } from 'zod';

import { isValidDistrict } from '@/config/cities';
import { SLUG_PATTERN, slugify } from '@/lib/slug';

import { checkbox, intField, lineField, numberField, optionalLine, textField } from './common';

export const APARTMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'RENTED', 'ARCHIVED'] as const;
export const CITIES_ENUM = ['KYIV', 'DNIPRO'] as const;
export const CURRENCIES = ['UAH', 'USD', 'EUR'] as const;
export const RENTAL_PERIODS = ['MONTHS_1', 'MONTHS_3', 'MONTHS_6', 'MONTHS_12'] as const;
export const UTILITIES = ['INCLUDED', 'SEPARATE'] as const;

export const apartmentStatusSchema = z.enum(APARTMENT_STATUSES);

export const apartmentInputSchema = z
  .object({
    title: lineField(10, 160),
    city: z.enum(CITIES_ENUM),
    district: z.string().trim().max(64),
    address: lineField(3, 200),
    price: intField(1, 10_000_000),
    currency: z.enum(CURRENCIES),
    rooms: intField(1, 10),
    area: numberField(5, 1000),
    floor: intField(0, 200),
    totalFloors: intField(1, 200),
    description: textField(30, 5000),
    furnished: checkbox,
    hasAppliances: checkbox,
    childrenAllowed: checkbox,
    petsAllowed: checkbox,
    dogsAllowed: checkbox,
    catsAllowed: checkbox,
    rentalPeriod: z.enum(RENTAL_PERIODS),
    depositMode: z.enum(['amount', 'none', 'agreement']),
    deposit: z.string().optional(),
    utilities: z.enum(UTILITIES),
    utilitiesNote: optionalLine(200),
    status: apartmentStatusSchema,
    slug: z
      .string()
      .optional()
      .transform((value) => (value ? slugify(value, 160) : '')),
  })
  .superRefine((data, ctx) => {
    if (!isValidDistrict(data.city, data.district)) {
      ctx.addIssue({ code: 'custom', path: ['district'], message: 'district' });
    }
    if (data.floor > data.totalFloors) {
      ctx.addIssue({ code: 'custom', path: ['floor'], message: 'floorAboveTotal' });
    }
    if (data.depositMode === 'amount') {
      const deposit = intField(1, 10_000_000).safeParse(data.deposit);
      if (!deposit.success) ctx.addIssue({ code: 'custom', path: ['deposit'], message: 'deposit' });
    }
    if (data.slug && (data.slug.length < 3 || !SLUG_PATTERN.test(data.slug))) {
      ctx.addIssue({ code: 'custom', path: ['slug'], message: 'slug' });
    }
  })
  .transform((data) => {
    const { depositMode, deposit, ...rest } = data;
    const dogsAllowed = rest.petsAllowed && rest.dogsAllowed;
    const catsAllowed = rest.petsAllowed && rest.catsAllowed;
    return {
      ...rest,
      area: Math.round(rest.area * 10) / 10,
      // Правила для животных согласованы: собака/кошка возможны только при общем разрешении
      dogsAllowed,
      catsAllowed,
      deposit:
        depositMode === 'none'
          ? 0
          : depositMode === 'agreement'
            ? null
            : Number(String(deposit).replace(/\s/g, '')),
    };
  });

export type ApartmentInput = z.infer<typeof apartmentInputSchema>;
