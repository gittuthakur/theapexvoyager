import { NextResponse } from 'next/server';
import { getAllExperts, getExpertFacets } from '@/lib/experts';

// Filters over the small in-memory experts catalog — same style as /api/journeys.
// Facets are bundled into this same response rather than split into separate
// /destinations and /expertise endpoints, since they're just derived reads of the
// same dataset this route already fetches.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination')?.toLowerCase() ?? undefined;
  const travelStyle = searchParams.get('travelStyle') ?? undefined;
  const expertise = searchParams.get('expertise') ?? undefined;
  const q = searchParams.get('q')?.trim().toLowerCase() ?? undefined;

  try {
    const [all, facets] = await Promise.all([getAllExperts(), getExpertFacets()]);

    const experts = all.filter((expert) => {
      const matchesDestination = destination ? expert.destinationSlugs.includes(destination) : true;
      const matchesStyle = travelStyle ? expert.travelStyles.includes(travelStyle) : true;
      const matchesExpertise = expertise ? expert.expertise.includes(expertise) : true;
      const matchesQuery = q
        ? expert.name.toLowerCase().includes(q) || expert.bio.toLowerCase().includes(q) || expert.role.toLowerCase().includes(q)
        : true;
      return matchesDestination && matchesStyle && matchesExpertise && matchesQuery;
    });

    return NextResponse.json({ experts, facets });
  } catch (error) {
    console.error('Failed to fetch travel experts', error);
    return NextResponse.json({ error: 'Failed to fetch travel experts' }, { status: 500 });
  }
}
