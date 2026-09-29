import { ArrowLeft, SearchX } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { getAdminDictionary } from '@/i18n';

export default function AdminApartmentNotFound() {
  const ta = getAdminDictionary();
  return (
    <EmptyState
      icon={SearchX}
      title={ta.common.notFoundTitle}
      description={ta.common.notFoundText}
      className="bg-background"
    >
      <Button asChild variant="outline">
        <Link href="/admin/apartments">
          <ArrowLeft />
          {ta.form.backToList}
        </Link>
      </Button>
    </EmptyState>
  );
}
