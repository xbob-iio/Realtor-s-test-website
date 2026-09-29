'use client';

import { LoaderCircle, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useDictionary } from '@/i18n/client';
import { fill, plural } from '@/i18n/format';
import {
  buildCatalogHref,
  buildFilterKey,
  countActiveFilters,
  filtersToSearchParams,
  resetFilters,
  type CatalogFilters,
} from '@/lib/catalog/filters';

import { useCatalog } from './catalog-shell';
import { FiltersForm, type DistrictCounts } from './filters-form';

interface FiltersProps {
  filters: CatalogFilters;
  districtCounts: DistrictCounts;
}

/**
 * Оптимистичное состояние: интерфейс реагирует сразу, а URL и данные
 * догоняют. При смене URL снаружи (назад, сброс) состояние синхронизируется.
 */
function useOptimisticFilters(filters: CatalogFilters) {
  const key = buildFilterKey(filters);
  const [state, setState] = useState(filters);
  const [syncedKey, setSyncedKey] = useState(key);
  if (key !== syncedKey) {
    setSyncedKey(key);
    setState(filters);
  }
  return [state, setState] as const;
}

/** Боковая панель фильтров (десктоп): изменения применяются сразу */
export function DesktopFilters({ filters, districtCounts }: FiltersProps) {
  const t = useDictionary();
  const { navigate } = useCatalog();
  const [value, setValue] = useOptimisticFilters(filters);
  const active = countActiveFilters(value);

  function apply(next: CatalogFilters) {
    setValue(next);
    navigate(buildCatalogHref(next));
  }

  return (
    <div className="rounded-3xl border bg-background p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{t.filters.title}</h2>
        {active > 0 && (
          <button
            type="button"
            onClick={() => apply(resetFilters(value))}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand"
          >
            <RotateCcw className="size-3.5" />
            {t.filters.reset}
          </button>
        )}
      </div>
      <FiltersForm value={value} onChange={apply} districtCounts={districtCounts} />
    </div>
  );
}

/** Кнопка «Фильтры» и нижняя панель (мобильные): применение по кнопке «Показать N» */
export function MobileFilters({ filters, districtCounts, total }: FiltersProps & { total: number }) {
  const t = useDictionary();
  const { navigate } = useCatalog();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  const active = countActiveFilters(filters);
  const draftKey = buildFilterKey(draft);
  const appliedKey = buildFilterKey(filters);

  // Предварительный подсчёт результатов для черновика фильтров
  useEffect(() => {
    if (!open || draftKey === appliedKey) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCounting(true);
      try {
        const query = filtersToSearchParams(draft, { includeCity: true, includePage: false });
        const response = await fetch(`/api/apartments/count?${query}`, { signal: controller.signal });
        if (response.ok) {
          const data = (await response.json()) as { count: number };
          setCount(data.count);
        }
      } catch {
        // запрос отменён или сеть недоступна — оставляем прежнее значение
      } finally {
        if (!controller.signal.aborted) setCounting(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, draft, draftKey, appliedKey]);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(filters);
    setOpen(next);
  }

  function changeDraft(next: CatalogFilters) {
    setDraft(next);
    setCount(null);
  }

  function apply() {
    setOpen(false);
    navigate(buildCatalogHref({ ...draft, page: 1 }), { scroll: true });
  }

  const shownCount = draftKey === appliedKey ? total : count;
  const resultsLabel =
    shownCount === null
      ? t.filters.showResultsLoading
      : fill(t.filters.showResults, { count: shownCount, noun: plural(shownCount, t.plurals.options) });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto lg:hidden">
          <SlidersHorizontal />
          {t.filters.open}
          {active > 0 && (
            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
              {active}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[92dvh]">
        <SheetHeader className="border-b">
          <SheetTitle>{t.filters.title}</SheetTitle>
          <SheetDescription className="sr-only">{t.catalog.subtitle}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <FiltersForm value={draft} onChange={changeDraft} districtCounts={districtCounts} debounceMs={0} />
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-2 border-t bg-background p-4">
          <Button variant="ghost" onClick={() => changeDraft(resetFilters(draft))}>
            {t.filters.reset}
          </Button>
          <Button variant="brand" size="lg" onClick={apply} disabled={shownCount === null && counting}>
            {counting && <LoaderCircle className="animate-spin" />}
            {resultsLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
