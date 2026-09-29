'use client';

import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LeadStatus } from '@/generated/prisma/enums';
import { useAdminDictionary } from '@/i18n/admin-client';
import { deleteLeadAction, updateLeadStatusAction } from '@/server/actions/leads';

import { ConfirmDialog } from './confirm-dialog';

const STATUSES: LeadStatus[] = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];

export function LeadControls({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const ta = useAdminDictionary();
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function changeStatus(next: LeadStatus) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const result = await updateLeadStatusAction(leadId, next);
      if (result.ok) {
        toast.success(ta.leads.toasts.status);
        router.refresh();
      } else {
        setValue(previous);
        toast.error(result.message === 'rateLimited' ? ta.common.rateLimited : ta.leads.toasts.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(next) => changeStatus(next as LeadStatus)} disabled={pending}>
        <SelectTrigger size="sm" className="w-44" aria-label={ta.leads.statusLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {ta.leadStatus[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={ta.leads.delete}
        title={ta.leads.delete}
        onClick={() => setConfirmOpen(true)}
        className="text-muted-foreground hover:bg-destructive/8 hover:text-destructive"
      >
        <Trash className="size-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={ta.leads.deleteConfirmTitle}
        description={ta.leads.deleteConfirmText}
        confirmLabel={ta.leads.delete}
        destructive
        onConfirm={async () => {
          const result = await deleteLeadAction(leadId);
          if (result.ok) {
            toast.success(ta.leads.toasts.deleted);
            router.refresh();
          } else {
            toast.error(ta.leads.toasts.error);
          }
          return result.ok;
        }}
      />
    </div>
  );
}
