import { NextResponse } from 'next/server';
import { isLocalDevelopment } from '@/lib/env';
import { describeHbxAuth } from '@/services/providers/hbx/hbx.client';
import { getHbxDestinationMapping } from '@/config/hbxDestinations.config';
import { getRawPricingResult } from '@/services/pricing/stayPricing.service';

export const dynamic = 'force-dynamic';

/**
 * Server-only diagnostic surface for the HBX provider — NEVER a public pricing page.
 * Gated the same way lib/stays.ts gates real Google Places spend in dev
 * (isLocalDevelopment()): every hosting provider's production build sets NODE_ENV to
 * 'production' (see lib/env.ts's own doc comment), so this 404s in every real
 * deployment regardless of who might otherwise be able to reach the URL. POST-only and
 * unlinked from any nav/sitemap — there is no GET handler for a crawler to index.
 *
 * Returns services/pricing/stayPricing.service.ts's raw provider result (evaluation
 * rates included, each with its own honest `environment` tag) — this is intentionally
 * NOT the same function (`resolvePublicPriceState`) any real UI is allowed to call.
 */
export async function POST(request: Request) {
  if (!isLocalDevelopment()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let payload: {
    destinationSlug?: string;
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    rooms?: number;
    hotelCodes?: (string | number)[];
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { destinationSlug, checkIn, checkOut } = payload;
  if (!destinationSlug || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'destinationSlug, checkIn and checkOut are required' }, { status: 400 });
  }

  const mapping = getHbxDestinationMapping(destinationSlug);
  if (!mapping) {
    return NextResponse.json({
      auth: describeHbxAuth(),
      mapping: null,
      note: `No verified HBX destination mapping for "${destinationSlug}" — see config/hbxDestinations.config.ts.`
    });
  }

  const result = await getRawPricingResult({
    destinationSlug,
    checkIn,
    checkOut,
    adults: payload.adults ?? 2,
    children: payload.children ?? 0,
    rooms: payload.rooms ?? 1,
    providerHotelIds: payload.hotelCodes?.map(String)
  });

  return NextResponse.json({
    auth: describeHbxAuth(),
    mapping,
    result,
    disclaimer:
      'DIAGNOSTIC ONLY. Rates above (if any) come from the HBX evaluation environment and are NOT live, customer-bookable production rates. Never display these to a site visitor — see services/pricing/stayPricing.service.ts\'s resolvePublicPriceState for the function every public page must use instead.'
  });
}
