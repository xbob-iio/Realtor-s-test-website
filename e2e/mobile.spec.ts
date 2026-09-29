import { expect, test } from '@playwright/test';

import { acceptCookies } from './helpers';

/** Мобильная версия (Pixel 7): меню, фильтры в bottom sheet, панель связи, свайп галереи */

test('Мобильное меню и панель связи', async ({ page }) => {
  await page.goto('/');
  await acceptCookies(page);

  const bar = page.getByRole('navigation', { name: 'Быстрая связь' });
  await expect(bar).toBeVisible();
  await expect(bar.getByRole('link', { name: /Telegram/ })).toBeVisible();
  await expect(bar.getByRole('link', { name: /WhatsApp/ })).toBeVisible();
  await expect(bar.getByRole('link', { name: /Позвонить/ })).toBeVisible();

  // Панель не перекрывает контент: низ подвала виден над панелью
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const footerBottom = await page
    .locator('footer')
    .evaluate((element) => element.getBoundingClientRect().bottom);
  const barTop = await bar.evaluate((element) => element.getBoundingClientRect().top);
  expect(footerBottom).toBeLessThanOrEqual(barTop + 1);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  const menu = page.getByRole('dialog', { name: 'Меню' });
  await expect(menu).toBeVisible();
  await menu.getByRole('link', { name: 'Контакты' }).click();
  await page.waitForURL(/\/contacts$/);
  await expect(menu).toBeHidden();
});

test('Мобильные фильтры в нижней панели с подсчётом результатов', async ({ page }) => {
  await page.goto('/kyiv/apartments');
  await acceptCookies(page);

  await page.getByRole('button', { name: /^Фильтры/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Фильтры' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('group', { name: 'Комнаты' }).getByRole('button', { name: '1', exact: true }).click();
  const apply = sheet.getByRole('button', { name: /Показать \d+/ });
  await expect(apply).toHaveText(/Показать 2 варианта/);
  await apply.click();
  await page.waitForURL(/rooms=1/);
  await expect(sheet).toBeHidden();
  await expect(page.locator('main article')).toHaveCount(2);
});

test('Свайп галереи на мобильном', async ({ page }) => {
  await page.goto('/apartments/2-room-apartment-pecherskyi-kyiv');
  await acceptCookies(page);
  const gallery = page.getByRole('region', { name: 'Фотогалерея' });
  await expect(gallery).toContainText(/1 из \d+/);
  const box = await gallery.locator('[aria-roledescription="slide"]').first().boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;
  await page.mouse.move(box!.x + box!.width * 0.85, y);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.5, y, { steps: 8 });
  await page.mouse.move(box!.x + box!.width * 0.1, y, { steps: 8 });
  await page.mouse.up();
  await expect(gallery).toContainText(/2 из \d+/);
});
