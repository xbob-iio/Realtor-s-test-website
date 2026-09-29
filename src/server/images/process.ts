import 'server-only';

import sharp from 'sharp';

export type ImageType = 'jpeg' | 'png' | 'webp' | 'avif';

export class ImageValidationError extends Error {
  constructor(public readonly reason: 'type' | 'dimensions' | 'corrupt') {
    super(`Invalid image: ${reason}`);
    this.name = 'ImageValidationError';
  }
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}

/**
 * Определение формата по сигнатуре файла (magic bytes).
 * Расширению и MIME-типу от браузера не доверяем.
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (bytes.length < 16) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSignature.every((value, index) => bytes[index] === value)) return 'png';

  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') return 'webp';

  if (ascii(bytes, 4, 8) === 'ftyp') {
    const boxSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
    const brands = [ascii(bytes, 8, 12)];
    for (let offset = 16; offset + 4 <= Math.min(boxSize, bytes.length, 128); offset += 4) {
      brands.push(ascii(bytes, offset, offset + 4));
    }
    if (brands.includes('avif') || brands.includes('avis')) return 'avif';
  }

  return null;
}

const SHARP_FORMATS: Record<ImageType, string[]> = {
  jpeg: ['jpeg'],
  png: ['png'],
  webp: ['webp'],
  avif: ['heif', 'avif'],
};

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  contentType: 'image/webp';
  extension: 'webp';
  blurDataUrl: string;
}

async function decodeAndValidate(input: Buffer, minWidth: number, minHeight: number) {
  const type = detectImageType(input);
  if (!type) throw new ImageValidationError('type');

  // limitInputPixels защищает от «декомпрессионных бомб»
  const image = sharp(input, { limitInputPixels: 60_000_000, failOn: 'error', animated: false });
  let metadata: Awaited<ReturnType<typeof image.metadata>>;
  try {
    metadata = await image.metadata();
  } catch {
    throw new ImageValidationError('corrupt');
  }
  if (!metadata.format || !SHARP_FORMATS[type].includes(metadata.format)) {
    throw new ImageValidationError('type');
  }
  if (!metadata.width || !metadata.height) throw new ImageValidationError('corrupt');
  if (
    Math.max(metadata.width, metadata.height) < minWidth ||
    Math.min(metadata.width, metadata.height) < minHeight
  ) {
    throw new ImageValidationError('dimensions');
  }
  return image;
}

async function makeBlurDataUrl(data: Buffer): Promise<string> {
  const tiny = await sharp(data).resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${tiny.toString('base64')}`;
}

/**
 * Фото квартиры: полное декодирование и пересжатие в WebP.
 * Исходный файл не сохраняется — это нейтрализует вредоносное содержимое
 * и удаляет метаданные (EXIF, включая GPS-координаты).
 */
export async function processApartmentPhoto(input: Buffer): Promise<ProcessedImage> {
  const image = await decodeAndValidate(input, 400, 300);
  try {
    const { data, info } = await image
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    return {
      data,
      width: info.width,
      height: info.height,
      contentType: 'image/webp',
      extension: 'webp',
      blurDataUrl: await makeBlurDataUrl(data),
    };
  } catch {
    throw new ImageValidationError('corrupt');
  }
}

/** Логотип: небольшое изображение с сохранением прозрачности */
export async function processLogo(input: Buffer): Promise<ProcessedImage> {
  const image = await decodeAndValidate(input, 32, 16);
  try {
    const { data, info } = await image
      .rotate()
      .resize({ width: 800, height: 240, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    return {
      data,
      width: info.width,
      height: info.height,
      contentType: 'image/webp',
      extension: 'webp',
      blurDataUrl: await makeBlurDataUrl(data),
    };
  } catch {
    throw new ImageValidationError('corrupt');
  }
}
