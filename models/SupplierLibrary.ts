/** Internal domain types. Local revisions only; never embedded in public Journey DTOs. */
export const SUPPLIER_TYPES = ['HOTEL', 'TRANSPORT', 'ACTIVITY', 'LOCAL_SERVICE', 'MULTI_SERVICE', 'OTHER'] as const;
export const SUPPLIER_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION'] as const;
export const VERIFICATION_STATES = ['UNVERIFIED', 'CONTACTED', 'VERIFIED'] as const;
export const RATE_TYPES = ['HOTEL_ROOM', 'TRANSPORT_PER_KM', 'TRANSPORT_PER_DAY', 'TRANSPORT_FIXED_ROUTE', 'MEAL', 'ACTIVITY', 'PERMIT', 'LOCAL_VEHICLE', 'LOCAL_SERVICE', 'MISC'] as const;
export interface SupplierInput {
  dataClassification: 'REAL' | 'DEMO_SYNTHETIC';
  name: string; supplierType: typeof SUPPLIER_TYPES[number]; status: typeof SUPPLIER_STATUSES[number];
  contactPerson: string; phone: string; email: string; businessName: string;
  serviceRegions: string[]; serviceDestinations: string[]; notes: string;
}
export interface Revision { id: string; version: number; createdAt: string; updatedAt: string; parentVersion: number | null }
export interface Supplier extends Revision {
  input: SupplierInput; verificationStatus: typeof VERIFICATION_STATES[number]; verifiedAt: string | null; verificationNotes: string;
}
export interface HotelRate {
  propertyName: string; roomCategory: string; mealPlan: string; mealPlanMeaning: string;
  includedMeals: string[]; singleOccupancyRate: number | null; doubleOccupancyRate: number | null;
  tripleOccupancyRate: number | null; extraAdultRate: number | null; childWithBedRate: number | null;
  childWithoutBedRate: number | null; numberOfGuestsBasis: number;
  mandatorySupplement: number | null; weekendSupplement: number | null; peakSupplement: number | null; minimumStay: number | null;
}
export interface TransportSupplierRate {
  vehicleType: string; pricingBasis: 'PER_KM' | 'PER_DAY' | 'FIXED_ROUTE' | 'SUPPLIER_QUOTE';
  ratePerKm: number | null; ratePerDay: number | null; fixedRouteAmount: number | null;
  minimumKmPerDay: number; deadKmPolicy: 'NOT_INCLUDED' | 'SAME_RATE' | 'SEPARATE_RATE' | 'INCLUDED'; deadKmRate: number | null;
  driverAllowance: number | null; nightAllowance: number | null; tollIncluded: boolean; parkingIncluded: boolean;
  stateTaxIncluded: boolean; permitIncluded: boolean; pickupLocation: string; dropLocation: string; journeySlugs: string[];
}
export interface ServiceRate { activityName: string; costBasis: 'PER_PERSON' | 'PER_GROUP' | 'PER_ROOM' | 'PER_DAY' | 'FIXED'; rate: number | null; includedByDefault: false }
export interface SupplierRateInput {
  supplierId: string; category: typeof RATE_TYPES[number]; subCategory: string; destination: string; location: string; region: string;
  currency: 'INR'; validFrom: string; validTo: string; seasonLabel: string; confirmationStatus: 'ESTIMATE' | 'QUOTED' | 'CONFIRMED';
  quoteReference: string; notes: string; taxIncluded: boolean; hotel: HotelRate | null; transport: TransportSupplierRate | null; service: ServiceRate | null;
}
export interface SupplierRate extends Revision { input: SupplierRateInput }
export interface RateSelection {
  category: import('./JourneyCosting').CostCategory; travelFrom: string; travelTo: string;
  quantity: number; occupancy: 'single' | 'double' | 'triple'; rooms: number; travellers: number;
  days: number; deadKm: number; nightsWithAllowance: number; weekendNights: number; peakNights: number;
  extraAdults: number; childrenWithBed: number; childrenWithoutBed: number;
}
export interface RateSnapshot {
  supplierDataClassification: SupplierInput['dataClassification'];
  supplierId: string; supplierRateId: string; supplierRateRevision: number; supplierName: string;
  snapshotRate: SupplierRateInput; snapshotValidity: { validFrom: string; validTo: string };
  snapshotConfirmationStatus: SupplierRateInput['confirmationStatus']; selection: RateSelection;
}
