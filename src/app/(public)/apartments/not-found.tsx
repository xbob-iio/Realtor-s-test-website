import { ArrowRight, House } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/i18n';

/** Квартира не найдена, снята с публикации или уже сдана */
export default function ApartmentNotFound() {
  const t = getDictionary();
  return (
    <div className="container-page py-16 lg:py-24">
      <EmptyState
        icon={House}
        title={t.apartment.notFound.title}
        description={t.apartment.notFound.description}
      >
        <Button asChild variant="brand" size="lg">
          <Link href="/apartments">
            {t.apartment.notFound.cta}
            <ArrowRight />
          </Link>
        </Button>
      </EmptyState>
    </div>
  );
}
