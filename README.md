# DOMA RENT — сайт аренды квартир в Киеве и Днепре

Полноценный full-stack сайт риелтора: публичный каталог с серверными фильтрами, страницы квартир с галереей,
заявки, cookie-согласие, юридические страницы, SEO и защищённая панель управления с CRUD квартир и загрузкой фото.

> Название «DOMA RENT» временное и меняется в админке: **Настройки → Название сайта**.

## Возможности

**Публичный сайт**

- Главная с большой формой поиска (город, район, цена, комнаты, животные, дети), подборками и FAQ
- Каталог `/apartments`, `/kyiv/apartments`, `/dnipro/apartments`: серверная фильтрация, сортировка, пагинация,
  фильтры в URL (`/apartments?city=kyiv&rooms=2&pets=dog&maxPrice=25000`), боковая панель на десктопе и bottom sheet
  со счётчиком результатов на мобильных
- Фильтры: город, район, цена, комнаты, площадь, этаж (в т. ч. «не первый/не последний»), мебель, техника, дети,
  животные / собака / кошка, срок аренды
- Страница квартиры: галерея (свайп, миниатюры, полноэкранный режим, клавиатура), характеристики, условия,
  похожие квартиры, кнопки Telegram / Viber / WhatsApp / телефон / email с готовым текстом про объект
- Страницы городов с районами, «О нас», «Контакты» с формой заявки, политика конфиденциальности, cookies, условия
- Фиксированная мобильная панель связи, cookie-баннер с категориями, «недавно просмотренные» (при согласии)
- SEO: метаданные, canonical, Open Graph, Twitter Card, JSON-LD (RealEstateListing, BreadcrumbList,
  RealEstateAgent, FAQPage, ItemList), `sitemap.xml`, `robots.txt`, OG-изображение, 301 со старых адресов

**Панель управления** (`/admin`)

- Дашборд со статистикой и предупреждениями (не заполнены реквизиты/контакты, есть демо-данные)
- Квартиры: создание, редактирование, публикация, скрытие, «сдана», архив, удаление с подтверждением
- Фото: drag & drop, прогресс загрузки, сортировка перетаскиванием, главное фото, alt-тексты, удаление
- Заявки: статусы «Новая / В работе / Обработана / В архиве», удаление персональных данных
- Настройки: название, логотип, контакты, соцсети, реквизиты, SEO, аналитика (GA4 / Meta Pixel), курсы валют,
  смена пароля, завершение всех сессий, журнал событий безопасности

## Стек

| Слой           | Технологии                                                            |
| -------------- | --------------------------------------------------------------------- |
| Фреймворк      | Next.js 16 (App Router, Server Components, Server Actions), React 19  |
| Язык           | TypeScript 5.9 (strict)                                               |
| UI             | Tailwind CSS 4, shadcn/ui (Radix), Lucide, Motion, Embla, dnd-kit     |
| Данные         | PostgreSQL 17, Prisma 7 (driver adapter `pg`)                         |
| Валидация      | Zod 4 (сервер)                                                        |
| Аутентификация | собственные серверные сессии в БД, Argon2id (`@node-rs/argon2`)       |
| Изображения    | sharp (проверка и пересжатие), `next/image` (AVIF/WebP)               |
| Хранилище      | локальный диск или любое S3-совместимое (AWS S3, R2, MinIO, Supabase) |
| Качество       | ESLint 9 (`eslint-config-next`), Prettier, Playwright (e2e)           |

## Быстрый старт (локально)

Нужны **Node.js 20.19+** (рекомендуется 24) и **PostgreSQL 16+** (установленный или через Docker).

```bash
npm install
cp .env.example .env          # заполните AUTH_SECRET, DATABASE_URL, SEED_ADMIN_*
```

Сгенерировать `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**База данных** — один из вариантов:

```bash
# А) Отдельный кластер на уже установленном PostgreSQL (без Docker, данные в .data/postgres, порт 5433)
npm run db:local:init          # после перезагрузки компьютера: npm run db:local:start

# Б) Docker
docker compose up -d
```

**Миграции, seed и запуск:**

```bash
npm run db:deploy             # применить миграции
npm run db:seed               # администратор, настройки и демо-данные
npm run dev                   # http://localhost:3000, админка: http://localhost:3000/admin
```

## Администратор

- Seed создаёт администратора из `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Если пароль не задан, он генерируется
  и выводится в консоль один раз. Повторный seed пароль не меняет.
- Создать администратора или сменить пароль (пароль вводится скрыто и не попадает в историю команд):

  ```bash
  npm run admin:create -- --email you@your-site.ua
  ```

