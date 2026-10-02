import { todayISOInIST } from '../../lib/dateValidation';
import { strictObject, boundedText, amount, option, flag, calendarDate, uuid, textList } from '../../lib/internalValidation';
import { SUPPLIER_TYPES, SUPPLIER_STATUSES, RATE_TYPES, type SupplierInput, type SupplierRateInput, type SupplierRate, type Supplier, type RateSelection, type RateSnapshot } from '../../models/SupplierLibrary';
import { COST_CATEGORIES, type CostLine } from '../../models/JourneyCosting';

export function emptySupplier(): SupplierInput { return { dataClassification: 'REAL', name: '', supplierType: 'HOTEL', status: 'PENDING_VERIFICATION', contactPerson: '', phone: '', email: '', businessName: '', serviceRegions: [], serviceDestinations: [], notes: '' }; }
export function emptyRate(supplierId = '', category: SupplierRateInput['category'] = 'HOTEL_ROOM'): SupplierRateInput {
  return { supplierId, category, subCategory: '', destination: '', location: '', region: '', currency: 'INR', validFrom: '', validTo: '', seasonLabel: '', confirmationStatus: 'ESTIMATE', quoteReference: '', notes: '', taxIncluded: false,
    hotel: category === 'HOTEL_ROOM' ? { propertyName: '', roomCategory: '', mealPlan: '', mealPlanMeaning: '', includedMeals: [], singleOccupancyRate: null, doubleOccupancyRate: null, tripleOccupancyRate: null, extraAdultRate: null, childWithBedRate: null, childWithoutBedRate: null, numberOfGuestsBasis: 2, mandatorySupplement: null, weekendSupplement: null, peakSupplement: null, minimumStay: null } : null,
    transport: category.startsWith('TRANSPORT_') || category === 'LOCAL_VEHICLE' ? { vehicleType: '', pricingBasis: category === 'TRANSPORT_PER_KM' ? 'PER_KM' : category === 'TRANSPORT_PER_DAY' ? 'PER_DAY' : 'FIXED_ROUTE', ratePerKm: null, ratePerDay: null, fixedRouteAmount: null, minimumKmPerDay: 0, deadKmPolicy: 'NOT_INCLUDED', deadKmRate: null, driverAllowance: null, nightAllowance: null, tollIncluded: false, parkingIncluded: false, stateTaxIncluded: false, permitIncluded: false, pickupLocation: '', dropLocation: '', journeySlugs: [] } : null,
    service: !category.startsWith('TRANSPORT_') && !['HOTEL_ROOM', 'LOCAL_VEHICLE'].includes(category) ? { activityName: '', costBasis: 'FIXED', rate: null, includedByDefault: false } : null };
}
export function validateSupplier(value: unknown): asserts value is SupplierInput {
  strictObject(value, Object.keys(emptySupplier()), 'supplier');
  for (const key of ['name', 'contactPerson', 'phone', 'email', 'businessName', 'notes']) boundedText(value[key], key, key === 'notes' ? 2000 : 200, key === 'name');
  option(value.supplierType, SUPPLIER_TYPES, 'supplier type'); option(value.status, SUPPLIER_STATUSES, 'supplier status');
  option(value.dataClassification, ['REAL', 'DEMO_SYNTHETIC'], 'data classification');
  if (/^DEMO\b|SYNTHETIC/i.test(String(value.name)) && value.dataClassification !== 'DEMO_SYNTHETIC') throw new Error('Demo-labelled supplier must be classified DEMO_SYNTHETIC');
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value.email))) throw new Error('Invalid email');
  if (value.phone && (!/^[+\d ()-]{6,30}$/.test(String(value.phone)) || String(value.phone).replace(/\D/g, '').length < 6)) throw new Error('Invalid phone');
  textList(value.serviceRegions, 'service regions'); textList(value.serviceDestinations, 'service destinations');
}
export function validateRate(value: unknown): asserts value is SupplierRateInput {
  strictObject(value, Object.keys(emptyRate()), 'rate'); uuid(value.supplierId); option(value.category, RATE_TYPES, 'rate category'); option(value.currency, ['INR'], 'currency');
  for (const key of ['subCategory', 'destination', 'location', 'region', 'seasonLabel', 'quoteReference', 'notes']) boundedText(value[key], key, 2000, key === 'destination');
  calendarDate(value.validFrom, 'valid from'); calendarDate(value.validTo, 'valid to'); if (String(value.validFrom) > String(value.validTo)) throw new Error('Rate validity reversed');
  option(value.confirmationStatus, ['ESTIMATE', 'QUOTED', 'CONFIRMED'], 'quote status'); flag(value.taxIncluded, 'tax included');
  const defaults = emptyRate(String(value.supplierId), value.category as SupplierRateInput['category']);
  for (const section of ['hotel', 'transport', 'service'] as const) {
    const shape = defaults[section]; const detail = value[section];
    if (!shape) { if (detail !== null) throw new Error('Rate details do not match category'); continue; }
    strictObject(detail, Object.keys(shape), section);
    for (const [key, prototype] of Object.entries(shape)) {
      if (prototype === null || typeof prototype === 'number') amount(detail[key], key, prototype === null);
      else if (typeof prototype === 'boolean') flag(detail[key], key);
      else if (Array.isArray(prototype)) textList(detail[key], key);
      else boundedText(detail[key], key, 200, ['propertyName', 'roomCategory', 'vehicleType', 'activityName'].includes(key));
    }
  }
  const input = value as unknown as SupplierRateInput;
  if (input.hotel) {
    if (input.hotel.doubleOccupancyRate === null || !Number.isInteger(input.hotel.numberOfGuestsBasis) || input.hotel.numberOfGuestsBasis < 1 || input.hotel.numberOfGuestsBasis > 10 || (input.hotel.minimumStay !== null && (!Number.isInteger(input.hotel.minimumStay) || input.hotel.minimumStay < 1))) throw new Error('Hotel double rate/guest basis/minimum stay invalid');
    if (input.hotel.includedMeals.length && (!input.hotel.mealPlan.trim() || !input.hotel.mealPlanMeaning.trim())) throw new Error('Included meals require human-readable meal plan');
  }
  if (input.transport) {
    const t = input.transport; option(t.pricingBasis, ['PER_KM', 'PER_DAY', 'FIXED_ROUTE', 'SUPPLIER_QUOTE'], 'transport basis'); option(t.deadKmPolicy, ['NOT_INCLUDED', 'SAME_RATE', 'SEPARATE_RATE', 'INCLUDED'], 'dead km policy');
    const basis = input.category === 'TRANSPORT_PER_KM' ? 'PER_KM' : input.category === 'TRANSPORT_PER_DAY' ? 'PER_DAY' : null;
    if ((basis && t.pricingBasis !== basis) || (input.category === 'TRANSPORT_FIXED_ROUTE' && !['FIXED_ROUTE', 'SUPPLIER_QUOTE'].includes(t.pricingBasis))) throw new Error('Transport category/basis mismatch');
    if ((t.pricingBasis === 'PER_KM' ? t.ratePerKm : t.pricingBasis === 'PER_DAY' ? t.ratePerDay : t.fixedRouteAmount) === null || (t.deadKmPolicy === 'SEPARATE_RATE' && t.deadKmRate === null)) throw new Error('Applicable transport supplier rate required');
  }
  if (input.service) { option(input.service.costBasis, ['PER_PERSON', 'PER_GROUP', 'PER_ROOM', 'PER_DAY', 'FIXED'], 'service basis'); if (input.service.rate === null || input.service.includedByDefault !== false) throw new Error('Service rate required; inclusion must be explicitly chosen in costing'); }
}
export function rateValidity(rate: Pick<SupplierRateInput, 'validFrom' | 'validTo'>, today = todayISOInIST()) {
  if (rate.validTo < today) return 'EXPIRED'; if (rate.validFrom > today) return 'FUTURE';
  const days = (Date.parse(rate.validTo) - Date.parse(today)) / 86400000; return days <= 30 ? 'EXPIRING_SOON' : 'ACTIVE';
}
export function rateCategory(input: SupplierRateInput): RateSelection['category'] {
  return input.category === 'HOTEL_ROOM' ? 'hotelCosts' : input.category.startsWith('TRANSPORT_') ? 'transportCosts' : input.category === 'MEAL' ? 'mealCosts' : input.category === 'ACTIVITY' ? 'activityCosts' : input.category === 'PERMIT' ? 'permitCosts' : ['LOCAL_SERVICE', 'LOCAL_VEHICLE'].includes(input.category) ? 'localServiceCosts' : 'miscCosts';
}
export function emptySelection(category: RateSelection['category']): RateSelection { return { category, travelFrom: '', travelTo: '', quantity: 1, occupancy: 'double', rooms: 1, travellers: 2, days: 1, deadKm: 0, nightsWithAllowance: 0, weekendNights: 0, peakNights: 0, extraAdults: 0, childrenWithBed: 0, childrenWithoutBed: 0 }; }
export function validateSelection(value: unknown): asserts value is RateSelection {
  strictObject(value, Object.keys(emptySelection('hotelCosts')), 'selection'); option(value.category, COST_CATEGORIES, 'cost category'); option(value.occupancy, ['single', 'double', 'triple'], 'occupancy');
  calendarDate(value.travelFrom, 'travel from'); calendarDate(value.travelTo, 'travel to'); if (String(value.travelFrom) > String(value.travelTo)) throw new Error('Travel dates reversed');
  for (const key of ['quantity', 'rooms', 'travellers', 'days', 'deadKm', 'nightsWithAllowance', 'weekendNights', 'peakNights', 'extraAdults', 'childrenWithBed', 'childrenWithoutBed']) { amount(value[key], key, false, 100000); if (key !== 'quantity' && key !== 'deadKm' && !Number.isInteger(value[key])) throw new Error('Selection counts must be integers'); }
  if (!value.rooms || !value.travellers || !value.days || !value.quantity) throw new Error('Positive selection quantities required');
}
export function makeSnapshot(supplier: Supplier, rate: SupplierRate, selection: RateSelection, today = todayISOInIST()): RateSnapshot {
  validateRate(rate.input); validateSelection(selection);
  if (supplier.id !== rate.input.supplierId || supplier.input.status !== 'ACTIVE') throw new Error('Choose an active supplier explicitly');
  if (rate.input.validTo < today || selection.travelFrom < rate.input.validFrom || selection.travelTo > rate.input.validTo) throw new Error('Rate expired or does not cover selected travel dates');
  if (rateCategory(rate.input) !== selection.category) throw new Error('Rate category mismatch');
  return structuredClone({ supplierDataClassification: supplier.input.dataClassification, supplierId: supplier.id, supplierRateId: rate.id, supplierRateRevision: rate.version, supplierName: supplier.input.name,
    snapshotRate: rate.input, snapshotValidity: { validFrom: rate.input.validFrom, validTo: rate.input.validTo }, snapshotConfirmationStatus: rate.input.confirmationStatus, selection });
}
export function validateSnapshot(value: unknown): asserts value is RateSnapshot {
  strictObject(value, ['supplierDataClassification', 'supplierId', 'supplierRateId', 'supplierRateRevision', 'supplierName', 'snapshotRate', 'snapshotValidity', 'snapshotConfirmationStatus', 'selection'], 'rate snapshot');
  option(value.supplierDataClassification, ['REAL', 'DEMO_SYNTHETIC'], 'supplier data classification');
  uuid(value.supplierId); uuid(value.supplierRateId); boundedText(value.supplierName, 'supplier name', 200, true);
  if (!Number.isSafeInteger(value.supplierRateRevision) || Number(value.supplierRateRevision) < 1) throw new Error('Invalid rate revision');
  validateRate(value.snapshotRate); validateSelection(value.selection); strictObject(value.snapshotValidity, ['validFrom', 'validTo'], 'snapshot validity');
  if (value.supplierId !== value.snapshotRate.supplierId || value.snapshotConfirmationStatus !== value.snapshotRate.confirmationStatus || value.snapshotValidity.validFrom !== value.snapshotRate.validFrom || value.snapshotValidity.validTo !== value.snapshotRate.validTo || rateCategory(value.snapshotRate) !== value.selection.category) throw new Error('Snapshot provenance mismatch');
}
/** Financial fields are deterministic and immutable. Quantity/occupancy changes require selecting a new snapshot. */
export function snapshotFinancials(snapshot: RateSnapshot): Pick<CostLine, 'supplierName' | 'location' | 'quantity' | 'unitCost' | 'costBasis' | 'deadKm' | 'vehicle' | 'taxIncluded' | 'quoteExpires' | 'confirmationStatus' | 'supplements'> {
  validateSnapshot(snapshot); const r = snapshot.snapshotRate; const s = snapshot.selection;
  const supplements: CostLine['supplements'] = [];
  const add = (label: string, quantity: number, rate: number | null) => { if (quantity && rate !== null) supplements.push({ label, quantity, unitCost: rate }); };
  let unitCost: number | null = 0; let quantity = s.quantity; let costBasis: CostLine['costBasis'] = 'FIXED';
  if (r.hotel) {
    if (!Number.isInteger(s.quantity) || s.quantity < (r.hotel.minimumStay ?? 0) || s.weekendNights > s.quantity || s.peakNights > s.quantity) throw new Error('Invalid hotel nights/minimum stay');
    if ((s.weekendNights && r.hotel.weekendSupplement === null) || (s.peakNights && r.hotel.peakSupplement === null)) throw new Error('Selected seasonal/weekend supplement has no supplier quote; enter an explicit zero if included');
    unitCost = r.hotel[`${s.occupancy}OccupancyRate`]; if (unitCost === null) throw new Error('Chosen occupancy has no supplier quote'); costBasis = 'ROOM_NIGHT';
    add('Mandatory supplement / room-night', s.rooms * s.quantity, r.hotel.mandatorySupplement); add('Weekend supplement / room-night', s.rooms * s.weekendNights, r.hotel.weekendSupplement); add('Peak supplement / room-night', s.rooms * s.peakNights, r.hotel.peakSupplement);
    for (const [label, count, price] of [['Extra adult', s.extraAdults, r.hotel.extraAdultRate], ['Child with bed', s.childrenWithBed, r.hotel.childWithBedRate], ['Child without bed', s.childrenWithoutBed, r.hotel.childWithoutBedRate]] as const) { if (count && price === null) throw new Error('Selected guest supplement has no supplier quote'); add(`${label} / night`, count * s.quantity, price); }
  } else if (r.transport) {
    const t = r.transport; costBasis = t.pricingBasis; unitCost = t.pricingBasis === 'PER_KM' ? t.ratePerKm : t.pricingBasis === 'PER_DAY' ? t.ratePerDay : t.fixedRouteAmount;
    if (t.pricingBasis === 'PER_DAY' && s.quantity !== s.days) throw new Error('Per-day quantity must equal selected days');
    if (t.pricingBasis === 'PER_KM') quantity = Math.max(s.quantity, s.days * t.minimumKmPerDay);
    if (s.deadKm) { if (t.deadKmPolicy === 'NOT_INCLUDED' || (t.deadKmPolicy === 'SAME_RATE' && t.ratePerKm === null)) throw new Error('Dead km needs an explicit quoted policy/rate'); if (t.deadKmPolicy !== 'INCLUDED') add('Dead km', s.deadKm, t.deadKmPolicy === 'SAME_RATE' ? t.ratePerKm : t.deadKmRate); }
    add('Driver allowance / day', s.days, t.driverAllowance); add('Night allowance', s.nightsWithAllowance, t.nightAllowance);
  } else if (r.service) { unitCost = r.service.rate; costBasis = r.service.costBasis === 'PER_GROUP' ? 'FIXED' : r.service.costBasis; }
  return { supplierName: snapshot.supplierName, location: r.location || r.destination, quantity, unitCost, costBasis, deadKm: 0, vehicle: r.transport?.vehicleType ?? '', taxIncluded: r.taxIncluded, quoteExpires: r.validTo, confirmationStatus: r.confirmationStatus, supplements };
}
export function snapshotWarnings(snapshot: RateSnapshot, today = todayISOInIST()): string[] {
  const r = snapshot.snapshotRate; const warnings: string[] = [];
  if (r.validTo < today) warnings.push('Supplier snapshot expired');
  if (snapshot.selection.travelFrom < r.validFrom || snapshot.selection.travelTo > r.validTo) warnings.push('Supplier snapshot does not cover travel dates');
  if (r.hotel?.includedMeals.length) warnings.push(`Hotel includes ${r.hotel.includedMeals.join(', ')} (${r.hotel.mealPlanMeaning}); link these meals with INCLUDED_IN_HOTEL, do not add another meal charge`);
  if (r.transport) for (const key of ['tollIncluded', 'parkingIncluded', 'stateTaxIncluded', 'permitIncluded'] as const) if (!r.transport[key]) warnings.push(`${key.replace('Included', '')} excluded/unpriced: enter a separately quoted manual cost if included in package`);
  return warnings;
}
export function matchingRates(rates: SupplierRate[], suppliers: Supplier[], filter: { category?: RateSelection['category']; destination?: string; supplierId?: string; region?: string; travelFrom?: string; travelTo?: string; seasonLabel?: string }, today = todayISOInIST()) {
  return rates.filter(row => suppliers.some(s => s.id === row.input.supplierId && s.input.status === 'ACTIVE') && (!filter.category || rateCategory(row.input) === filter.category) && (!filter.destination || row.input.destination === filter.destination) && (!filter.region || row.input.region === filter.region) && (!filter.supplierId || row.input.supplierId === filter.supplierId) && (!filter.seasonLabel || row.input.seasonLabel === filter.seasonLabel) && row.input.validTo >= today && (!filter.travelFrom || row.input.validFrom <= filter.travelFrom) && (!filter.travelTo || row.input.validTo >= filter.travelTo));
}
