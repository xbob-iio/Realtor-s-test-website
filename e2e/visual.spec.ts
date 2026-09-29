import { expect, test, type Page } from '@playwright/test';

/**
 * Адаптивность: страницы не должны иметь горизонтальной прокрутки
 * на ширинах от 320 до 1440 px.
 *   npx playwright test --project=visual
 * Скриншоты (e2e/.artifacts): E2E_SCREENSHOTS=viewport | full
 */
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440];
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'catalog', path: '/kyiv/apartments' },
  { name: 'apartment', path: '/apartments/2-room-apartment-pecherskyi-kyiv' },
  { name: 'city', path: '/dnipro' },
  { name: 'contacts', path: '/contacts' },
  { name: 'privacy', path: '/privacy-policy' },
  { name: 'admin-login', path: '/admin/login' },
];

/** Прокрутка до конца, чтобы сработали анимации появления */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += Math.round(window.innerHeight * 0.8)) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

for (const target of PAGES) {
  test(`${target.name}: без горизонтальной прокрутки на всех ширинах`, async ({ browser }) => {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'ru-RU' });
      const page = await context.newPage();
      await page.goto(target.path, { waitUntil: 'networkidle' });
      await scrollThrough(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${target.path} @ ${width}px`).toBeLessThanOrEqual(0);
      if (process.env.E2E_SCREENSHOTS) {
        await page.screenshot({
          path: `e2e/.artifacts/${target.name}-${width}.png`,
          fullPage: process.env.E2E_SCREENSHOTS === 'full',
        });
      }
      await context.close();
    }
  });
}
