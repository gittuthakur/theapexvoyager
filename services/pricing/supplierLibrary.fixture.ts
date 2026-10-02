/** DEMO / SYNTHETIC. Test/local fixtures only; no production write path. */
import { emptySupplier, emptyRate, emptySelection } from './supplierLibrary.service';
import type { Supplier, SupplierRate } from '../../models/SupplierLibrary';
const base = { version: 1, parentVersion: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
export const DEMO_SUPPLIER_ID = '00000000-0000-0000-0000-000000000015';
export const DEMO_RATE_ID = '00000000-0000-0000-0000-000000000016';
export function demoSupplier(): Supplier { return { ...base, id: DEMO_SUPPLIER_ID, input: { ...emptySupplier(), dataClassification: 'DEMO_SYNTHETIC', name: 'DEMO Hotel Supplier', status: 'ACTIVE', serviceDestinations: ['auli'] }, verificationStatus: 'UNVERIFIED', verifiedAt: null, verificationNotes: '' }; }
export function demoHotelRate(): SupplierRate { const input = emptyRate(DEMO_SUPPLIER_ID); input.destination = 'auli'; input.validFrom = '2026-01-01'; input.validTo = '2099-12-31'; input.seasonLabel = 'DEMO / SYNTHETIC Winter'; input.confirmationStatus = 'QUOTED'; input.hotel!.propertyName = 'DEMO Property'; input.hotel!.roomCategory = 'Demo double'; input.hotel!.doubleOccupancyRate = 2000; input.hotel!.mealPlan = 'CP'; input.hotel!.mealPlanMeaning = 'Room plus breakfast'; input.hotel!.includedMeals = ['breakfast']; return { ...base, id: DEMO_RATE_ID, input }; }
export function demoTransportRate(): SupplierRate { const input = emptyRate(DEMO_SUPPLIER_ID, 'TRANSPORT_FIXED_ROUTE'); input.destination = 'auli'; input.validFrom = '2026-01-01'; input.validTo = '2099-12-31'; input.transport!.vehicleType = 'DEMO Sedan'; input.transport!.fixedRouteAmount = 4000; input.confirmationStatus = 'QUOTED'; return { ...base, id: '00000000-0000-0000-0000-000000000017', input }; }
export function demoSelection() { return { ...emptySelection('hotelCosts'), travelFrom: '2026-10-10', travelTo: '2026-10-13', quantity: 3 }; }
