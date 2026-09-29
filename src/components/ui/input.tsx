import * as React from 'react';

import { cn } from '@/lib/utils';

const fieldBase =
  'w-full min-w-0 rounded-xl border border-input bg-background text-[15px] text-foreground transition-[color,border-color,box-shadow] outline-none placeholder:text-muted-foreground/75 hover:border-foreground/20 focus-visible:border-foreground/35 focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldBase,
        'h-12 px-4 file:mr-3 file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  );
}

export { Input, fieldBase };
