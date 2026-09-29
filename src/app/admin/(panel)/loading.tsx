export default function AdminLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton-shimmer h-8 w-64 rounded-xl" />
        <div className="skeleton-shimmer h-4 w-80 max-w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton-shimmer h-32 rounded-3xl" />
        ))}
      </div>
      <div className="skeleton-shimmer h-80 rounded-3xl" />
    </div>
  );
}
