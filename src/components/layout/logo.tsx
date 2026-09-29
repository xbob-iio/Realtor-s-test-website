import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

interface LogoProps {
  siteName: string;
  logoUrl?: string | null;
  href?: string;
  inverted?: boolean;
  className?: string;
  homeLabel: string;
}

/** Фирменный знак: скруглённый квадрат с «крышей» и акцентной точкой */
export function LogoMark({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn('size-9 shrink-0', className)}>
      <rect width="40" height="40" rx="12" className={inverted ? 'fill-white' : 'fill-graphite'} />
      <path
        d="M11 20.5 20 12.5l9 8"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={inverted ? 'stroke-graphite' : 'stroke-white'}
      />
      <path
        d="M14 19v8.5h12V19"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={inverted ? 'stroke-graphite' : 'stroke-white'}
      />
      <circle cx="29.5" cy="10.5" r="3" className="fill-brand" />
    </svg>
  );
}

export function Logo({ siteName, logoUrl, href = '/', inverted = false, className, homeLabel }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={`${siteName} — ${homeLabel}`}
      className={cn('group inline-flex items-center gap-2.5 rounded-xl', className)}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={siteName}
          width={160}
          height={40}
          className={cn('h-9 w-auto object-contain', inverted && 'brightness-0 invert')}
          priority
          unoptimized={logoUrl.endsWith('.svg')}
        />
      ) : (
        <>
          <LogoMark inverted={inverted} className="transition-transform duration-300 group-hover:-rotate-6" />
          <span
            className={cn(
              'text-[17px] font-extrabold tracking-[0.14em] uppercase',
              inverted ? 'text-white' : 'text-foreground',
            )}
          >
            {siteName}
          </span>
        </>
      )}
    </Link>
  );
}
