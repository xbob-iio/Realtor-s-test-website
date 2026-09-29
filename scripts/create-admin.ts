/**
 * Создание администратора или смена его пароля.
 *
 *   npm run admin:create -- --email admin@site.ua
 *
 * Пароль вводится интерактивно (не попадает в историю команд) или передаётся
 * через переменную окружения ADMIN_PASSWORD (для автоматизации).
 */
import 'dotenv/config';

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { z } from 'zod';

import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../src/server/auth/password';
import { invalidateUserSessions } from '../src/server/auth/session';
import { prisma } from '../src/server/db';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function askHidden(question: string): Promise<string> {
  if (!stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(question);
    rl.close();
    return answer;
  }
  // Скрываем ввод пароля в терминале
  return new Promise((resolve) => {
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (char: string) => {
      if (char === '\r' || char === '\n' || char === '\u{4}') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off('data', onData);
        stdout.write('\n');
        resolve(value);
      } else if (char === '\u{3}') {
        process.exit(130);
      } else if (char === '\u{7f}' || char === '\b') {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const emailRaw = argument('email') ?? process.env.ADMIN_EMAIL;
  const email = z.email().safeParse(emailRaw?.trim().toLowerCase());
  if (!email.success) {
    console.error('Укажите корректный email: npm run admin:create -- --email admin@site.ua');
    process.exitCode = 1;
    return;
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await askHidden(`Пароль (минимум ${PASSWORD_MIN_LENGTH} символов): `);
    const confirm = await askHidden('Повторите пароль: ');
    if (password !== confirm) {
      console.error('Пароли не совпадают');
      process.exitCode = 1;
      return;
    }
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    console.error(`Пароль должен быть от ${PASSWORD_MIN_LENGTH} до ${PASSWORD_MAX_LENGTH} символов`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email: email.data },
    create: { email: email.data, passwordHash, role: 'ADMIN', name: 'Администратор' },
    update: { passwordHash, passwordChangedAt: new Date() },
  });
  await invalidateUserSessions(user.id);
  console.log(`✓ Администратор ${email.data} сохранён. Активные сессии этого пользователя завершены.`);
}

main()
  .catch((error) => {
    console.error('✖ Ошибка:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
