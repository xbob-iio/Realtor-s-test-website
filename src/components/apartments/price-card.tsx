import { CalendarDays, MessageCircle } from 'lucide-react';

import { ContactButtons } from '@/components/contact/contact-buttons';
import { ContactDialog } from '@/components/contact/contact-dialog';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { fill, formatDate, formatPrice } from '@/i18n/format';
import type { ApartmentDetails } from '@/lib/catalog/types';
import type { ContactLink } from '@/lib/contacts';

interface PriceCardProps {
  apartment: ApartmentDetails;
  t: Dictionary;
  links: ContactLink[];
  formToken: string;
}

/** Цена и призыв к действию — «липкая» колонка на десктопе */
export function PriceCard({ apartment, t, links, formToken }: PriceCardProps) {
  const deposit =
    apartment.deposit === null
      ? t.apartment.conditions.byAgreement
      : apartment.deposit === 0
        ? t.apartment.conditions.noDeposit
        : formatPrice(apartment.deposit, apartment.currency);

  return (
    <div className="rounded-3xl border bg-background p-6 shadow-card sm:p-7">
      <p className="text-sm font-medium text-muted-foreground">{t.apartment.cta.price}</p>
      <p className="mt-1 text-4xl font-extrabold tracking-tight">
        {formatPrice(apartment.price, apartment.currency)}
        <span className="ml-1.5 text-base font-medium text-muted-foreground">{t.common.perMonth}</span>
      </p>
      {apartment.currency !== 'UAH' && (
        <p className="mt-1 text-sm text-muted-foreground">
          {fill(t.currency.approxUah, { amount: formatPrice(apartment.priceUah, 'UAH') })}
        </p>
      )}

      <dl className="mt-5 grid gap-2 border-y py-4 text-[15px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t.apartment.conditions.deposit}</dt>
          <dd className="text-right font-semibold">{deposit}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t.apartment.conditions.utilities}</dt>
          <dd className="text-right font-semibold">{t.apartment.utilities[apartment.utilities]}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t.apartment.conditions.rentalPeriod}</dt>
          <dd className="text-right font-semibold">{t.apartment.rentalPeriods[apartment.rentalPeriod]}</dd>
        </div>
      </dl>

      <ContactDialog
        links={links}
        formToken={formToken}
        apartment={{ id: apartment.id, title: apartment.title }}
        title={t.apartment.cta.checkAvailability}
        description={t.apartment.cta.contactSubtitle}
      >
        <Button variant="brand" size="lg" className="mt-5 w-full">
          <MessageCircle />
          {t.apartment.cta.checkAvailability}
        </Button>
      </ContactDialog>

      {links.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-medium text-muted-foreground">{t.apartment.cta.contactTitle}</p>
          <ContactButtons links={links} t={t} variant="row" />
        </div>
      )}

      {apartment.publishedAt && (
        <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {fill(t.apartment.publishedAt, { date: formatDate(apartment.publishedAt, t.months.genitive) })}
        </p>
      )}
    </div>
  );
}
