import { ArrowUpRight, FileCheck, HandHeart, MessagesSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/motion/reveal';
import type { Dictionary } from '@/i18n/dictionaries/ru';

const WHY_ICONS = [ShieldCheck, FileCheck, HandHeart, MessagesSquare];

/** Как мы работаем: 4 шага */
export function HowItWorks({ t }: { t: Dictionary }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {t.home.howSteps.map((step, index) => (
        <Reveal as="li" key={step.title} delay={index * 0.07}>
          <div className="relative h-full rounded-3xl border bg-background p-6 transition-shadow duration-300 hover:shadow-card">
            <span className="text-sm font-bold text-brand tabular-nums">0{index + 1}</span>
            <h3 className="mt-4 text-xl font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

/** Почему с нами удобно */
export function WhyUs({ t }: { t: Dictionary }) {
  return (
    <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
      {t.home.whyItems.map((item, index) => {
        const Icon = WHY_ICONS[index % WHY_ICONS.length]!;
        return (
          <Reveal as="li" key={item.title} delay={index * 0.06} className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Icon className="size-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          </Reveal>
        );
      })}
    </ul>
  );
}

/** Популярные запросы — готовые ссылки на отфильтрованный каталог */
export function QuickLinks({ t, links }: { t: Dictionary; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={t.home.quickTitle}>
      <ul className="flex flex-wrap gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex h-11 items-center gap-1.5 rounded-full border bg-background px-5 text-[15px] font-semibold transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-soft"
            >
              {link.label}
              <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-brand" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
