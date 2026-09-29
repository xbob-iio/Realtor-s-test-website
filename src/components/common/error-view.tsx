'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useDictionary } from '@/i18n/client';
import { fill } from '@/i18n/format';

/**
 * Экран ошибки. Пользователь видит только понятный текст и короткий код
 * (digest) для поддержки — никаких стеков, путей и внутренних сообщений.
 */
export function ErrorView({ digest, reset }: { digest?: string; reset: () => void }) {
  const t = useDictionary();
  return (
    <div className="container-page flex min-h-[60dvh] items-center justify-center py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-warning-soft text-warning">
          <TriangleAlert className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">{t.errors.genericTitle}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t.errors.genericText}</p>
        {digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {fill(t.errors.errorCode, { code: digest })}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>
            <RotateCcw />
            {t.common.tryAgain}
          </Button>
          <Button asChild variant="outline">
            <Link href="/">{t.common.home}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
