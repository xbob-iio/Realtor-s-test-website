/**
 * Согласие на cookies. Хранится в cookie «cookie_consent» (категория «необходимые»),
 * читается и на сервере (без мигания баннера), и в браузере.
 */
export const CONSENT_COOKIE = 'cookie_consent';
/** 180 дней — затем согласие запрашивается повторно */
export const CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';
export const OPTIONAL_CATEGORIES = ['functional', 'analytics', 'marketing'] as const;

export interface ConsentState {
  version: number;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  /** Время согласия, unix seconds */
  timestamp: number;
}

export function serializeConsent(consent: ConsentState): string {
  const payload = [
    consent.version,
    consent.functional ? 1 : 0,
    consent.analytics ? 1 : 0,
    consent.marketing ? 1 : 0,
    consent.timestamp,
  ].join('.');
  return `v1.${payload}`;
}

/** Некорректное или устаревшее (другая версия политики) значение = согласия нет */
export function parseConsent(raw: string | undefined | null, currentVersion: number): ConsentState | null {
  if (!raw) return null;
  const parts = decodeURIComponent(raw).split('.');
  if (parts.length !== 6 || parts[0] !== 'v1') return null;
  const [, version, functional, analytics, marketing, timestamp] = parts.map((part) => Number(part));
  if (!Number.isInteger(version) || version !== currentVersion) return null;
  if (!Number.isInteger(timestamp)) return null;
  return {
    version: version!,
    functional: functional === 1,
    analytics: analytics === 1,
    marketing: marketing === 1,
    timestamp: timestamp!,
  };
}
