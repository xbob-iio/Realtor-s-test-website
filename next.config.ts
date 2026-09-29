import type { NextConfig } from 'next';

/** Удалённое хранилище фото (S3/R2/Supabase) — разрешаем его для next/image */
function storageRemotePatterns(): NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> {
  const publicUrl = process.env.STORAGE_PUBLIC_URL;
  if (!publicUrl) return [];
  try {
    const url = new URL(publicUrl);
    return [
      {
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        port: url.port,
        pathname: `${url.pathname.replace(/\/$/, '')}/**`,
      },
    ];
  } catch {
    return [];
  }
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Заголовки безопасности для всех ответов. Content-Security-Policy с nonce
 * выставляется в src/proxy.ts (он уникален для каждого запроса).
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  ...(isProduction
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 75, 85],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [56, 80, 112, 160, 220, 320, 400],
    // Файлы в хранилище неизменяемы (уникальные имена), кешируем оптимизированные версии надолго
    minimumCacheTTL: 60 * 60 * 24 * 31,
    localPatterns: [{ pathname: '/media/**' }, { pathname: '/images/**' }],
    remotePatterns: storageRemotePatterns(),
  },

  // Встроенная в Next.js защита Server Actions: принимаются только запросы с того же origin.
  // Для работы за прокси с другим доменом добавьте его сюда.
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
