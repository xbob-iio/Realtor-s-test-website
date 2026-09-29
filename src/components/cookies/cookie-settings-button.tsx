'use client';

import { useDictionary } from '@/i18n/client';

import { useOptionalConsent } from './consent-provider';

export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useDictionary();
  const consent = useOptionalConsent();
  if (!consent) return null;

  return (
    <button type="button" onClick={() => consent.setPreferencesOpen(true)} className={className}>
      {t.footer.cookieSettings}
    </button>
  );
}
