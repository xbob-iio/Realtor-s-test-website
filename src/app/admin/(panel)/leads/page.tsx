import { ExternalLink, Inbox, MessageCircle, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AdminPagination } from '@/components/admin/admin-pagination';
import { LeadControls } from '@/components/admin/lead-controls';
import { AdminPageHeader } from '@/components/admin/page-header';
import { LeadStatusBadge } from '@/components/admin/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@/generated/prisma/enums';
import { getAdminDictionary, getDictionary } from '@/i18n';
import { formatDateTime, phoneToHref } from '@/i18n/format';
import { cn } from '@/lib/utils';
import { requireAdmin } from '@/server/auth/guard';
import { getAdminLeads } from '@/server/queries/admin';
import { LEAD_STATUSES } from '@/server/validation/lead';

export const metadata: Metadata = { title: getAdminDictionary().leads.title };

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const ta = getAdminDictionary();
  const t = getDictionary();
  const params = await searchParams;
  const status = LEAD_STATUSES.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus)
    : undefined;
  const page = Math.max(1, Math.min(10_000, Number.parseInt(params.page ?? '1', 10) || 1));

  const { items, pageCount, counts } = await getAdminLeads({ status, page });
  const allCount = Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0);

  const hrefFor = (next: { status?: string; page?: number }) => {
    const search = new URLSearchParams();
    if (next.status) search.set('status', next.status);
    if (next.page && next.page > 1) search.set('page', String(next.page));
    const qs = search.toString();
    return qs ? `/admin/leads?${qs}` : '/admin/leads';
  };

  const tabs = [
    { key: 'all', status: undefined, label: ta.leads.tabs.all, count: allCount },
    ...LEAD_STATUSES.map((value) => ({
      key: value,
      status: value,
      label: ta.leads.tabs[value],
      count: counts[value] ?? 0,
    })),
  ];

  return (
    <>
      <AdminPageHeader title={ta.leads.title} description={ta.leads.subtitle} />

      <nav aria-label={ta.leads.title} className="-mx-1 mb-5 overflow-x-auto px-1">
        <ul className="flex gap-1.5">
          {tabs.map((tab) => {
            const active = tab.status === status;
            return (
              <li key={tab.key}>
                <Link
                  href={hrefFor({ status: tab.status })}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground/75 hover:bg-secondary',
                  )}
                >
                  {tab.label}
                  <span
                    className={cn('text-xs tabular-nums', active ? 'text-white/70' : 'text-muted-foreground')}
                  >
                    {tab.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status ? ta.leads.emptyFiltered : ta.leads.empty}
          className="bg-background"
        />
      ) : (
        <ul className="grid gap-3">
          {items.map((lead) => (
            <li key={lead.id} className="rounded-3xl border bg-background p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{lead.name}</h2>
                    <LeadStatusBadge status={lead.status} label={ta.leadStatus[lead.status]} />
                    {lead.isDemo && <Badge variant="secondary">{ta.leads.demo}</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <a
                      href={phoneToHref(lead.phone)}
                      className="inline-flex items-center gap-1.5 font-semibold hover:text-brand"
                    >
                      <Phone className="size-4" />
                      {lead.phone}
                    </a>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MessageCircle className="size-4" />
                      {ta.leads.messenger}: {lead.messenger ? t.leadForm.messengers[lead.messenger] : '—'}
                    </span>
                    <span className="text-muted-foreground">
                      {ta.leads.received}: {formatDateTime(lead.createdAt)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'max-w-3xl leading-relaxed whitespace-pre-line',
                      !lead.message && 'text-muted-foreground',
                    )}
                  >
                    {lead.message ?? ta.leads.noMessage}
                  </p>
                  {(lead.apartment || lead.source) && (
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                      {lead.apartment && (
                        <span className="inline-flex items-center gap-1.5">
                          {ta.leads.apartment}:{' '}
                          <Link
                            href={`/admin/apartments/${lead.apartment.id}`}
                            className="font-medium text-foreground hover:text-brand"
                          >
                            {lead.apartment.title}
                          </Link>
                          {lead.apartment.status === 'PUBLISHED' && (
                            <Link
                              href={`/apartments/${lead.apartment.slug}`}
                              target="_blank"
                              aria-label={lead.apartment.title}
                            >
                              <ExternalLink className="size-3.5" />
                            </Link>
                          )}
                        </span>
                      )}
                      {lead.source && (
                        <span>
                          {ta.leads.source}: <span className="font-mono text-xs">{lead.source}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <LeadControls key={lead.status} leadId={lead.id} status={lead.status} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminPagination
        page={page}
        pageCount={pageCount}
        hrefFor={(next) => hrefFor({ status, page: next })}
        label={ta.common.page}
      />
    </>
  );
}
