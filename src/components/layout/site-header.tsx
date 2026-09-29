import { getDictionary } from '@/i18n';
import { buildContactLinks } from '@/lib/contacts';
import type { SiteSettingsData } from '@/server/settings';

import { HeaderClient } from './header-client';
import { Logo } from './logo';

export function SiteHeader({ settings, formToken }: { settings: SiteSettingsData; formToken: string }) {
  const t = getDictionary();
  return (
    <HeaderClient
      logo={<Logo siteName={settings.siteName} logoUrl={settings.logoUrl} homeLabel={t.nav.toHome} />}
      links={buildContactLinks(settings)}
      phone={settings.phone}
      formToken={formToken}
    />
  );
}
