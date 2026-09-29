import 'server-only';

import { getEnv } from '@/server/env';

import { createLocalStorage } from './local';
import { createS3Storage } from './s3';

export interface StorageDriver {
  readonly kind: 'local' | 's3';
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

/**
 * Ключи генерирует только сервер (UUID), пользовательские имена файлов
 * никогда не попадают в путь.
 */
const STORAGE_KEY_PATTERN = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*\.(webp|png|jpg|avif)$/;

export function isValidStorageKey(key: string): boolean {
  return key.length <= 300 && STORAGE_KEY_PATTERN.test(key);
}

let driver: StorageDriver | undefined;

export function getStorage(): StorageDriver {
  if (driver) return driver;
  const env = getEnv();
  driver = env.STORAGE_DRIVER === 's3' ? createS3Storage(env) : createLocalStorage(env.UPLOAD_DIR);
  return driver;
}

/** Удаление без исключений: файл может быть уже удалён — это не ошибка для пользователя */
export async function deleteStoredFiles(keys: string[]): Promise<void> {
  const storage = getStorage();
  await Promise.all(
    keys.map((key) =>
      storage.delete(key).catch((error: unknown) => {
        console.error('[storage] failed to delete', key, error);
      }),
    ),
  );
}
