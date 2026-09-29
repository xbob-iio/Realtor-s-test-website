import { NextResponse, type NextRequest } from 'next/server';

import { parseCatalogFilters, type RawSearchParams } from '@/lib/catalog/filters';
import { countCatalog } from '@/server/queries/apartments';

/** Количество опубликованных квартир по фильтрам — для кнопки «Показать N вариантов» */
export async function GET(request: NextRequest) {
  const raw: RawSearchParams = {};
  for (const key of new Set(request.nextUrl.searchParams.keys())) {
    const values = request.nextUrl.searchParams.getAll(key).slice(0, 10);
    raw[key] = values.length > 1 ? values : values[0];
  }

  try {
    const count = await countCatalog(parseCatalogFilters(raw));
    return NextResponse.json(
      { count },
      { headers: { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('[api/count]', error);
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
