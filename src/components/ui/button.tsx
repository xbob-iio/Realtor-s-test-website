import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap select-none',
    'transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out',
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-soft hover:bg-primary/88 hover:shadow-card',
        brand: 'bg-brand text-brand-foreground shadow-soft hover:bg-brand-strong hover:shadow-card',
        destructive: 'bg-destructive text-white shadow-soft hover:bg-destructive/90',
        outline:
          'border border-border bg-background text-foreground hover:border-foreground/25 hover:bg-surface',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        ghost: 'text-foreground hover:bg-secondary',
        link: 'rounded-md text-foreground underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        default: 'h-11 px-5',
        xs: 'h-7 gap-1 px-2.5 text-xs',
        sm: 'h-9 px-4',
        lg: 'h-12 px-6 text-[15px]',
        xl: 'h-14 px-8 text-base',
        icon: 'size-11',
        'icon-xs': 'size-7',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
