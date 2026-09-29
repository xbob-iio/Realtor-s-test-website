'use client';

import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { startTransition, useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminDictionary } from '@/i18n/admin-client';
import { fill } from '@/i18n/format';
import { loginAction } from '@/server/actions/auth';
import { IDLE } from '@/server/actions/types';

export function LoginForm({ next }: { next?: string }) {
  const ta = useAdminDictionary();
  const [state, dispatch, pending] = useActionState(loginAction, IDLE);
  const [showPassword, setShowPassword] = useState(false);

  let error: string | null = null;
  if (state.status === 'error' && state.message) {
    if (state.message.startsWith('rateLimited:')) {
      error = fill(ta.login.errors.rateLimited, { minutes: state.message.split(':')[1] ?? '15' });
    } else {
      error = ta.login.errors[state.message as keyof typeof ta.login.errors] ?? ta.login.errors.generic;
    }
  }

  return (
    <form
      className="mt-8 grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => dispatch(data));
      }}
    >
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid gap-2">
        <Label htmlFor="email">{ta.login.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          maxLength={254}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{ta.login.password}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            maxLength={128}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? ta.login.hidePassword : ta.login.showPassword}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <LoaderCircle className="animate-spin" /> : <LogIn />}
        {pending ? ta.login.submitting : ta.login.submit}
      </Button>
    </form>
  );
}
