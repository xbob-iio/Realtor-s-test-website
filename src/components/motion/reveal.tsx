'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Задержка появления, секунды */
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * Плавное появление при прокрутке. В серверном HTML контент всегда виден
 * (важно для SEO и медленных устройств): прячутся только блоки ниже экрана
 * и только после загрузки JS. Учитывает prefers-reduced-motion.
 */
export function Reveal({ children, className, delay = 0, as: Component = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    element.dataset.reveal = 'hidden';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.dataset.reveal = 'shown';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -60px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref as React.Ref<never>}
      className={cn('reveal', className)}
      style={delay ? ({ '--reveal-delay': `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </Component>
  );
}
