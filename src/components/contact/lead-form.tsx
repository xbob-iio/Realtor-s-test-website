'use client';

import { CircleCheck, LoaderCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { startTransition, useActionState, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDictionary } from '@/i18n/client';
import { fill } from '@/i18n/format';
import { cn } from '@/lib/utils';
import { submitLeadAction } from '@/server/actions/leads';
import { IDLE } from '@/server/actions/types';

const MESSENGERS = ['TELEGRAM', 'VIBER', 'WHATSAPP', 'PHONE'] as const;

interface LeadFormProps {
  formToken: string;
  apartment?: { id: string; title: string };
  className?: string;
  onSuccess?: () => void;
}

export function LeadForm({ formToken, apartment, className, onSuccess }: LeadFormProps) {
  const t = useDictionary();
  const pathname = usePathname();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch, pending] = useActionState(submitLeadAction, IDLE);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [messenger, setMessenger] = useState<(typeof MESSENGERS)[number]>('TELEGRAM');
  const [submitted, setSubmitted] = useState(false);

  const success = state.status === 'success' && submitted;
  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {};
  const formError =
    state.status === 'error' && state.message && state.message !== 'validation'
      ? (t.leadForm.errors[state.message as keyof typeof t.leadForm.errors] ?? t.leadForm.errors.generic)
      : null;

  useEffect(() => {
    if (state.status === 'success' && submitted) onSuccess?.();
  }, [state, submitted, onSuccess]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    const data = new FormData(event.currentTarget);
    data.set('consent', 'on');
    data.set('messenger', messenger);
    setSubmitted(true);
    startTransition(() => dispatch(data));
  }

  function reset() {
    formRef.current?.reset();
    setConsent(false);
    setSubmitted(false);
  }

  const fieldId = (name: string) => `${id}-${name}`;
  const errorText = (name: keyof typeof t.leadForm.errors) =>
    errors[name] ? (
      <p id={fieldId(`${name}-error`)} className="text-sm text-destructive">
        {t.leadForm.errors[name]}
      </p>
    ) : null;

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <m.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
            role="status"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
              <CircleCheck className="size-7" />
            </span>
            <p className="text-lg font-semibold">{t.leadForm.successTitle}</p>
            <p className="max-w-sm text-muted-foreground">{t.leadForm.successText}</p>
            <Button variant="outline" size="sm" onClick={reset} className="mt-2">
              {t.leadForm.sendAnother}
            </Button>
          </m.div>
        ) : (
          <m.form
            key="form"
            ref={formRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            noValidate
            className="grid gap-4"
          >
            <input type="hidden" name="formToken" value={formToken} />
            <input type="hidden" name="source" value={pathname} />
            {apartment && <input type="hidden" name="apartmentId" value={apartment.id} />}
            {/* Ловушка для ботов: невидимое поле, люди его не заполняют */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={fieldId('website')}>Website</label>
              <input id={fieldId('website')} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {apartment && (
              <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted-foreground">
                {fill(t.leadForm.apartmentContext, { title: apartment.title })}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={fieldId('name')}>{t.leadForm.name}</Label>
                <Input
                  id={fieldId('name')}
                  name="name"
                  autoComplete="name"
                  placeholder={t.leadForm.namePlaceholder}
                  maxLength={80}
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? fieldId('name-error') : undefined}
                />
                {errorText('name')}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={fieldId('phone')}>{t.leadForm.phone}</Label>
                <Input
                  id={fieldId('phone')}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t.leadForm.phonePlaceholder}
                  maxLength={40}
                  required
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? fieldId('phone-error') : undefined}
                />
                {errorText('phone')}
              </div>
            </div>

            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">{t.leadForm.messenger}</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {MESSENGERS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={messenger === value}
                    onClick={() => setMessenger(value)}
                    className={cn(
                      'h-10 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] duration-200',
                      messenger === value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:border-foreground/30',
                    )}
                  >
                    {t.leadForm.messengers[value]}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-2">
              <Label htmlFor={fieldId('message')}>
                {t.leadForm.message}{' '}
                <span className="font-normal text-muted-foreground">({t.common.optional})</span>
              </Label>
              <Textarea
                id={fieldId('message')}
                name="message"
                rows={3}
                maxLength={1000}
                placeholder={t.leadForm.messagePlaceholder}
                aria-invalid={Boolean(errors.message)}
              />
              {errorText('message')}
            </div>

            <div className="grid gap-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={fieldId('consent')}
                  checked={consent}
                  onCheckedChange={(value) => {
                    setConsent(value === true);
                    if (value === true) setConsentError(false);
                  }}
                  aria-invalid={consentError || Boolean(errors.consent)}
                  aria-describedby={consentError ? fieldId('consent-error') : undefined}
                  className="mt-0.5"
                />
                <label htmlFor={fieldId('consent')} className="text-sm leading-relaxed text-muted-foreground">
                  {t.leadForm.consentPrefix}{' '}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="font-medium text-foreground underline underline-offset-4 hover:text-brand"
                  >
                    {t.leadForm.consentLink}
                  </Link>{' '}
                  {t.leadForm.consentSuffix}
                </label>
              </div>
              {(consentError || errors.consent) && (
                <p id={fieldId('consent-error')} className="text-sm text-destructive">
                  {t.leadForm.errors.consent}
                </p>
              )}
            </div>

            {formError && (
              <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              variant="brand"
              size="lg"
              disabled={pending}
              className="w-full sm:w-auto sm:justify-self-start"
            >
              {pending && <LoaderCircle className="animate-spin" />}
              {pending ? t.leadForm.submitting : t.leadForm.submit}
            </Button>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
