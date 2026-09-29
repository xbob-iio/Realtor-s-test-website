import { cookies } from 'next/headers';

import { CookieConsentProvider } from '@/components/cookies/consent-provider';
import { ConsentScripts } from '@/components/cookies/consent-scripts';
import { CookieBanner } from '@/components/cookies/cookie-banner';
import { MOBILE_BAR_SPACER } from '@/components/layout/constants';
import { MobileContactBar } from '@/components/layout/mobile-contact-bar';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { getDictionary } from '@/i18n';
import { CONSENT_COOKIE, parseConsent } from '@/lib/consent';
import { buildContactLinks } from '@/lib/contacts';
import { cn } from '@/lib/utils';
import { hasPublishedDemo } from '@/server/queries/apartments';
import { createFormToken } from '@/server/security/form-token';
import { getSiteSettings } from '@/server/settings';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = getDictionary();
  const [settings, cookieStore, hasDemo] = await Promise.all([
    getSiteSettings(),
    cookies(),
    hasPublishedDemo(),
  ]);
  const consent = parseConsent(cookieStore.get(CONSENT_COOKIE)?.value, settings.cookieConsentVersion);
  const contactLinks = buildContactLinks(settings);
  const formToken = createFormToken();

  return (
    <CookieConsentProvider initialConsent={consent} version={settings.cookieConsentVersion}>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t.common.skipToContent}
      </a>
      <div className={cn('flex min-h-dvh flex-col', contactLinks.length > 0 && MOBILE_BAR_SPACER)}>
        <SiteHeader settings={settings} formToken={formToken} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} hasDemo={hasDemo} />
      </div>
      <MobileContactBar links={contactLinks} />
      <CookieBanner />
      <ConsentScripts gaId={settings.gaMeasurementId} pixelId={settings.metaPixelId} />
    </CookieConsentProvider>
  );
}
