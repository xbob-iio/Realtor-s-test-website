import type { MetadataRoute } from 'next';

import { CITIES } from '@/config/cities';
import { LEGAL_UPDATED_AT } from '@/content/legal/common';
import { getSitemapApartments } from '@/server/queries/apartments';
import { absoluteUrl } from '@/server/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apartments = await getSitemapApartments();
  const latestUpdate = apartments.reduce<Date>(
    (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
    LEGAL_UPDATED_AT,
  );

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: latestUpdate, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/apartments'), lastModified: latestUpdate, changeFrequency: 'daily', priority: 0.9 },
    ...CITIES.flatMap((city) => [
      {
        url: absoluteUrl(`/${city.slug}`),
        lastModified: latestUpdate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: absoluteUrl(`/${city.slug}/apartments`),
        lastModified: latestUpdate,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
    ]),
    { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contacts'), changeFrequency: 'monthly', priority: 0.6 },
    {
      url: absoluteUrl('/privacy-policy'),
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: absoluteUrl('/cookie-policy'),
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    { url: absoluteUrl('/terms'), lastModified: LEGAL_UPDATED_AT, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const apartmentPages: MetadataRoute.Sitemap = apartments.map((apartment) => ({
    url: absoluteUrl(`/apartments/${apartment.slug}`),
    lastModified: apartment.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
    images: apartment.images.map((image) => absoluteUrl(image.url)),
  }));

  return [...staticPages, ...apartmentPages];
}
