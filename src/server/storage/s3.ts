import 'server-only';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { ServerEnv } from '@/server/env';

import type { StorageDriver } from './index';

/**
 * Любое S3-совместимое хранилище: AWS S3, Cloudflare R2, MinIO,
 * Supabase Storage (S3 endpoint), DigitalOcean Spaces, Backblaze B2.
 */
export function createS3Storage(env: ServerEnv): StorageDriver {
  const client = new S3Client({
    region: env.STORAGE_REGION,
    endpoint: env.STORAGE_ENDPOINT || undefined,
    forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: env.STORAGE_SECRET_KEY ?? '',
    },
  });
  const bucket = env.STORAGE_BUCKET ?? '';
  const publicBase = (env.STORAGE_PUBLIC_URL ?? '').replace(/\/+$/, '');

  return {
    kind: 's3',

    async put(key, data, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: data,
          ContentType: contentType,
          // Ключи уникальны (UUID), поэтому файл можно кешировать навсегда
          CacheControl: 'public, max-age=31536000, immutable',
          ContentDisposition: 'inline',
        }),
      );
    },

    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    publicUrl(key) {
      return `${publicBase}/${key}`;
    },
  };
}
