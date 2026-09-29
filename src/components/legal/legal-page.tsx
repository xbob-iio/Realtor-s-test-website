import { Breadcrumbs } from '@/components/common/breadcrumbs';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { fill, formatDate } from '@/i18n/format';

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageProps {
  t: Dictionary;
  title: string;
  path: string;
  updatedAt: Date;
  sections: LegalSection[];
  tocLabel: string;
}

/** Страница документа: заголовок, дата редакции, оглавление и текст */
export function LegalPage({ t, title, path, updatedAt, sections, tocLabel }: LegalPageProps) {
  return (
    <div className="container-page py-10 lg:py-16">
      <Breadcrumbs
        items={[
          { name: t.common.home, path: '/' },
          { name: title, path },
        ]}
        label={t.common.breadcrumbs}
      />
      <header className="mt-6 max-w-3xl space-y-3 border-b pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="text-muted-foreground">
          {fill(t.legal.updated, { date: formatDate(updatedAt, t.months.genitive) })}
        </p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label={tocLabel} className="hidden lg:block">
          <ol className="sticky top-28 space-y-1 text-sm">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <span className="tabular-nums">{index + 1}.</span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal-prose max-w-3xl">
          {sections.map((section, index) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2 id={section.id}>
                {index + 1}. {section.title}
              </h2>
              {section.content}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
