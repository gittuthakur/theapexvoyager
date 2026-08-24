import { NextResponse } from 'next/server';
import { getRegionHubData } from '@/services/regions/regionHub.service';

// GET /api/regions/[slug]/hub — for client-side/external consumers only. The server
// component at app/regions/[slug]/page.tsx calls getRegionHubData(slug) directly and
// never fetches this route itself, avoiding a redundant round-trip.
//
// Response shape is an intentional, called-out exception to this codebase's house API
// convention (a flat `{ entityName: value }` object, see the other app/api/* routes) —
// this one route uses { success, data } / { success: false, error: { code, message } }
// as explicitly specified for the Region Hub feature.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const hub = await getRegionHubData(slug);

    if (!hub) {
      return NextResponse.json(
        { success: false, error: { code: 'REGION_NOT_FOUND', message: `No published region found for "${slug}".` } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: hub });
  } catch (error) {
    console.error(`GET /api/regions/${slug}/hub failed`, error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong loading this region.' } },
      { status: 500 }
    );
  }
}
