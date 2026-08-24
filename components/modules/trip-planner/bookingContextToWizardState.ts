import type { BookingContext } from '@/types/bookingContext';
import type { TripPlannerWizardState } from '@/types/tripPlanner';

/**
 * Turns a resolved BookingContext into a fresh wizard state, built off `defaultState`
 * rather than merged into whatever is currently live — so switching from one booked
 * item to another (e.g. Spiti → Kashmir) always discards the previous selection
 * instead of layering on top of it. Fields the context has no opinion on (dates,
 * travellers, budget, experienceIds) are left at `defaultState`'s own defaults.
 */
export function mapBookingContextToWizardState(context: BookingContext, defaultState: TripPlannerWizardState): TripPlannerWizardState {
  const destination = context.destinationName
    ? { regionIds: [], places: [context.destinationName] }
    : context.plannerRegionId
      ? { regionIds: [context.plannerRegionId], places: [] }
      : defaultState.destination;

  return {
    ...defaultState,
    destination,
    travelStyleIds: context.travelStyleIds?.length ? context.travelStyleIds : defaultState.travelStyleIds,
    stay: {
      ...defaultState.stay,
      typeIds: context.stayTypeIds?.length ? context.stayTypeIds : defaultState.stay.typeIds,
      amenities: context.stayAmenities?.length ? context.stayAmenities : defaultState.stay.amenities
    },
    transport: {
      ...defaultState.transport,
      modeId: context.transportModeId ?? defaultState.transport.modeId
    }
  };
}
