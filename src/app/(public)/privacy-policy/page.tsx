import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/legal-page';
import { buildLegalContext, LEGAL_UPDATED_AT } from '@/content/legal/common';
import { privacySections } from '@/content/legal/privacy';
import { getDictionary } from '@/i18n';
import { getEnv } from '@/server/env';
import { buildMetadata } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();
  const settings = await getSiteSettings();
  return buildMetadata({
    title: t.legal.privacy,
    description: t.legal.privacyMeta,
    path: '/privacy-policy',
    siteName: settings.siteName,
  });
}

export default async function PrivacyPolicyPage() {
  const t = getDictionary();
  const settings = await getSiteSettings();
  const context = buildLegalContext(settings, getEnv().SITE_URL);
  return (
    <LegalPage
      t={t}
      title={t.legal.privacy}
      path="/privacy-policy"
      updatedAt={LEGAL_UPDATED_AT}
      sections={privacySections(context)}
      tocLabel={t.legal.privacy}
    />
  );
}
