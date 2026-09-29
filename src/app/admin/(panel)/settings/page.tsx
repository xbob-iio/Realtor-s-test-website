import type { Metadata } from 'next';

import { AdminCard, AdminPageHeader } from '@/components/admin/page-header';
import { SettingsForm } from '@/components/admin/settings-form';
import {
  CookieResetButton,
  LogoUploader,
  LogoutAllButton,
  PasswordForm,
} from '@/components/admin/settings-extras';
import { getAdminDictionary } from '@/i18n';
import { formatDateTime } from '@/i18n/format';
import { requireAdmin } from '@/server/auth/guard';
import { getAuditLog } from '@/server/queries/admin';
import { getSiteSettings } from '@/server/settings';

export const metadata: Metadata = { title: getAdminDictionary().settings.title };

export default async function SettingsPage() {
  await requireAdmin();
  const ta = getAdminDictionary();
  const [settings, audit] = await Promise.all([getSiteSettings(), getAuditLog(20)]);

  return (
    <>
      <AdminPageHeader title={ta.settings.title} description={ta.settings.subtitle} />

      <div className="grid gap-6">
        <AdminCard title={ta.settings.fields.logo} description={ta.settings.sections.generalHint}>
          <LogoUploader logoUrl={settings.logoUrl} siteName={settings.siteName} />
        </AdminCard>

        <SettingsForm
          initial={{
            siteName: settings.siteName,
            companyDescription: settings.companyDescription ?? '',
            defaultCity: settings.defaultCity,
            phone: settings.phone ?? '',
            email: settings.email ?? '',
            telegramUrl: settings.telegramUrl ?? '',
            viberUrl: settings.viberUrl ?? '',
            whatsappUrl: settings.whatsappUrl ?? '',
            workingHours: settings.workingHours ?? '',
            socialLinks: settings.socialLinks,
            seoTitle: settings.seoTitle ?? '',
            seoDescription: settings.seoDescription ?? '',
            legalCompanyName: settings.legal.companyName ?? '',
            legalAddress: settings.legal.address ?? '',
            legalEmail: settings.legal.email ?? '',
            legalPhone: settings.legal.phone ?? '',
            gaMeasurementId: settings.gaMeasurementId ?? '',
            metaPixelId: settings.metaPixelId ?? '',
            usdRate: settings.usdRate,
            eurRate: settings.eurRate,
          }}
        />

        <AdminCard title={ta.settings.sections.cookies} description={ta.settings.sections.cookiesHint}>
          <CookieResetButton version={settings.cookieConsentVersion} />
        </AdminCard>

        <AdminCard title={ta.settings.sections.security} description={ta.settings.sections.securityHint}>
          <div className="grid gap-8">
            <div>
              <h3 className="mb-4 font-semibold">{ta.settings.password.title}</h3>
              <PasswordForm />
            </div>
            <div className="border-t pt-6">
              <h3 className="mb-3 font-semibold">{ta.settings.sessions.title}</h3>
              <LogoutAllButton />
            </div>
            <div className="border-t pt-6">
              <h3 className="mb-3 font-semibold">{ta.settings.audit.title}</h3>
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">{ta.settings.audit.empty}</p>
              ) : (
                <ul className="divide-y rounded-2xl border text-sm">
                  {audit.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>
                        <span className="font-medium">
                          {ta.settings.audit.actions[entry.action] ?? entry.action}
                        </span>
                        {entry.details && <span className="text-muted-foreground"> · {entry.details}</span>}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {entry.user?.email ? `${entry.user.email} · ` : ''}
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
