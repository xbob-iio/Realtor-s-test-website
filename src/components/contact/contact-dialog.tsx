'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDictionary } from '@/i18n/client';
import type { ContactLink } from '@/lib/contacts';

import { ContactButtons } from './contact-buttons';
import { LeadForm } from './lead-form';

interface ContactDialogProps {
  children: React.ReactNode;
  links: ContactLink[];
  formToken: string;
  apartment?: { id: string; title: string };
  title?: string;
  description?: string;
}

/** Окно связи: мессенджеры и форма заявки */
export function ContactDialog({
  children,
  links,
  formToken,
  apartment,
  title,
  description,
}: ContactDialogProps) {
  const t = useDictionary();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title ?? t.contact.dialogTitle}</DialogTitle>
          <DialogDescription>{description ?? t.contact.dialogSubtitle}</DialogDescription>
        </DialogHeader>

        {links.length > 0 && (
          <>
            <ContactButtons links={links} t={t} />
            <div className="flex items-center gap-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <span className="h-px flex-1 bg-border" />
              {t.contact.orLeaveRequest}
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <LeadForm formToken={formToken} apartment={apartment} />
      </DialogContent>
    </Dialog>
  );
}
