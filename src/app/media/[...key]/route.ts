import { getEnv } from '@/server/env';
import { isValidStorageKey } from '@/server/storage';
import { readLocalFile } from '@/server/storage/local';

export const runtime = 'nodejs';

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  avif: 'image/avif',
};

/**
 * Раздача загруженных файлов при STORAGE_DRIVER=local.
 * Ключ строго валидируется (без «..» и произвольных символов), файлы неизменяемы.
 */
export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const env = getEnv();
  if (env.STORAGE_DRIVER !== 'local') return new Response('Not found', { status: 404 });

  const { key: segments } = await context.params;
  const key = segments.join('/');
  if (!isValidStorageKey(key)) return new Response('Not found', { status: 404 });

  const file = await readLocalFile(env.UPLOAD_DIR, key);
  if (!file) return new Response('Not found', { status: 404 });

  const extension = key.slice(key.lastIndexOf('.') + 1);
  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': CONTENT_TYPES[extension] ?? 'application/octet-stream',
      'Content-Length': String(file.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cross-Origin-Resource-Policy': 'same-site',
    },
  });
}
