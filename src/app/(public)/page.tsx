import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ApartmentCard } from '@/components/apartments/apartment-card';
import { RecentlyViewed } from '@/components/apartments/recently-viewed';
import { SectionHeading } from '@/components/common/section-heading';
import { CityCards } from '@/components/home/city-cards';
import { CtaSection } from '@/components/home/cta-section';
import { Faq } from '@/components/home/faq';
import { Hero } from '@/components/home/hero';
import { HowItWorks, QuickLinks, WhyUs } from '@/components/home/home-sections';
import { Reveal } from '@/components/motion/reveal';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { getCityByCode } from '@/config/cities';
import { getDictionary } from '@/i18n';
import { buildContactLinks } from '@/lib/contacts';
import { getCityStats, getHeroImages, getLatestApartments } from '@/server/queries/apartments';
import { createFormToken } from '@/server/security/form-token';
import { buildMetadata, faqJsonLd, organizationJsonLd, websiteJsonLd } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary();
  const settings = await getSiteSettings();
  return buildMetadata({
    title: `${settings.seoTitle ?? t.meta.defaultTitle} | ${settings.siteName}`,
    description: settings.seoDescription ?? t.meta.defaultDescription,
    path: '/',
    siteName: settings.siteName,
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const t = getDictionary();
  const [settings, stats, latest, heroImages, kyivCover, dniproCover] = await Promise.all([
    getSiteSettings(),
    getCityStats(),
    getLatestApartments(6),
    getHeroImages(3),
    getLatestApartments(1, 'KYIV'),
    getLatestApartments(1, 'DNIPRO'),
  ]);

  const totalAvailable = stats.reduce((sum, item) => sum + item.count, 0);
  const covers = { KYIV: kyivCover[0]?.image ?? null, DNIPRO: dniproCover[0]?.image ?? null };
  const quickLinks = [
    { href: '/apartments?pets=any', label: t.home.quickLinks.pets },
    { href: '/apartments?pets=dog', label: t.home.quickLinks.dogs },
    { href: '/apartments?children=1', label: t.home.quickLinks.children },
    { href: '/apartments?rooms=1', label: t.home.quickLinks.oneRoom },
    { href: '/apartments?rooms=2', label: t.home.quickLinks.twoRoom },
    { href: '/apartments?rooms=3', label: t.home.quickLinks.threeRoom },
    { href: '/apartments?furnished=1&appliances=1', label: t.home.quickLinks.furnished },
    { href: '/apartments?maxPrice=15000', label: t.home.quickLinks.budget },
  ];

  return (
    <>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings), faqJsonLd(t.home.faq)]} />

      <Hero
        t={t}
        totalAvailable={totalAvailable}
        defaultCity={getCityByCode(settings.defaultCity).slug}
        images={heroImages}
      />

      <section aria-labelledby="cities-title" className="container-page py-16 lg:py-24">
        <SectionHeading id="cities-title" title={t.home.citiesTitle} description={t.home.citiesSubtitle} />
        <div className="mt-10">
          <CityCards t={t} cities={stats.map((item) => ({ ...item, image: covers[item.city] }))} />
        </div>
      </section>

      {latest.length > 0 && (
        <section aria-labelledby="latest-title" className="container-page pb-16 lg:pb-24">
          <SectionHeading
            id="latest-title"
            title={t.home.latestTitle}
            description={t.home.latestSubtitle}
            action={
              <Button asChild variant="outline">
                <Link href="/apartments">
                  {t.common.showAll}
                  <ArrowRight />
                </Link>
              </Button>
            }
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((apartment, index) => (
              <Reveal as="li" key={apartment.id} delay={(index % 3) * 0.06}>
                <ApartmentCard apartment={apartment} t={t} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <RecentlyViewed className="container-page pb-16 lg:pb-24" />

      <section aria-labelledby="quick-title" className="border-y bg-surface py-14 lg:py-16">
        <div className="container-page">
          <h2 id="quick-title" className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
            {t.home.quickTitle}
          </h2>
          <QuickLinks t={t} links={quickLinks} />
        </div>
      </section>

      <section aria-labelledby="how-title" className="container-page py-16 lg:py-24">
        <SectionHeading id="how-title" title={t.home.howTitle} description={t.home.howSubtitle} />
        <div className="mt-10">
          <HowItWorks t={t} />
        </div>
      </section>

      <section aria-labelledby="why-title" className="container-page pb-16 lg:pb-24">
        <div className="grid gap-10 rounded-[2rem] bg-surface p-7 sm:p-10 lg:grid-cols-[1fr_1.6fr] lg:p-14">
          <SectionHeading id="why-title" title={t.home.whyTitle} className="self-start lg:sticky lg:top-28" />
          <WhyUs t={t} />
        </div>
      </section>

      <section aria-labelledby="faq-title" className="container-page pb-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading id="faq-title" title={t.home.faqTitle} className="self-start lg:sticky lg:top-28" />
          <Faq items={t.home.faq} />
        </div>
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
