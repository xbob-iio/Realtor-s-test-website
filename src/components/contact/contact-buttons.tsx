import { Mail, Phone } from 'lucide-react';

import { TelegramIcon, ViberIcon, WhatsAppIcon } from '@/components/icons/brand-icons';
import type { ClientDictionary as Dictionary } from '@/i18n/client-dictionary';
import type { ContactChannel, ContactLink } from '@/lib/contacts';
import { cn } from '@/lib/utils';

export const CHANNEL_ICON: Record<ContactChannel, React.ComponentType<{ className?: string }>> = {
  telegram: TelegramIcon,
  whatsapp: WhatsAppIcon,
  viber: ViberIcon,
  phone: Phone,
  email: Mail,
};

/** Фирменные цвета мессенджеров — только для иконок */
export const CHANNEL_COLOR: Record<ContactChannel, string> = {
  telegram: 'text-[#229ED9]',
  whatsapp: 'text-[#1FAF53]',
  viber: 'text-[#7360F2]',
  phone: 'text-foreground',
  email: 'text-foreground',
};

export function channelLabel(link: ContactLink, t: Dictionary): string {
  switch (link.channel) {
    case 'telegram':
      return t.contact.telegram;
    case 'whatsapp':
      return t.contact.whatsapp;
    case 'viber':
      return t.contact.viber;
    case 'phone':
      return link.value ?? t.contact.phone;
    case 'email':
      return link.value ?? t.contact.email;
  }
}

function channelAriaLabel(link: ContactLink, t: Dictionary): string {
  switch (link.channel) {
    case 'telegram':
      return t.contact.writeTelegram;
    case 'whatsapp':
      return t.contact.writeWhatsapp;
    case 'viber':
      return t.contact.writeViber;
    case 'phone':
      return t.contact.callPhone.replace('{phone}', link.value ?? '');
    case 'email':
      return t.contact.sendEmail.replace('{email}', link.value ?? '');
  }
}

interface ContactButtonsProps {
  links: ContactLink[];
  t: Dictionary;
  className?: string;
  /** grid — плитки с подписью, row — компактные кнопки в ряд */
  variant?: 'grid' | 'row';
}

export function ContactButtons({ links, t, className, variant = 'grid' }: ContactButtonsProps) {
  if (!links.length) return null;

  return (
    <ul
      className={cn(
        variant === 'grid' ? 'grid grid-cols-2 gap-2.5 sm:grid-cols-3' : 'flex flex-wrap gap-2',
        className,
      )}
    >
      {links.map((link) => {
        const Icon = CHANNEL_ICON[link.channel];
        return (
          <li
            key={link.channel}
            className={cn(variant === 'grid' && link.channel === 'email' && 'col-span-2 sm:col-span-1')}
          >
            <a
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              aria-label={channelAriaLabel(link, t)}
              className={cn(
                'group flex items-center gap-3 rounded-2xl border border-border bg-background font-semibold transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-card active:translate-y-0',
                variant === 'grid' ? 'h-14 px-4 text-[15px]' : 'h-11 px-4 text-sm',
              )}
            >
              <Icon
                className={cn(
                  'size-5 shrink-0 transition-transform group-hover:scale-110',
                  CHANNEL_COLOR[link.channel],
                )}
              />
              <span className="truncate">{channelLabel(link, t)}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
