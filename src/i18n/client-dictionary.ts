import type { Dictionary } from './dictionaries/ru';

/** Разделы, которые используются только на сервере и не нужны в браузере */
type ServerOnlySections = 'home' | 'about' | 'cityPage' | 'legal';

/** Часть словаря, которая передаётся в клиентские компоненты */
export type ClientDictionary = Omit<Dictionary, ServerOnlySections>;

export function toClientDictionary(dictionary: Dictionary): ClientDictionary {
  const { home: _home, about: _about, cityPage: _cityPage, legal: _legal, ...client } = dictionary;
  return client;
}
