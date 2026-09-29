import {
  Archive,
  ArrowRight,
  Building,
  EyeOff,
  FilePen,
  Inbox,
  KeyRound,
  Plus,
  Send,
  TriangleAlert,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { DemoCleanupButton } from '@/components/admin/demo-cleanup-button';
import { AdminCard, AdminPageHeader } from '@/components/admin/page-header';
import { ApartmentStatusBadge, LeadStatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { getAdminDictionary, getDictionary } from '@/i18n';
import { fill, formatDateTime, formatPrice } from '@/i18n/format';
import { cn } from '@/lib/utils';
import { requireAdmin } from '@/server/auth/guard';
import { getDashboardStats, getRecentApartments, getRecentLeads } from '@/server/queries/admin';
import { getSiteSettings, hasContacts, hasLegalDetails } from '@/server/settings';

export const metadata: Metadata = { title: getAdminDictionary().dashboard.title };

export default async function DashboardPage() {
  const user = await requireAdmin();
  const ta = getAdminDictionary();
  const t = getDictionary();
  const [stats, leads, apartments, settings] = await Promise.all([
    getDashboardStats(),
    getRecentLeads(5),
    getRecentApartments(5),
    getSiteSettings(),
  ]);

  const cards = [
    { label: ta.dashboard.stats.total, value: stats.total, icon: Building, href: '/admin/apartments' },
    {
      label: ta.dashboard.stats.published,
      value: stats.published,
      icon: Send,
      href: '/admin/apartments?status=PUBLISHED',
      tone: 'success',
    },
    {
      label: ta.dashboard.stats.hidden,
      value: stats.hidden,
      icon: EyeOff,
      href: '/admin/apartments?status=HIDDEN',
    },
    {
      label: ta.dashboard.stats.rented,
      value: stats.rented,
      icon: KeyRound,
      href: '/admin/apartments?status=RENTED',
    },
    {
      label: ta.dashboard.stats.drafts,
      value: stats.drafts,
      icon: FilePen,
      href: '/admin/apartments?status=DRAFT',
    },
    {
      label: ta.dashboard.stats.archived,
      value: stats.archived,
      icon: Archive,
      href: '/admin/apartments?status=ARCHIVED',
    },
    {
      label: ta.dashboard.stats.newLeads,
      value: stats.newLeads,
      icon: Inbox,
      href: '/admin/leads?status=NEW',
      tone: 'brand',
    },
  ] as const;

  const warnings = [
    !hasLegalDetails(settings) && { text: ta.dashboard.warnings.legal, action: 'settings' as const },
    !hasContacts(settings) && { text: ta.dashboard.warnings.contacts, action: 'settings' as const },
    stats.demo > 0 && {
      text: fill(ta.dashboard.warnings.demo, { count: stats.demo }),
      action: 'demo' as const,
    },
  ].filter(Boolean) as { text: string; action: 'settings' | 'demo' }[];

  return (
    <>
      <AdminPageHeader
        title={`${ta.dashboard.greeting}, ${user.name ?? user.email.split('@')[0]}`}
        description={ta.dashboard.subtitle}
        actions={
          <Button asChild variant="brand">
            <Link href="/admin/apartments/new">
              <Plus />
              {ta.dashboard.addApartment}
            </Link>
          </Button>
        }
      />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map(({ label, value, icon: Icon, href, ...rest }) => {
          const tone = 'tone' in rest ? rest.tone : undefined;
          return (
            <li key={label}>
              <Link
                href={href}
                className="group flex h-full flex-col justify-between gap-4 rounded-3xl border bg-background p-5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card"
              >
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-2xl',
                    tone === 'success'
                      ? 'bg-success-soft text-success'
                      : tone === 'brand'
                        ? 'bg-brand-soft text-brand'
                        : 'bg-secondary text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-3xl font-bold tracking-tight tabular-nums">{value}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {warnings.length > 0 && (
        <AdminCard title={ta.dashboard.attention} className="mt-6 border-warning/40 bg-warning-soft/40">
          <ul className="grid gap-3">
            {warnings.map((warning) => (
              <li
                key={warning.text}
                className="flex flex-col gap-3 rounded-2xl bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="flex items-start gap-3 text-[15px]">
                  <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
                  {warning.text}
                </span>
                {warning.action === 'demo' ? (
                  <DemoCleanupButton />
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/settings">{ta.dashboard.warnings.fillSettings}</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminCard
          title={ta.dashboard.recentLeads}
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/leads">
                {ta.dashboard.allLeads}
                <ArrowRight />
              </Link>
            </Button>
          }
        >
          {leads.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">{ta.dashboard.noLeads}</p>
          ) : (
            <ul className="divide-y">
              {leads.map((lead) => (
                <li
                  key={lead.id}
                  className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.phone}
                      {lead.apartment ? ` · ${lead.apartment.title}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(lead.createdAt)}</p>
                  </div>
                  <LeadStatusBadge status={lead.status} label={ta.leadStatus[lead.status]} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard
          title={ta.dashboard.recentApartments}
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/apartments">
                {ta.dashboard.allApartments}
                <ArrowRight />
              </Link>
            </Button>
          }
        >
          {apartments.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">{ta.apartments.empty}</p>
          ) : (
            <ul className="divide-y">
              {apartments.map((apartment) => (
                <li key={apartment.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/admin/apartments/${apartment.id}`} className="group flex items-center gap-3">
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {apartment.images[0] && (
                        <Image
                          src={apartment.images[0].url}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold group-hover:text-brand">
                        {apartment.title}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {formatPrice(apartment.price, apartment.currency)} · {t.cities[apartment.city].name}
                      </span>
                    </span>
                    <ApartmentStatusBadge status={apartment.status} label={ta.status[apartment.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </>
  );
}
