# Transport supplier rate import template

Introduced in TP2 (Transport Pricing — Supplier Rate Foundation). This is the format for
entering a **genuine** transport supplier rate into `TransportRate`
(`models/TransportRate.ts`) — never a demo, seed, or guessed figure. See
`services/pricing/transportPricing.service.ts` for how these rows are matched against a
booking request, and `scripts/importTransportRates.ts` for how to load a CSV built to
this format.

No numeric value in this document is a real rate. Every example below uses a
placeholder — `<supplier provided amount>` or similar — precisely so it can never be
mistaken for a genuine figure.

## Running the import

```
npx tsx scripts/importTransportRates.ts --file path/to/rates.csv
```

Each row is validated, converted (rupees → paise), and passed to
`createTransportRate`, which independently re-checks the partner and route are real and
that the new rate's validity window doesn't overlap an existing active one for the same
supplier/vehicle/route (or circuit). Rejected rows are reported by number and reason;
nothing partial is ever written for a rejected row.

## Columns

| Column | Required | Notes |
|---|---|---|
| `partnerId` | Yes | The real Mongo `_id` of an existing `TransportPartner` document. Not the business name — resolve this first (e.g. from the partner's admin listing) so the rate is always tied to an identifiable supplier. |
| `vehicleCategory` | Yes | Must exactly match one of `TransportVehicle`'s existing category values (see `models/TransportVehicle.ts`) — no new categories are invented by this template. |
| `rateType` | Yes | One of `POINT_TO_POINT`, `ROUND_TRIP`, `CIRCUIT_FIXED`. |
| `routeId` | Only for a route-specific `POINT_TO_POINT`/`ROUND_TRIP` rate | The real Mongo `_id` of an existing `TransportRoute` document. Leave blank for a generic (vehicle-category-wide) rate, or for `CIRCUIT_FIXED`. |
| `circuitKey` | Only for `CIRCUIT_FIXED` | A short, stable identifier you choose for one multi-day itinerary, e.g. `spiti-circuit-shimla-manali`. Must be blank for `POINT_TO_POINT`/`ROUND_TRIP`. |
| `journeySlug` | No | Optional metadata linking this rate to a real Journey slug (`config/packages.config.ts`) for the rate-collection priority matrix — never used by the pricing service to gate eligibility. |
| `supplierCostRupees` | Yes | **The actual amount the supplier quoted, in rupees** — `<supplier provided amount>`. Never estimated. Converted internally to paise. |
| `includedKm` | No | Kilometres included before `extraKmRateRupees` applies. |
| `minimumKm` | No | Floor distance the extra-km calculation is measured against. |
| `extraKmRateRupees` | No | `<supplier provided amount>` per km beyond `includedKm`. |
| `driverAllowanceRupees` | No | `<supplier provided amount>`, per day, if charged separately. |
| `nightChargeRupees` | No | `<supplier provided amount>`, per night, if charged separately. |
| `fuelIncluded` | No | `true`/`false`. Leave blank if genuinely unknown — never defaults to either. |
| `driverAllowanceIncluded` | No | `true`/`false`/blank. |
| `tollParkingIncluded` | No | `true`/`false`/blank. |
| `stateTaxIncluded` | No | `true`/`false`/blank. |
| `permitIncluded` | No | `true`/`false`/blank. |
| `nightChargeIncluded` | No | `true`/`false`/blank. |
| `validFrom` | Yes | `YYYY-MM-DD` — first travel date this rate applies to. |
| `validTo` | Yes | `YYYY-MM-DD` — last travel date this rate applies to. |
| `source` | Yes | How this rate was actually obtained, e.g. "Phone call with supplier, confirmed via WhatsApp on 2026-10-02". Free text — there is no fixed taxonomy, because the only thing this collection ever holds is a genuine supplier-provided rate. |
| `sourceReference` | No | A reference number, quote/email filename, etc. |
| `verifiedBy` | No | Who on the Apex Voyager team confirmed this rate. |
| `notes` | No | Free text — seasonal exceptions, special conditions, etc. |

## Example row (placeholders only)

```csv
partnerId,vehicleCategory,rateType,routeId,circuitKey,journeySlug,supplierCostRupees,includedKm,minimumKm,extraKmRateRupees,driverAllowanceRupees,nightChargeRupees,fuelIncluded,driverAllowanceIncluded,tollParkingIncluded,stateTaxIncluded,permitIncluded,nightChargeIncluded,validFrom,validTo,source,sourceReference,verifiedBy,notes
<real TransportPartner _id>,SUV,POINT_TO_POINT,<real TransportRoute _id>,,,<supplier provided amount>,<supplier provided amount>,<supplier provided amount>,<supplier provided amount>,<supplier provided amount>,<supplier provided amount>,true,true,false,,,,2026-10-01,2027-03-31,<how this rate was obtained>,,,
```

## Recommended collection priority (from TP1's audit of real Journey itineraries)

Collect the **Spiti Valley Adventure** (`spiti-valley-adventure`) circuit-fixed rate
first — it is the one real Journey whose 7-day, one-way Shimla→Manali itinerary the
existing flat display prices (`TransportVehicle.estimatedFromPrice`,
`TRANSPORT_MODES[].perDayRate`) cannot honestly represent. See TP1's report for the full
Journey/vehicle-category/rate-type priority matrix.
