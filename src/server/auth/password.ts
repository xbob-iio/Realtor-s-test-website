import 'server-only';

import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id (алгоритм по умолчанию в @node-rs/argon2) с параметрами,
 * рекомендованными OWASP: 19 MiB памяти, 2 итерации, 1 поток.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHashPromise: Promise<string> | undefined;

/**
 * Проверка пароля для несуществующего пользователя, чтобы время ответа
 * не выдавало, зарегистрирован ли email (защита от перебора логинов).
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHashPromise ??= hashPassword('dummy-password-for-constant-timing');
  await verifyPassword(await dummyHashPromise, password);
  return false;
}
