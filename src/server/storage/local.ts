import 'server-only';

import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import type { StorageDriver } from './index';

const KEY_PATTERN = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*\.(webp|png|jpg|avif)$/;

export function resolveLocalPath(uploadDir: string, key: string): string {
  if (!KEY_PATTERN.test(key)) throw new Error('Invalid storage key');
  // Папка загрузок — данные времени выполнения, а не исходники: исключаем её из трассировки сборки
  const base = resolve(/* turbopackIgnore: true */ process.cwd(), uploadDir);
  const fullPath = resolve(/* turbopackIgnore: true */ base, ...key.split('/'));
  // Защита от выхода за пределы папки хранилища
  if (!fullPath.startsWith(base + sep)) throw new Error('Invalid storage path');
  return fullPath;
}

export function createLocalStorage(uploadDir: string): StorageDriver {
  return {
    kind: 'local',

    async put(key, data) {
      const path = resolveLocalPath(uploadDir, key);
      await mkdir(dirname(path), { recursive: true });
      // wx — не перезаписывать существующий файл
      await writeFile(path, data, { flag: 'wx' });
    },

    async delete(key) {
      try {
        await unlink(resolveLocalPath(uploadDir, key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    },

    publicUrl(key) {
      return `/media/${key}`;
    },
  };
}

export async function readLocalFile(uploadDir: string, key: string): Promise<Buffer | null> {
  try {
    return await readFile(resolveLocalPath(uploadDir, key));
  } catch {
    return null;
  }
}
