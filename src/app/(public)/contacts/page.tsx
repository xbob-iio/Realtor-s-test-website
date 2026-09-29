import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ContactButtons } from '@/components/contact/contact-buttons';
import { LeadForm } from '@/components/contact/lead-form';
import { JsonLd } from '@/components/seo/json-ld';
import { getDictionary } from '@/i18n';
import { phoneToHref } from '@/i18n/format';
import { buildContactLinks } from '@/lib/contacts';
import { createFormToken } from '@/server/security/form-token';
import { breadcrumbJsonLd, buildMetadata, organizationJsonLd } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();
  const settings = await getSiteSettings();
  return buildMetadata({
    title: t.contacts.metaTitle,
    description: t.contacts.metaDescription,
    path: '/contacts',
    siteName: settings.siteName,
  });
}

export default async function ContactsPage() {
  const t = getDictionary();
  const settings = await getSiteSettings();
  const messengerLinks = buildContactLinks(settings).filter(
    (link) => link.channel !== 'phone' && link.channel !== 'email',
  );
  const breadcrumbs = [
    { name: t.common.home, path: '/' },
    { name: t.contacts.metaTitle, path: '/contacts' },
  ];

  const details = [
    settings.phone && {
      icon: Phone,
      label: t.contacts.phone,
      value: settings.phone,
      href: phoneToHref(settings.phone),
    },
    settings.email && {
      icon: Mail,
      label: t.contacts.email,
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    settings.workingHours && { icon: Clock, label: t.contacts.workingHours, value: settings.workingHours },
    settings.legal.address && { icon: MapPin, label: t.contacts.address, value: settings.legal.address },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), breadcrumbJsonLd(breadcrumbs)]} />
      <div className="container-page py-10 lg:py-16">
        <Breadcrumbs items={breadcrumbs} label={t.common.breadcrumbs} />

        <header className="mt-6 max-w-2xl animate-fade-up space-y-4">
          <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">{t.contacts.eyebrow}</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t.contacts.title}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{t.contacts.subtitle}</p>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
          <div className="space-y-6">
            {details.length > 0 && (
              <ul className="grid gap-3">
                {details.map(({ icon: Icon, label, value, href }) => (
                  <li key={label}>
                    <div className="flex items-center gap-4 rounded-3xl border bg-background p-5">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        {href ? (
                          <a
                            href={href}
                            className="text-lg font-semibold break-words transition-colors hover:text-brand"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="text-lg font-semibold break-words">{value}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {messengerLinks.length > 0 && (
              <div className="rounded-3xl border bg-surface p-6">
                <p className="mb-4 font-semibold">{t.contacts.messengers}</p>
                <ContactButtons links={messengerLinks} t={t} />
              </div>
            )}

            {details.length === 0 && messengerLinks.length === 0 && (
              <p className="rounded-3xl border bg-surface p-6 text-muted-foreground">
                {t.contacts.noContacts}
              </p>
            )}
          </div>

          <section
            id="lead-form"
            aria-labelledby="lead-form-title"
            className="scroll-mt-28 rounded-[2rem] border bg-background p-6 shadow-card sm:p-9"
          >
            <h2 id="lead-form-title" className="text-2xl font-bold tracking-tight">
              {t.contacts.formTitle}
            </h2>
            <p className="mt-2 mb-7 text-muted-foreground">{t.contacts.formSubtitle}</p>
            <LeadForm formToken={createFormToken()} />
          </section>
        </div>
      </div>
    </>
  );
}
