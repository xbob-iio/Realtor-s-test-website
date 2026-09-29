import 'server-only';

import { z } from 'zod';

import { CITIES_ENUM } from './apartment';
import { cleanLine, cleanText, lineField, numberField, optionalLine } from './common';

const empty = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(empty, schema.optional()).transform((value) => value ?? null);
}

const phone = z
  .string()
  .transform(cleanLine)
  .refine((value) => /^\+?[\d\s()-]{10,20}$/.test(value) && value.replace(/\D/g, '').length >= 10, 'phone');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: 'email' }));

function urlWith(check: (url: URL) => boolean, message: string) {
  return z
    .string()
    .trim()
    .max(300)
    .refine((value) => {
      try {
        return check(new URL(value));
      } catch {
        return false;
      }
    }, message);
}

const telegramUrl = urlWith(
  (url) =>
    (url.protocol === 'https:' && ['t.me', 'telegram.me'].includes(url.hostname)) || url.protocol === 'tg:',
  'telegram',
);
const viberUrl = urlWith(
  (url) => url.protocol === 'viber:' || (url.protocol === 'https:' && url.hostname.endsWith('viber.com')),
  'viber',
);
const whatsappUrl = urlWith(
  (url) => url.protocol === 'https:' && ['wa.me', 'api.whatsapp.com'].includes(url.hostname),
  'whatsapp',
);
const httpsUrl = urlWith((url) => url.protocol === 'https:', 'url');

const socialLinks = z
  .string()
  .max(5000)
  .transform((value, ctx) => {
    try {
      return JSON.parse(value || '[]') as unknown;
    } catch {
      ctx.addIssue({ code: 'custom', message: 'url' });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(
        z.object({ label: z.string().transform(cleanLine).pipe(z.string().min(1).max(40)), url: httpsUrl }),
      )
      .max(8),
  );

export const settingsInputSchema = z.object({
  siteName: lineField(2, 60),
  companyDescription: optional(z.string().transform(cleanText).pipe(z.string().max(1500, 'text'))),
  defaultCity: z.enum(CITIES_ENUM),
  phone: optional(phone),
  email: optional(email),
  telegramUrl: optional(telegramUrl),
  viberUrl: optional(viberUrl),
  whatsappUrl: optional(whatsappUrl),
  workingHours: optionalLine(120),
  socialLinks,
  seoTitle: optionalLine(120),
  seoDescription: optionalLine(300),
  legalCompanyName: optionalLine(200),
  legalAddress: optionalLine(300),
  legalEmail: optional(email),
  legalPhone: optional(phone),
  gaMeasurementId: optional(
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^G-[A-Z0-9]{4,15}$/, 'ga'),
  ),
  metaPixelId: optional(
    z
      .string()
      .trim()
      .regex(/^\d{5,20}$/, 'pixel'),
  ),
  usdRate: numberField(1, 1000),
  eurRate: numberField(1, 1000),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
