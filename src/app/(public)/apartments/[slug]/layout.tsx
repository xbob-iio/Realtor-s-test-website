import { notFound, permanentRedirect } from 'next/navigation';

import { findRedirectSlug, getPublishedApartmentBySlug } from '@/server/queries/apartments';

/**
 * Проверка существования объявления до начала стриминга (loading.tsx ниже по дереву):
 * так несуществующая или снятая с публикации квартира отдаёт настоящий статус 404,
 * а старый адрес после смены slug — постоянный редирект.
 * Запрос кешируется на время HTTP-запроса и переиспользуется страницей.
 */
export default async function ApartmentLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const apartment = await getPublishedApartmentBySlug(slug);
  if (!apartment) {
    const target = await findRedirectSlug(slug);
    if (target) permanentRedirect(`/apartments/${target}`);
    notFound();
  }
  return children;
}
