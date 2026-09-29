/** Ограничения загрузки — общие для клиента (подсказки) и сервера (проверка) */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTOS_PER_APARTMENT = 30;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.avif';

export function bytesToMegabytes(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}
