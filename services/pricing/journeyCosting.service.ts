import { isValidCalendarDateISO, todayISOInIST } from '../../lib/dateValidation';
import { COST_CATEGORIES, COST_BASES, CONFIRMATIONS, type CostingInput, type CostLine, type JourneyContext, type CostCategory } from '../../models/JourneyCosting';
import type { TransportCostResult } from './transportPricing.types';
import { validateSnapshot, snapshotFinancials, snapshotWarnings } from './supplierLibrary.service';

export function emptyCosting(journey: Pick<JourneyContext, 'journeyId' | 'journeySlug'>): CostingInput {
  return { journeyId: journey.journeyId, journeySlug: journey.journeySlug, currency: 'INR', scenarioName: 'New supplier costing', travellerCount: 2, adultCount: 2, childCount: 0, roomCount: 1,
    travelSeason: '', validFrom: '', validTo: '', notes: '', hotelCosts: [], transportCosts: [], mealCosts: [], activityCosts: [], permitCosts: [], localServiceCosts: [], miscCosts: [],
    contingency: { mode: 'FIXED', value: 0 }, commission: { mode: 'FIXED', value: 0 }, pricing: { mode: 'MARKUP_ON_COST', percent: 0 },
    tax: { taxEnabled: false, taxLabel: 'Tax', taxRate: 0, taxInclusive: false }, rounding: 'UP_TO_999' };
}
export function emptyLine(id: string, category: CostCategory): CostLine {
  return { id, label: '', supplierName: '', location: '', date: '', quantity: 1, unit: category === 'hotelCosts' ? 'nights' : 'units', unitCost: null,
    costBasis: category === 'hotelCosts' ? 'ROOM_NIGHT' : 'FIXED', deadKm: 0, vehicle: '', taxIncluded: false, notes: '', confirmationStatus: 'ESTIMATE', quoteExpires: '',
    includedInPackage: !['activityCosts', 'localServiceCosts'].includes(category), optional: ['activityCosts', 'localServiceCosts'].includes(category), includedHotelId: '', supplements: [] };
}

