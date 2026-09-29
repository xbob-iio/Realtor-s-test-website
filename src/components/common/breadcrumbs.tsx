import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** Хлебные крошки. Последний элемент — текущая страница (без ссылки). */
export function Breadcrumbs({
  items,
  label,
  className,
}: {
  items: BreadcrumbItem[];
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn('text-sm text-muted-foreground', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.path} className="flex min-w-0 items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="transition-colors hover:text-foreground">
                    {item.name}
                  </Link>
                  <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
