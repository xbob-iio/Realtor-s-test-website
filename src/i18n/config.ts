/**
 * Локализация.
 *
 * Сейчас сайт работает на русском. Чтобы добавить украинский или английский:
 * 1) создайте словарь src/i18n/dictionaries/uk.ts (тип Dictionary гарантирует,
 *    что переведены все ключи) и зарегистрируйте его в src/i18n/index.ts;
 * 2) добавьте код языка в `locales`;
 * 3) вынесите публичные страницы в сегмент app/[locale] и определяйте язык
 *    в src/proxy.ts (русский остаётся языком по умолчанию без префикса).
 */
export const locales = ['ru'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

/** BCP 47 теги для Intl и атрибута lang */
export const intlLocale: Record<Locale, string> = {
  ru: 'ru-UA',
};

export const htmlLang: Record<Locale, string> = {
  ru: 'ru',
};

export const ogLocale: Record<Locale, string> = {
  ru: 'ru_UA',
};
