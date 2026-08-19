import type { TravelPackage } from '@/types/package';

export interface BookingConfig {
  adults: number;
  children: number;
  stayOptionId: string;
  addOnIds: string[];
  /** ISO date (YYYY-MM-DD). */
  travelDate: string;
  transportOptionId?: string;
  paceId?: string;
}

export interface AddOnLine {
  id: string;
  label: string;
  price: number;
}

export interface PriceBreakdown {
  perPersonPrice: number;
  seasonLabel: string | null;
  travellerCount: number;
  basePrice: number;
  stayLabel: string;
  stayUpgrade: number;
  addOnLines: AddOnLine[];
  addOnsTotal: number;
  transportLabel?: string;
  transportUpgrade: number;
  paceLabel?: string;
  paceMultiplier: number;
  total: number;
}

/** Falls back to the package's default price when the date misses every configured window, or is empty. */
function getSeasonalRate(pkg: TravelPackage, travelDate: string): { price: number; label: string | null } {
  if (travelDate && pkg.seasonalPricing) {
    const match = pkg.seasonalPricing.find((season) => travelDate >= season.startDate && travelDate <= season.endDate);
    if (match) return { price: match.price, label: match.label };
  }
  return { price: pkg.price, label: null };
}

/**
 * Single source of truth for package booking totals — the trip-configuration
 * step, the booking summary, and the WhatsApp message all call this instead
 * of each computing their own breakdown.
 */
export function calculateBookingPrice(pkg: TravelPackage, config: BookingConfig): PriceBreakdown {
  const travellerCount = Math.max(1, config.adults) + Math.max(0, config.children);

  const { price: perPersonPrice, label: seasonLabel } = getSeasonalRate(pkg, config.travelDate);
  const basePrice = perPersonPrice * travellerCount;

  const stayOption = pkg.stayOptions.find((option) => option.id === config.stayOptionId) ?? pkg.stayOptions[0];
  const stayUpgrade = stayOption?.extraPrice ?? 0;

  const addOnLines: AddOnLine[] = pkg.addOns
    .filter((addOn) => config.addOnIds.includes(addOn.id))
    .map((addOn) => ({ id: addOn.id, label: addOn.label, price: addOn.price }));
  const addOnsTotal = addOnLines.reduce((sum, line) => sum + line.price, 0);

  const transportOption = pkg.transportOptions?.find((option) => option.id === config.transportOptionId) ?? pkg.transportOptions?.[0];
  const transportUpgrade = transportOption?.extraPrice ?? 0;

  const paceOption = pkg.pace?.find((option) => option.id === config.paceId) ?? pkg.pace?.[0];
  const paceMultiplier = paceOption?.priceMultiplier ?? 1;

  const subtotal = (basePrice + stayUpgrade + addOnsTotal + transportUpgrade) * paceMultiplier;

  return {
    perPersonPrice,
    seasonLabel,
    travellerCount,
    basePrice,
    stayLabel: stayOption?.label ?? 'Standard',
    stayUpgrade,
    addOnLines,
    addOnsTotal,
    transportLabel: transportOption?.label,
    transportUpgrade,
    paceLabel: paceOption?.label,
    paceMultiplier,
    total: subtotal
  };
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
