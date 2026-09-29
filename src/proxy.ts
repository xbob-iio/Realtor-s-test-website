import { NextResponse, type NextRequest } from 'next/server';

import { getSessionCookieName, getSessionCookieOptions, SESSION_TTL_MS } from '@/server/auth/cookie';

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Content-Security-Policy со случайным nonce на каждый запрос.
 * 'strict-dynamic' разрешает только скрипты с nonce (Next.js проставляет его сам)
 * и загруженные ими. Inline-скрипты без nonce, eval и чужие домены запрещены.
 */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const isHttps = (process.env.SITE_URL ?? '').startsWith('https://');
  const storage = originOf(process.env.STORAGE_PUBLIC_URL);

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      ...(storage ? [storage] : []),
      'https://www.googletagmanager.com',
      'https://*.google-analytics.com',
      'https://www.facebook.com',
    ],
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://www.facebook.com',
      'https://connect.facebook.net',
      ...(isDev ? ['ws:', 'wss:'] : []),
    ],
    'media-src': ["'self'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
  return isHttps ? `${policy}; upgrade-insecure-requests` : policy;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get(getSessionCookieName())?.value;

  // Быстрая (оптимистичная) проверка: без cookie сессии в админку не пускаем.
  // Полная проверка сессии и роли — на сервере в каждой странице и действии.
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');
  if (isAdminArea && pathname !== '/admin/login' && !sessionCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  // Скользящее продление cookie сессии (срок в БД продлевается при проверке сессии)
  if (isAdminArea && sessionCookie && request.method === 'GET') {
    response.cookies.set(
      getSessionCookieName(),
      sessionCookie,
      getSessionCookieOptions(new Date(Date.now() + SESSION_TTL_MS)),
    );
  }

  if (isAdminArea) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api/|_next/static|_next/image|media/|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|manifest.webmanifest|images/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
