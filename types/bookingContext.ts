import type { TravelStyleId, StayTypeId, TransportModeId } from './tripPlanner';

export type BookingSource = 'journey' | 'destination' | 'stay' | 'experience' | 'transport' | 'region';

/**
 * Normalized shape returned by lib/bookingContext.ts's resolveBookingContext, regardless
 * of which real catalog (Journey/Tour, Destination, Hotel, Experience, TransportVehicle)
 * the source+slug resolved against — lets the Plan My Journey wizard prefill from any of
 * them through one interface instead of branching on the source everywhere it consumes it.
 */
export interface BookingContext {
  source: BookingSource;
  slug: string;
  title: string;
  destinationSlug?: string;
  destinationName?: string;
  regionId?: string;
  /** config/tripPlanner.config.ts's PLANNER_REGIONS id — see getPlannerRegionId. */
  plannerRegionId?: string;
  travelStyleIds?: TravelStyleId[];
  stayTypeIds?: StayTypeId[];
  stayAmenities?: string[];
  transportModeId?: TransportModeId | null;
}
