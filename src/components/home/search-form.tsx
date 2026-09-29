'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CITIES, type CitySlug } from '@/config/cities';
import { useDictionary } from '@/i18n/client';
import { buildCatalogHref, EMPTY_FILTERS, MAX_PRICE, type PetOption } from '@/lib/catalog/filters';
import { cn } from '@/lib/utils';

const ANY = 'any-value';

function toPrice(value: string): number | undefined {
  const digits = value.replace(/\D/g, '');
  if (!digits) return undefined;
  const number = Number.parseInt(digits, 10);
  return number > 0 && number <= MAX_PRICE ? number : undefined;
}

/**
 * Большая форма поиска на главной. Один набор полей для всех экранов:
 * на мобильных второстепенные поля скрыты под кнопкой «Ещё параметры».
 */
export function SearchForm({ defaultCity, className }: { defaultCity: CitySlug; className?: string }) {
  const t = useDictionary();
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const [city, setCity] = useState<CitySlug>(defaultCity);
  const [district, setDistrict] = useState(ANY);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rooms, setRooms] = useState(ANY);
  const [pets, setPets] = useState(ANY);
  const [children, setChildren] = useState(ANY);

  const cityConfig = CITIES.find((item) => item.slug === city) ?? CITIES[0]!;
  const field = (name: string) => `${id}-${name}`;
  /** Второстепенные поля: на мобильных — только в раскрытом состоянии */
  const secondary = expanded
    ? 'grid animate-in fade-in-0 slide-in-from-top-1 duration-300'
    : 'hidden lg:grid';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const href = buildCatalogHref({
      ...EMPTY_FILTERS,
      city,
      district: district === ANY ? undefined : district,
      minPrice: toPrice(minPrice),
      maxPrice: toPrice(maxPrice),
      rooms: rooms === ANY ? [] : [Number(rooms)],
      pets: pets === ANY ? [] : [pets as PetOption],
      children: children === 'yes',
    });
    startTransition(() => router.push(href));
  }

  function priceInput(name: 'minPrice' | 'maxPrice', className: string) {
    const value = name === 'minPrice' ? minPrice : maxPrice;
    const setValue = name === 'minPrice' ? setMinPrice : setMaxPrice;
    return (
      <div className={cn('grid gap-2', className)}>
        <Label htmlFor={field(name)}>{name === 'minPrice' ? t.search.priceFrom : t.search.priceTo}</Label>
        <div className="relative">
          <Input
            id={field(name)}
            inputMode="numeric"
            autoComplete="off"
            placeholder={name === 'minPrice' ? '10 000' : '30 000'}
            value={value}
            onChange={(event) => setValue(event.target.value.replace(/[^\d\s]/g, ''))}
            className="pr-10"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground"
          >
            {t.search.currencyHint}
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      role="search"
      aria-label={t.search.title}
      onSubmit={handleSubmit}
      className={cn('rounded-3xl border bg-background p-4 shadow-elevated sm:p-6 lg:p-7', className)}
    >
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div className="order-1 grid gap-2">
          <Label htmlFor={field('city')}>{t.search.city}</Label>
          <Select
            value={city}
            onValueChange={(value) => {
              setCity(value as CitySlug);
              setDistrict(ANY);
            }}
          >
            <SelectTrigger id={field('city')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {t.cities[item.code].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={cn('order-4 gap-2 lg:order-2', secondary)}>
          <Label htmlFor={field('district')}>{t.search.district}</Label>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger id={field('district')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t.search.anyDistrict}</SelectItem>
              {cityConfig.districts.map((key) => (
                <SelectItem key={key} value={key}>
                  {t.districts[cityConfig.code][key] ?? key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {priceInput('minPrice', cn('order-5 lg:order-3', secondary))}
        {priceInput('maxPrice', 'order-2 lg:order-4')}

        <div className="order-3 grid gap-2 lg:order-5">
          <Label htmlFor={field('rooms')}>{t.search.rooms}</Label>
          <Select value={rooms} onValueChange={setRooms}>
            <SelectTrigger id={field('rooms')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t.search.anyRooms}</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={cn('order-6 gap-2', secondary)}>
          <Label htmlFor={field('pets')}>{t.search.pets}</Label>
          <Select value={pets} onValueChange={setPets}>
            <SelectTrigger id={field('pets')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t.search.petsNone}</SelectItem>
              <SelectItem value="any">{t.search.petsAny}</SelectItem>
              <SelectItem value="dog">{t.search.petsDog}</SelectItem>
              <SelectItem value="cat">{t.search.petsCat}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={cn('order-7 gap-2', secondary)}>
          <Label htmlFor={field('children')}>{t.search.children}</Label>
          <Select value={children} onValueChange={setChildren}>
            <SelectTrigger id={field('children')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t.search.childrenAny}</SelectItem>
              <SelectItem value="yes">{t.search.childrenYes}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="order-8 flex flex-col-reverse gap-2 sm:col-span-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-1 lg:items-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="self-center sm:self-auto lg:hidden"
          >
            {expanded ? t.search.less : t.search.more}
            <ChevronDown className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full sm:w-auto lg:w-full"
            disabled={pending}
          >
            <Search />
            {t.search.submit}
          </Button>
        </div>
      </div>
    </form>
  );
}
