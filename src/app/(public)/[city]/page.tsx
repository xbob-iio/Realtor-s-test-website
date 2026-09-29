import { ArrowRight, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ApartmentCard } from '@/components/apartments/apartment-card';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { SectionHeading } from '@/components/common/section-heading';
import { CtaSection } from '@/components/home/cta-section';
import { QuickLinks } from '@/components/home/home-sections';
import { Reveal } from '@/components/motion/reveal';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { getCityBySlug } from '@/config/cities';
import { getDictionary } from '@/i18n';
import { fill, formatPrice, plural } from '@/i18n/format';
import { buildContactLinks } from '@/lib/contacts';
import { getCityStats, getDistrictCounts, getLatestApartments } from '@/server/queries/apartments';
import { createFormToken } from '@/server/security/form-token';
import { breadcrumbJsonLd, buildMetadata } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug((await params).city);
  if (!city) return {};
  const t = getDictionary();
  const settings = await getSiteSettings();
  const cityIn = t.cities[city.code].in;
  return buildMetadata({
    title: fill(t.cityPage.metaTitle, { city: cityIn }),
    description: fill(t.cityPage.metaDescription, { city: cityIn }),
    path: `/${city.slug}`,
    siteName: settings.siteName,
  });
}

/** Страница города: /kyiv, /dnipro */
export default async function CityPage({ params }: PageProps) {
  const city = getCityBySlug((await params).city);
  if (!city) notFound();

  const t = getDictionary();
  const [settings, stats, districtCounts, latest] = await Promise.all([
    getSiteSettings(),
    getCityStats(),
    getDistrictCounts(city.code),
    getLatestApartments(6, city.code),
  ]);
  const cityStats = stats.find((item) => item.city === city.code);
  const count = cityStats?.count ?? 0;
  const cityIn = t.cities[city.code].in;
  const catalogHref = `/${city.slug}/apartments`;

  const breadcrumbs = [
    { name: t.common.home, path: '/' },
    { name: t.cities[city.code].name, path: `/${city.slug}` },
  ];

  const quickLinks = [
    { href: `${catalogHref}?rooms=1`, label: t.home.quickLinks.oneRoom },
    { href: `${catalogHref}?rooms=2`, label: t.home.quickLinks.twoRoom },
    { href: `${catalogHref}?rooms=3`, label: t.home.quickLinks.threeRoom },
    { href: `${catalogHref}?pets=any`, label: t.home.quickLinks.pets },
    { href: `${catalogHref}?pets=dog`, label: t.home.quickLinks.dogs },
    { href: `${catalogHref}?children=1`, label: t.home.quickLinks.children },
    { href: `${catalogHref}?furnished=1&appliances=1`, label: t.home.quickLinks.furnished },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />

      <section className="relative overflow-hidden border-b bg-surface">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-0 size-[30rem] rounded-full bg-brand-soft blur-3xl"
        />
        <div className="relative container-page py-10 lg:py-16">
          <Breadcrumbs items={breadcrumbs} label={t.common.breadcrumbs} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div className="animate-fade-up space-y-5">
              <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">
                {t.cityPage.eyebrow}
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
                {fill(t.cityPage.title, { city: cityIn })}
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {t.cityPage.intro[city.code]}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" variant="brand">
                  <Link href={catalogHref}>
                    {fill(t.cityPage.allCta, { city: cityIn })}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#lead-form">{t.nav.contactCta}</Link>
                </Button>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border bg-background p-5 shadow-soft">
                <dt className="text-sm text-muted-foreground">{t.cityPage.countLabel}</dt>
                <dd className="mt-1 text-3xl font-bold tracking-tight">{count}</dd>
              </div>
              <div className="rounded-3xl border bg-background p-5 shadow-soft">
                <dt className="text-sm text-muted-foreground">{t.cityPage.priceLabel}</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight">
                  {cityStats?.minPriceUah != null
                    ? fill(t.cityPage.priceFrom, { price: formatPrice(cityStats.minPriceUah) })
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <SectionHeading title={t.cityPage.districtsTitle} description={t.cityPage.districtsSubtitle} />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {city.districts.map((key, index) => {
            const districtCount = districtCounts[key] ?? 0;
            return (
              <Reveal as="li" key={key} delay={Math.min(index, 8) * 0.04}>
                <Link
                  href={`${catalogHref}?district=${key}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border bg-background p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-card"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors group-hover:bg-brand-soft group-hover:text-brand">
                      <MapPin className="size-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{t.districts[city.code][key] ?? key}</span>
                      <span className="block text-sm text-muted-foreground">
                        {districtCount > 0
                          ? fill(t.cityPage.districtCount, {
                              count: districtCount,
                              noun: plural(districtCount, t.plurals.apartments),
                            })
                          : t.cityPage.districtEmpty}
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {latest.length > 0 && (
        <section className="container-page pb-16 lg:pb-20">
          <SectionHeading
            title={fill(t.cityPage.latestTitle, { city: cityIn })}
            action={
              <Button asChild variant="outline">
                <Link href={catalogHref}>
                  {t.common.showAll}
                  <ArrowRight />
                </Link>
              </Button>
            }
          />
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((apartment, index) => (
              <Reveal as="li" key={apartment.id} delay={index * 0.05}>
                <ApartmentCard apartment={apartment} t={t} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <section className="container-page pb-16 lg:pb-20">
        <h2 className="mb-5 text-2xl font-bold tracking-tight">{t.cityPage.popularTitle}</h2>
        <QuickLinks t={t} links={quickLinks} />
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
