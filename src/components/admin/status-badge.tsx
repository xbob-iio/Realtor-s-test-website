import { Badge } from '@/components/ui/badge';
import type { ApartmentStatus, LeadStatus } from '@/generated/prisma/enums';

const APARTMENT_VARIANT: Record<ApartmentStatus, React.ComponentProps<typeof Badge>['variant']> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  HIDDEN: 'warning',
  RENTED: 'soft',
  ARCHIVED: 'outline',
};

const LEAD_VARIANT: Record<LeadStatus, React.ComponentProps<typeof Badge>['variant']> = {
  NEW: 'brand',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'secondary',
};

export function ApartmentStatusBadge({ status, label }: { status: ApartmentStatus; label: string }) {
  return (
    <Badge variant={APARTMENT_VARIANT[status]}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export function LeadStatusBadge({ status, label }: { status: LeadStatus; label: string }) {
  return <Badge variant={LEAD_VARIANT[status]}>{label}</Badge>;
}
