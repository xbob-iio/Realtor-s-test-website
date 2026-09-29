import { defaultLocale, type Locale } from './config';
import { ru, type Dictionary } from './dictionaries/ru';
import { ruAdmin, type AdminDictionary } from './dictionaries/ru-admin';

const dictionaries: Record<Locale, Dictionary> = { ru };
const adminDictionaries: Record<Locale, AdminDictionary> = { ru: ruAdmin };

/** Текущий язык. Когда появится мультиязычность — читать из сегмента [locale]. */
export function getLocale(): Locale {
  return defaultLocale;
}

export function getDictionary(locale: Locale = getLocale()): Dictionary {
  return dictionaries[locale];
}

export function getAdminDictionary(locale: Locale = getLocale()): AdminDictionary {
  return adminDictionaries[locale];
}

export type { Dictionary, AdminDictionary, Locale };
