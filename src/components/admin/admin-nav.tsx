'use client';

import { ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, Settings, Building } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { LogoMark } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAdminDictionary } from '@/i18n/admin-client';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/server/actions/auth';

interface AdminNavProps {
  siteName: string;
  email: string;
  newLeads: number;
}

function useNavItems(newLeads: number) {
  const ta = useAdminDictionary();
  return [
    { href: '/admin', label: ta.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/admin/apartments', label: ta.nav.apartments, icon: Building },
    { href: '/admin/leads', label: ta.nav.leads, icon: Inbox, badge: newLeads },
    { href: '/admin/settings', label: ta.nav.settings, icon: Settings },
  ];
}

function NavList({ newLeads, onNavigate }: { newLeads: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = useNavItems(newLeads);
  return (
    <ul className="grid gap-1">
      {items.map(({ href, label, icon: Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/75 hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="size-[18px]" />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span
                  className={cn(
                    'min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold tabular-nums',
                    active ? 'bg-white/20 text-white' : 'bg-brand text-brand-foreground',
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function AccountBlock({ email }: { email: string }) {
  const ta = useAdminDictionary();
  return (
    <div className="grid gap-1 border-t pt-4">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ExternalLink className="size-4" />
        {ta.nav.openSite}
      </Link>
      <div className="px-3.5 pt-2 pb-1 text-xs break-all text-muted-foreground">{email}</div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive"
        >
          <LogOut className="size-4" />
          {ta.nav.logout}
        </button>
      </form>
    </div>
  );
}

/** Боковая панель (десктоп) */
export function AdminSidebar({ siteName, email, newLeads }: AdminNavProps) {
  const ta = useAdminDictionary();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background px-4 py-6 lg:flex">
      <Link href="/admin" className="mb-8 flex items-center gap-2.5 px-2">
        <LogoMark className="size-9" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-extrabold tracking-[0.12em] uppercase">
            {siteName}
          </span>
          <span className="block text-xs text-muted-foreground">{ta.title}</span>
        </span>
      </Link>
      <nav aria-label={ta.nav.navigation} className="flex-1">
        <NavList newLeads={newLeads} />
      </nav>
      <AccountBlock email={email} />
    </aside>
  );
}

/** Верхняя панель и меню (мобильные) */
export function AdminMobileBar({ siteName, email, newLeads }: AdminNavProps) {
  const ta = useAdminDictionary();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl lg:hidden">
      <Link href="/admin" className="flex items-center gap-2.5">
        <LogoMark className="size-8" />
        <span className="text-sm font-extrabold tracking-[0.12em] uppercase">{siteName}</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label={ta.nav.menu}>
            <Menu className="size-5" />
            {newLeads > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-brand" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="px-4 py-6">
          <SheetTitle className="px-2">{ta.title}</SheetTitle>
          <SheetDescription className="sr-only">{ta.nav.navigation}</SheetDescription>
          <nav aria-label={ta.nav.navigation} className="mt-6 flex-1">
            <NavList newLeads={newLeads} onNavigate={() => setOpen(false)} />
          </nav>
          <AccountBlock email={email} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
