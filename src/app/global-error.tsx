'use client';

import { useEffect } from 'react';

import { getDictionary } from '@/i18n';
import { fill } from '@/i18n/format';

/**
 * Последний рубеж: ошибка в корневом layout. Провайдеры и стили могут быть
 * недоступны, поэтому разметка автономная, с минимальными inline-стилями.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = getDictionary();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          background: '#ffffff',
          color: '#1d1f24',
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, margin: '0 0 12px' }}>{t.errors.genericTitle}</h1>
          <p style={{ color: '#6b6e75', lineHeight: 1.6, margin: '0 0 24px' }}>{t.errors.genericText}</p>
          {error.digest && (
            <p style={{ color: '#6b6e75', fontSize: 12, fontFamily: 'monospace', margin: '0 0 24px' }}>
              {fill(t.errors.errorCode, { code: error.digest })}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#1d1f24',
              color: '#fff',
              border: 0,
              borderRadius: 999,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.common.tryAgain}
          </button>
        </main>
      </body>
    </html>
  );
}
