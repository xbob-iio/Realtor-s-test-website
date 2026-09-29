import { notFound } from 'next/navigation';

import { getCityBySlug } from '@/config/cities';

/** Неизвестный город — честный 404 ещё до стриминга вложенных страниц */
export default async function CityLayout({
  params,
  children,
}: {
  params: Promise<{ city: string }>;
  children: React.ReactNode;
}) {
  const { city } = await params;
  if (!getCityBySlug(city)) notFound();
  return children;
}
