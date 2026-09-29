import 'server-only';

import { z } from 'zod';

import { cleanText, lineField } from './common';

export const MESSENGERS = ['TELEGRAM', 'VIBER', 'WHATSAPP', 'PHONE'] as const;
export const LEAD_STATUSES = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as const;

/** Телефон: допускаем пробелы, скобки, дефисы; храним в виде +380XXXXXXXXX */
export const phoneSchema = z
  .string()
  .max(40)
  .transform((value) => value.replace(/[^\d+]/g, ''))
  .pipe(z.string().regex(/^\+?\d{10,15}$/))
  .transform((digits) => {
    const plain = digits.replace(/^\+/, '');
    if (plain.length === 10 && plain.startsWith('0')) return `+38${plain}`;
    return `+${plain}`;
  });

export const leadInputSchema = z.object({
  name: lineField(2, 80),
  phone: phoneSchema,
  messenger: z
    .enum(MESSENGERS)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  message: z
    .string()
    .max(2000)
    .optional()
    .transform((value) => (value ? cleanText(value) : ''))
    .pipe(z.string().max(1000))
    .transform((value) => value || null),
  consent: z.literal('on'),
  apartmentId: z
    .string()
    .regex(/^[a-z0-9]{10,40}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  source: z
    .string()
    .max(300)
    .optional()
    .transform((value) => (value && value.startsWith('/') && !value.startsWith('//') ? value : null)),
});

export const leadStatusSchema = z.enum(LEAD_STATUSES);
