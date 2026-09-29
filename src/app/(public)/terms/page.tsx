import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';
import { buildLegalContext, LEGAL_UPDATED_AT } from '@/content/legal/common';
import { termsSections } from '@/content/legal/terms';
import { getDictionary } from '@/i18n';
import { getEnv } from '@/server/env';
import { buildMetadata } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();
  const settings = await getSiteSettings();
  return buildMetadata({
    title: t.legal.terms,
    description: t.legal.termsMeta,
    path: '/terms',
    siteName: settings.siteName,
  });
}

export default async function TermsPage() {
  const t = getDictionary();
  const settings = await getSiteSettings();
  const context = buildLegalContext(settings, getEnv().SITE_URL);
  return (
    <LegalPage
      t={t}
      title={t.legal.terms}
      path="/terms"
      updatedAt={LEGAL_UPDATED_AT}
      sections={termsSections(context)}
      tocLabel={t.legal.terms}
    />
  );
}