function object(value: unknown, keys: string[], label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !(key in value))) throw new Error(`${label}: invalid fields`);
}
function number(value: unknown, label: string, max = 1e9) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) throw new Error(`${label}: invalid non-negative number`);
}
function text(value: unknown, label: string, max = 2000) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`${label}: invalid text`);
}
function enumeration(value: unknown, values: readonly string[], label: string) { if (typeof value !== 'string' || !values.includes(value)) throw new Error(`${label}: invalid option`); }
function boolean(value: unknown, label: string) { if (typeof value !== 'boolean') throw new Error(`${label}: invalid boolean`); }
function date(value: unknown, label: string) { text(value, label, 10); if (value && !isValidCalendarDateISO(value as string)) throw new Error(`${label}: invalid calendar date`); }
export function validateCosting(value: unknown): asserts value is CostingInput {
  object(value, Object.keys(emptyCosting({ journeyId: '', journeySlug: '' })), 'costing');
  for (const key of ['journeyId', 'journeySlug', 'scenarioName', 'travelSeason', 'notes']) text(value[key], key);
  if (!/^[a-f\d]{24}$/.test(value.journeyId as string) || !/^[a-z0-9-]{1,200}$/.test(value.journeySlug as string) || !String(value.scenarioName).trim()) throw new Error('Journey/scenario identity invalid');
  enumeration(value.currency, ['INR'], 'currency');
  for (const key of ['travellerCount', 'adultCount', 'childCount', 'roomCount']) {
    number(value[key], key, 1000); if (!Number.isInteger(value[key])) throw new Error(`${key}: integer required`);
  }
  if ((value.adultCount as number) < 1 || (value.roomCount as number) < 1 || value.travellerCount !== (value.adultCount as number) + (value.childCount as number)) throw new Error('Invalid occupancy totals');
  date(value.validFrom, 'validFrom'); date(value.validTo, 'validTo');
  if (value.validFrom && value.validTo && String(value.validFrom) > String(value.validTo)) throw new Error('Validity dates reversed');
  for (const key of ['contingency', 'commission']) {
    const adjustment = value[key]; object(adjustment, ['mode', 'value'], key);
    enumeration(adjustment.mode, ['FIXED', 'PERCENT'], key); number(adjustment.value, key, adjustment.mode === 'PERCENT' ? 100 : 1e9);
    if (key === 'commission' && adjustment.mode === 'PERCENT' && adjustment.value === 100) throw new Error('Commission must be below 100%');
  }
  object(value.pricing, ['mode', 'percent'], 'pricing'); enumeration(value.pricing.mode, ['MARKUP_ON_COST', 'TARGET_GROSS_MARGIN'], 'pricing');
  number(value.pricing.percent, 'pricing percent', 1000);
  if (value.pricing.mode === 'TARGET_GROSS_MARGIN' && (value.pricing.percent as number) + (value.commission as { mode: string; value: number }).value * ((value.commission as { mode: string }).mode === 'PERCENT' ? 1 : 0) >= 100) throw new Error('Margin plus commission must be below 100%');
  object(value.tax, ['taxEnabled', 'taxLabel', 'taxRate', 'taxInclusive'], 'tax');
  boolean(value.tax.taxEnabled, 'taxEnabled'); boolean(value.tax.taxInclusive, 'taxInclusive'); text(value.tax.taxLabel, 'taxLabel', 100); number(value.tax.taxRate, 'taxRate', 100);
  enumeration(value.rounding, ['NONE', 'NEAREST_100', 'UP_TO_499', 'UP_TO_999'], 'rounding');
  const ids = new Set<string>();
  for (const category of COST_CATEGORIES) {
    const lines = value[category]; if (!Array.isArray(lines) || lines.length > 100) throw new Error(`${category}: maximum 100 lines`);
    for (const line of lines) {
      object(line, [...Object.keys(emptyLine('', category)), ...('supplierRateSnapshot' in line ? ['supplierRateSnapshot'] : []), ...('mealType' in line ? ['mealType'] : [])], category);
      if ('mealType' in line) { text(line.mealType, 'meal type', 100); if (category !== 'mealCosts') throw new Error('Meal type is for meal lines'); }
      if (line.supplierRateSnapshot) {
        validateSnapshot(line.supplierRateSnapshot);
        const snapshot = line.supplierRateSnapshot;
        if (snapshot.selection.category !== category || snapshot.selection.rooms !== value.roomCount || snapshot.selection.travellers !== value.travellerCount) throw new Error('Supplier snapshot scenario changed: reselect rate or convert to manual');
        for (const [key, expected] of Object.entries(snapshotFinancials(snapshot))) if (JSON.stringify(line[key]) !== JSON.stringify(expected)) throw new Error('Supplier snapshot financial fields changed: reselect rate or convert to manual');
      } else if (line.supplierRateSnapshot !== undefined && line.supplierRateSnapshot !== null) throw new Error('Invalid supplier snapshot');
      for (const field of ['id', 'label', 'supplierName', 'location', 'unit', 'vehicle', 'notes', 'includedHotelId']) text(line[field], field);
      if (!line.id || ids.has(String(line.id))) throw new Error('Line IDs must be unique'); ids.add(String(line.id));
      number(line.quantity, 'quantity', 100000); number(line.deadKm, 'dead km', 100000);
      if (line.unitCost !== null) number(line.unitCost, 'unit cost');
      enumeration(line.costBasis, COST_BASES, 'cost basis'); enumeration(line.confirmationStatus, CONFIRMATIONS, 'confirmation');
      for (const field of ['taxIncluded', 'includedInPackage', 'optional']) boolean(line[field], field);
      date(line.date, 'line date'); date(line.quoteExpires, 'quote expiry');
      if (!Array.isArray(line.supplements) || line.supplements.length > 30) throw new Error('Invalid supplements');
      for (const supplement of line.supplements) {
        object(supplement, ['label', 'quantity', 'unitCost'], 'supplement'); text(supplement.label, 'supplement label'); number(supplement.quantity, 'supplement quantity', 100000);
        if (supplement.unitCost !== null) number(supplement.unitCost, 'supplement cost');
      }
      if (line.costBasis === 'INCLUDED_IN_HOTEL' && (category !== 'mealCosts' || line.unitCost !== 0 || line.supplements.length || !(value.hotelCosts as CostLine[]).some(hotel => hotel.id === line.includedHotelId && hotel.includedInPackage))) throw new Error('Hotel-included meal needs a linked included hotel, zero cost and no supplements');
      if (category === 'mealCosts' && line.includedInPackage && line.costBasis !== 'INCLUDED_IN_HOTEL' && (((line.unitCost as number | null) ?? 0) > 0 || line.supplements.some((s: { unitCost: number | null }) => (s.unitCost ?? 0) > 0))) {
        const meal = String(line.mealType || line.label).trim().toLowerCase();
        const includedHotel = (value.hotelCosts as CostLine[]).find(hotel => hotel.includedInPackage && hotel.supplierRateSnapshot?.snapshotRate.hotel?.includedMeals.some(name => name.trim().toLowerCase() === meal) && (!line.date || (String(line.date) >= hotel.supplierRateSnapshot.selection.travelFrom && String(line.date) < hotel.supplierRateSnapshot.selection.travelTo)));
        if (includedHotel) throw new Error('Meal already included in supplier hotel rate: use a linked zero-cost INCLUDED_IN_HOTEL line, or date separate meals outside that stay');
      }
      if (line.costBasis === 'ROOM_NIGHT' && category !== 'hotelCosts') throw new Error('Room-night basis is for hotels');
      if (line.costBasis === 'PER_KM' && category !== 'transportCosts') throw new Error('Per-km basis is for transport');
      if (line.deadKm && line.costBasis !== 'PER_KM') throw new Error('Dead km only applies to per-km transport');
    }
  }
}
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const ceilMoney = (n: number) => Math.max(0, Math.ceil(n * 100) / 100);
export function roundStartingPrice(n: number, strategy: CostingInput['rounding']) {
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid rounding amount');
  enumeration(strategy, ['NONE', 'NEAREST_100', 'UP_TO_499', 'UP_TO_999'], 'rounding');
  if (n === 0) return 0;
  if (strategy === 'NONE') return ceilMoney(n);
  if (strategy === 'NEAREST_100') return Math.ceil(n / 100) * 100;
  const step = strategy === 'UP_TO_499' ? 500 : 1000;
  return Math.ceil((n + 1) / step) * step - 1;
}
export interface CostingResult {
  categories: Record<CostCategory, number>; lines: { id: string; totalCost: number; included: boolean }[];
  subtotal: number; contingency: number; costAfterContingency: number; commission: number; totalCost: number;
  requiredSellingBeforeTax: number; sellingTotal: number; netRevenue: number; taxes: number; perPersonSellingPrice: number; recommendedStartingPrice: number;
  grossProfit: number; grossMarginPercent: number; markupPercent: number; recommendedSellingTotal: number; recommendedGrossProfit: number;
  supplierConfirmationStatus: 'EMPTY' | 'ESTIMATE' | 'QUOTED' | 'CONFIRMED'; confirmations: Record<typeof CONFIRMATIONS[number], number>;
  warnings: string[]; reviewBlockers: string[];
}
export function calculateJourneyCosting(input: CostingInput, today = todayISOInIST()): CostingResult {
  validateCosting(input);
  const categories = Object.fromEntries(COST_CATEGORIES.map(key => [key, 0])) as Record<CostCategory, number>;
  const confirmations = { ESTIMATE: 0, QUOTED: 0, CONFIRMED: 0 }; const warnings: string[] = []; const reviewBlockers: string[] = [];
  const lines: CostingResult['lines'] = [];
  for (const category of COST_CATEGORIES) for (const line of input[category]) {
    if (line.supplierRateSnapshot) {
      const issues = snapshotWarnings(line.supplierRateSnapshot, today); warnings.push(...issues);
      if (line.includedInPackage) reviewBlockers.push(...issues.filter(issue => issue.includes('expired') || issue.includes('does not cover')));
    }
    confirmations[line.confirmationStatus]++;
    if (line.quoteExpires && line.quoteExpires < today) { warnings.push(`Expired quote: ${line.label || line.id}`); if (line.includedInPackage) reviewBlockers.push(`Expired included quote: ${line.id}`); }
    if (!line.includedInPackage) { lines.push({ id: line.id, totalCost: 0, included: false }); continue; }
    if (line.unitCost === null || line.supplements.some(s => s.unitCost === null)) reviewBlockers.push(`Missing cost: ${line.label || line.id}`);
    if (!line.label.trim()) reviewBlockers.push(`Missing label: ${line.id}`);
    if (line.confirmationStatus !== 'CONFIRMED') reviewBlockers.push(`Supplier confirmation required: ${line.id}`);
    if (line.optional) warnings.push(`Optional item explicitly included in base: ${line.label || line.id}`);
    if (!line.taxIncluded && (line.unitCost ?? 0) > 0) warnings.push(`Verify supplier tax/supplements: ${line.label || line.id}`);
    let units = line.quantity;
    if (line.costBasis === 'ROOM_NIGHT' || line.costBasis === 'PER_ROOM') units *= input.roomCount;
    if (line.costBasis === 'PER_PERSON') units *= input.travellerCount;
    if (line.costBasis === 'PER_KM') units += line.deadKm;
    const total = line.costBasis === 'INCLUDED_IN_HOTEL' ? 0 : money(units * (line.unitCost ?? 0) + line.supplements.reduce((sum, s) => sum + s.quantity * (s.unitCost ?? 0), 0));
    categories[category] = money(categories[category] + total); lines.push({ id: line.id, totalCost: total, included: true });
  }
  const subtotal = money(Object.values(categories).reduce((a, b) => a + b, 0));
  const contingency = money(input.contingency.mode === 'PERCENT' ? subtotal * input.contingency.value / 100 : input.contingency.value);
  const costAfterContingency = money(subtotal + contingency);
  const f = input.commission.mode === 'FIXED' ? input.commission.value : 0;
  const c = input.commission.mode === 'PERCENT' ? input.commission.value / 100 : 0;
  const p = input.pricing.percent / 100;
  const requiredSellingBeforeTax = ceilMoney(input.pricing.mode === 'MARKUP_ON_COST' ? (costAfterContingency * (1 + p) + f) / (1 - c) : (costAfterContingency + f) / (1 - p - c));
  const t = input.tax.taxEnabled ? input.tax.taxRate / 100 : 0;
  // Inclusive mode extracts tax from the calculated quote; exclusive adds it. Profit always excludes collected tax.
  const sellingTotal = input.tax.taxInclusive ? requiredSellingBeforeTax : ceilMoney(requiredSellingBeforeTax * (1 + t));
  const netRevenue = money(sellingTotal / (1 + t)); const taxes = money(sellingTotal - netRevenue);
  const commission = money(f + c * netRevenue); const totalCost = money(costAfterContingency + commission);
  const grossProfit = money(netRevenue - totalCost);
  const perPersonSellingPrice = ceilMoney(sellingTotal / input.travellerCount);
  const recommendedStartingPrice = roundStartingPrice(perPersonSellingPrice, input.rounding);
  const recommendedSellingTotal = money(recommendedStartingPrice * input.travellerCount);
  const recommendedNet = recommendedSellingTotal / (1 + t);
  if (grossProfit <= 0) warnings.push(grossProfit < 0 ? 'LOSS: selling proceeds are below total internal cost' : 'No profit: selling proceeds equal total internal cost');
  if (input.tax.taxEnabled && input.tax.taxInclusive) warnings.push('Inclusive tax reduces net proceeds and may reduce the requested margin/markup');
  if (!input.validFrom || !input.validTo || !input.travelSeason.trim()) reviewBlockers.push('Season and validity window required for review');
  if (input.validTo && input.validTo < today) { warnings.push('Costing validity expired'); reviewBlockers.push('Costing validity expired'); }
  if (!lines.some(line => line.included)) reviewBlockers.push('No included supplier items');
  const count = Object.values(confirmations).reduce((a, b) => a + b, 0);
  const supplierConfirmationStatus = !count ? 'EMPTY' : confirmations.ESTIMATE ? 'ESTIMATE' : confirmations.QUOTED ? 'QUOTED' : 'CONFIRMED';
  if (![subtotal, sellingTotal, totalCost, recommendedSellingTotal].every(n => Number.isFinite(n) && n <= 1e12)) throw new Error('Calculation exceeds supported monetary range');
  return { categories, lines, subtotal, contingency, costAfterContingency, commission, totalCost, requiredSellingBeforeTax, sellingTotal, netRevenue, taxes, perPersonSellingPrice, recommendedStartingPrice,
    grossProfit, grossMarginPercent: netRevenue ? money(grossProfit / netRevenue * 100) : 0, markupPercent: costAfterContingency ? money(grossProfit / costAfterContingency * 100) : 0,
    recommendedSellingTotal, recommendedGrossProfit: money(recommendedNet * (1 - c) - f - costAfterContingency), supplierConfirmationStatus, confirmations, warnings, reviewBlockers };
}
/** Explicit adapter for TP2 supplier results only. Never accepts the public estimate resolver. */
export function lineFromSupplierTransport(result: TransportCostResult, id: string): CostLine {
  if (result.status !== 'EXACT' || result.currency !== 'INR' || !result.rateId || !result.supplierCostMinorUnits || !Number.isSafeInteger(result.supplierCostMinorUnits) || result.supplierCostMinorUnits < 0) throw new Error('Exact supplier rate required; public estimates cannot be imported');
  return { ...emptyLine(id, 'transportCosts'), label: 'Imported supplier transport quote', costBasis: 'SUPPLIER_QUOTE', unitCost: result.supplierCostMinorUnits / 100, confirmationStatus: 'QUOTED', quoteExpires: result.validTo?.slice(0, 10) ?? '', notes: `TransportRate reference: ${result.rateId}. Review inclusions and allowances; import is not supplier confirmation.` };
}
