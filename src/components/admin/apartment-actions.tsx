'use client';

import { Archive, Ellipsis, ExternalLink, EyeOff, KeyRound, Pencil, Send, Trash, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ApartmentStatus } from '@/generated/prisma/enums';
import { useAdminDictionary } from '@/i18n/admin-client';
import { fill } from '@/i18n/format';
import { changeApartmentStatusAction, deleteApartmentAction } from '@/server/actions/apartments';
import type { ActionResult } from '@/server/actions/types';

import { ConfirmDialog } from './confirm-dialog';

interface ApartmentRef {
  id: string;
  title: string;
  slug: string;
  status: ApartmentStatus;
}

type PendingConfirm = 'delete' | 'archive' | 'rented' | 'unpublish' | null;

function useApartmentActions(apartment: ApartmentRef, afterDelete?: string) {
  const ta = useAdminDictionary();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function errorMessage(result: ActionResult) {
    if (result.message === 'needPhoto') return ta.apartments.toasts.needPhoto;
    if (result.message === 'notFound') return ta.apartments.toasts.notFound;
    if (result.message === 'rateLimited') return ta.common.rateLimited;
    return ta.apartments.toasts.error;
  }

  const successMessage: Record<ApartmentStatus, string> = {
    PUBLISHED: ta.apartments.toasts.published,
    HIDDEN: ta.apartments.toasts.unpublished,
    RENTED: ta.apartments.toasts.rented,
    ARCHIVED: ta.apartments.toasts.archived,
    DRAFT: ta.apartments.toasts.draft,
  };

  async function setStatus(status: ApartmentStatus): Promise<boolean> {
    const result = await changeApartmentStatusAction(apartment.id, status);
    if (result.ok) {
      toast.success(successMessage[status]);
      router.refresh();
    } else {
      toast.error(errorMessage(result));
    }
    return result.ok;
  }

  async function remove(): Promise<boolean> {
    const result = await deleteApartmentAction(apartment.id);
    if (result.ok) {
      toast.success(ta.apartments.toasts.deleted);
      if (afterDelete) router.push(afterDelete);
      else router.refresh();
    } else {
      toast.error(errorMessage(result));
    }
    return result.ok;
  }

  return {
    pending,
    setStatus: (status: ApartmentStatus) => startTransition(async () => void (await setStatus(status))),
    setStatusAsync: setStatus,
    remove,
  };
}

function ConfirmDialogs({
  apartment,
  confirm,
  setConfirm,
  actions,
}: {
  apartment: ApartmentRef;
  confirm: PendingConfirm;
  setConfirm: (value: PendingConfirm) => void;
  actions: ReturnType<typeof useApartmentActions>;
}) {
  const ta = useAdminDictionary();
  const c = ta.apartments.confirm;
  const config = {
    delete: {
      title: c.deleteTitle,
      description: fill(c.deleteText, { title: apartment.title }),
      confirmLabel: c.deleteConfirm,
      destructive: true,
      run: actions.remove,
    },
    archive: {
      title: c.archiveTitle,
      description: c.archiveText,
      confirmLabel: c.archiveConfirm,
      destructive: false,
      run: () => actions.setStatusAsync('ARCHIVED'),
    },
    rented: {
      title: c.rentedTitle,
      description: c.rentedText,
      confirmLabel: c.rentedConfirm,
      destructive: false,
      run: () => actions.setStatusAsync('RENTED'),
    },
    unpublish: {
      title: c.unpublishTitle,
      description: c.unpublishText,
      confirmLabel: c.unpublishConfirm,
      destructive: false,
      run: () => actions.setStatusAsync('HIDDEN'),
    },
  } as const;
  const current = confirm ? config[confirm] : null;

  return (
    <ConfirmDialog
      open={confirm !== null}
      onOpenChange={(open) => !open && setConfirm(null)}
      title={current?.title ?? ''}
      description={current?.description ?? ''}
      confirmLabel={current?.confirmLabel ?? ''}
      destructive={current?.destructive}
      onConfirm={async () => (current ? current.run() : true)}
    />
  );
}

/** Меню действий в строке таблицы */
export function ApartmentRowActions({ apartment }: { apartment: ApartmentRef }) {
  const ta = useAdminDictionary();
  const actions = useApartmentActions(apartment);
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const a = ta.apartments.actions;
  const { status } = apartment;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={a.open} disabled={actions.pending}>
            <Ellipsis className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem asChild>
            <Link href={`/admin/apartments/${apartment.id}`}>
              <Pencil />
              {a.edit}
            </Link>
          </DropdownMenuItem>
          {status === 'PUBLISHED' && (
            <DropdownMenuItem asChild>
              <Link href={`/apartments/${apartment.slug}`} target="_blank">
                <ExternalLink />
                {a.view}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {status !== 'PUBLISHED' && (
            <DropdownMenuItem onSelect={() => actions.setStatus('PUBLISHED')}>
              <Send />
              {a.publish}
            </DropdownMenuItem>
          )}
          {status === 'PUBLISHED' && (
            <DropdownMenuItem onSelect={() => setConfirm('unpublish')}>
              <EyeOff />
              {a.unpublish}
            </DropdownMenuItem>
          )}
          {status !== 'RENTED' && (
            <DropdownMenuItem onSelect={() => setConfirm('rented')}>
              <KeyRound />
              {a.rented}
            </DropdownMenuItem>
          )}
          {status !== 'ARCHIVED' && (
            <DropdownMenuItem onSelect={() => setConfirm('archive')}>
              <Archive />
              {a.archive}
            </DropdownMenuItem>
          )}
          {(status === 'ARCHIVED' || status === 'RENTED') && (
            <DropdownMenuItem onSelect={() => actions.setStatus('DRAFT')}>
              <Undo2 />
              {a.toDraft}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm('delete')}>
            <Trash />
            {a.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialogs apartment={apartment} confirm={confirm} setConfirm={setConfirm} actions={actions} />
    </>
  );
}

/** Панель кнопок статуса на странице редактирования */
export function ApartmentStatusPanel({ apartment }: { apartment: ApartmentRef }) {
  const ta = useAdminDictionary();
  const actions = useApartmentActions(apartment, '/admin/apartments');
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const a = ta.apartments.actions;
  const { status } = apartment;

  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'PUBLISHED' ? (
        <Button variant="brand" onClick={() => actions.setStatus('PUBLISHED')} disabled={actions.pending}>
          <Send />
          {a.publish}
        </Button>
      ) : (
        <>
          <Button asChild variant="outline">
            <Link href={`/apartments/${apartment.slug}`} target="_blank">
              <ExternalLink />
              {a.view}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setConfirm('unpublish')} disabled={actions.pending}>
            <EyeOff />
            {a.unpublish}
          </Button>
        </>
      )}
      {status !== 'RENTED' && (
        <Button variant="outline" onClick={() => setConfirm('rented')} disabled={actions.pending}>
          <KeyRound />
          {a.rented}
        </Button>
      )}
      {status !== 'ARCHIVED' && (
        <Button variant="outline" onClick={() => setConfirm('archive')} disabled={actions.pending}>
          <Archive />
          {a.archive}
        </Button>
      )}
      <Button
        variant="ghost"
        className="text-destructive hover:bg-destructive/8 hover:text-destructive"
        onClick={() => setConfirm('delete')}
        disabled={actions.pending}
      >
        <Trash />
        {a.delete}
      </Button>
      <ConfirmDialogs apartment={apartment} confirm={confirm} setConfirm={setConfirm} actions={actions} />
    </div>
  );
}
