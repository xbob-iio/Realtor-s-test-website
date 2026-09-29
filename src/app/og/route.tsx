import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

import { getDictionary } from '@/i18n';
import { DEFAULT_SITE_NAME, getSiteSettings } from '@/server/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FONT_DIR = join(process.cwd(), 'src', 'assets', 'fonts');

async function loadFonts() {
  const files = [
    { file: 'manrope-cyrillic-700-normal.woff', weight: 700 as const },
    { file: 'manrope-latin-700-normal.woff', weight: 700 as const },
    { file: 'manrope-cyrillic-500-normal.woff', weight: 500 as const },
    { file: 'manrope-latin-500-normal.woff', weight: 500 as const },
  ];
  try {
    return await Promise.all(
      files.map(async ({ file, weight }) => ({
        name: 'Manrope',
        data: await readFile(join(FONT_DIR, file)),
        weight,
        style: 'normal' as const,
      })),
    );
  } catch {
    return [];
  }
}

/** Изображение для соцсетей и мессенджеров (Open Graph) по умолчанию */
export async function GET() {
  const t = getDictionary();
  let siteName = DEFAULT_SITE_NAME;
  try {
    siteName = (await getSiteSettings()).siteName;
  } catch {
    // база недоступна — используем название по умолчанию
  }
  const fonts = await loadFonts();

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: 'linear-gradient(135deg, #1f2126 0%, #2b2d33 60%, #3a2c26 100%)',
        color: '#ffffff',
        fontFamily: 'Manrope',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="64" height="64" viewBox="0 0 40 40">
          <rect width="40" height="40" rx="12" fill="#ffffff" />
          <path
            d="M11 20.5 20 12.5l9 8"
            fill="none"
            stroke="#1f2126"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 19v8.5h12V19"
            fill="none"
            stroke="#1f2126"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="29.5" cy="10.5" r="3" fill="#b0613f" />
        </svg>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase' }}>
          {siteName}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }}>
          {t.home.heroTitle}
        </div>
        <div style={{ fontSize: 32, fontWeight: 500, color: 'rgba(255,255,255,0.75)', maxWidth: 900 }}>
          {t.home.heroSubtitle}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 72, height: 6, borderRadius: 3, background: '#b0613f' }} />
        <div style={{ fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
          {t.home.heroEyebrow}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    },
  );
}
