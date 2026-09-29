import 'dotenv/config';

import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-проверки. Приложение должно быть запущено (npm run build && npm start).
 *   npx playwright test                    — приёмочный сценарий
 *   PW_CHANNEL=msedge npx playwright test  — использовать установленный Edge/Chrome
 *                                            вместо скачанного Chromium
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    channel: process.env.PW_CHANNEL || undefined,
    locale: 'ru-RU',
    timezoneId: 'Europe/Kyiv',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /(visual|mobile|debug-.*)\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /visual\.spec\.ts/,
    },
  ],
});
