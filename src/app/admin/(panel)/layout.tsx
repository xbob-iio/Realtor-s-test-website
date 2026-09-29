import { AdminMobileBar, AdminSidebar } from '@/components/admin/admin-nav';
import { requireAdmin } from '@/server/auth/guard';
import { getNewLeadsCount } from '@/server/queries/admin';
import { getSiteSettings } from '@/server/settings';

/**
 * Оболочка панели управления. Проверка доступа здесь — для интерфейса;
 * каждая страница и каждое действие дополнительно проверяют сессию сами.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [settings, newLeads] = await Promise.all([getSiteSettings(), getNewLeadsCount()]);

  return (
    <div className="min-h-dvh bg-surface">
      <AdminSidebar siteName={settings.siteName} email={user.email} newLeads={newLeads} />
      <AdminMobileBar siteName={settings.siteName} email={user.email} newLeads={newLeads} />
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
