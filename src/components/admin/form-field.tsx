import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Поле формы: подпись, подсказка и сообщение об ошибке, связанные через aria */
export function FormField({ id, label, error, hint, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden className="text-brand">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, error?: string | null, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function SwitchRow({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border bg-background p-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-muted-foreground">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
