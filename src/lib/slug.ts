const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function transliterate(text: string): string {
  return [...text.toLowerCase()].map((char) => TRANSLIT[char] ?? char).join('');
}

export function slugify(text: string, maxLength = 100): string {
  return transliterate(text)
    .normalize('NFKD')
    .replace(/[\u{300}-\u{36f}]/gu, '')
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}

/**
 * Базовый slug из параметров квартиры: «2-room-apartment-pecherskyi-kyiv».
 * Строится один раз при создании и не зависит от названия.
 */
export function apartmentBaseSlug(params: { rooms: number; district: string; citySlug: string }): string {
  return slugify(`${params.rooms}-room-apartment-${params.district}-${params.citySlug}`);
}
