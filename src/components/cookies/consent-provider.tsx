'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { CONSENT_COOKIE, CONSENT_MAX_AGE_SECONDS, serializeConsent, type ConsentState } from '@/lib/consent';

interface ConsentContextValue {
  consent: ConsentState | null;
  /** Баннер показан, пока посетитель не сделал выбор */
  needsDecision: boolean;
  preferencesOpen: boolean;
  setPreferencesOpen: (open: boolean) => void;
  acceptAll: () => void;
  acceptNecessary: () => void;
  save: (choice: Pick<ConsentState, 'functional' | 'analytics' | 'marketing'>) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function writeCookie(consent: ConsentState) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serializeConsent(consent))}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

/** Удаляем cookies аналитики/рекламы, если согласие отозвано */
function removeTrackingCookies(consent: ConsentState) {
  const names = document.cookie.split(';').map((item) => item.split('=')[0]?.trim() ?? '');
  const toRemove = names.filter(
    (name) =>
      (!consent.analytics && (name === '_ga' || name.startsWith('_ga_') || name === '_gid')) ||
      (!consent.marketing && (name === '_fbp' || name === '_fbc')),
  );
  const host = window.location.hostname;
  const domains = ['', `; Domain=${host}`, `; Domain=.${host.replace(/^www\./, '')}`];
  for (const name of toRemove) {
    for (const domain of domains) {
      document.cookie = `${name}=; Path=/; Max-Age=0${domain}`;
    }
  }
}

export function CookieConsentProvider({
  initialConsent,
  version,
  children,
}: {
  initialConsent: ConsentState | null;
  version: number;
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState<ConsentState | null>(initialConsent);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const save = useCallback(
    (choice: Pick<ConsentState, 'functional' | 'analytics' | 'marketing'>) => {
      const next: ConsentState = { version, ...choice, timestamp: Math.floor(Date.now() / 1000) };
      writeCookie(next);
      removeTrackingCookies(next);
      if (!next.functional) {
        try {
          window.localStorage.removeItem('recently-viewed');
        } catch {
          // хранилище недоступно — удалять нечего
        }
      }
      setConsent(next);
      setPreferencesOpen(false);
    },
    [version],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      needsDecision: consent === null,
      preferencesOpen,
      setPreferencesOpen,
      acceptAll: () => save({ functional: true, analytics: true, marketing: true }),
      acceptNecessary: () => save({ functional: false, analytics: false, marketing: false }),
      save,
    }),
    [consent, preferencesOpen, save],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent must be used inside <CookieConsentProvider>');
  return context;
}

/** Безопасная версия для компонентов, которые могут оказаться вне провайдера */
export function useOptionalConsent(): ConsentContextValue | null {
  return useContext(ConsentContext);
}
