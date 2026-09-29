'use client';

import { ArrowUpRight, Menu, Phone } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ContactButtons } from '@/components/contact/contact-buttons';
import { ContactDialog } from '@/components/contact/contact-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useDictionary } from '@/i18n/client';
import { phoneToHref } from '@/i18n/format';
import type { ContactLink } from '@/lib/contacts';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

interface HeaderClientProps {
  logo: React.ReactNode;
  links: ContactLink[];
  phone: string | null;
  formToken: string;
}

export function HeaderClient({ logo, links, phone, formToken }: HeaderClientProps) {
  const t = useDictionary();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);

  const nav: NavItem[] = [
    {
      href: '/apartments',
      label: t.nav.apartments,
      isActive: (path) => path.startsWith('/apartments'),
    },
    { href: '/kyiv', label: t.nav.kyiv, isActive: (path) => path.startsWith('/kyiv') },
    { href: '/dnipro', label: t.nav.dnipro, isActive: (path) => path.startsWith('/dnipro') },
    { href: '/about', label: t.nav.about, isActive: (path) => path === '/about' },
    { href: '/contacts', label: t.nav.contacts, isActive: (path) => path === '/contacts' },
  ];

  // Шапка прячется при прокрутке вниз и появляется при прокрутке вверх
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        const delta = y - lastY.current;
        if (y < 120) setHidden(false);
        else if (delta > 6) setHidden(true);
        else if (delta < -6) setHidden(false);
        lastY.current = y;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[transform,background-color,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'border-b bg-background/85 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/75',
        scrolled
          ? 'border-border shadow-[0_1px_0_rgb(0_0_0/0.02),0_8px_24px_-18px_rgb(0_0_0/0.25)]'
          : 'border-transparent',
        hidden && !menuOpen && '-translate-y-full',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[76px]">
        {logo}

        <nav aria-label={t.nav.mainNavigation} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = item.isActive(pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative rounded-full px-4 py-2 text-[15px] font-semibold transition-colors duration-200',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={cn(
                        'absolute inset-x-4 -bottom-0.5 h-0.5 origin-left rounded-full bg-brand transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                        active ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {phone && (
            <a
              href={phoneToHref(phone)}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-brand xl:inline-flex"
            >
              <Phone className="size-4" />
              {phone}
            </a>
          )}
          <ContactDialog links={links} formToken={formToken}>
            <Button className="hidden sm:inline-flex">
              {t.nav.contactCta}
              <ArrowUpRight />
            </Button>
          </ContactDialog>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label={t.nav.openMenu}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm">
              <div className="flex h-16 items-center border-b px-5">
                <SheetTitle>{t.nav.menuTitle}</SheetTitle>
                <SheetDescription className="sr-only">{t.nav.mainNavigation}</SheetDescription>
              </div>
              <nav aria-label={t.nav.mainNavigation} className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="grid gap-1">
                  {[
                    { href: '/', label: t.common.home, isActive: (path: string) => path === '/' },
                    ...nav,
                  ].map((item, index) => {
                    const active = item.isActive(pathname);
                    return (
                      <li
                        key={item.href}
                        className="animate-in duration-500 fade-in-0 fill-mode-both slide-in-from-right-4"
                        style={{ animationDelay: `${60 + index * 40}ms` }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-semibold transition-colors',
                            active ? 'bg-secondary text-foreground' : 'text-foreground/85 hover:bg-secondary',
                          )}
                        >
                          {item.label}
                          {active && <span className="size-2 rounded-full bg-brand" aria-hidden />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="grid gap-3 border-t p-5">
                <ContactButtons links={links} t={t} />
                <ContactDialog links={links} formToken={formToken}>
                  <Button variant="brand" size="lg" className="w-full">
                    {t.nav.contactCta}
                  </Button>
                </ContactDialog>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
