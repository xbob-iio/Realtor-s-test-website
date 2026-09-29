'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'rounded-lg bg-transparent hover:bg-secondary data-[state=on]:bg-secondary data-[state=on]:text-foreground',
        outline:
          'rounded-lg border border-input bg-background hover:border-foreground/25 data-[state=on]:bg-secondary',
        chip: 'rounded-full border border-input bg-background text-foreground hover:border-foreground/30 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
      },
      size: {
        default: 'h-10 min-w-10 px-3',
        sm: 'h-9 min-w-9 px-3 text-[13px]',
        lg: 'h-11 min-w-11 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
