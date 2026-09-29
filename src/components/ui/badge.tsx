import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        brand: 'bg-brand text-brand-foreground',
        soft: 'bg-brand-soft text-brand-strong',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-[oklch(0.45_0.1_70)]',
        destructive: 'bg-destructive/10 text-destructive',
        outline: 'border-border bg-background text-foreground',
        glass: 'bg-white/90 text-foreground shadow-soft backdrop-blur-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
