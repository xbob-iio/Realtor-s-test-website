import {
  Baby,
  BedDouble,
  Building,
  CalendarClock,
  Cat,
  Dog,
  MapPin,
  PawPrint,
  Receipt,
  Refrigerator,
  Ruler,
  Sofa,
  Wallet,
} from 'lucide-react';

import type { Dictionary } from '@/i18n/dictionaries/ru';
import { fill, formatPrice } from '@/i18n/format';
import { areaLabel, districtName, floorFull } from '@/lib/catalog/labels';
import type { ApartmentDetails } from '@/lib/catalog/types';
import { cn } from '@/lib/utils';

/** Ключевые параметры: комнаты, площадь, этаж, район */
export function ApartmentFacts({ apartment, t }: { apartment: ApartmentDetails; t: Dictionary }) {
  const facts = [
    { icon: BedDouble, label: t.apartment.specs.rooms, value: String(apartment.rooms) },
    { icon: Ruler, label: t.apartment.specs.area, value: areaLabel(t, apartment.area) },
    {
      icon: Building,
      label: t.apartment.specs.floor,
      value: floorFull(t, apartment.floor, apartment.totalFloors),
    },
    {
      icon: MapPin,
      label: t.apartment.specs.district,
      value: districtName(t, apartment.city, apartment.district),
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="min-w-0 rounded-2xl border bg-background p-4">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="size-4" />
            {label}
          </dt>
          <dd className="mt-1.5 text-lg font-semibold tracking-tight break-words hyphens-auto">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function depositText(apartment: ApartmentDetails, t: Dictionary): string {
  if (apartment.deposit === null) return t.apartment.conditions.byAgreement;
  if (apartment.deposit === 0) return t.apartment.conditions.noDeposit;
  return formatPrice(apartment.deposit, apartment.currency);
}

function petsText(apartment: ApartmentDetails, t: Dictionary): string {
  if (!apartment.petsAllowed) return t.apartment.conditions.notAllowed;
  const kinds = [
    apartment.dogsAllowed ? t.apartment.conditions.dogsLower : null,
    apartment.catsAllowed ? t.apartment.conditions.catsLower : null,
  ].filter(Boolean);
  return kinds.length
    ? fill(t.apartment.conditions.petsWithDetails, { list: kinds.join(', ') })
    : t.apartment.conditions.petsGeneral;
}

/** Условия аренды и удобства */
export function ApartmentConditions({ apartment, t }: { apartment: ApartmentDetails; t: Dictionary }) {
  const c = t.apartment.conditions;
  const rows: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    positive?: boolean;
  }[] = [
    { icon: CalendarClock, label: c.rentalPeriod, value: t.apartment.rentalPeriods[apartment.rentalPeriod] },
    { icon: Wallet, label: c.deposit, value: depositText(apartment, t) },
    {
      icon: Receipt,
      label: c.utilities,
      value: [t.apartment.utilities[apartment.utilities], apartment.utilitiesNote]
        .filter(Boolean)
        .join(' · '),
    },
    {
      icon: Sofa,
      label: c.furnished,
      value: apartment.furnished ? c.furnishedYes : c.furnishedNo,
      positive: apartment.furnished,
    },
    {
      icon: Refrigerator,
      label: c.appliances,
      value: apartment.hasAppliances ? c.appliancesYes : c.appliancesNo,
      positive: apartment.hasAppliances,
    },
    {
      icon: Baby,
      label: c.children,
      value: apartment.childrenAllowed ? c.allowed : c.notAllowed,
      positive: apartment.childrenAllowed,
    },
    { icon: PawPrint, label: c.pets, value: petsText(apartment, t), positive: apartment.petsAllowed },
    {
      icon: Dog,
      label: c.dogs,
      value: apartment.dogsAllowed ? c.allowed : c.notAllowed,
      positive: apartment.dogsAllowed,
    },
    {
      icon: Cat,
      label: c.cats,
      value: apartment.catsAllowed ? c.allowed : c.notAllowed,
      positive: apartment.catsAllowed,
    },
  ];

  return (
    <dl className="grid overflow-hidden rounded-3xl border sm:grid-cols-2">
      {rows.map(({ icon: Icon, label, value, positive }) => (
        <div
          key={label}
          className="flex items-start gap-3 border-b p-4 last:border-b-0 sm:odd:border-r sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl',
              positive === true
                ? 'bg-success-soft text-success'
                : positive === false
                  ? 'bg-secondary text-muted-foreground'
                  : 'bg-brand-soft text-brand',
            )}
          >
            <Icon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 font-semibold">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
