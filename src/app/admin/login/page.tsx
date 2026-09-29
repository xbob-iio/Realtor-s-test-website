import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/admin/login-form';
import { LogoMark } from '@/components/layout/logo';
import { getAdminDictionary } from '@/i18n';
import { getCurrentSession } from '@/server/auth/session';

export const metadata: Metadata = {
  title: getAdminDictionary().login.metaTitle,
};

interface PageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  if (session?.user.role === 'ADMIN') redirect('/admin');

  const ta = getAdminDictionary();
  const next = (await searchParams).next;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand-soft blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="rounded-[2rem] border bg-background p-7 shadow-elevated sm:p-10">
          <div className="flex items-center gap-3">
            <LogoMark className="size-11" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{ta.login.title}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-success" />
                {ta.login.subtitle}
              </p>
            </div>
          </div>
          <LoginForm next={typeof next === 'string' ? next : undefined} />
        </div>
        <Link
          href="/"
          className="mx-auto mt-6 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {ta.login.backToSite}
        </Link>
      </div>
    </main>
  );
}
