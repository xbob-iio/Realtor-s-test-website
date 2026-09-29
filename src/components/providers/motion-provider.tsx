'use client';

import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';

/**
 * Анимации: только нужные фичи Motion (LazyMotion) и уважение
 * к системной настройке «уменьшить движение».
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
