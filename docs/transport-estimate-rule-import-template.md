# Transport estimate rule import template

Introduced in TP3B (Transport Pricing — Calculated Estimate Engine Foundation). This is
the format for entering an **owner-approved formula estimation rule** into
`TransportEstimateRule` (`models/TransportEstimateRule.ts`) — never a demo, seed, or
guessed figure, and never a genuine supplier quote (that belongs in `TransportRate`
instead — see `docs/transport-rate-import-template.md`). See
`services/pricing/transportEstimate.service.ts` for how these rows are matched against a
calculation request, and `scripts/importTransportEstimateRules.ts` for how to load a CSV
built to this format.

No numeric value in this document is a real rate. Every example below uses a
placeholder — `<owner approved amount>` or similar — precisely so it can never be
mistaken for a genuine figure. **This importer must not be run against production during
TP3B** — the expected `TransportEstimateRule` count after TP3B ships is 0.

## Running the import

```
npx tsx scripts/importTransportEstimateRules.ts --file path/to/rules.csv
```

Each row is validated, converted (rupees → paise), and passed to
`createTransportEstimateRule`, which independently re-checks that the new rule's
validity window doesn't overlap an existing active rule for the same vehicle
category/region/trip type/rate basis identity. Rejected rows are reported by number and
reason; nothing partial is ever written for a rejected row.

## Columns

| Column | Required | Notes |
|---|---|---|
| `vehicleCategory` | Yes | Must exactly match one of `TransportVehicle`'s existing category values (see `models/TransportVehicle.ts`) — no new categories are invented by this template. A `4x4` category row may be imported, but the calculator always refuses to auto-calculate a 4x4 request regardless. |
| `serviceRegion` | Yes | Must exactly match one of the canonical region ids in `config/regions.config.ts` (currently `himachal-pradesh`, `jammu-kashmir`, `uttarakhand`). |
| `tripType` | Yes | One of `ONE_WAY`, `AIRPORT_TRANSFER`, `RAILWAY_TRANSFER`, `ROUND_TRIP`, `LOCAL`, `MULTI_DAY`, `CIRCUIT`, `4X4_SPECIAL`. Only the first three are ever calculated in TP3B — the rest may be stored for a future phase but always resolve to `QUOTE_REQUIRED` today. |
| `rateBasis` | Yes | Only `PER_KM` is supported in TP3B. |
| `perKmRateRupees` | Yes | **The actual owner-approved rate, in rupees per kilometre** — `<owner approved amount>`. Never estimated, never copied from a competitor site or from `TransportVehicle.estimatedFromPrice`/`TransportRoute.startingFare`. Converted internally to paise. |
| `minimumKmPerDay` | No | Floor distance (km) the calculation is measured against. Leave blank to use the actual approved road distance with no floor. |
| `driverAllowanceApplicable` | No | `true`/`false`. Leave blank (treated as `false`) if this rule has no driver-allowance concept at all. |
| `driverAllowanceIncludedInBaseFare` | No | `true`/`false`. Only meaningful when `driverAllowanceApplicable` is `true` — set `true` if the allowance is already folded into `perKmRateRupees` (nothing extra is added), or `false` if it must be added on top via `driverAllowancePerDayAmountRupees`. |
| `driverAllowancePerDayAmountRupees` | Only when applicable and not included in base fare | `<owner approved amount>`, per day. Must be blank whenever `driverAllowanceApplicable` is `false` or `driverAllowanceIncludedInBaseFare` is `true` — a component can never be silently double-counted. |
| `nightHaltChargeRupees` | No | `<owner approved amount>`, per night. Stored for a future overnight/multi-day trip type only — TP3B's supported trip types are same-day and never apply this. |
| `tollStatus` | No | One of `INCLUDED`, `EXCLUDED`, `AT_ACTUALS`, `UNKNOWN`, `CONFIRMATION_REQUIRED`. Leave blank to default to `UNKNOWN` — never assumed `EXCLUDED`/₹0. |
| `parkingStatus` | No | Same vocabulary as `tollStatus`. |
| `stateTaxStatus` | No | Same vocabulary as `tollStatus`. |
| `permitStatus` | No | Same vocabulary as `tollStatus`. |
| `validFrom` | Yes | `YYYY-MM-DD` — first travel date this rule applies to. |
| `validTo` | Yes | `YYYY-MM-DD` — last travel date this rule applies to. |
| `sourceType` | Yes | One of `MARKET_REFERENCE`, `BUSINESS_APPROVED_ESTIMATE`. Never a supplier-flavored value — a genuine supplier rate belongs in `TransportRate`, not here. |
| `sourceName` | No | Short label for where this figure came from, e.g. an internal pricing committee name. |
| `sourceReference` | No | A reference number, approval document filename, etc. |
| `verifiedBy` | No | Who on the Apex Voyager team approved this rule. |
| `notes` | No | Free text — seasonal exceptions, special conditions, etc. Never shown to a customer. |

## Example row (placeholders only)

```csv
vehicleCategory,serviceRegion,tripType,rateBasis,perKmRateRupees,minimumKmPerDay,driverAllowanceApplicable,driverAllowanceIncludedInBaseFare,driverAllowancePerDayAmountRupees,nightHaltChargeRupees,tollStatus,parkingStatus,stateTaxStatus,permitStatus,validFrom,validTo,sourceType,sourceName,sourceReference,verifiedBy,notes
SUV,himachal-pradesh,ONE_WAY,PER_KM,<owner approved amount>,,true,false,<owner approved amount>,,UNKNOWN,UNKNOWN,UNKNOWN,UNKNOWN,2026-10-01,2027-03-31,BUSINESS_APPROVED_ESTIMATE,,,,
```

## Customer-facing wording contract

A `CALCULATED_ESTIMATE` result must be labeled **"Estimated Transport Cost"** to a
customer, with a disclosure similar to: "Final fare may vary based on route, travel
dates, vehicle availability, tolls, permits and supplier confirmation." Never label it
"Verified Fare", "Confirmed Fare", "Live Fare" or "Supplier Price" — those imply a
genuine `TransportRate` supplier quote, which this collection never produces.
