/**
 * Seed: администратор, настройки сайта, демонстрационные квартиры с фото и заявки.
 *
 *   npm run db:seed                  — создать недостающее (повторный запуск безопасен)
 *   SEED_DEMO=false npm run db:seed  — только администратор и настройки (для production)
 *   npm run db:seed -- --reset-demo  — пересоздать демо-данные
 *
 * Пароль администратора берётся из SEED_ADMIN_PASSWORD. Если он не задан,
 * генерируется случайный и выводится в консоль один раз.
 */
import 'dotenv/config';

import { randomBytes, randomUUID } from 'node:crypto';

import sharp from 'sharp';

import { getCityByCode } from '../src/config/cities';
import { apartmentBaseSlug } from '../src/lib/slug';
import { toUah } from '../src/lib/pricing';
import { hashPassword, PASSWORD_MIN_LENGTH } from '../src/server/auth/password';
import { prisma } from '../src/server/db';
import { processApartmentPhoto } from '../src/server/images/process';
import { deleteStoredFiles, getStorage } from '../src/server/storage';

import { DEMO_APARTMENTS, DEMO_LEADS } from './seed/demo-data';
import { PALETTES, renderScene, SCENE_LABELS } from './seed/illustrations';

const DAY = 24 * 60 * 60 * 1000;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

async function seedAdmin() {
  const email = (env('SEED_ADMIN_EMAIL') ?? 'admin@example.com').toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  const resetPassword = env('SEED_ADMIN_RESET_PASSWORD') === 'true';

  if (existing && !resetPassword) {
    console.log(`✓ Администратор ${email} уже существует (пароль не изменён)`);
    return;
  }

  let password = env('SEED_ADMIN_PASSWORD');
  let generated = false;
  if (!password) {
    password = randomBytes(12).toString('base64url');
    generated = true;
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`SEED_ADMIN_PASSWORD должен быть не короче ${PASSWORD_MIN_LENGTH} символов`);
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, name: 'Администратор', role: 'ADMIN' },
    update: { passwordHash, passwordChangedAt: new Date() },
  });
  console.log(`✓ Администратор: ${email}`);
  if (generated) {
    console.log(`  Сгенерированный пароль (сохраните его, повторно не показывается): ${password}`);
  }
}

async function seedSettings() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (existing) {
    console.log('✓ Настройки сайта уже существуют');
    return existing;
  }
  const settings = await prisma.siteSettings.create({
    data: {
      id: 1,
      siteName: 'DOMA RENT',
      phone: env('CONTACT_PHONE') ?? null,
      email: env('CONTACT_EMAIL') ?? null,
      telegramUrl: env('TELEGRAM_URL') ?? null,
      viberUrl: env('VIBER_URL') ?? null,
      whatsappUrl: env('WHATSAPP_URL') ?? null,
      legalCompanyName: env('COMPANY_NAME') ?? null,
      legalAddress: env('COMPANY_ADDRESS') ?? null,
      legalEmail: env('COMPANY_EMAIL') ?? null,
      legalPhone: env('COMPANY_PHONE') ?? null,
    },
  });
  console.log('✓ Настройки сайта созданы');
  return settings;
}

async function removeDemo() {
  const images = await prisma.apartmentImage.findMany({
    where: { apartment: { isDemo: true } },
    select: { storageKey: true },
  });
  await prisma.apartment.deleteMany({ where: { isDemo: true } });
  await prisma.lead.deleteMany({ where: { isDemo: true } });
  await deleteStoredFiles(images.map((image) => image.storageKey));
  console.log('✓ Старые демо-данные удалены');
}

async function uniqueSlug(base: string): Promise<string> {
  for (let suffix = 1; suffix < 100; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const taken = await prisma.apartment.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function seedDemo(rates: { usdRate: number; eurRate: number }) {
  const storage = getStorage();
  const apartmentIds = new Map<string, string>();

  for (const [index, demo] of DEMO_APARTMENTS.entries()) {
    const { key, palette, scenes, publishedDaysAgo, ...data } = demo;
    const slug = await uniqueSlug(
      apartmentBaseSlug({
        rooms: data.rooms,
        district: data.district,
        citySlug: getCityByCode(data.city).slug,
      }),
    );
    const apartment = await prisma.apartment.create({
      data: {
        ...data,
        slug,
        priceUah: toUah(data.price, data.currency, rates),
        isDemo: true,
        publishedAt: new Date(Date.now() - publishedDaysAgo * DAY),
      },
      select: { id: true },
    });
    apartmentIds.set(key, apartment.id);

    for (const [order, scene] of scenes.entries()) {
      const svg = renderScene(scene, PALETTES[palette % PALETTES.length]!, index * 31 + order * 7 + 11);
      const png = await sharp(Buffer.from(svg)).png().toBuffer();
      // Тот же конвейер, что и для загрузок из админки: проверка, пересжатие, превью
      const processed = await processApartmentPhoto(png);
      const storageKey = `apartments/${apartment.id}/${randomUUID()}.${processed.extension}`;
      await storage.put(storageKey, processed.data, processed.contentType);
      await prisma.apartmentImage.create({
        data: {
          apartmentId: apartment.id,
          url: storage.publicUrl(storageKey),
          storageKey,
          alt: `${data.title} — ${SCENE_LABELS[scene]}`,
          width: processed.width,
          height: processed.height,
          blurDataUrl: processed.blurDataUrl,
          sortOrder: order,
          isPrimary: order === 0,
        },
      });
    }
    console.log(`  • ${data.title} (${scenes.length} фото)`);
  }

  for (const lead of DEMO_LEADS) {
    const { apartmentKey, hoursAgo, ...data } = lead;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    await prisma.lead.create({
      data: {
        ...data,
        apartmentId: apartmentKey ? (apartmentIds.get(apartmentKey) ?? null) : null,
        source: apartmentKey ? '/apartments' : '/contacts',
        consentAt: createdAt,
        createdAt,
        isDemo: true,
      },
    });
  }
  console.log(`✓ Демо-данные: ${DEMO_APARTMENTS.length} квартир, ${DEMO_LEADS.length} заявки`);
}

async function main() {
  const resetDemo = process.argv.includes('--reset-demo');
  const withDemo = env('SEED_DEMO') !== 'false';

  await seedAdmin();
  const settings = await seedSettings();

  if (!withDemo) {
    console.log('— Демо-данные пропущены (SEED_DEMO=false)');
    return;
  }
  if (resetDemo) await removeDemo();

  const demoCount = await prisma.apartment.count({ where: { isDemo: true } });
  if (demoCount > 0) {
    console.log(`✓ Демо-квартиры уже есть (${demoCount}). Пересоздать: npm run db:seed -- --reset-demo`);
    return;
  }
  console.log('Создаём демо-квартиры с иллюстрациями…');
  await seedDemo({ usdRate: settings.usdRate, eurRate: settings.eurRate });
}

main()
  .catch((error) => {
    console.error('✖ Seed завершился с ошибкой:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
