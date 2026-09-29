import { ArrowRight, Eye, Handshake, Timer } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { SectionHeading } from '@/components/common/section-heading';
import { CtaSection } from '@/components/home/cta-section';
import { HowItWorks } from '@/components/home/home-sections';
import { Reveal } from '@/components/motion/reveal';
import { JsonLd } from '@/components/seo/json-ld';
import { CITIES } from '@/config/cities';
import { getDictionary } from '@/i18n';
import { fill, plural } from '@/i18n/format';
import { buildContactLinks } from '@/lib/contacts';
import { getCityStats } from '@/server/queries/apartments';
import { createFormToken } from '@/server/security/form-token';
import { breadcrumbJsonLd, buildMetadata, organizationJsonLd } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

const VALUE_ICONS = [Eye, Handshake, Timer];

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();
  const settings = await getSiteSettings();
  return buildMetadata({
    title: t.about.metaTitle,
    description: t.about.metaDescription,
    path: '/about',
    siteName: settings.siteName,
  });
}

export default async function AboutPage() {
  const t = getDictionary();
  const [settings, stats] = await Promise.all([getSiteSettings(), getCityStats()]);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(settings),
          breadcrumbJsonLd([
            { name: t.common.home, path: '/' },
            { name: t.about.metaTitle, path: '/about' },
          ]),
        ]}
      />

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-[34rem] rounded-full bg-brand-soft blur-3xl"
        />
        <div className="relative container-page py-14 lg:py-24">
          <div className="max-w-3xl animate-fade-up space-y-6">
            <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">{t.about.eyebrow}</p>
            <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl">
              {t.about.title}
            </h1>
            <p className="text-lg leading-relaxed whitespace-pre-line text-muted-foreground sm:text-xl">
              {settings.companyDescription ?? t.about.fallbackDescription}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="values-title" className="container-page pb-16 lg:pb-24">
        <SectionHeading id="values-title" title={t.about.valuesTitle} />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {t.about.values.map((value, index) => {
            const Icon = VALUE_ICONS[index % VALUE_ICONS.length]!;
            return (
              <Reveal as="li" key={value.title} delay={index * 0.07}>
                <div className="h-full rounded-3xl border bg-background p-7">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{value.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{value.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="how-title" className="bg-surface py-16 lg:py-24">
        <div className="container-page">
          <SectionHeading id="how-title" title={t.home.howTitle} description={t.home.howSubtitle} />
          <div className="mt-10">
            <HowItWorks t={t} />
          </div>
        </div>
      </section>

      <section aria-labelledby="cities-title" className="container-page py-16 lg:py-24">
        <SectionHeading id="cities-title" title={t.about.citiesTitle} />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {CITIES.map((city) => {
            const count = stats.find((item) => item.city === city.code)?.count ?? 0;
            return (
              <li key={city.slug}>
                <Link
                  href={`/${city.slug}`}
                  className="group flex items-center justify-between rounded-3xl border bg-background p-7 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span>
                    <span className="block text-2xl font-bold tracking-tight">
                      {t.cities[city.code].name}
                    </span>
                    <span className="mt-1 block text-muted-foreground">
                      {fill(t.cityPage.available, { count, noun: plural(count, t.plurals.apartments) })}
                    </span>
                  </span>
                  <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="container-page pb-20 lg:pb-28">
        <CtaSection
          id="lead-form"
          t={t}
          title={t.home.ctaTitle}
          text={t.home.ctaText}
          links={buildContactLinks(settings)}
          formToken={createFormToken()}
        />
      </section>
    </>
  );
}
