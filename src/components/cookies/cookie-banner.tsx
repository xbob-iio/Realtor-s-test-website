'use client';

import { Cookie } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useDictionary } from '@/i18n/client';

import { useConsent } from './consent-provider';
import { CookiePreferencesDialog } from './cookie-preferences-dialog';

export function CookieBanner() {
  const t = useDictionary();
  const { needsDecision, acceptAll, acceptNecessary, setPreferencesOpen, preferencesOpen } = useConsent();

  return (
    <>
      <AnimatePresence>
        {needsDecision && !preferencesOpen && (
          <m.section
            role="region"
            aria-label={t.cookies.bannerTitle}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md lg:bottom-6"
          >
            <div className="rounded-3xl border bg-background/97 p-5 shadow-elevated backdrop-blur-xl sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Cookie className="size-5" />
                </span>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold">{t.cookies.bannerTitle}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t.cookies.bannerText}{' '}
                    <Link
                      href="/cookie-policy"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      {t.cookies.learnMore}
                    </Link>
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button onClick={acceptAll} className="col-span-2">
                  {t.cookies.acceptAll}
                </Button>
                <Button variant="outline" size="sm" onClick={acceptNecessary}>
                  {t.cookies.necessaryOnly}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPreferencesOpen(true)}>
                  {t.cookies.customize}
                </Button>
              </div>
            </div>
          </m.section>
        )}
      </AnimatePresence>
      <CookiePreferencesDialog />
    </>
  );
}