- Сменить пароль можно и в админке: **Настройки → Безопасность**.

## Seed и демо-данные

```bash
npm run db:seed                       # создаёт недостающее, повторный запуск безопасен
npm run db:seed -- --reset-demo       # пересоздать демо-квартиры
SEED_DEMO=false npm run db:seed       # только администратор и настройки (для production)
```

Демо-квартиры (Киев и Днепр, 1–3 комнаты, разные цены, районы и условия) помечены значком «Демо» и предупреждением
на странице, их фото — собственные векторные иллюстрации (без сторонних снимков). Удалить все демо-данные можно
одной кнопкой на дашборде админки.

## Production

```bash
npm ci
npm run db:deploy
SEED_DEMO=false npm run db:seed
npm run build
npm start                             # порт 3000, PORT=... для другого
```

Рекомендации:

- Задайте `SITE_URL=https://ваш-домен` — от него зависят canonical, sitemap, флаг `Secure` и префикс `__Host-` у cookie.
- Работайте за HTTPS-прокси (nginx/Caddy/Cloudflare). Для корректного ограничения частоты запросов прокси должен
  передавать реальный IP: `proxy_set_header X-Real-IP $remote_addr;`.
- Для платформ без постоянного диска (Vercel и т. п.) используйте `STORAGE_DRIVER=s3`. Переменная
  `STORAGE_PUBLIC_URL` нужна и на этапе сборки (разрешает домен хранилища для `next/image`).
- Заполните реквизиты и контакты в **Настройках** — они подставляются в юридические страницы и кнопки связи.

## Переменные окружения

Полный список с комментариями — в [`.env.example`](.env.example).

