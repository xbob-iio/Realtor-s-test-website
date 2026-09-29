import Link from 'next/link';

import type { SiteSettingsData } from '@/server/settings';

/** Дата текущей редакции юридических документов */
export const LEGAL_UPDATED_AT = new Date('2026-09-28T00:00:00+03:00');

export interface LegalContext {
  siteName: string;
  siteUrl: string;
  /** Оператор данных: реквизиты из настроек или нейтральная формулировка */
  operator: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

/**
 * Реквизиты берутся только из настроек сайта (/admin/settings).
 * Если владелец их не заполнил, текст остаётся корректным без выдуманных данных.
 */
export function buildLegalContext(settings: SiteSettingsData, siteUrl: string): LegalContext {
  return {
    siteName: settings.siteName,
    siteUrl,
    operator: settings.legal.companyName ?? `владелец сайта «${settings.siteName}»`,
    email: settings.legal.email ?? settings.email,
    phone: settings.legal.phone ?? settings.phone,
    address: settings.legal.address,
  };
}

export function ContactLine({ context }: { context: LegalContext }) {
  return (
    <ul>
      <li>
        <strong>Оператор:</strong> {context.operator}
      </li>
      {context.address && (
        <li>
          <strong>Адрес:</strong> {context.address}
        </li>
      )}
      {context.email && (
        <li>
          <strong>Email:</strong> <a href={`mailto:${context.email}`}>{context.email}</a>
        </li>
      )}
      {context.phone && (
        <li>
          <strong>Телефон:</strong> {context.phone}
        </li>
      )}
      {!context.email && !context.phone && (
        <li>
          Для обращений используйте <Link href="/contacts">форму на странице «Контакты»</Link>.
        </li>
      )}
    </ul>
  );
}
