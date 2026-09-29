import { ArrowRight, House } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { LogoMark } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/i18n';

export const metadata: Metadata = {
  title: getDictionary().errors.notFoundTitle,
  robots: { index: false },
};

/** Глобальная страница 404 */
export default function NotFound() {
  const t = getDictionary();
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-brand-soft blur-3xl"
      />
      <div className="relative mx-auto max-w-xl text-center">
        <Link href="/" aria-label={t.nav.toHome} className="inline-flex">
          <LogoMark className="size-12" />
        </Link>
        <p className="mt-10 text-sm font-semibold tracking-[0.14em] text-brand uppercase">
          {t.errors.notFoundCode}
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{t.errors.notFoundTitle}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.errors.notFoundText}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">
              <House />
              {t.common.home}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/apartments">
              {t.errors.toCatalog}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
