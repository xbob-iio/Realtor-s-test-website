import 'dotenv/config';

import pg from 'pg';

/**
 * Перед прогоном сбрасываем счётчики ограничения частоты запросов,
 * чтобы повторные запуски тестов не упирались в лимиты входа и заявок.
 * Работает только с локальной базой разработки.
 */
export default async function globalSetup() {
  const url = process.env.DATABASE_URL;
  if (!url || !/@(localhost|127\.0\.0\.1)[:/]/.test(url)) return;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('DELETE FROM rate_limits');
  } finally {
    await client.end();
  }
}
