'use client';

import { ImagePlus, LoaderCircle, LogOut, RotateCcw, Trash } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminDictionary } from '@/i18n/admin-client';
import { fill } from '@/i18n/format';
import { ACCEPTED_IMAGE_TYPES, MAX_LOGO_BYTES } from '@/lib/images';
import { changePasswordAction, logoutAllAction } from '@/server/actions/auth';
import { removeLogoAction, resetCookieConsentAction } from '@/server/actions/settings';
import { IDLE } from '@/server/actions/types';

import { ConfirmDialog } from './confirm-dialog';
import { FormField } from './form-field';

/** Загрузка и удаление логотипа */
export function LogoUploader({ logoUrl, siteName }: { logoUrl: string | null; siteName: string }) {
  const ta = useAdminDictionary();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startUpload] = useTransition();

  function upload(file: File) {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type) || file.size > MAX_LOGO_BYTES) {
      toast.error(ta.settings.errors.logo);
      return;
    }
    startUpload(async () => {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/admin/settings/logo', { method: 'POST', body: data });
      if (response.ok) {
        toast.success(ta.settings.saved);
        router.refresh();
      } else {
        toast.error(ta.settings.errors.logo);
      }
    });
  }

  function remove() {
    startUpload(async () => {
      const result = await removeLogoAction();
      if (result.ok) {
        toast.success(ta.settings.saved);
        router.refresh();
      } else {
        toast.error(ta.settings.errors.generic);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-20 w-48 items-center justify-center rounded-2xl border bg-surface p-3">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={siteName}
            width={180}
            height={56}
            className="max-h-14 w-auto object-contain"
          />
        ) : (
          <span className="text-sm font-extrabold tracking-[0.12em] uppercase">{siteName}</span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
            {ta.settings.fields.logoUpload}
          </Button>
          {logoUrl && (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={remove}>
              <Trash />
              {ta.settings.fields.logoRemove}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{ta.settings.fields.logoHint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

/** Сброс согласия на cookies: баннер снова появится у всех посетителей */
export function CookieResetButton({ version }: { version: number }) {
  const ta = useAdminDictionary();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{fill(ta.settings.fields.cookieVersion, { version })}</p>
        <p className="text-sm text-muted-foreground">{ta.settings.fields.cookieResetHint}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw />
        {ta.settings.fields.cookieReset}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={ta.settings.fields.cookieReset}
        description={ta.settings.fields.cookieResetHint}
        confirmLabel={ta.common.confirm}
        onConfirm={async () => {
          const result = await resetCookieConsentAction();
          if (result.ok) {
            toast.success(ta.settings.fields.cookieResetDone);
            router.refresh();
          } else {
            toast.error(ta.settings.errors.generic);
          }
          return result.ok;
        }}
      />
    </div>
  );
}

/** Смена пароля администратора */
export function PasswordForm() {
  const ta = useAdminDictionary();
  const [state, dispatch, pending] = useActionState(changePasswordAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const p = ta.settings.password;
  const errors = state.status === 'error' ? (state.fieldErrors ?? {}) : {};
  const errorFor = (field: string) => {
    const key = errors[field];
    return key ? (p.errors[key as keyof typeof p.errors] ?? ta.settings.errors.generic) : null;
  };

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(p.success);
      formRef.current?.reset();
    } else if (state.status === 'error' && state.message) {
      toast.error(state.message === 'rateLimited' ? p.errors.rateLimited : ta.settings.errors.generic);
    }
  }, [state, p, ta]);

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-4 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => dispatch(data));
      }}
    >
      <FormField id="password-current" label={p.current} error={errorFor('current')}>
        <Input
          id="password-current"
          name="current"
          type="password"
          autoComplete="current-password"
          maxLength={128}
        />
      </FormField>
      <FormField id="password-next" label={p.next} error={errorFor('next')}>
        <Input id="password-next" name="next" type="password" autoComplete="new-password" maxLength={128} />
      </FormField>
      <FormField id="password-confirm" label={p.confirm} error={errorFor('confirm')}>
        <Input
          id="password-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          maxLength={128}
        />
      </FormField>
      <div className="flex flex-col gap-3 sm:col-span-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{p.hint}</p>
        <Button type="submit" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" />}
          {p.submit}
        </Button>
      </div>
    </form>
  );
}

/** Завершение всех сессий */
export function LogoutAllButton() {
  const ta = useAdminDictionary();
  const [open, setOpen] = useState(false);
  const s = ta.settings.sessions;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{s.text}</p>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <LogOut />
        {s.logoutAll}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={s.confirmTitle}
        description={s.confirmText}
        confirmLabel={s.logoutAll}
        destructive
        onConfirm={async () => {
          await logoutAllAction();
          return true;
        }}
      />
    </div>
  );
}
