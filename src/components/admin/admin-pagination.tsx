import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { fill } from '@/i18n/format';

export function AdminPagination({
  page,
  pageCount,
  hrefFor,
  label,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  label: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-center gap-3" aria-label={label}>
      <Button asChild={page > 1} variant="outline" size="icon" disabled={page <= 1}>
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} aria-label="←">
            <ChevronLeft />
          </Link>
        ) : (
          <ChevronLeft />
        )}
      </Button>
      <span className="text-sm font-medium text-muted-foreground">
        {fill(label, { page, total: pageCount })}
      </span>
      <Button asChild={page < pageCount} variant="outline" size="icon" disabled={page >= pageCount}>
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} aria-label="→">
            <ChevronRight />
          </Link>
        ) : (
          <ChevronRight />
        )}
      </Button>
    </nav>
  );
}
