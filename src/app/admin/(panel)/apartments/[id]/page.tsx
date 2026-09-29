import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ApartmentStatusPanel } from '@/components/admin/apartment-actions';
import { ApartmentForm } from '@/components/admin/apartment-form';
import { CreatedToast } from '@/components/admin/created-toast';
import { ImageManager } from '@/components/admin/image-manager';
import { AdminCard, AdminPageHeader } from '@/components/admin/page-header';
import { ApartmentStatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { getAdminDictionary } from '@/i18n';
import { formatDateTime } from '@/i18n/format';
import { requireAdmin } from '@/server/auth/guard';
import { saveApartmentAction } from '@/server/actions/apartments';
import { getAdminApartment } from '@/server/queries/admin';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await requireAdmin();
  const apartment = await getAdminApartment((await params).id);
  return { title: apartment?.title ?? getAdminDictionary().form.editTitle };
}

export default async function EditApartmentPage({ params }: PageProps) {
  await requireAdmin();
  const ta = getAdminDictionary();
  const apartment = await getAdminApartment((await params).id);
  if (!apartment) notFound();

  return (
    <>
      <Suspense>
        <CreatedToast />
      </Suspense>

      <AdminPageHeader
        title={apartment.title}
        description={`${ta.apartments.table.updated}: ${formatDateTime(apartment.updatedAt)} · /apartments/${apartment.slug}`}
      >
        <Link
          href="/admin/apartments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {ta.form.backToList}
        </Link>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <ApartmentStatusBadge status={apartment.status} label={ta.status[apartment.status]} />
          {apartment.isDemo && <Badge variant="secondary">{ta.apartments.demo}</Badge>}
        </div>
      </AdminPageHeader>

      <div className="mb-6 rounded-3xl border bg-background p-4 sm:p-5">
        <ApartmentStatusPanel
          apartment={{
            id: apartment.id,
            title: apartment.title,
            slug: apartment.slug,
            status: apartment.status,
          }}
        />
      </div>

      <AdminCard title={ta.form.sections.photos} description={ta.form.sections.photosHint} className="mb-6">
        <ImageManager apartmentId={apartment.id} initialImages={apartment.images} />
      </AdminCard>

      <ApartmentForm
        isNew={false}
        initial={{
          title: apartment.title,
          city: apartment.city,
          district: apartment.district,
          address: apartment.address,
          price: apartment.price,
          currency: apartment.currency,
          rooms: apartment.rooms,
          area: apartment.area,
          floor: apartment.floor,
          totalFloors: apartment.totalFloors,
          description: apartment.description,
          furnished: apartment.furnished,
          hasAppliances: apartment.hasAppliances,
          childrenAllowed: apartment.childrenAllowed,
          petsAllowed: apartment.petsAllowed,
          dogsAllowed: apartment.dogsAllowed,
          catsAllowed: apartment.catsAllowed,
          rentalPeriod: apartment.rentalPeriod,
          deposit: apartment.deposit,
          utilities: apartment.utilities,
          utilitiesNote: apartment.utilitiesNote,
          status: apartment.status,
          slug: apartment.slug,
        }}
        action={saveApartmentAction.bind(null, apartment.id)}
      />
    </>
  );
}
