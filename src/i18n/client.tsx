'use client';

import { createContext, useContext } from 'react';

import type { Locale } from './config';
import type { ClientDictionary } from './client-dictionary';

interface I18nContextValue {
  locale: Locale;
  t: ClientDictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: ClientDictionary;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, t: dictionary }}>{children}</I18nContext.Provider>;
}

/** Словарь текущего языка в клиентских компонентах */
export function useDictionary(): ClientDictionary {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useDictionary must be used inside <I18nProvider>');
  return context.t;
}

export function useLocale(): Locale {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useLocale must be used inside <I18nProvider>');
  return context.locale;
}
