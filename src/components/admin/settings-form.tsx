'use client';

import { LoaderCircle, Plus, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CITIES } from '@/config/cities';
import type { City } from '@/generated/prisma/enums';
import { useAdminDictionary } from '@/i18n/admin-client';
import { useDictionary } from '@/i18n/client';
import { saveSettingsAction } from '@/server/actions/settings';
import { IDLE } from '@/server/actions/types';

import { FormField } from './form-field';

export interface SettingsFormValues {
  siteName: string;
  companyDescription: string;
  defaultCity: City;
  phone: string;
  email: string;
  telegramUrl: string;
  viberUrl: string;
  whatsappUrl: string;
  workingHours: string;
  socialLinks: { label: string; url: string }[];
  seoTitle: string;
  seoDescription: string;
  legalCompanyName: string;
  legalAddress: string;
  legalEmail: string;
  legalPhone: string;
  gaMeasurementId: string;
  metaPixelId: string;
  usdRate: number;
  eurRate: number;
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-background p-5 sm:p-7">
      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial }: { initial: SettingsFormValues }) {
  const ta = useAdminDictionary();
  const t = useDictionary();
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(saveSettingsAction, IDLE);
  const [defaultCity, setDefaultCity] = useState<City>(initial.defaultCity);
  const [socialLinks, setSocialLinks] = useState(initial.socialLinks);

  const f = ta.settings.fields;
  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {};
  const errorFor = (field: string) => {
    const key = errors[field];
    return key
      ? (ta.settings.errors[key as keyof typeof ta.settings.errors] ?? ta.settings.errors.generic)
      : null;
  };

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(ta.settings.saved);
      router.refresh();
    } else if (state.status === 'error') {
      toast.error(state.message === 'rateLimited' ? ta.common.rateLimited : ta.settings.errors.generic);
    }
  }, [state, router, ta]);

  function text(
    name: keyof SettingsFormValues,
    label: string,
    options: { hint?: string; placeholder?: string; type?: string; full?: boolean; maxLength?: number } = {},
  ) {
    const id = `settings-${name}`;
    return (
      <FormField
        id={id}
        label={label}
        hint={options.hint}
        error={errorFor(name)}
        className={options.full ? 'sm:col-span-2' : undefined}
      >
        <Input
          id={id}
          name={name}
          type={options.type ?? 'text'}
          defaultValue={String(initial[name] ?? '')}
          placeholder={options.placeholder}
          maxLength={options.maxLength ?? 300}
          aria-invalid={Boolean(errors[name])}
        />
      </FormField>
    );
  }

  return (
    <form
      noValidate
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        data.set('defaultCity', defaultCity);
        data.set(
          'socialLinks',
          JSON.stringify(socialLinks.filter((link) => link.label.trim() || link.url.trim())),
        );
        startTransition(() => dispatch(data));
      }}
    >
      <Card title={ta.settings.sections.general} hint={ta.settings.sections.generalHint}>
        {text('siteName', f.siteName, { maxLength: 60 })}
        <FormField id="settings-defaultCity" label={f.defaultCity}>
          <Select value={defaultCity} onValueChange={(value) => setDefaultCity(value as City)}>
            <SelectTrigger id="settings-defaultCity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city.code} value={city.code}>
                  {t.cities[city.code].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          id="settings-companyDescription"
          label={f.companyDescription}
          hint={f.companyDescriptionHint}
          error={errorFor('companyDescription')}
          className="sm:col-span-2"
        >
          <Textarea
            id="settings-companyDescription"
            name="companyDescription"
            defaultValue={initial.companyDescription}
            maxLength={1500}
            rows={4}
          />
        </FormField>
      </Card>

      <Card title={ta.settings.sections.contacts} hint={ta.settings.sections.contactsHint}>
        {text('phone', f.phone, { type: 'tel', placeholder: '+380 50 000 00 00', maxLength: 32 })}
        {text('email', f.email, { type: 'email', maxLength: 254 })}
        {text('telegramUrl', f.telegramUrl, { hint: f.telegramHint, placeholder: 'https://t.me/username' })}
        {text('whatsappUrl', f.whatsappUrl, {
          hint: f.whatsappHint,
          placeholder: 'https://wa.me/380XXXXXXXXX',
        })}
        {text('viberUrl', f.viberUrl, {
          hint: f.viberHint,
          placeholder: 'viber://chat?number=%2B380XXXXXXXXX',
        })}
        {text('workingHours', f.workingHours, { placeholder: f.workingHoursPlaceholder, maxLength: 120 })}

        <div className="grid gap-3 sm:col-span-2">
          <div>
            <p className="text-sm font-medium">{f.socialLinks}</p>
            <p className="text-xs text-muted-foreground">{f.socialLinksHint}</p>
          </div>
          {socialLinks.map((link, index) => (
            <div key={index} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <Input
                aria-label={f.socialLabel}
                placeholder="Instagram"
                value={link.label}
                maxLength={40}
                onChange={(event) =>
                  setSocialLinks((current) =>
                    current.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)),
                  )
                }
              />
              <Input
                aria-label={f.socialUrl}
                placeholder="https://instagram.com/…"
                value={link.url}
                maxLength={300}
                onChange={(event) =>
                  setSocialLinks((current) =>
                    current.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={f.removeSocial}
                onClick={() => setSocialLinks((current) => current.filter((_, i) => i !== index))}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          {errorFor('socialLinks') && <p className="text-sm text-destructive">{errorFor('socialLinks')}</p>}
          {socialLinks.length < 8 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => setSocialLinks((current) => [...current, { label: '', url: '' }])}
            >
              <Plus />
              {f.addSocial}
            </Button>
          )}
        </div>
      </Card>

      <Card title={ta.settings.sections.legal} hint={ta.settings.sections.legalHint}>
        {text('legalCompanyName', f.legalCompanyName, { maxLength: 200 })}
        {text('legalAddress', f.legalAddress, { maxLength: 300 })}
        {text('legalEmail', f.legalEmail, { type: 'email', maxLength: 254 })}
        {text('legalPhone', f.legalPhone, { type: 'tel', maxLength: 32 })}
      </Card>

      <Card title={ta.settings.sections.seo} hint={ta.settings.sections.seoHint}>
        {text('seoTitle', f.seoTitle, { full: true, maxLength: 120, placeholder: t.meta.defaultTitle })}
        <FormField
          id="settings-seoDescription"
          label={f.seoDescription}
          error={errorFor('seoDescription')}
          className="sm:col-span-2"
        >
          <Textarea
            id="settings-seoDescription"
            name="seoDescription"
            defaultValue={initial.seoDescription}
            placeholder={t.meta.defaultDescription}
            maxLength={300}
            rows={3}
          />
        </FormField>
      </Card>

      <Card title={ta.settings.sections.cookies} hint={ta.settings.sections.cookiesHint}>
        {text('gaMeasurementId', f.gaMeasurementId, {
          hint: f.gaHint,
          placeholder: 'G-XXXXXXXXXX',
          maxLength: 32,
        })}
        {text('metaPixelId', f.metaPixelId, { hint: f.metaPixelHint, maxLength: 32 })}
      </Card>

      <Card title={ta.settings.sections.currency} hint={ta.settings.sections.currencyHint}>
        {text('usdRate', f.usdRate, { maxLength: 10 })}
        {text('eurRate', f.eurRate, { maxLength: 10 })}
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" disabled={pending} className="shadow-elevated">
          {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {ta.settings.save}
        </Button>
      </div>
    </form>
  );
}
