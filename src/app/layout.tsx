import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { headers } from 'next/headers';

import { MotionProvider } from '@/components/providers/motion-provider';
import { Toaster } from '@/components/ui/sonner';
import { getDictionary, getLocale } from '@/i18n';
import { I18nProvider } from '@/i18n/client';
import { toClientDictionary } from '@/i18n/client-dictionary';
import { htmlLang, ogLocale } from '@/i18n/config';
import { getEnv } from '@/server/env';
import { DEFAULT_SITE_NAME, getSiteSettings } from '@/server/settings';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();
  let siteName = DEFAULT_SITE_NAME;
  let title: string = t.meta.defaultTitle;
  let description: string = t.meta.defaultDescription;
  try {
    const settings = await getSiteSettings();
    siteName = settings.siteName;
    title = settings.seoTitle ?? title;
    description = settings.seoDescription ?? description;
  } catch {
    // База недоступна — страница ошибки всё равно получит корректные метаданные
  }

  return {
    metadataBase: new URL(getEnv().SITE_URL),
    title: { default: `${title} | ${siteName}`, template: `%s | ${siteName}` },
    description,
    applicationName: siteName,
    openGraph: {
      type: 'website',
      siteName,
      locale: ogLocale.ru,
      title: `${title} | ${siteName}`,
      description,
      images: [{ url: '/og', width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: { card: 'summary_large_image' },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Чтение заголовков делает рендеринг динамическим: nonce из CSP уникален для каждого ответа
  await headers();
  const locale = getLocale();

  return (
    <html lang={htmlLang[locale]} className={manrope.variable}>
      <body className="min-h-dvh bg-background font-sans">
        <I18nProvider locale={locale} dictionary={toClientDictionary(getDictionary(locale))}>
          <MotionProvider>
            {children}
            <Toaster position="top-center" />
          </MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
