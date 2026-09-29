import { expect, test } from '@playwright/test';

import { acceptCookies, login, makeImages } from './helpers';

/**
 * Приёмочный сценарий из технического задания.
 * Требуется запущенное приложение с seed-данными: npm run build && npm start
 */

test.describe.configure({ mode: 'serial' });

test('Cookie consent: баннер, настройки категорий, без аналитики до согласия', async ({ page, context }) => {
  await page.goto('/');
  const banner = page.getByRole('region', { name: 'Файлы cookies' });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(
    'Мы используем cookies для работы сайта, аналитики и улучшения сервиса.',
  );
  await expect(banner.getByRole('button', { name: 'Принять все' })).toBeVisible();
  await expect(banner.getByRole('button', { name: 'Только необходимые' })).toBeVisible();

  await banner.getByRole('button', { name: 'Настроить' }).click();
  const dialog = page.getByRole('dialog', { name: 'Настройки cookies' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('switch', { name: /Функциональные/ }).click();
  await dialog.getByRole('button', { name: 'Сохранить выбор' }).click();
  await expect(dialog).toBeHidden();
  await expect(banner).toBeHidden();

  const consent = (await context.cookies()).find((cookie) => cookie.name === 'cookie_consent');
  // версия.функциональные.аналитика.маркетинг
  expect(decodeURIComponent(consent?.value ?? '')).toMatch(/^v1\.\d+\.1\.0\.0\.\d+$/);
  expect(await page.locator('script[src*="googletagmanager"], script[src*="fbevents"]').count()).toBe(0);

  await page.reload();
  await expect(page.getByRole('region', { name: 'Файлы cookies' })).toBeHidden();
});

test('Публичная часть: поиск → фильтры → квартира → галерея → связь → политика', async ({ page }) => {
  await page.goto('/');
  await acceptCookies(page);

  // Главная: выбираем Киев и ищем
  const search = page.getByRole('search', { name: 'Поиск квартиры' });
  await expect(search).toBeVisible();
  await search.getByRole('combobox', { name: 'Город' }).click();
  await page.getByRole('option', { name: 'Киев' }).click();
  await search.getByRole('button', { name: 'Найти квартиру' }).click();
  await page.waitForURL(/\/kyiv\/apartments/);
  await expect(page.getByRole('heading', { level: 1, name: 'Аренда квартир в Киеве' })).toBeVisible();

  // Фильтр цены
  const filters = page.getByRole('complementary', { name: 'Фильтры' });
  const maxPrice = filters.getByLabel('Цена до');
  await maxPrice.fill('35000');
  await maxPrice.press('Enter');
  await page.waitForURL(/maxPrice=35000/);

  // Фильтр комнат
  await filters
    .getByRole('group', { name: 'Комнаты' })
    .getByRole('button', { name: '2', exact: true })
    .click();
  await page.waitForURL(/rooms=2/);

  // «Можно с собакой»
  await filters.getByRole('button', { name: 'Можно с собакой' }).click();
  await page.waitForURL(/pets=dog/);
  await expect(page.locator('#catalog-results')).toHaveText(/Найдено: 2 квартиры/);
  const cards = page.locator('main article');
  await expect(cards).toHaveCount(2);

  // Ссылка с фильтрами работает и при прямом переходе (URL отражает фильтры)
  const filteredUrl = page.url();
  expect(filteredUrl).toContain('/kyiv/apartments?');

  // Открываем квартиру
  await cards.first().getByRole('link').click();
  await page.waitForURL(/\/apartments\/[a-z0-9-]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Галерея: следующее фото, полноэкранный режим, клавиатура
  const gallery = page.getByRole('region', { name: 'Фотогалерея' });
  await expect(gallery).toContainText(/1 из \d+/);
  await gallery.getByRole('button', { name: 'Следующее фото' }).click();
  await expect(gallery).toContainText(/2 из \d+/);
  await gallery.getByRole('button', { name: 'Все фото' }).click();
  const lightbox = page.getByRole('dialog', { name: 'Фотогалерея' });
  await expect(lightbox).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(lightbox).toContainText(/3 из \d+/);
  await page.keyboard.press('Escape');
  await expect(lightbox).toBeHidden();

  // Кнопки связи: Telegram, WhatsApp, телефон (с текстом про квартиру)
  const telegram = page.locator('main a[href^="https://t.me/"]').first();
  const whatsapp = page.locator('main a[href^="https://wa.me/"]').first();
  const phone = page.locator('main a[href^="tel:"]').first();
  await expect(telegram).toBeVisible();
  await expect(whatsapp).toBeVisible();
  await expect(phone).toBeVisible();
  expect(await telegram.getAttribute('href')).toContain('text=');
  expect(await whatsapp.getAttribute('href')).toContain('text=');
  expect(await telegram.getAttribute('rel')).toContain('noopener');

  // CTA «Узнать, свободна ли квартира» открывает форму заявки
  await page.getByRole('button', { name: 'Узнать, свободна ли квартира' }).click();
  const contactDialog = page.getByRole('dialog', { name: 'Узнать, свободна ли квартира' });
  await expect(contactDialog).toBeVisible();
  await expect(contactDialog.getByRole('button', { name: 'Отправить заявку' })).toBeVisible();
  await page.keyboard.press('Escape');

  // Политика конфиденциальности
  await page.goto('/privacy-policy');
  await expect(page.getByRole('heading', { level: 1, name: 'Политика конфиденциальности' })).toBeVisible();
});

test('Заявка: валидация, согласие и успешная отправка', async ({ page }) => {
  await page.goto('/contacts');
  await acceptCookies(page);
  const form = page.locator('#lead-form');

  // Без согласия отправить нельзя
  await form.getByLabel('Имя').fill('E2E Тест');
  await form.getByLabel('Телефон').fill('+380 50 123 45 67');
  await form.getByRole('button', { name: 'Отправить заявку' }).click();
  await expect(form.getByText('Необходимо согласие с политикой конфиденциальности')).toBeVisible();

  await form.getByRole('radio', { name: 'WhatsApp' }).click();
  await form.getByLabel(/Сообщение/).fill('Проверка формы заявки из автотеста');
  await form.getByRole('checkbox').click();
  // Защита от ботов: слишком быстрая отправка отклоняется
  await page.waitForTimeout(2_800);
  await form.getByRole('button', { name: 'Отправить заявку' }).click();
  await expect(form.getByText('Заявка отправлена')).toBeVisible();
});

test('Безопасность API: без сессии и с чужого origin загрузка запрещена', async ({ request, baseURL }) => {
  const url = '/api/admin/apartments/abcdefghijklmnop/images';
  const foreign = await request.post(url, {
    headers: { origin: 'https://evil.example' },
    multipart: { file: 'x' },
  });
  expect(foreign.status()).toBe(403);
  const anonymous = await request.post(url, { headers: { origin: baseURL! }, multipart: { file: 'x' } });
  expect(anonymous.status()).toBe(401);

  const adminPage = await request.get('/admin/apartments', { maxRedirects: 0 });
  expect(adminPage.status()).toBe(307);
  expect(adminPage.headers()['location']).toContain('/admin/login');

  const home = await request.get('/');
  const headers = home.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toContain('camera=()');
  expect(headers['x-powered-by']).toBeUndefined();
});

test('Вход: неверный пароль и блокировка перебора', async ({ page }) => {
  const email = `nobody-${Date.now()}@example.com`;
  await page.goto('/admin/login');
  for (let attempt = 1; attempt <= 6; attempt++) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль', { exact: true }).fill(`wrong-password-${attempt}`);
    await page.getByRole('button', { name: 'Войти' }).click();
    const expected = attempt <= 5 ? 'Неверный email или пароль' : /Слишком много попыток входа/;
    await expect(page.locator('form').getByRole('alert')).toHaveText(expected);
  }
});

test('Админка: создание, фото, публикация, скрытие, удаление, заявки', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Добро пожаловать');

  // Создание
  const title = `E2E: 2-комнатная квартира ${Date.now()}`;
  await page.goto('/admin/apartments/new');
  await page.getByRole('textbox', { name: 'Название', exact: true }).fill(title);
  await page.getByRole('combobox', { name: 'Город' }).click();
  await page.getByRole('option', { name: 'Киев' }).click();
  await page.getByRole('combobox', { name: 'Район' }).click();
  await page.getByRole('option', { name: 'Печерский' }).click();
  await page.getByRole('textbox', { name: 'Адрес', exact: true }).fill('улица Тестовая, рядом с парком');
  await page.getByLabel('Комнат').fill('2');
  await page.getByLabel('Площадь, м²').fill('54,5');
  await page.getByRole('textbox', { name: 'Этаж', exact: true }).fill('5');
  await page.getByLabel('Этажность дома').fill('9');
  await page.getByLabel('Цена в месяц').fill('21 000');
  await page.getByLabel('Сумма депозита').fill('21000');
  await page.getByRole('switch', { name: 'Можно с детьми' }).click();
  await page.getByRole('switch', { name: 'Можно с животными' }).click();
  await page.getByRole('switch', { name: 'Можно с собакой' }).click();
  await page
    .getByRole('textbox', { name: 'Описание', exact: true })
    .fill('Тестовая квартира, созданная автотестом. Светлая, с ремонтом, рядом парк и метро.');
  await page.getByRole('button', { name: 'Создать квартиру' }).click();
  await page.waitForURL(/\/admin\/apartments\/[a-z0-9]{10,}$/);
  await expect(page.getByText('Квартира создана. Добавьте фотографии.')).toBeVisible();
  const editUrl = page.url();

  // Публикация без фото запрещена
  await page.getByRole('button', { name: 'Опубликовать' }).click();
  await expect(page.getByText('Для публикации добавьте хотя бы одну фотографию')).toBeVisible();

  // Загрузка фото (JPEG, PNG, WebP) и отклонение файла с поддельным расширением
  await page
    .locator('input[type="file"]')
    .setInputFiles([
      ...(await makeImages()),
      { name: 'fake.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('это не изображение, а текст') },
    ]);
  await expect(page.getByText('«fake.jpg»: неподдерживаемый формат').first()).toBeVisible();
  const handles = page.getByRole('button', { name: 'Перетащите, чтобы изменить порядок' });
  await expect(handles).toHaveCount(3);

  // Изменение порядка и выбор главного фото
  await page.getByRole('button', { name: 'Переместить правее' }).first().click();
  await expect(page.getByText('Порядок фотографий сохранён').first()).toBeVisible();
  await page.getByRole('button', { name: 'Сделать главным' }).last().click();
  await expect(page.getByText('Главное фото обновлено').first()).toBeVisible();

  // Публикация
  await page.getByRole('button', { name: 'Опубликовать' }).click();
  await expect(page.getByText('Квартира опубликована').first()).toBeVisible();
  const slug = (await page.locator('main p').first().textContent())?.match(/\/apartments\/([a-z0-9-]+)/)?.[1];
  expect(slug).toBeTruthy();

  // Квартира появилась на сайте
  const publicResponse = await page.request.get(`/apartments/${slug}`);
  expect(publicResponse.status()).toBe(200);
  expect(await publicResponse.text()).toContain(title);

  // Редактирование: slug при смене названия не меняется
  await page.goto(editUrl);
  await page.getByRole('textbox', { name: 'Название', exact: true }).fill(`${title} (изменено)`);
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(page.getByText('Изменения сохранены').first()).toBeVisible();
  expect((await page.request.get(`/apartments/${slug}`)).status()).toBe(200);

  // Скрытие: исчезает с сайта
  await page.getByRole('button', { name: 'Скрыть с сайта' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Скрыть' }).click();
  await expect(page.getByText('Квартира скрыта с сайта').first()).toBeVisible();
  expect((await page.request.get(`/apartments/${slug}`)).status()).toBe(404);
  expect(await (await page.request.get('/kyiv/apartments')).text()).not.toContain(title);

  // Возврат публикации
  await page.getByRole('button', { name: 'Опубликовать' }).click();
  await expect(page.getByText('Квартира опубликована').first()).toBeVisible();
  expect((await page.request.get(`/apartments/${slug}`)).status()).toBe(200);

  // Удаление с подтверждением
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Удалить навсегда' }).click();
  await page.waitForURL(/\/admin\/apartments$/);
  await expect(page.getByText('Квартира удалена').first()).toBeVisible();
  expect((await page.request.get(`/apartments/${slug}`)).status()).toBe(404);

  // Заявки: заявка из формы на сайте видна в админке
  await page.goto('/admin/leads');
  const lead = page.locator('li', { hasText: 'E2E Тест' }).first();
  await expect(lead).toBeVisible();
  await lead.getByRole('combobox', { name: 'Статус заявки' }).click();
  await page.getByRole('option', { name: 'В работе' }).click();
  await expect(page.getByText('Статус заявки обновлён').first()).toBeVisible();
  // Удаление тестовой заявки (персональные данные)
  await page
    .locator('li', { hasText: 'E2E Тест' })
    .first()
    .getByRole('button', { name: 'Удалить заявку' })
    .click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Удалить заявку' }).click();
  await expect(page.getByText('Заявка удалена').first()).toBeVisible();
});
