import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';
import { buildLegalContext, LEGAL_UPDATED_AT } from '@/content/legal/common';
import { cookieSections } from '@/content/legal/cookies';
import { getDictionary } from '@/i18n';
import { getEnv } from '@/server/env';
import { buildMetadata } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();
  const settings = await getSiteSettings();
  return buildMetadata({
    title: t.legal.cookies,
    description: t.legal.cookiesMeta,
    path: '/cookie-policy',
    siteName: settings.siteName,
  });
}

export default async function CookiePolicyPage() {
  const t = getDictionary();
  const settings = await getSiteSettings();
  const context = buildLegalContext(settings, getEnv().SITE_URL);
  return (
    <LegalPage
      t={t}
      title={t.legal.cookies}
      path="/cookie-policy"
      updatedAt={LEGAL_UPDATED_AT}
      sections={cookieSections(context)}
      tocLabel={t.legal.cookies}
    />
  );
}
