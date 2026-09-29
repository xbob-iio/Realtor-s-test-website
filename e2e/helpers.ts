import { expect, type Page } from '@playwright/test';
import sharp from 'sharp';

export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? '';

export async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Пароль', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/\/admin$/);
}

/** Закрываем баннер cookies, чтобы он не перекрывал элементы */
export async function acceptCookies(page: Page) {
  const banner = page.getByRole('region', { name: 'Файлы cookies' });
  if (await banner.isVisible().catch(() => false)) {
    await banner.getByRole('button', { name: 'Только необходимые' }).click();
    await expect(banner).toBeHidden();
  }
}

/** Тестовые изображения разных форматов */
export async function makeImages() {
  const colors = ['#c9a27b', '#8fa38a', '#365b6d'];
  const formats = [
    {
      ext: 'jpg',
      mime: 'image/jpeg',
      encode: (image: ReturnType<typeof sharp>) => image.jpeg({ quality: 80 }),
    },
    { ext: 'png', mime: 'image/png', encode: (image: ReturnType<typeof sharp>) => image.png() },
    {
      ext: 'webp',
      mime: 'image/webp',
      encode: (image: ReturnType<typeof sharp>) => image.webp({ quality: 80 }),
    },
  ];
  return Promise.all(
    formats.map(async (format, index) => ({
      name: `photo-${index + 1}.${format.ext}`,
      mimeType: format.mime,
      buffer: await format
        .encode(sharp({ create: { width: 960, height: 720, channels: 3, background: colors[index]! } }))
        .toBuffer(),
    })),
  );
}
