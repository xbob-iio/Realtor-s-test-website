import 'server-only';

import type { Metadata } from 'next';

import { CITIES, getCityByCode } from '@/config/cities';
import { getDictionary } from '@/i18n';
import { ogLocale } from '@/i18n/config';
import type { ApartmentDetails } from '@/lib/catalog/types';
import { getEnv } from '@/server/env';
import type { SiteSettingsData } from '@/server/settings';

export function absoluteUrl(path: string): string {
  return new URL(path, `${getEnv().SITE_URL}/`).toString();
}

interface MetadataInput {
  title: string;
  description: string;
  path: string;
  siteName: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  noindex?: boolean;
  type?: 'website' | 'article';
  /** true — title без шаблона «| Название сайта» */
  absoluteTitle?: boolean;
}

/** Метаданные страницы: title, description, canonical, Open Graph, Twitter */
export function buildMetadata(input: MetadataInput): Metadata {
  const t = getDictionary();
  const fullTitle = input.absoluteTitle ? input.title : `${input.title} | ${input.siteName}`;
  const images = input.images?.length
    ? input.images
    : [{ url: '/og', width: 1200, height: 630, alt: t.meta.ogAlt }];

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: input.type ?? 'website',
      title: fullTitle,
      description: input.description,
      url: input.path,
      siteName: input.siteName,
      locale: ogLocale.ru,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: input.description,
      images: images.map((image) => image.url),
    },
    robots: input.noindex ? { index: false, follow: true } : undefined,
  };
}

export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 100 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

// ───────────────────────────── JSON-LD ─────────────────────────────

type JsonLdObject = Record<string, unknown>;

export function organizationJsonLd(settings: SiteSettingsData): JsonLdObject {
  const t = getDictionary();
  const siteUrl = getEnv().SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${siteUrl}/#organization`,
    name: settings.siteName,
    url: siteUrl,
    image: absoluteUrl('/og'),
    ...(settings.logoUrl ? { logo: absoluteUrl(settings.logoUrl) } : {}),
    ...(settings.companyDescription ? { description: settings.companyDescription } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.legal.address
      ? { address: { '@type': 'PostalAddress', streetAddress: settings.legal.address, addressCountry: 'UA' } }
      : {}),
    areaServed: CITIES.map((city) => ({ '@type': 'City', name: t.cities[city.code].name })),
    ...(settings.socialLinks.length ? { sameAs: settings.socialLinks.map((link) => link.url) } : {}),
  };
}

export function websiteJsonLd(settings: SiteSettingsData): JsonLdObject {
  const siteUrl = getEnv().SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: settings.siteName,
    url: siteUrl,
    inLanguage: 'ru',
    publisher: { '@id': `${siteUrl}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function itemListJsonLd(items: { slug: string; title: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/apartments/${item.slug}`),
      name: item.title,
    })),
  };
}

export function apartmentJsonLd(apartment: ApartmentDetails, settings: SiteSettingsData): JsonLdObject {
  const t = getDictionary();
  const city = getCityByCode(apartment.city);
  const url = absoluteUrl(`/apartments/${apartment.slug}`);
  const districtName = t.districts[apartment.city][apartment.district] ?? apartment.district;

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${url}#listing`,
    url,
    name: apartment.title,
    description: truncate(apartment.description, 500),
    ...(apartment.publishedAt ? { datePosted: apartment.publishedAt.toISOString() } : {}),
    dateModified: apartment.updatedAt.toISOString(),
    image: apartment.images.slice(0, 8).map((image) => absoluteUrl(image.url)),
    offers: {
      '@type': 'Offer',
      price: apartment.price,
      priceCurrency: apartment.currency,
      availability: 'https://schema.org/InStock',
      businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: apartment.price,
        priceCurrency: apartment.currency,
        unitCode: 'MON',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
      },
      seller: { '@id': `${getEnv().SITE_URL}/#organization`, name: settings.siteName },
    },
    about: {
      '@type': 'Apartment',
      name: apartment.title,
      numberOfRooms: apartment.rooms,
      floorLevel: String(apartment.floor),
      floorSize: { '@type': 'QuantitativeValue', value: apartment.area, unitCode: 'MTK' },
      petsAllowed: apartment.petsAllowed,
      address: {
        '@type': 'PostalAddress',
        streetAddress: apartment.address,
        addressLocality: t.cities[apartment.city].name,
        addressRegion: districtName,
        addressCountry: 'UA',
      },
      geo: { '@type': 'GeoCoordinates', latitude: city.geo.latitude, longitude: city.geo.longitude },
    },
  };
}

/** Безопасная сериализация: «</script>» и спецсимволы не разорвут тег */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
