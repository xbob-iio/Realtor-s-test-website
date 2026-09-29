import { headers } from 'next/headers';

import { serializeJsonLd } from '@/server/seo';

type JsonLdObject = Record<string, unknown>;

/** Структурированные данные schema.org. Содержимое экранируется от XSS. */
export async function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // Данные сериализуются с экранированием <, >, & — безопасно для встраивания
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
