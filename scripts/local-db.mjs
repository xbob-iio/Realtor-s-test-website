#!/usr/bin/env node
/**
 * Локальный кластер PostgreSQL для разработки — без Docker и без установки служб.
 *
 * Использует уже установленные бинарники PostgreSQL (initdb, pg_ctl, createdb).
 * Данные хранятся в .data/postgres внутри проекта, сервер слушает только localhost.
 * Логин, пароль, порт и имя базы берутся из DATABASE_URL в .env.
 *
 *   node scripts/local-db.mjs init    — создать кластер и базу, запустить
 *   node scripts/local-db.mjs start   — запустить
 *   node scripts/local-db.mjs stop    — остановить
 *   node scripts/local-db.mjs status  — статус
 *
 * Путь к бинарникам можно задать явно: PG_BIN=C:\Program Files\PostgreSQL\17\bin
 */
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, rmSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(ROOT, '.env'), quiet: true });

const DATA_DIR = resolve(ROOT, process.env.LOCAL_PG_DATA_DIR ?? '.data/postgres');
const LOG_FILE = join(DATA_DIR, 'server.log');
const EXE = process.platform === 'win32' ? '.exe' : '';

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function parseDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) fail('DATABASE_URL не задан в .env');
  const url = new URL(raw);
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) {
    fail(`DATABASE_URL указывает на ${url.hostname}. Скрипт управляет только локальной базой.`);
  }
  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, '') || 'postgres',
  };
}

function findPgBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN;

  const lookup = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['pg_ctl'], {
    encoding: 'utf8',
  });
  if (lookup.status === 0 && lookup.stdout.trim()) {
    return dirname(lookup.stdout.split(/\r?\n/)[0].trim());
  }

  const candidates = [];
  const byVersionDesc = (a, b) => Number.parseFloat(b) - Number.parseFloat(a);
  const scan = (base, suffix) => {
    if (!existsSync(base)) return;
    for (const version of readdirSync(base).sort(byVersionDesc)) {
      candidates.push(join(base, version, suffix));
    }
  };

  if (process.platform === 'win32') {
    scan('C:\\Program Files\\PostgreSQL', 'bin');
    scan('C:\\Program Files (x86)\\PostgreSQL', 'bin');
  } else {
    scan('/usr/lib/postgresql', 'bin');
    scan('/usr/local/Cellar/postgresql', 'bin');
    for (const brew of ['/opt/homebrew/opt', '/usr/local/opt']) {
      if (!existsSync(brew)) continue;
      for (const name of readdirSync(brew)
        .filter((n) => n.startsWith('postgresql'))
        .sort()
        .reverse()) {
        candidates.push(join(brew, name, 'bin'));
      }
    }
  }

  return candidates.find((dir) => existsSync(join(dir, `pg_ctl${EXE}`)));
}

const PG_BIN = findPgBin();
if (!PG_BIN) {
  fail(
    'Не найдены бинарники PostgreSQL (pg_ctl). Установите PostgreSQL 16+ или задайте PG_BIN.\n' +
      '  Альтернатива: docker compose up -d (см. docker-compose.yml)',
  );
}

const bin = (name) => join(PG_BIN, `${name}${EXE}`);

function run(name, args, { quiet = false, env = {} } = {}) {
  const result = spawnSync(bin(name), args, {
    // stdio 'ignore' для pg_ctl start обязателен: иначе дочерний postgres
    // унаследует дескрипторы и родительский процесс будет ждать его завершения.
    stdio: quiet ? 'ignore' : ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return result;
}

function isInitialized() {
  return existsSync(join(DATA_DIR, 'PG_VERSION'));
}

function isRunning() {
  if (!isInitialized()) return false;
  return run('pg_ctl', ['-D', DATA_DIR, 'status']).status === 0;
}

function start() {
  if (!isInitialized()) fail('Кластер не создан. Выполните: npm run db:local:init');
  if (isRunning()) {
    console.log('✓ PostgreSQL уже запущен');
    return;
  }
  const result = run('pg_ctl', ['-D', DATA_DIR, '-l', LOG_FILE, '-w', '-t', '60', 'start'], {
    quiet: true,
  });
  if (result.status !== 0 || !isRunning()) fail(`Не удалось запустить PostgreSQL. Лог: ${LOG_FILE}`);
  const { port } = parseDatabaseUrl();
  console.log(`✓ PostgreSQL запущен на localhost:${port} (данные: ${DATA_DIR})`);
}

function stop() {
  if (!isRunning()) {
    console.log('PostgreSQL не запущен');
    return;
  }
  const result = run('pg_ctl', ['-D', DATA_DIR, '-m', 'fast', '-w', 'stop']);
  if (result.status !== 0) fail(result.stderr || 'Не удалось остановить PostgreSQL');
  console.log('✓ PostgreSQL остановлен');
}

function status() {
  if (!isInitialized()) {
    console.log('Кластер не создан (npm run db:local:init)');
    return;
  }
  console.log(isRunning() ? '✓ PostgreSQL запущен' : 'PostgreSQL остановлен');
}

function init() {
  const { user, password, port, database } = parseDatabaseUrl();
  if (!password) fail('В DATABASE_URL должен быть задан пароль');

  if (!isInitialized()) {
    mkdirSync(DATA_DIR, { recursive: true });
    const pwFile = join(tmpdir(), `pgpw-${randomBytes(8).toString('hex')}`);
    writeFileSync(pwFile, password, { mode: 0o600 });
    try {
      const result = run('initdb', [
        '-D',
        DATA_DIR,
        '-U',
        user,
        `--pwfile=${pwFile}`,
        '--auth=scram-sha-256',
        '--encoding=UTF8',
        '--locale=C',
        '--locale-provider=builtin',
        '--builtin-locale=C.UTF-8',
      ]);
      if (result.status !== 0) fail(`initdb завершился с ошибкой:\n${result.stderr || result.stdout}`);
    } finally {
      rmSync(pwFile, { force: true });
    }

    appendFileSync(
      join(DATA_DIR, 'postgresql.conf'),
      [
        '',
        '# ── local dev overrides (scripts/local-db.mjs) ──',
        `port = ${port}`,
        "listen_addresses = 'localhost'",
        'max_connections = 50',
        "timezone = 'UTC'",
        "log_timezone = 'UTC'",
        '',
      ].join('\n'),
    );
    console.log(`✓ Кластер создан в ${DATA_DIR}`);
  } else {
    console.log('✓ Кластер уже существует');
  }

  start();

  const env = { PGPASSWORD: password };
  const exists = run(
    'psql',
    [
      '-h',
      'localhost',
      '-p',
      port,
      '-U',
      user,
      '-d',
      'postgres',
      '-tAc',
      `SELECT 1 FROM pg_database WHERE datname = '${database.replaceAll("'", "''")}'`,
    ],
    { env },
  );
  if (exists.status !== 0) fail(`Не удалось подключиться к PostgreSQL:\n${exists.stderr}`);

  if (exists.stdout.trim() === '1') {
    console.log(`✓ База «${database}» уже существует`);
  } else {
    const created = run('createdb', ['-h', 'localhost', '-p', port, '-U', user, database], { env });
    if (created.status !== 0) fail(`Не удалось создать базу:\n${created.stderr}`);
    console.log(`✓ База «${database}» создана`);
  }

  console.log('\nДальше: npm run db:deploy && npm run db:seed');
}

const command = process.argv[2];
const commands = { init, start, stop, status };
if (!commands[command]) {
  console.log('Использование: node scripts/local-db.mjs <init|start|stop|status>');
  process.exit(command ? 1 : 0);
}
commands[command]();
