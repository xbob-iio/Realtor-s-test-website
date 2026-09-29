import { ArrowUpRight, Clock } from 'lucide-react';
import Link from 'next/link';

import { CookieSettingsButton } from '@/components/cookies/cookie-settings-button';
import { getDictionary } from '@/i18n';
import { buildContactLinks } from '@/lib/contacts';
import type { SiteSettingsData } from '@/server/settings';

import { CHANNEL_ICON, channelLabel } from '../contact/contact-buttons';
import { Logo } from './logo';

interface SiteFooterProps {
  settings: SiteSettingsData;
  hasDemo: boolean;
}

export function SiteFooter({ settings, hasDemo }: SiteFooterProps) {
  const t = getDictionary();
  const links = buildContactLinks(settings);
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t.footer.catalog,
      items: [
        { href: '/kyiv/apartments', label: t.footer.kyivApartments },
        { href: '/dnipro/apartments', label: t.footer.dniproApartments },
        { href: '/apartments?pets=any', label: t.footer.withPets },
        { href: '/apartments?children=1', label: t.footer.withChildren },
      ],
    },
    {
      title: t.footer.company,
      items: [
        { href: '/about', label: t.nav.about },
        { href: '/contacts', label: t.nav.contacts },
        { href: '/kyiv', label: t.nav.kyiv },
        { href: '/dnipro', label: t.nav.dnipro },
      ],
    },
    {
      title: t.footer.documents,
      items: [
        { href: '/privacy-policy', label: t.legal.privacy },
        { href: '/cookie-policy', label: t.legal.cookies },
        { href: '/terms', label: t.legal.terms },
      ],
    },
  ];

  return (
    <footer className="bg-graphite text-white/70">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.3fr_2fr] lg:py-20">
        <div className="max-w-sm space-y-5">
          <Logo siteName={settings.siteName} logoUrl={settings.logoUrl} inverted homeLabel={t.nav.toHome} />
          <p className="text-[15px] leading-relaxed">{settings.companyDescription ?? t.footer.description}</p>
          {settings.socialLinks.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-semibold text-white">{t.footer.social}</p>
              <ul className="flex flex-wrap gap-2">
                {settings.socialLinks.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3.5 py-1.5 text-sm transition-colors hover:border-white/40 hover:text-white"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="mb-4 text-sm font-semibold tracking-wide text-white">{column.title}</p>
              <ul className="space-y-2.5">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[15px] transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <p className="mb-4 text-sm font-semibold tracking-wide text-white">{t.footer.contacts}</p>
            <ul className="space-y-2.5">
              {links.map((link) => {
                const Icon = CHANNEL_ICON[link.channel];
                return (
                  <li key={link.channel}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="inline-flex items-center gap-2.5 text-[15px] transition-colors hover:text-white"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="break-all">{channelLabel(link, t)}</span>
                    </a>
                  </li>
                );
              })}
              {settings.workingHours && (
                <li className="inline-flex items-center gap-2.5 text-[15px]">
                  <Clock className="size-4 shrink-0" />
                  {settings.workingHours}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.legal.companyName ?? settings.siteName}. {t.footer.rights}
          </p>
          <CookieSettingsButton className="self-start text-sm transition-colors hover:text-white sm:self-auto" />
        </div>
        {hasDemo && <div className="container-page pb-6 text-xs text-white/50">{t.footer.demoNotice}</div>}
      </div>
    </footer>
  );
}
