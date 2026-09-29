import 'server-only';

import { cache } from 'react';
import { z } from 'zod';

import type { City } from '@/generated/prisma/enums';
import { safeContactUrl, type ContactSettings } from '@/lib/contacts';
import { prisma } from '@/server/db';

export const DEFAULT_SITE_NAME = 'DOMA RENT';

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteSettingsData extends ContactSettings {
  siteName: string;
  logoUrl: string | null;
  workingHours: string | null;
  defaultCity: City;
  companyDescription: string | null;
  socialLinks: SocialLink[];
  seoTitle: string | null;
  seoDescription: string | null;
  legal: {
    companyName: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
  };
  gaMeasurementId: string | null;
  metaPixelId: string | null;
  cookieConsentVersion: number;
  usdRate: number;
  eurRate: number;
}

const socialLinksSchema = z
  .array(z.object({ label: z.string().max(40), url: z.string().max(300) }))
  .max(10)
  .catch([]);

const DEFAULTS: SiteSettingsData = {
  siteName: DEFAULT_SITE_NAME,
  logoUrl: null,
  phone: null,
  email: null,
  telegramUrl: null,
  viberUrl: null,
  whatsappUrl: null,
  workingHours: null,
  defaultCity: 'KYIV',
  companyDescription: null,
  socialLinks: [],
  seoTitle: null,
  seoDescription: null,
  legal: { companyName: null, address: null, email: null, phone: null },
  gaMeasurementId: null,
  metaPixelId: null,
  cookieConsentVersion: 1,
  usdRate: 41.5,
  eurRate: 48,
};

/** Настройки сайта (одна строка в БД). Кешируются на время запроса. */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!row) return DEFAULTS;

  const socialLinks = socialLinksSchema
    .parse(row.socialLinks)
    .map((link) => ({ label: link.label, url: safeContactUrl(link.url) }))
    .filter((link): link is SocialLink => Boolean(link.url && link.label));

  return {
    siteName: row.siteName || DEFAULT_SITE_NAME,
    logoUrl: row.logoUrl,
    phone: row.phone,
    email: row.email,
    telegramUrl: safeContactUrl(row.telegramUrl),
    viberUrl: safeContactUrl(row.viberUrl),
    whatsappUrl: safeContactUrl(row.whatsappUrl),
    workingHours: row.workingHours,
    defaultCity: row.defaultCity,
    companyDescription: row.companyDescription,
    socialLinks,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    legal: {
      companyName: row.legalCompanyName,
      address: row.legalAddress,
      email: row.legalEmail,
      phone: row.legalPhone,
    },
    gaMeasurementId: row.gaMeasurementId,
    metaPixelId: row.metaPixelId,
    cookieConsentVersion: row.cookieConsentVersion,
    usdRate: row.usdRate,
    eurRate: row.eurRate,
  };
});

export function hasContacts(settings: SiteSettingsData): boolean {
  return Boolean(settings.phone || settings.telegramUrl || settings.whatsappUrl || settings.viberUrl);
}

export function hasLegalDetails(settings: SiteSettingsData): boolean {
  return Boolean(settings.legal.companyName && (settings.legal.email || settings.email));
}
