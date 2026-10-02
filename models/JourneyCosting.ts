/** Internal local-store model. Never embedded in Journey or public DTOs. Money inputs are INR. */
export const COST_CATEGORIES = ['hotelCosts', 'transportCosts', 'mealCosts', 'activityCosts', 'permitCosts', 'localServiceCosts', 'miscCosts'] as const;
export type CostCategory = typeof COST_CATEGORIES[number];
export const COST_BASES = ['ROOM_NIGHT', 'PER_KM', 'PER_DAY', 'FIXED_ROUTE', 'SUPPLIER_QUOTE', 'PER_PERSON', 'PER_ROOM', 'FIXED', 'INCLUDED_IN_HOTEL'] as const;
export const CONFIRMATIONS = ['ESTIMATE', 'QUOTED', 'CONFIRMED'] as const;
export const COSTING_STATUSES = ['DRAFT', 'AWAITING_SUPPLIER_CONFIRMATION', 'READY_FOR_OWNER_REVIEW', 'OWNER_APPROVED'] as const;
export type CostingStatus = typeof COSTING_STATUSES[number];
export interface CostLine {
  id: string; label: string; supplierName: string; location: string; date: string;
  quantity: number; unit: string; unitCost: number | null; costBasis: typeof COST_BASES[number];
  deadKm: number; vehicle: string; taxIncluded: boolean; notes: string;
  confirmationStatus: typeof CONFIRMATIONS[number]; quoteExpires: string;
  includedInPackage: boolean; optional: boolean; includedHotelId: string;
  supplements: { label: string; quantity: number; unitCost: number | null }[];
}
export interface JourneyContext {
  journeyId: string; journeySlug: string; title: string; duration: string;
  startingCity: string; endingCity: string; status: 'draft' | 'published'; price: number | null;
  itinerary: { day: number; title: string; description: string }[];
}
export interface CostingInput {
  journeyId: string; journeySlug: string; currency: 'INR'; scenarioName: string;
  travellerCount: number; adultCount: number; childCount: number; roomCount: number;
  travelSeason: string; validFrom: string; validTo: string; notes: string;
  hotelCosts: CostLine[]; transportCosts: CostLine[]; mealCosts: CostLine[];
  activityCosts: CostLine[]; permitCosts: CostLine[]; localServiceCosts: CostLine[]; miscCosts: CostLine[];
  contingency: { mode: 'FIXED' | 'PERCENT'; value: number };
  commission: { mode: 'FIXED' | 'PERCENT'; value: number };
  pricing: { mode: 'MARKUP_ON_COST' | 'TARGET_GROSS_MARGIN'; percent: number };
  tax: { taxEnabled: boolean; taxLabel: string; taxRate: number; taxInclusive: boolean };
  rounding: 'NONE' | 'NEAREST_100' | 'UP_TO_499' | 'UP_TO_999';
}
export interface JourneyCosting {
  id: string; version: number; parentId: string | null; createdAt: string; updatedAt: string;
  status: CostingStatus; approvedBy: string | null; approvedAt: string | null;
  input: CostingInput; journeyContext: JourneyContext;
  calculation: import('../services/pricing/journeyCosting.service').CostingResult;
}
