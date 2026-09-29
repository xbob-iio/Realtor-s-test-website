import type { MetadataRoute } from 'next';

import { getDictionary } from '@/i18n';
import { getSiteSettings } from '@/server/settings';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = getDictionary();
  const settings = await getSiteSettings();
  return {
    name: settings.siteName,
    short_name: settings.siteName,
    description: settings.seoDescription ?? t.meta.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'ru',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
