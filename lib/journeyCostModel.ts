// INTERNAL, NOT PUBLIC. Never imported by any app/ page/route or by any public-facing
// component — this is a pure calculation engine for pricing a Journey before it's
// published, used from scripts/internal tooling only (see docs/phase-2c-pricing-
// worksheets.md). Nothing here reads or writes MongoDB, calls any external API, or
// exposes a price anywhere a visitor could see it.
//
// Every field is explicitly tagged in its own doc comment as one of three kinds — this
// distinction is the whole point of the module, not decoration:
//   SUPPLIER COST     — a real quoted amount from an actual hotel/transport/activity
//                        supplier. This module never invents one; every such field is
//                        required input, never defaulted.
//   OWNER ASSUMPTION  — a business decision (traveller count, margin, buffer, tax rate)
//                        that only the business owner can set. Also never defaulted to
//                        a guessed value — `marginPercent` has no fallback, and
//                        `taxPercent`/`operationalBufferPercent` are optional and treated
//                        as "not yet configured" (0-equivalent for the calculation) when
//                        omitted, never silently assumed to be some real-world rate.
//   CALCULATED VALUE  — everything this module derives from the two above. Never a
//                        manual input.

export interface JourneyCostInputs {
  // SUPPLIER COST — real quoted amounts only. Never invented by this module or any
  // caller; a placeholder/guessed number here would violate the same no-fabrication
  // rule that governs the rest of this Journey-drafting work.
  /** Quoted rate for one room, one night, at the hotel category actually being costed. */
  hotelCostPerRoomPerNight: number;
  /** Quoted total transport cost for the whole package (not per day/per person). */
  transportTotal: number;
  /** Quoted total meal cost for the whole package, if any meals are included at all. */
  mealCostTotal?: number;
  /** Quoted total activities cost for the whole package. */
  activitiesCostTotal?: number;
  /** Quoted total permits/entry-charges cost for the whole package. */
  permitsCostTotal?: number;
  /** Any other real, quoted operational cost not covered above. */
  otherOperationalCostTotal?: number;

  // OWNER ASSUMPTION — business decisions. `marginPercent` has no default: a package
  // cannot be priced without the owner actually choosing a margin.
  /** Number of travellers this costing is built for. Must be a positive integer. */
  travellers: number;
  /** Number of hotel rooms this costing assumes. Must be a positive integer. */
  rooms: number;
  /** Number of nights the accommodation cost applies for. Must be a positive integer. */
  nights: number;
  /** Fractional buffer applied to base operational cost, e.g. 0.05 for 5%. Omitted (not
   *  0) means "not yet configured" — treated as 0 for the calculation, but callers
   *  should treat an omitted buffer as an open decision, not an approved zero. */
  operationalBufferPercent?: number;
  /** Fractional margin applied to (base cost + buffer). Required — there is no
   *  business-safe default margin this module could guess. */
  marginPercent: number;
  /** Fractional tax applied to (base cost + buffer + margin). Omitted means the
   *  business's tax treatment for this package is not yet configured/approved — treated
   *  as 0 for the calculation, never assumed to be a real GST rate. */
  taxPercent?: number;
}

export interface JourneyCostBreakdown {
  // CALCULATED VALUE — every field below is derived, never a direct input.
  accommodationTotal: number;
  /** Sum of accommodation + transport + meals + activities + permits + other — the real
   *  operational cost before any buffer, margin or tax is applied. */
  baseOperationalCost: number;
  bufferAmount: number;
  marginAmount: number;
  taxAmount: number;
  /** baseOperationalCost + bufferAmount + marginAmount + taxAmount. */
  finalPackageTotal: number;
  /** baseOperationalCost / travellers — the raw per-person cost with no buffer/margin/tax. */
  perPersonCost: number;
  /** finalPackageTotal / travellers — the actual per-person selling price this costing implies. */
  perPersonSellingPrice: number;
}

function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive whole number — received ${value}.`);
  }
}

function assertNonNegative(value: number | undefined, fieldName: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new Error(`${fieldName} must be a non-negative number when provided — received ${value}.`);
  }
}

// The one calculation function this module exists for. Throws on invalid input rather
// than silently producing a misleading number — a zero/negative traveller count, or a
// negative supplier cost, is a real data-entry error that must stop the calculation, not
// be coerced into something that looks plausible.
export function calculateJourneyCost(inputs: JourneyCostInputs): JourneyCostBreakdown {
  assertPositiveInteger(inputs.travellers, 'travellers');
  assertPositiveInteger(inputs.rooms, 'rooms');
  assertPositiveInteger(inputs.nights, 'nights');
  assertNonNegative(inputs.hotelCostPerRoomPerNight, 'hotelCostPerRoomPerNight');
  assertNonNegative(inputs.transportTotal, 'transportTotal');
  assertNonNegative(inputs.mealCostTotal, 'mealCostTotal');
  assertNonNegative(inputs.activitiesCostTotal, 'activitiesCostTotal');
  assertNonNegative(inputs.permitsCostTotal, 'permitsCostTotal');
  assertNonNegative(inputs.otherOperationalCostTotal, 'otherOperationalCostTotal');
  if (!Number.isFinite(inputs.marginPercent) || inputs.marginPercent < 0) {
    throw new Error(`marginPercent must be a non-negative number — received ${inputs.marginPercent}. There is no default margin; it must be explicitly set.`);
  }
  assertNonNegative(inputs.operationalBufferPercent, 'operationalBufferPercent');
  assertNonNegative(inputs.taxPercent, 'taxPercent');

  const accommodationTotal = inputs.hotelCostPerRoomPerNight * inputs.rooms * inputs.nights;
  const baseOperationalCost =
    accommodationTotal +
    inputs.transportTotal +
    (inputs.mealCostTotal ?? 0) +
    (inputs.activitiesCostTotal ?? 0) +
    (inputs.permitsCostTotal ?? 0) +
    (inputs.otherOperationalCostTotal ?? 0);

  const bufferAmount = baseOperationalCost * (inputs.operationalBufferPercent ?? 0);
  const marginAmount = (baseOperationalCost + bufferAmount) * inputs.marginPercent;
  const taxAmount = (baseOperationalCost + bufferAmount + marginAmount) * (inputs.taxPercent ?? 0);
  const finalPackageTotal = baseOperationalCost + bufferAmount + marginAmount + taxAmount;

  return {
    accommodationTotal,
    baseOperationalCost,
    bufferAmount,
    marginAmount,
    taxAmount,
    finalPackageTotal,
    perPersonCost: baseOperationalCost / inputs.travellers,
    perPersonSellingPrice: finalPackageTotal / inputs.travellers
  };
}
