import { ContactButtons } from '@/components/contact/contact-buttons';
import { LeadForm } from '@/components/contact/lead-form';
import { Reveal } from '@/components/motion/reveal';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import type { ContactLink } from '@/lib/contacts';

interface CtaSectionProps {
  t: Dictionary;
  title: string;
  text: string;
  links: ContactLink[];
  formToken: string;
  id?: string;
}

/** Блок «Оставьте заявку»: слева текст и мессенджеры, справа форма */
export function CtaSection({ t, title, text, links, formToken, id }: CtaSectionProps) {
  return (
    <Reveal>
      <div
        id={id}
        className="grid overflow-hidden rounded-[2rem] bg-graphite text-white lg:grid-cols-[1fr_1.15fr]"
      >
        <div className="relative flex flex-col justify-between gap-10 p-7 sm:p-10 lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-brand/35 blur-3xl"
          />
          <div className="relative space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
            <p className="max-w-md text-lg leading-relaxed text-white/75">{text}</p>
          </div>
          {links.length > 0 && (
            <div className="relative [&_a]:border-white/15 [&_a]:bg-white/5 [&_a]:text-white [&_a:hover]:border-white/35 [&_a:hover]:bg-white/10">
              <ContactButtons links={links.filter((link) => link.channel !== 'email')} t={t} />
            </div>
          )}
        </div>
        <div className="m-2 rounded-[1.6rem] bg-background p-6 text-foreground sm:m-3 sm:p-8">
          <LeadForm formToken={formToken} />
        </div>
      </div>
    </Reveal>
  );
}
