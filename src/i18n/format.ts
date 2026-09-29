/**
 * Детерминированное форматирование: одинаковый результат на сервере и в браузере
 * (Intl в разных движках по-разному расставляет пробелы, что ломает гидратацию).
 */
import type { Currency } from '@/generated/prisma/enums';

const NBSP = String.fromCharCode(0xa0);

/** Подстановка значений: fill('Найдено {count}', { count: 5 }) */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Русские формы множественного числа: [одна, несколько, много] */
export function plural(count: number, forms: readonly string[]): string {
  const [one = '', few = one, many = few] = forms;
  const abs = Math.abs(Math.trunc(count));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** 25000 → «25 000», 45.5 → «45,5» */
export function formatNumber(value: number, maxFractionDigits = 1): string {
  const factor = 10 ** maxFractionDigits;
  const rounded = Math.round(value * factor) / factor;
  const negative = rounded < 0;
  const [integerPart = '0', fractionPart] = Math.abs(rounded).toString().split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const result = fractionPart ? `${grouped},${fractionPart}` : grouped;
  return negative ? `-${result}` : result;
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
};

/** 25000 UAH → «25 000 ₴», 900 USD → «900 $» */
export function formatPrice(amount: number, currency: Currency = 'UAH'): string {
  return `${formatNumber(amount, 0)}${NBSP}${CURRENCY_SYMBOL[currency]}`;
}

/** Дата «28 сентября 2026» в часовом поясе Киева */
export function formatDate(date: Date | string, monthsGenitive: readonly string[]): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(value);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return `${get('day')}${NBSP}${monthsGenitive[get('month') - 1] ?? ''} ${get('year')}`;
}

/** Дата и время «28.09.2026, 14:05» (Киев) — для админки */
export function formatDateTime(date: Date | string): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')}, ${get('hour')}:${get('minute')}`;
}

/** Номер телефона для ссылки tel: — только цифры и ведущий + */
export function phoneToHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits.startsWith('+') ? digits : `+${digits}`}`;
}
