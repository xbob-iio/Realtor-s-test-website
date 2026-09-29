import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');

  const adapter = new PrismaPg({ connectionString, max: 10 });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = createPrismaClient();
  }
  return globalForPrisma.__prisma;
}

/**
 * Prisma-клиент создаётся при первом обращении (а не при импорте модуля),
 * поэтому сборка не требует доступа к базе. Все запросы параметризованы Prisma.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
