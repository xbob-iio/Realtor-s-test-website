import { ArrowLeft, ImagePlus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ApartmentForm } from '@/components/admin/apartment-form';
import { EMPTY_APARTMENT } from '@/components/admin/apartment-form-values';
import { AdminCard, AdminPageHeader } from '@/components/admin/page-header';
import { getAdminDictionary } from '@/i18n';
import { requireAdmin } from '@/server/auth/guard';
import { saveApartmentAction } from '@/server/actions/apartments';
import { getSiteSettings } from '@/server/settings';

export const metadata: Metadata = { title: getAdminDictionary().form.newTitle };

export default async function NewApartmentPage() {
  await requireAdmin();
  const ta = getAdminDictionary();
  const settings = await getSiteSettings();

  return (
    <>
      <AdminPageHeader title={ta.form.newTitle}>
        <Link
          href="/admin/apartments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {ta.form.backToList}
        </Link>
      </AdminPageHeader>

      <AdminCard title={ta.form.sections.photos} className="mb-6">
        <div className="flex items-center gap-4 rounded-2xl bg-surface p-5 text-muted-foreground">
          <ImagePlus className="size-6 shrink-0" />
          <p>{ta.images.saveFirst}</p>
        </div>
      </AdminCard>

      <ApartmentForm
        isNew
        initial={{ ...EMPTY_APARTMENT, city: settings.defaultCity }}
        action={saveApartmentAction.bind(null, null)}
      />
    </>
  );
}
