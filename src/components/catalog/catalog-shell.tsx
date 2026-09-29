'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';

import { useDictionary } from '@/i18n/client';
import { cn } from '@/lib/utils';

interface CatalogContextValue {
  isPending: boolean;
  navigate: (href: string, options?: { scroll?: boolean }) => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

/** Общее состояние каталога: переход по новым фильтрам как transition + индикатор загрузки */
export function CatalogShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      startTransition(() => router.push(href, { scroll: options?.scroll ?? false }));
    },
    [router],
  );

  const value = useMemo(() => ({ isPending, navigate }), [isPending, navigate]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside <CatalogShell>');
  return context;
}

/** Результаты: во время загрузки новых данных плавно приглушаются */
export function CatalogResults({ children }: { children: React.ReactNode }) {
  const t = useDictionary();
  const { isPending } = useCatalog();
  return (
    <div className="relative" aria-busy={isPending}>
      <div className={cn('transition-opacity duration-300', isPending && 'pointer-events-none opacity-45')}>
        {children}
      </div>
      {isPending && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center">
          <span className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-semibold shadow-elevated">
            <LoaderCircle className="size-4 animate-spin text-brand" />
            {t.common.loading}
          </span>
        </div>
      )}
    </div>
  );
}
