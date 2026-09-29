export default function Loading() {
  return (
    <div className="container-page pt-6 pb-16 lg:pt-10" aria-busy="true">
      <div className="skeleton-shimmer hidden h-4 w-72 rounded-lg sm:block" />
      <div className="mt-6 space-y-3">
        <div className="skeleton-shimmer h-7 w-56 rounded-full" />
        <div className="skeleton-shimmer h-11 w-full max-w-2xl rounded-xl" />
        <div className="skeleton-shimmer h-5 w-80 max-w-full rounded-lg" />
      </div>
      <div className="skeleton-shimmer mt-6 aspect-[4/3] rounded-3xl sm:aspect-[16/10] lg:aspect-[16/9]" />
      <div className="mt-3 flex gap-2.5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton-shimmer aspect-[4/3] w-24 rounded-xl sm:w-28" />
        ))}
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="skeleton-shimmer h-20 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton-shimmer h-40 rounded-3xl" />
        </div>
        <div className="skeleton-shimmer h-96 rounded-3xl" />
      </div>
    </div>
  );
}
