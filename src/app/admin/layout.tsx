import type { Metadata } from 'next';

import { TooltipProvider } from '@/components/ui/tooltip';
import { getAdminDictionary } from '@/i18n';
import { AdminI18nProvider } from '@/i18n/admin-client';

export const metadata: Metadata = {
  title: { default: getAdminDictionary().title, template: `%s — ${getAdminDictionary().title}` },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminI18nProvider dictionary={getAdminDictionary()}>
      <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
    </AdminI18nProvider>
  );
}
