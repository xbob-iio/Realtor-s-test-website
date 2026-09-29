'use client';

import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAdminDictionary } from '@/i18n/admin-client';
import { deleteDemoDataAction } from '@/server/actions/apartments';

import { ConfirmDialog } from './confirm-dialog';

export function DemoCleanupButton() {
  const ta = useAdminDictionary();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Trash />
        {ta.dashboard.warnings.deleteDemo}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={ta.dashboard.deleteDemoConfirm.title}
        description={ta.dashboard.deleteDemoConfirm.text}
        confirmLabel={ta.dashboard.deleteDemoConfirm.confirm}
        destructive
        onConfirm={async () => {
          const result = await deleteDemoDataAction();
          if (result.ok) {
            toast.success(ta.dashboard.demoDeleted);
            router.refresh();
          } else {
            toast.error(
              result.message === 'rateLimited' ? ta.common.rateLimited : ta.apartments.toasts.error,
            );
          }
          return result.ok;
        }}
      />
    </>
  );
}
