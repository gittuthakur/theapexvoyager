import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { isValidCalendarDateISO } from '@/lib/dateValidation';
import { TransportRoute, type TransportRouteDocument } from '@/models/TransportRoute';
import { Region } from '@/models/Region';
import { resolveTransportPricing } from '@/services/pricing/combinedTransportPricing.service';
import type { TransportRateType } from '@/models/TransportRate';

/**
 * TP3F — the one public price endpoint for the Transport customer flow. This is a thin,
 * sanitizing wrapper around services/pricing/combinedTransportPricing.service.ts's
 * resolveTransportPricing (server-only) — it never re-implements pricing logic itself,
 * and never returns internal fields a client doesn't need (rateRuleId, rateId,
 * partnerId, sourceReference, notes, etc.). Distance is always read from the genuine
 * TransportRoute document server-side — a client can influence WHICH route/vehicle/date
 * it asks about, never the distance used to price it.
 *
 * This is deliberately distinct from the TP3B "no public estimate-rule endpoint" rule
 * (Section 26 of that phase): that rule was about never exposing the underlying
 * TransportEstimateRule rows themselves. This endpoint returns only a computed price and
 * customer-safe metadata for one specific request — the underlying rule/rate data is
 * never queryable or listable through it.
 */

// The Route Booking Popup's own UI trip-type labels (config/transportServiceTypes.config.ts's
// TRIP_TYPE_OPTIONS) mapped to the backend's TripType/TransportRateType enums. Only 'One
// Way' is currently supported by the calculated-estimate engine — the others correctly
// fall through to QUOTE_REQUIRED today (no supplier data exists for them either), but are
// mapped here so this endpoint keeps working automatically if supplier or estimate data
// for them is ever added, without another code change.
const UI_TRIP_TYPE_TO_BACKEND: Record<string, { tripType: string; rateType: TransportRateType }> = {
  'One Way': { tripType: 'ONE_WAY', rateType: 'POINT_TO_POINT' },
  'Round Trip': { tripType: 'ROUND_TRIP', rateType: 'ROUND_TRIP' },
  'Multi-Day': { tripType: 'MULTI_DAY', rateType: 'POINT_TO_POINT' }
};

const QUOTE_REQUIRED_RESPONSE = { status: 'QUOTE_REQUIRED' as const, message: 'Get Custom Quote' };

// TP3B Section 34's customer wording contract — never "Verified Fare"/"Confirmed Fare"/
// "Live Fare"/"Supplier Price" for a calculated estimate.
const CALCULATED_ESTIMATE_LABEL = 'Estimated Fare';
const CALCULATED_ESTIMATE_DISCLAIMER = 'Final fare may vary based on tolls, parking, state taxes, permits and final route confirmation.';

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get('routeId');
  const vehicleCategory = searchParams.get('vehicleCategory');
  const uiTripType = searchParams.get('tripType');
  const travelDate = searchParams.get('travelDate');
  const travellerCountParam = searchParams.get('travellerCount');
  const travellerCount = travellerCountParam ? Number(travellerCountParam) : undefined;

  if (!routeId || !vehicleCategory || !uiTripType || !travelDate || !isValidCalendarDateISO(travelDate)) {
    return NextResponse.json(QUOTE_REQUIRED_RESPONSE);
  }

  const mapped = UI_TRIP_TYPE_TO_BACKEND[uiTripType];
  if (!mapped) {
    return NextResponse.json(QUOTE_REQUIRED_RESPONSE);
  }

  try {
    await connectDB();

    const route = await TransportRoute.findById(routeId).lean<TransportRouteDocument | null>();
    if (!route || !route.active || !isPositiveFiniteNumber(route.distanceKm)) {
      // Missing/invalid/non-positive distance, or an unknown/inactive route — never
      // invented (TP3B Section 10). QUOTE_REQUIRED is the only safe outcome.
      return NextResponse.json(QUOTE_REQUIRED_RESPONSE);
    }

    const region = route.regionId ? await Region.findById(route.regionId).lean<{ slug: string } | null>() : null;

    const result = await resolveTransportPricing({
      vehicleCategory,
      travelDate,
      rateType: mapped.rateType,
      routeId,
      serviceRegion: region?.slug,
      tripType: mapped.tripType,
      rateBasis: 'PER_KM',
      distanceKm: route.distanceKm,
      travellerCount: Number.isFinite(travellerCount) ? travellerCount : undefined
    });

    if (result.status === 'QUOTE_REQUIRED') {
      return NextResponse.json(QUOTE_REQUIRED_RESPONSE);
    }

    if (result.status === 'CALCULATED_ESTIMATE') {
      return NextResponse.json({
        status: 'CALCULATED_ESTIMATE' as const,
        label: CALCULATED_ESTIMATE_LABEL,
        amountMinorUnits: result.amountMinorUnits,
        currency: result.currency,
        distanceKm: result.distanceKm,
        disclaimer: CALCULATED_ESTIMATE_DISCLAIMER
      });
    }

    // EXACT_SUPPLIER_RATE | GENERIC_SUPPLIER_ESTIMATE — a genuine supplier-backed result.
    return NextResponse.json({
      status: result.status,
      label: result.status === 'EXACT_SUPPLIER_RATE' ? 'Confirmed Fare' : 'Estimated Fare',
      amountMinorUnits: result.amountMinorUnits,
      currency: result.currency
    });
  } catch (error) {
    console.error('Failed to resolve transport price', error);
    // Never surface a broken/partial price to a customer — the same safe fallback as a
    // genuine QUOTE_REQUIRED business outcome (TP3F Section 5).
    return NextResponse.json(QUOTE_REQUIRED_RESPONSE, { status: 200 });
  }
}