| Переменная                                                                                                                                           | Назначение                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `SITE_URL`                                                                                                                                           | Публичный адрес сайта                                            |
| `DATABASE_URL`                                                                                                                                       | Строка подключения PostgreSQL                                    |
| `AUTH_SECRET`                                                                                                                                        | Секрет (≥ 32 символов) для подписи токенов форм и хеширования IP |
| `STORAGE_DRIVER`                                                                                                                                     | `local` или `s3`                                                 |
| `UPLOAD_DIR`                                                                                                                                         | Папка для файлов при `local`                                     |
| `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`, `STORAGE_PUBLIC_URL`, `STORAGE_FORCE_PATH_STYLE` | Параметры S3-хранилища                                           |
| `TELEGRAM_URL`, `VIBER_URL`, `WHATSAPP_URL`, `CONTACT_PHONE`, `CONTACT_EMAIL`                                                                        | Начальные контакты для seed (дальше — в админке)                 |
| `COMPANY_NAME`, `COMPANY_ADDRESS`, `COMPANY_EMAIL`, `COMPANY_PHONE`                                                                                  | Начальные реквизиты для seed                                     |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`                                                                                                            | Администратор, создаваемый seed                                  |
| `LEAD_NOTIFY_TELEGRAM_BOT_TOKEN`, `LEAD_NOTIFY_TELEGRAM_CHAT_ID`                                                                                     | Необязательно: уведомления о заявках в Telegram                  |

Секреты хранятся только в `.env` / менеджере секретов и не попадают в git (см. `.gitignore`).

## Команды

| Команда                                                 | Что делает                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                                           | Режим разработки                                              |
| `npm run build` / `npm start`                           | Production-сборка и запуск                                    |
| `npm run typecheck` / `npm run lint` / `npm run format` | Проверка типов, ESLint, Prettier                              |
| `npm run db:migrate`                                    | Создать новую миграцию после изменения `prisma/schema.prisma` |
| `npm run db:deploy`                                     | Применить миграции                                            |
| `npm run db:seed`                                       | Seed                                                          |
| `npm run db:studio`                                     | Prisma Studio                                                 |
| `npm run db:local:init                                  | start                                                         | stop | status` | Локальный кластер PostgreSQL |
| `npm run admin:create -- --email …`                     | Создать администратора / сменить пароль                       |
| `npm run test:e2e`                                      | E2E-тесты (нужен запущенный сайт)                             |

## Тесты

Приёмочный сценарий из ТЗ автоматизирован на Playwright (`e2e/`): cookie-согласие, поиск и фильтры, страница
квартиры и галерея, кнопки связи, заявка, безопасность API и заголовков, защита от перебора пароля и полный цикл
в админке (создание → фото → порядок → главное фото → публикация → проверка на сайте → правка → скрытие →
исчезновение из каталога → публикация → удаление → заявки), плюс мобильная версия и отсутствие горизонтальной
прокрутки на ширинах 320–1440 px.

```bash
npm run build && npm start            # в отдельном терминале
npx playwright install chromium       # один раз
npx playwright test                   # desktop-сценарий
npx playwright test --project=mobile  # мобильная версия
npx playwright test --project=visual  # адаптивность 320–1440 px
# Использовать установленный Edge/Chrome вместо скачанного Chromium: PW_CHANNEL=msedge
```

## Безопасность

- **Аутентификация:** серверные сессии в БД (в cookie — случайный 256-битный токен, в БД — только его SHA-256),
  cookie `HttpOnly`, `SameSite=Lax`, `Secure` + префикс `__Host-` на HTTPS; скользящий срок 7 дней, максимум 30 дней;
  «выйти на всех устройствах»; смена пароля завершает остальные сессии.
- **Пароли:** Argon2id (параметры OWASP), одинаковое время ответа для существующих и несуществующих email.
- **Авторизация:** проверка сессии и роли в каждой admin-странице, server action и route handler (не только в UI);
  proxy лишь дополнительно перенаправляет гостей на страницу входа.
- **Перебор и спам:** лимиты частоты в PostgreSQL (работают на нескольких инстансах): вход — по IP и по email,
  заявки, загрузки, admin-действия; honeypot и подписанная метка времени в форме заявки.
- **CSRF:** встроенная проверка origin у Server Actions, явная проверка `Origin` в route handlers, `SameSite` cookie.
- **XSS:** экранирование React, никакого пользовательского HTML, безопасная сериализация JSON-LD, строгая CSP с nonce
  и `strict-dynamic`, фильтрация ссылок на мессенджеры (только `https:`, `tg:`, `viber:`).
- **SQL-инъекции:** только параметризованные запросы Prisma (raw-запросы — через tagged templates).
- **Загрузки:** проверка размера до чтения тела, сигнатуры файла (не расширения), полное декодирование sharp с
  лимитом пикселей, пересжатие в WebP без метаданных (EXIF/GPS удаляются), случайные имена файлов, защита от path
  traversal, SVG запрещён.
- **IDOR:** операции с фото проверяют принадлежность фото квартире; идентификаторы валидируются.
- **Заголовки:** CSP, HSTS, `X-Frame-Options: DENY` и `frame-ancestors 'none'`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, без `X-Powered-By`.
- **Ошибки:** пользователь видит только понятный текст и код ошибки — без стеков, путей и секретов.
- **Приватность:** IP хранится только в виде HMAC-хеша; аналитика и реклама загружаются только после согласия;
  журнал событий безопасности в админке.

## Структура проекта

```
prisma/
  schema.prisma            модели: Apartment, ApartmentImage, Lead, User, Session, SiteSettings, RateLimit, AuditLog
  migrations/              SQL-миграции
  seed.ts, seed/           seed, демо-данные и генератор иллюстраций
scripts/                   локальный PostgreSQL, создание администратора
e2e/                       Playwright-тесты
src/
  app/
    (public)/              публичные страницы: главная, каталог, квартира, города, контакты, документы
    admin/                 вход и панель управления
    api/                   загрузка фото и логотипа, подсчёт результатов фильтра
    media/                 раздача локальных файлов
    sitemap.ts, robots.ts, manifest.ts, og/
  components/              UI (ui/ — shadcn), каталог, квартира, админка, cookies, layout
  config/cities.ts         города и районы
  i18n/                    словари (ru, ru-admin), форматирование, провайдеры
  lib/                     фильтры каталога, контакты, slug, согласие на cookies
  server/                  БД, auth, безопасность, хранилище, изображения, запросы, server actions, SEO
  proxy.ts                 CSP с nonce, защита /admin
```

## Локализация и расширение

- Все тексты интерфейса — в `src/i18n/dictionaries`. Чтобы добавить украинский или английский, создайте `uk.ts` /
  `en.ts` по типу `Dictionary` и следуйте инструкции в `src/i18n/config.ts`.
- Новый город: значение в enum `City` (миграция) + запись в `src/config/cities.ts` + названия в словаре.

## Публикация на GitHub

В проект уже добавлены `.gitignore`, `.gitattributes`, `.editorconfig` и CI (`.github/workflows/ci.yml`: типы,
линтер, форматирование, миграции, seed, сборка и e2e-тесты на каждый push и pull request).

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<логин>/<репозиторий>.git
git push -u origin main
```

`.env`, база данных (`.data/`) и загруженные файлы (`storage/`) в репозиторий не попадают.
