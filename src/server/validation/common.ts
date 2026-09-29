import 'server-only';

import { z } from 'zod';

/** Удаляем управляющие символы (кроме переноса строки и табуляции), нормализуем переносы */
export function cleanText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(
      /[\u{0}-\u{8}\u{B}\u{C}\u{E}-\u{1F}\u{7F}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2066}-\u{2069}]/gu,
      '',
    )
    .trim();
}

/** Однострочный текст: без переносов и повторяющихся пробелов */
export function cleanLine(value: string): string {
  return cleanText(value).replace(/\s+/g, ' ');
}

export const lineField = (min: number, max: number) =>
  z.string().transform(cleanLine).pipe(z.string().min(min).max(max));

export const textField = (min: number, max: number) =>
  z.string().transform(cleanText).pipe(z.string().min(min).max(max));

export const optionalLine = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value ? cleanLine(value) : ''))
    .pipe(z.string().max(max))
    .transform((value) => value || null);

/** Чекбокс/свитч из FormData: «on» — включено, отсутствие поля — выключено */
export const checkbox = z.preprocess(
  (value) => value === 'on' || value === 'true' || value === true,
  z.boolean(),
);

export const intField = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.replace(/\s/g, '').replace(',', '.') : value),
    z.coerce.number().int().min(min).max(max),
  );

export const numberField = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.replace(/\s/g, '').replace(',', '.') : value),
    z.coerce.number().min(min).max(max),
  );

export const idField = z.string().regex(/^[a-z0-9]{10,40}$/);

/** Преобразует ошибки Zod в словарь «поле → ключ ошибки» */
export function fieldErrorKeys(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '_form');
    if (!(field in result)) {
      result[field] = issue.code === 'custom' && issue.message ? issue.message : field;
    }
  }
  return result;
}

/** FormData → объект (только строковые значения, без файлов) */
export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$ACTION')) result[key] = value;
  }
  return result;
}
