'use client';

import { usePathname } from 'next/navigation';

import { CHANNEL_COLOR, CHANNEL_ICON } from '@/components/contact/contact-buttons';
import { useDictionary } from '@/i18n/client';
import type { ContactChannel, ContactLink } from '@/lib/contacts';
import { cn } from '@/lib/utils';

/** Порядок и набор кнопок: Telegram, WhatsApp, звонок (Viber — если чего-то нет) */
const PRIORITY: ContactChannel[] = ['telegram', 'whatsapp', 'phone', 'viber'];

interface MobileContactBarProps {
  links: ContactLink[];
  /** На странице квартиры панель рендерится самой страницей — с текстом про объект */
  scope?: 'global' | 'page';
}

export function MobileContactBar({ links, scope = 'global' }: MobileContactBarProps) {
  const t = useDictionary();
  const pathname = usePathname();

  const isApartmentPage = /^\/apartments\/[^/]+$/.test(pathname);
  if (scope === 'global' && isApartmentPage) return null;

  const items = PRIORITY.map((channel) => links.find((link) => link.channel === channel))
    .filter((link): link is ContactLink => Boolean(link))
    .slice(0, 3);
  if (!items.length) return null;

  const label = (channel: ContactChannel) =>
    channel === 'phone'
      ? t.contact.phone
      : channel === 'telegram'
        ? t.contact.telegram
        : channel === 'whatsapp'
          ? t.contact.whatsapp
          : t.contact.viber;

  return (
    <nav
      aria-label={t.contact.mobileBar}
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="container-page grid auto-cols-fr grid-flow-col gap-2 py-2.5">
        {items.map((link) => {
          const Icon = CHANNEL_ICON[link.channel];
          const primary = link.channel === 'phone';
          return (
            <li key={link.channel}>
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={cn(
                  'flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-transform active:scale-[0.97]',
                  primary ? 'bg-primary text-primary-foreground' : 'border border-border bg-background',
                )}
              >
                <Icon className={cn('size-5', !primary && CHANNEL_COLOR[link.channel])} />
                <span>{label(link.channel)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
