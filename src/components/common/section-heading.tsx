import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  className?: string;
  action?: React.ReactNode;
  id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Heading = 'h2',
  className,
  action,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'items-center text-center sm:flex-col sm:items-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl space-y-3', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="text-sm font-semibold tracking-[0.12em] text-brand uppercase">{eyebrow}</p>}
        <Heading
          id={id}
          className={cn(
            'font-bold tracking-tight text-foreground',
            Heading === 'h1' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl',
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
