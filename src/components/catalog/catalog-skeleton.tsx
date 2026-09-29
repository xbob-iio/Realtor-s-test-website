import { ApartmentCardSkeleton } from '@/components/apartments/apartment-card';

/** Скелетон каталога — показывается при первой загрузке страницы */
export function CatalogSkeleton() {
  return (
    <div className="container-page py-8 lg:py-12" aria-busy="true">
      <div className="skeleton-shimmer h-4 w-48 rounded-lg" />
      <div className="mt-6 space-y-3">
        <div className="skeleton-shimmer h-11 w-3/4 max-w-xl rounded-xl" />
        <div className="skeleton-shimmer h-5 w-2/3 max-w-lg rounded-lg" />
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="hidden space-y-5 rounded-3xl border p-6 lg:block">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-3">
              <div className="skeleton-shimmer h-4 w-24 rounded-lg" />
              <div className="skeleton-shimmer h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <div className="flex justify-between">
            <div className="skeleton-shimmer h-6 w-40 rounded-lg" />
            <div className="skeleton-shimmer h-11 w-48 rounded-full" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <ApartmentCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
