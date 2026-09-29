import { phoneToHref } from '@/i18n/format';

export type ContactChannel = 'telegram' | 'viber' | 'whatsapp' | 'phone' | 'email';

export interface ContactSettings {
  telegramUrl: string | null;
  viberUrl: string | null;
  whatsappUrl: string | null;
  phone: string | null;
  email: string | null;
}

export interface ContactLink {
  channel: ContactChannel;
  href: string;
  /** Отображаемое значение: номер телефона, email */
  value?: string;
  external: boolean;
}

const SAFE_PROTOCOLS = new Set(['https:', 'http:', 'tg:', 'viber:']);

/** Только безопасные схемы — javascript:, data: и т. п. отбрасываются */
export function safeContactUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function withText(url: string, message: string | undefined, hosts: string[]): string {
  if (!message) return url;
  try {
    const parsed = new URL(url);
    if (!hosts.includes(parsed.hostname)) return url;
    parsed.searchParams.set('text', message);
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Ссылки для связи. Для Telegram и WhatsApp можно передать готовый текст
 * сообщения (например, со ссылкой на квартиру).
 */
export function buildContactLinks(settings: ContactSettings, message?: string): ContactLink[] {
  const links: ContactLink[] = [];

  const telegram = safeContactUrl(settings.telegramUrl);
  if (telegram) {
    links.push({ channel: 'telegram', href: withText(telegram, message, ['t.me']), external: true });
  }

  const whatsapp = safeContactUrl(settings.whatsappUrl);
  if (whatsapp) {
    links.push({
      channel: 'whatsapp',
      href: withText(whatsapp, message, ['wa.me', 'api.whatsapp.com']),
      external: true,
    });
  }

  const viber = safeContactUrl(settings.viberUrl);
  if (viber) links.push({ channel: 'viber', href: viber, external: true });

  if (settings.phone) {
    links.push({
      channel: 'phone',
      href: phoneToHref(settings.phone),
      value: settings.phone,
      external: false,
    });
  }

  if (settings.email) {
    const body = message ? `?body=${encodeURIComponent(message)}` : '';
    links.push({
      channel: 'email',
      href: `mailto:${settings.email}${body}`,
      value: settings.email,
      external: false,
    });
  }

  return links;
}
