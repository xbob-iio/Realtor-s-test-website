'use client';

import { useId } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CITIES, getCityBySlug, type CitySlug } from '@/config/cities';
import type { City } from '@/generated/prisma/enums';
import { useDictionary } from '@/i18n/client';
import {
  MAX_PRICE,
  PET_OPTIONS,
  ROOM_OPTIONS,
  TERM_OPTIONS,
  type CatalogFilters,
  type PetOption,
  type TermOption,
} from '@/lib/catalog/filters';
import { cn } from '@/lib/utils';

import { NumberField } from './range-inputs';

const ALL = 'all';

export type DistrictCounts = Record<City, Record<string, number>>;

interface FiltersFormProps {
  value: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  districtCounts: DistrictCounts;
  /** 0 — числовые поля применяются сразу (черновик в мобильном окне) */
  debounceMs?: number;
  className?: string;
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = useId();
  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cn('grid gap-3 border-b py-5 first:pt-0 last:border-b-0 last:pb-0', className)}
    >
      <p id={headingId} className="text-[15px] font-semibold">
        {title}
      </p>
      {children}
    </div>
  );
}

function CheckRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(state) => onChange(state === true)} />
      <label htmlFor={id} className="cursor-pointer text-[15px] select-none">
        {label}
      </label>
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  children,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'h-10 min-w-11 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-95',
        pressed
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background text-foreground hover:border-foreground/30',
      )}
    >
      {children}
    </button>
  );
}

/** Поля фильтров каталога. Не хранит состояние — всё приходит через value/onChange. */
export function FiltersForm({
  value,
  onChange,
  districtCounts,
  debounceMs = 700,
  className,
}: FiltersFormProps) {
  const t = useDictionary();
  const id = useId();
  const city = getCityBySlug(value.city);

  const update = (patch: Partial<CatalogFilters>) => onChange({ ...value, ...patch, page: 1 });
  const toggleRoom = (room: number) =>
    update({
      rooms: value.rooms.includes(room)
        ? value.rooms.filter((item) => item !== room)
        : [...value.rooms, room].sort((a, b) => a - b),
    });
  const togglePet = (pet: PetOption) =>
    update({
      pets: value.pets.includes(pet) ? value.pets.filter((item) => item !== pet) : [...value.pets, pet],
    });

  const counts = city ? districtCounts[city.code] : {};

  return (
    <div className={cn('grid', className)}>
      <Section title={t.filters.city}>
        <div className="flex flex-wrap gap-2">
          <Chip pressed={!value.city} onClick={() => update({ city: undefined, district: undefined })}>
            {t.filters.allCities}
          </Chip>
          {CITIES.map((item) => (
            <Chip
              key={item.slug}
              pressed={value.city === item.slug}
              onClick={() => update({ city: item.slug as CitySlug, district: undefined })}
            >
              {t.cities[item.code].name}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t.filters.district}>
        <Select
          value={value.district ?? ALL}
          onValueChange={(district) => update({ district: district === ALL ? undefined : district })}
          disabled={!city}
        >
          <SelectTrigger size="sm" aria-label={t.filters.district} className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t.filters.allDistricts}</SelectItem>
            {city?.districts.map((key) => {
              const count = counts?.[key] ?? 0;
              return (
                <SelectItem key={key} value={key}>
                  <span className="flex w-full items-center justify-between gap-3">
                    {t.districts[city.code][key] ?? key}
                    <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Section>

      <Section title={t.filters.price}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id={`${id}-min-price`}
            label={t.filters.priceMin}
            placeholder={t.common.from}
            value={value.minPrice}
            max={MAX_PRICE}
            debounceMs={debounceMs}
            onCommit={(minPrice) => update({ minPrice })}
          />
          <NumberField
            id={`${id}-max-price`}
            label={t.filters.priceMax}
            placeholder={t.common.to}
            value={value.maxPrice}
            max={MAX_PRICE}
            debounceMs={debounceMs}
            onCommit={(maxPrice) => update({ maxPrice })}
          />
        </div>
      </Section>

      <Section title={t.filters.rooms}>
        <div className="flex flex-wrap gap-2">
          {ROOM_OPTIONS.map((room) => (
            <Chip key={room} pressed={value.rooms.includes(room)} onClick={() => toggleRoom(room)}>
              {room === 4 ? t.filters.roomsFourPlus : room}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t.filters.area}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id={`${id}-min-area`}
            label={t.filters.areaMin}
            placeholder={t.common.from}
            value={value.minArea}
            max={1000}
            debounceMs={debounceMs}
            onCommit={(minArea) => update({ minArea })}
          />
          <NumberField
            id={`${id}-max-area`}
            label={t.filters.areaMax}
            placeholder={t.common.to}
            value={value.maxArea}
            max={1000}
            debounceMs={debounceMs}
            onCommit={(maxArea) => update({ maxArea })}
          />
        </div>
      </Section>

      <Section title={t.filters.floor}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            id={`${id}-min-floor`}
            label={t.filters.floorMin}
            placeholder={t.common.from}
            value={value.minFloor}
            max={200}
            debounceMs={debounceMs}
            onCommit={(minFloor) => update({ minFloor })}
          />
          <NumberField
            id={`${id}-max-floor`}
            label={t.filters.floorMax}
            placeholder={t.common.to}
            value={value.maxFloor}
            max={200}
            debounceMs={debounceMs}
            onCommit={(maxFloor) => update({ maxFloor })}
          />
        </div>
        <div className="grid gap-3 pt-1">
          <CheckRow
            id={`${id}-not-first`}
            label={t.filters.notFirstFloor}
            checked={value.notFirstFloor}
            onChange={(notFirstFloor) => update({ notFirstFloor })}
          />
          <CheckRow
            id={`${id}-not-last`}
            label={t.filters.notLastFloor}
            checked={value.notLastFloor}
            onChange={(notLastFloor) => update({ notLastFloor })}
          />
        </div>
      </Section>

      <Section title={t.filters.amenities}>
        <CheckRow
          id={`${id}-furnished`}
          label={t.filters.furnished}
          checked={value.furnished}
          onChange={(furnished) => update({ furnished })}
        />
        <CheckRow
          id={`${id}-appliances`}
          label={t.filters.appliances}
          checked={value.appliances}
          onChange={(appliances) => update({ appliances })}
        />
      </Section>

      <Section title={t.filters.conditions}>
        <CheckRow
          id={`${id}-children`}
          label={t.filters.children}
          checked={value.children}
          onChange={(children) => update({ children })}
        />
        <div className="grid gap-2.5 pt-1">
          <span className="text-sm text-muted-foreground">{t.filters.pets}</span>
          <div className="flex flex-wrap gap-2">
            {PET_OPTIONS.map((pet) => (
              <Chip key={pet} pressed={value.pets.includes(pet)} onClick={() => togglePet(pet)}>
                {pet === 'any' ? t.filters.petsAny : pet === 'dog' ? t.filters.petsDog : t.filters.petsCat}
              </Chip>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t.filters.term}>
        <Select
          value={value.term ?? ALL}
          onValueChange={(term) => update({ term: term === ALL ? undefined : (term as TermOption) })}
        >
          <SelectTrigger size="sm" aria-label={t.filters.term} className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t.filters.termAny}</SelectItem>
            {TERM_OPTIONS.map((term) => (
              <SelectItem key={term} value={term}>
                {t.filters.terms[term]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>
    </div>
  );
}
