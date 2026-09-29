import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Аккуратное пустое состояние: иконка в мягком круге, заголовок, пояснение и действия */
export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border border-dashed bg-surface px-6 py-14 text-center sm:py-20',
        className,
      )}
    >
      <span className="relative mb-6 flex size-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-brand-soft" />
        <span className="absolute inset-2.5 rounded-full bg-background shadow-soft" />
        <Icon className="relative size-8 text-brand" />
      </span>
      <h2 className="max-w-md text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      {description && <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">{description}</p>}
      {children && <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
