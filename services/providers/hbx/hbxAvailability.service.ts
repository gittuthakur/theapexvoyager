import { getHbxDestinationMapping } from '@/config/hbxDestinations.config';
import { HBX_SOURCE_MARKET } from '@/config/hbxEnvironment.config';
import { hbxFetch, isHbxConfigured } from './hbx.client';
import { logHbxError } from './hbx.errors';
import { mapHbxAvailabilityToRates } from './hbx.mapper';
import { getSampleHotelsForDestination } from './hbxHotels.service';
import type { HbxAvailabilityResponse } from './hbx.types';
import type { StayPricingProvider, StayPricingQuery, StayPricingResult } from '../../pricing/stayPricing.types';

/** Availability search only — POST /hotel-api/1.0/hotels. This file itself only ever
 *  calls Availability — CheckRate and Booking creation/retrieval/cancellation are
 *  separate, dedicated services (services/providers/hbx/hbxCheckRate.service.ts,
 *  hbxBooking.service.ts) invoked only by the explicit booking workflow
 *  (services/pricing/hbxBookingWorkflow.service.ts), never from here. */
const AVAILABILITY_PATH = '/hotel-api/1.0/hotels';

function nightsBetween(checkIn: string, checkOut: string): number {
  const inDate = new Date(`${checkIn}T00:00:00Z`);
  const outDate = new Date(`${checkOut}T00:00:00Z`);
  const nights = Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

async function getAvailability(query: StayPricingQuery): Promise<StayPricingResult> {
  if (!isHbxConfigured()) {
    return { state: 'UNAVAILABLE', rates: [], error: 'HBX not configured' };
  }

  const mapping = getHbxDestinationMapping(query.destinationSlug);
  if (!mapping) {
    // No verified destination mapping — fail safe, never guess a code. Not a
    // PROVIDER_ERROR: this destination legitimately has no HBX coverage yet.
    return { state: 'UNAVAILABLE', rates: [] };
  }

  let hotelCodes: number[];
  if (query.providerHotelIds && query.providerHotelIds.length > 0) {
    hotelCodes = query.providerHotelIds.map(Number).filter(Number.isFinite);
  } else {
    const sample = await getSampleHotelsForDestination(mapping.hbxCode);
    hotelCodes = sample.map((hotel) => hotel.hbxCode);
  }

  if (hotelCodes.length === 0) {
    return { state: 'UNAVAILABLE', rates: [] };
  }

  const nightCount = nightsBetween(query.checkIn, query.checkOut);

  try {
    const response = await hbxFetch<HbxAvailabilityResponse>(AVAILABILITY_PATH, {
      method: 'POST',
      body: {
        stay: { checkIn: query.checkIn, checkOut: query.checkOut },
        occupancies: [{ rooms: query.rooms, adults: query.adults, children: query.children }],
        hotels: { hotel: hotelCodes },
        // A rateKey is only ever valid for the sourceMarket it was originally quoted
        // under (config/hbxEnvironment.config.ts's own doc comment) — sent from
        // Availability onward, consistently, so CheckRate/Booking never mismatch it.
        sourceMarket: HBX_SOURCE_MARKET
      }
    });

    const rates = (response.hotels?.hotels ?? []).flatMap((hotel) => mapHbxAvailabilityToRates(hotel, nightCount));
    return { state: rates.length > 0 ? 'VERIFIED_LIVE_RATE' : 'UNAVAILABLE', rates };
  } catch (error) {
    logHbxError('getAvailability', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { state: 'PROVIDER_ERROR', rates: [], error: message };
  }
}

export const hbxPricingProvider: StayPricingProvider = {
  id: 'hbx',
  getAvailability
};
