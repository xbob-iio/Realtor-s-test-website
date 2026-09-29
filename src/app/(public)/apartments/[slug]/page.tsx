import { ArrowRight, Info, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';

import { ApartmentBadges } from '@/components/apartments/apartment-badges';
import { ApartmentCard } from '@/components/apartments/apartment-card';
import { ApartmentConditions, ApartmentFacts } from '@/components/apartments/apartment-details';
import { ApartmentGallery } from '@/components/apartments/gallery';
import { PriceCard } from '@/components/apartments/price-card';
import { RecentlyViewed, TrackRecentlyViewed } from '@/components/apartments/recently-viewed';
import { ShareButton } from '@/components/apartments/share-button';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { MobileContactBar } from '@/components/layout/mobile-contact-bar';
import { Reveal } from '@/components/motion/reveal';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCityByCode } from '@/config/cities';
import { getDictionary } from '@/i18n';
import { fill, formatPrice } from '@/i18n/format';
import { areaLabel, cityName, districtFull } from '@/lib/catalog/labels';
import type { ApartmentCardData, ApartmentDetails } from '@/lib/catalog/types';
import { buildContactLinks } from '@/lib/contacts';
import {
  findRedirectSlug,
  getPublishedApartmentBySlug,
  getSimilarApartments,
} from '@/server/queries/apartments';
import { createFormToken } from '@/server/security/form-token';
import { absoluteUrl, apartmentJsonLd, breadcrumbJsonLd, buildMetadata, truncate } from '@/server/seo';
import { getSiteSettings } from '@/server/settings';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function summary(apartment: ApartmentDetails, t: ReturnType<typeof getDictionary>): string {
  const parts = [
    `${fill(t.apartment.roomsTitle, { count: apartment.rooms })}, ${areaLabel(t, apartment.area)}`,
    `${districtFull(t, apartment.city, apartment.district)}, ${cityName(t, apartment.city)}`,
    `${formatPrice(apartment.price, apartment.currency)} ${t.common.perMonth}`,
  ];
  const extras = [
    apartment.childrenAllowed ? t.apartment.badges.children : null,
    apartment.dogsAllowed ? t.apartment.badges.dog : apartment.petsAllowed ? t.apartment.badges.pets : null,
  ].filter(Boolean);
  return `${parts.join(' · ')}.${extras.length ? ` ${extras.join(', ')}.` : ''} ${apartment.description}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [apartment, settings] = await Promise.all([getPublishedApartmentBySlug(slug), getSiteSettings()]);
  if (!apartment) return { robots: { index: false } };

  const t = getDictionary();
  const cover = apartment.images[0];
  return buildMetadata({
    title: `${apartment.title} — ${formatPrice(apartment.price, apartment.currency)} ${t.common.perMonth}`,
    description: truncate(summary(apartment, t), 160),
    path: `/apartments/${apartment.slug}`,
    siteName: settings.siteName,
    type: 'article',
    images: cover
      ? [
          {
            url: absoluteUrl(cover.url),
            width: cover.width,
            height: cover.height,
            alt: cover.alt ?? apartment.title,
          },
        ]
      : undefined,
  });
}

export default async function ApartmentPage({ params }: PageProps) {
  const { slug } = await params;
  const apartment = await getPublishedApartmentBySlug(slug);
  if (!apartment) {
    const target = await findRedirectSlug(slug);
    if (target) permanentRedirect(`/apartments/${target}`);
    notFound();
  }

  const t = getDictionary();
  const [settings, similar] = await Promise.all([getSiteSettings(), getSimilarApartments(apartment)]);
  const city = getCityByCode(apartment.city);
  const url = absoluteUrl(`/apartments/${apartment.slug}`);
  const message = fill(t.apartment.cta.messageTemplate, { title: apartment.title, url });
  const links = buildContactLinks(settings, message);
  const catalogTitle = fill(t.apartment.breadcrumbCatalog, { city: t.cities[apartment.city].in });

  const breadcrumbs = [
    { name: t.common.home, path: '/' },
    { name: catalogTitle, path: `/${city.slug}/apartments` },
    {
      name: districtFull(t, apartment.city, apartment.district),
      path: `/${city.slug}/apartments?district=${apartment.district}`,
    },
    { name: apartment.title, path: `/apartments/${apartment.slug}` },
  ];

  const cardData: ApartmentCardData = {
    id: apartment.id,
    slug: apartment.slug,
    title: apartment.title,
    city: apartment.city,
    district: apartment.district,
    price: apartment.price,
    currency: apartment.currency,
    priceUah: apartment.priceUah,
    rooms: apartment.rooms,
    area: apartment.area,
    floor: apartment.floor,
    totalFloors: apartment.totalFloors,
    excerpt: truncate(apartment.description, 150),
    furnished: apartment.furnished,
    childrenAllowed: apartment.childrenAllowed,
    petsAllowed: apartment.petsAllowed,
    dogsAllowed: apartment.dogsAllowed,
    catsAllowed: apartment.catsAllowed,
    isNew: apartment.isNew,
    isDemo: apartment.isDemo,
    image: apartment.images[0] ?? null,
  };

  return (
    <>
      <JsonLd data={[apartmentJsonLd(apartment, settings), breadcrumbJsonLd(breadcrumbs)]} />
      <TrackRecentlyViewed apartment={cardData} />

      <article className="container-page pt-6 pb-16 lg:pt-10 lg:pb-24">
        <Breadcrumbs items={breadcrumbs} label={t.common.breadcrumbs} className="hidden sm:block" />

        <header className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ApartmentBadges apartment={apartment} t={t} limit={4} />
              {apartment.isDemo && <Badge variant="secondary">{t.apartment.demoBadge}</Badge>}
            </div>
            <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {apartment.title}
            </h1>
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-4.5 shrink-0" />
              <span>
                {districtFull(t, apartment.city, apartment.district)}, {cityName(t, apartment.city)} ·{' '}
                {apartment.address}
              </span>
            </p>
          </div>
          <div className="self-start lg:self-auto">
            <ShareButton title={apartment.title} />
          </div>
        </header>

        <div className="mt-6">
          <ApartmentGallery images={apartment.images} title={apartment.title} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <div className="min-w-0 space-y-12">
            <ApartmentFacts apartment={apartment} t={t} />

            {apartment.isDemo && (
              <p className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm leading-relaxed">
                <Info className="mt-0.5 size-4.5 shrink-0 text-warning" />
                {t.apartment.demoNotice}
              </p>
            )}

            <section aria-labelledby="description-title" className="space-y-4">
              <h2 id="description-title" className="text-2xl font-bold tracking-tight">
                {t.apartment.sections.description}
              </h2>
              <div className="max-w-none text-[17px] leading-relaxed whitespace-pre-line text-foreground/90">
                {apartment.description}
              </div>
            </section>

            <section aria-labelledby="conditions-title" className="space-y-5">
              <h2 id="conditions-title" className="text-2xl font-bold tracking-tight">
                {t.apartment.sections.conditions}
              </h2>
              <ApartmentConditions apartment={apartment} t={t} />
            </section>

            <section aria-labelledby="location-title" className="space-y-4">
              <h2 id="location-title" className="text-2xl font-bold tracking-tight">
                {t.apartment.sections.location}
              </h2>
              <div className="flex flex-col gap-4 rounded-3xl border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background shadow-soft">
                    <MapPin className="size-5 text-brand" />
                  </span>
                  <div>
                    <p className="font-semibold">
                      {cityName(t, apartment.city)}, {districtFull(t, apartment.city, apartment.district)}
                    </p>
                    <p className="text-muted-foreground">{apartment.address}</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${city.slug}/apartments?district=${apartment.district}`}>
                    {t.apartment.moreInDistrict}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PriceCard apartment={apartment} t={t} links={links} formToken={createFormToken()} />
          </aside>
        </div>

        {similar.length > 0 && (
          <section aria-labelledby="similar-title" className="mt-20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="similar-title" className="text-3xl font-bold tracking-tight">
                  {t.apartment.sections.similar}
                </h2>
                <p className="mt-2 text-muted-foreground">{t.apartment.sections.similarSubtitle}</p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/${city.slug}/apartments`}>
                  {t.common.showAll}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((item, index) => (
                <Reveal as="li" key={item.id} delay={index * 0.06}>
                  <ApartmentCard apartment={item} t={t} />
                </Reveal>
              ))}
            </ul>
          </section>
        )}

        <RecentlyViewed excludeId={apartment.id} className="mt-20" />
      </article>

      <MobileContactBar links={links} scope="page" />
    </>
  );
}
