'use client';

import { LoaderCircle, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CITIES } from '@/config/cities';
import type {
  ApartmentStatus,
  City,
  Currency,
  RentalPeriod,
  UtilitiesPayment,
} from '@/generated/prisma/enums';
import { useAdminDictionary } from '@/i18n/admin-client';
import { useDictionary } from '@/i18n/client';
import { fill } from '@/i18n/format';
import { cn } from '@/lib/utils';
import { IDLE, type ActionState } from '@/server/actions/types';

import type { ApartmentFormValues } from './apartment-form-values';
import { describedBy, FormField, SwitchRow } from './form-field';

type DepositMode = 'amount' | 'none' | 'agreement';

const STATUSES: ApartmentStatus[] = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'RENTED', 'ARCHIVED'];
const RENTAL_PERIODS: RentalPeriod[] = ['MONTHS_1', 'MONTHS_3', 'MONTHS_6', 'MONTHS_12'];
const CURRENCIES: Currency[] = ['UAH', 'USD', 'EUR'];
const DESCRIPTION_MAX = 5000;

interface ApartmentFormProps {
  initial: ApartmentFormValues;
  isNew: boolean;
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
}

function Section({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-3xl border bg-background p-5 sm:p-7', className)}>
      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function ApartmentForm({ initial, isNew, action }: ApartmentFormProps) {
  const ta = useAdminDictionary();
  const t = useDictionary();
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const formRef = useRef<HTMLFormElement>(null);

  const [city, setCity] = useState<City>(initial.city);
  const [district, setDistrict] = useState(initial.district);
  const [currency, setCurrency] = useState<Currency>(initial.currency);
  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>(initial.rentalPeriod);
  const [utilities, setUtilities] = useState<UtilitiesPayment>(initial.utilities);
  const [status, setStatus] = useState<ApartmentStatus>(initial.status);
  // Статус могли изменить кнопками над формой — подхватываем новое значение с сервера
  const [syncedStatus, setSyncedStatus] = useState<ApartmentStatus>(initial.status);
  if (initial.status !== syncedStatus) {
    setSyncedStatus(initial.status);
    setStatus(initial.status);
  }
  const [petsAllowed, setPetsAllowed] = useState(initial.petsAllowed);
  const [depositMode, setDepositMode] = useState<DepositMode>(
    initial.deposit === null ? (isNew ? 'amount' : 'agreement') : initial.deposit === 0 ? 'none' : 'amount',
  );
  const [descriptionLength, setDescriptionLength] = useState(initial.description.length);

  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {};
  const errorFor = (field: string): string | null => {
    const key = errors[field];
    if (!key) return null;
    if (key === 'needPhoto') return ta.apartments.toasts.needPhoto;
    return (
      ta.form.errors[key as keyof typeof ta.form.errors] ??
      ta.form.errors[field as keyof typeof ta.form.errors] ??
      ta.form.errors.generic
    );
  };

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(ta.apartments.toasts.saved);
      router.refresh();
    } else if (state.status === 'error') {
      const message =
        state.message === 'rateLimited'
          ? ta.common.rateLimited
          : state.message === 'needPhoto'
            ? ta.apartments.toasts.needPhoto
            : state.message === 'notFound'
              ? ta.apartments.toasts.notFound
              : state.message === 'errorSummary'
                ? ta.form.errorSummary
                : ta.form.errors.generic;
      toast.error(message);
      // Фокус на первое поле с ошибкой
      const firstField = Object.keys(state.fieldErrors ?? {})[0];
      if (firstField)
        formRef.current?.querySelector<HTMLElement>(`[name="${firstField}"], #field-${firstField}`)?.focus();
    }
  }, [state, router, ta]);

  const cityConfig = CITIES.find((item) => item.code === city) ?? CITIES[0]!;
  const f = ta.form.fields;
  const id = (name: string) => `field-${name}`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // Radix Select отправляет значения через скрытые поля; дублируем явно для надёжности
    data.set('city', city);
    data.set('district', district);
    data.set('currency', currency);
    data.set('rentalPeriod', rentalPeriod);
    data.set('utilities', utilities);
    data.set('status', status);
    data.set('depositMode', depositMode);
    startTransition(() => dispatch(data));
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="grid min-w-0 gap-6">
        <Section title={ta.form.sections.main} hint={ta.form.sections.mainHint}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id={id('title')}
              label={f.title}
              error={errorFor('title')}
              required
              className="sm:col-span-2"
            >
              <Input
                id={id('title')}
                name="title"
                defaultValue={initial.title}
                placeholder={f.titlePlaceholder}
                maxLength={160}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={describedBy(id('title'), errorFor('title'))}
              />
            </FormField>
            <FormField id={id('city')} label={f.city} error={errorFor('city')} required>
              <Select
                value={city}
                onValueChange={(value) => {
                  setCity(value as City);
                  setDistrict('');
                }}
              >
                <SelectTrigger id={id('city')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {t.cities[item.code].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id={id('district')} label={f.district} error={errorFor('district')} required>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger id={id('district')} aria-invalid={Boolean(errors.district)}>
                  <SelectValue placeholder={f.districtPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {cityConfig.districts.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t.districts[cityConfig.code][key] ?? key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              id={id('address')}
              label={f.address}
              error={errorFor('address')}
              hint={f.addressHint}
              required
              className="sm:col-span-2"
            >
              <Input
                id={id('address')}
                name="address"
                defaultValue={initial.address}
                placeholder={f.addressPlaceholder}
                maxLength={200}
                aria-invalid={Boolean(errors.address)}
                aria-describedby={describedBy(id('address'), errorFor('address'), f.addressHint)}
              />
            </FormField>
          </div>
        </Section>

        <Section title={ta.form.sections.params} hint={ta.form.sections.paramsHint}>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <FormField id={id('rooms')} label={f.rooms} error={errorFor('rooms')} required>
              <Input
                id={id('rooms')}
                name="rooms"
                inputMode="numeric"
                defaultValue={initial.rooms ?? ''}
                maxLength={2}
                aria-invalid={Boolean(errors.rooms)}
              />
            </FormField>
            <FormField id={id('area')} label={f.area} error={errorFor('area')} required>
              <Input
                id={id('area')}
                name="area"
                inputMode="decimal"
                defaultValue={initial.area ?? ''}
                maxLength={7}
                aria-invalid={Boolean(errors.area)}
              />
            </FormField>
            <FormField id={id('floor')} label={f.floor} error={errorFor('floor')} required>
              <Input
                id={id('floor')}
                name="floor"
                inputMode="numeric"
                defaultValue={initial.floor ?? ''}
                maxLength={3}
                aria-invalid={Boolean(errors.floor)}
              />
            </FormField>
            <FormField id={id('totalFloors')} label={f.totalFloors} error={errorFor('totalFloors')} required>
              <Input
                id={id('totalFloors')}
                name="totalFloors"
                inputMode="numeric"
                defaultValue={initial.totalFloors ?? ''}
                maxLength={3}
                aria-invalid={Boolean(errors.totalFloors)}
              />
            </FormField>
          </div>
        </Section>

        <Section title={ta.form.sections.price} hint={ta.form.sections.priceHint}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <FormField id={id('price')} label={f.price} error={errorFor('price')} required>
                <Input
                  id={id('price')}
                  name="price"
                  inputMode="numeric"
                  defaultValue={initial.price ?? ''}
                  maxLength={12}
                  aria-invalid={Boolean(errors.price)}
                />
              </FormField>
              <FormField id={id('currency')} label={f.currency}>
                <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                  <SelectTrigger id={id('currency')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t.currency[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField id={id('rentalPeriod')} label={f.rentalPeriod}>
              <Select value={rentalPeriod} onValueChange={(value) => setRentalPeriod(value as RentalPeriod)}>
                <SelectTrigger id={id('rentalPeriod')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RENTAL_PERIODS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t.apartment.rentalPeriods[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid gap-3 sm:col-span-2">
              <span className="text-sm font-medium">{f.depositMode}</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={f.depositMode}>
                {(['amount', 'none', 'agreement'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={depositMode === mode}
                    onClick={() => setDepositMode(mode)}
                    className={cn(
                      'h-10 rounded-full border px-4 text-sm font-semibold transition-colors',
                      depositMode === mode
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:border-foreground/30',
                    )}
                  >
                    {f.depositModes[mode]}
                  </button>
                ))}
              </div>
              {depositMode === 'amount' && (
                <FormField
                  id={id('deposit')}
                  label={f.deposit}
                  error={errorFor('deposit')}
                  className="max-w-xs"
                >
                  <Input
                    id={id('deposit')}
                    name="deposit"
                    inputMode="numeric"
                    defaultValue={initial.deposit && initial.deposit > 0 ? initial.deposit : ''}
                    maxLength={12}
                    aria-invalid={Boolean(errors.deposit)}
                  />
                </FormField>
              )}
            </div>

            <FormField id={id('utilities')} label={f.utilities}>
              <Select value={utilities} onValueChange={(value) => setUtilities(value as UtilitiesPayment)}>
                <SelectTrigger id={id('utilities')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['SEPARATE', 'INCLUDED'] as const).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t.apartment.utilities[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id={id('utilitiesNote')} label={f.utilitiesNote} error={errorFor('utilitiesNote')}>
              <Input
                id={id('utilitiesNote')}
                name="utilitiesNote"
                defaultValue={initial.utilitiesNote ?? ''}
                placeholder={f.utilitiesNotePlaceholder}
                maxLength={200}
              />
            </FormField>
          </div>
        </Section>

        <Section title={ta.form.sections.amenities} hint={ta.form.sections.amenitiesHint}>
          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchRow id={id('furnished')} label={f.furnished} hint={f.furnishedHint}>
              <Switch id={id('furnished')} name="furnished" defaultChecked={initial.furnished} />
            </SwitchRow>
            <SwitchRow id={id('hasAppliances')} label={f.hasAppliances} hint={f.hasAppliancesHint}>
              <Switch id={id('hasAppliances')} name="hasAppliances" defaultChecked={initial.hasAppliances} />
            </SwitchRow>
            <SwitchRow id={id('childrenAllowed')} label={f.childrenAllowed}>
              <Switch
                id={id('childrenAllowed')}
                name="childrenAllowed"
                defaultChecked={initial.childrenAllowed}
              />
            </SwitchRow>
            <SwitchRow id={id('petsAllowed')} label={f.petsAllowed}>
              <Switch
                id={id('petsAllowed')}
                name="petsAllowed"
                checked={petsAllowed}
                onCheckedChange={setPetsAllowed}
              />
            </SwitchRow>
            {petsAllowed && (
              <>
                <SwitchRow id={id('dogsAllowed')} label={f.dogsAllowed}>
                  <Switch id={id('dogsAllowed')} name="dogsAllowed" defaultChecked={initial.dogsAllowed} />
                </SwitchRow>
                <SwitchRow id={id('catsAllowed')} label={f.catsAllowed}>
                  <Switch id={id('catsAllowed')} name="catsAllowed" defaultChecked={initial.catsAllowed} />
                </SwitchRow>
              </>
            )}
          </div>
        </Section>

        <Section title={ta.form.sections.description} hint={ta.form.sections.descriptionHint}>
          <FormField id={id('description')} label={f.description} error={errorFor('description')} required>
            <Textarea
              id={id('description')}
              name="description"
              defaultValue={initial.description}
              placeholder={f.descriptionPlaceholder}
              rows={10}
              maxLength={DESCRIPTION_MAX}
              onChange={(event) => setDescriptionLength(event.target.value.length)}
              aria-invalid={Boolean(errors.description)}
              className="min-h-56"
            />
            <p className="text-right text-xs text-muted-foreground tabular-nums">
              {fill(ta.form.charCount, { count: descriptionLength, max: DESCRIPTION_MAX })}
            </p>
          </FormField>
        </Section>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Section title={ta.form.sections.publication} hint={ta.form.sections.publicationHint}>
          <div className="grid gap-5">
            <FormField id={id('status')} label={f.status} error={errorFor('status')}>
              <Select value={status} onValueChange={(value) => setStatus(value as ApartmentStatus)}>
                <SelectTrigger id={id('status')} aria-invalid={Boolean(errors.status)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ta.status[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id={id('slug')} label={f.slug} error={errorFor('slug')} hint={f.slugHint}>
              <Input
                id={id('slug')}
                name="slug"
                defaultValue={initial.slug}
                placeholder={f.slugPlaceholder}
                maxLength={160}
                spellCheck={false}
                autoCapitalize="none"
                className="font-mono text-sm"
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={describedBy(id('slug'), errorFor('slug'), f.slugHint)}
              />
            </FormField>
            <Button type="submit" size="lg" disabled={pending} className="w-full">
              {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
              {pending ? ta.form.saving : isNew ? ta.form.create : ta.form.save}
            </Button>
          </div>
        </Section>
      </div>
    </form>
  );
}
