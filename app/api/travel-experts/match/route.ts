import { NextResponse } from 'next/server';
import { getAllExperts } from '@/lib/experts';
import type { TravelExpert } from '@/types/expert';

interface MatchRequestBody {
  destinationSlug?: string;
  travelStyle?: string;
  tripType?: string;
  needHelpWith?: string;
}

// Simple rule-based scoring (spec §11) — no AI matching is claimed anywhere in the
// product copy, so none is implemented here. Destination match counts most since
// it's the strongest signal of whether an expert actually knows the route.
function scoreExpert(expert: TravelExpert, criteria: MatchRequestBody): number {
  let score = 0;

  if (criteria.destinationSlug && expert.destinationSlugs.includes(criteria.destinationSlug)) {
    score += 3;
  }
  if (criteria.travelStyle && expert.travelStyles.includes(criteria.travelStyle)) {
    score += 2;
  }

  const keywordText = [criteria.tripType, criteria.needHelpWith].filter(Boolean).join(' ').toLowerCase();
  if (keywordText) {
    const hasExpertiseKeywordMatch = expert.expertise.some((item) => keywordText.includes(item.toLowerCase()) || item.toLowerCase().includes(keywordText));
    if (hasExpertiseKeywordMatch) score += 1;
  }

  return score;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const criteria: MatchRequestBody = {
    destinationSlug: typeof body?.destinationSlug === 'string' ? body.destinationSlug : undefined,
    travelStyle: typeof body?.travelStyle === 'string' ? body.travelStyle : undefined,
    tripType: typeof body?.tripType === 'string' ? body.tripType : undefined,
    needHelpWith: typeof body?.needHelpWith === 'string' ? body.needHelpWith : undefined
  };

  try {
    const experts = await getAllExperts();
    const ranked = experts
      .map((expert) => ({ expert, score: scoreExpert(expert, criteria) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ expert: ranked[0]?.expert ?? null });
  } catch (error) {
    console.error('Failed to match a travel expert', error);
    return NextResponse.json({ error: 'Failed to match a travel expert' }, { status: 500 });
  }
}
