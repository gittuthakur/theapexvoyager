# Phase 2C — Commercial Model, Cost Engine and Pricing Worksheets

Continues from Phase 2B (`docs/phase-2b-draft-commercial-audit.md`). No draft published, no existing published Journey modified, no production database mutation performed while producing this document or the code below.

## A. Commercial data model

`models/Journey.ts` gained 6 new **optional** fields, none enforced by the existing `pre('validate')` publish hook — deliberately, so the 6 live packages (which have none of them) remain valid, backward-compatible published documents with zero backfill required:

| Field | Type | Purpose |
|---|---|---|
| `pickupInfo` | `string?` | Real pickup point(s)/instructions |
| `dropInfo` | `string?` | Real drop point(s)/instructions |
| `mealPlan` | `string?` | Real meal-plan description (e.g. "Daily breakfast only (CP)") |
| `transportType` | `string?` | Real plain-language transport summary (e.g. "Private SUV throughout") |
| `minTravellers` | `number?` | The group size a costing assumes |
| `roomsIncluded` | `number?` | The room count a costing assumes, paired with `minTravellers` for occupancy basis |

Mirrored in `types/package.ts` (`TravelPackage`, inherited automatically by `DraftTravelPackageInput`) and mapped in `lib/packages.ts`'s `toTravelPackage()`. Backward compatibility verified by test (`models/Journey.test.ts`): a Journey shaped exactly like a live package — none of these 6 fields set — still validates as `published`.

## B. Pricing formula

```
Selling Price =
    Hotel Accommodation (rate/room/night × rooms × nights)
  + Transport
  + Meals
  + Activities
  + Permits / entry charges
  + Other operational cost
  = Base Operational Cost
  + Operational Buffer  (% of Base Operational Cost)
  = Subtotal
  + Company Margin      (% of Subtotal)
  = Pre-tax Total
  + Applicable Tax       (% of Pre-tax Total, omitted ⇒ 0 — never assumed)
  = Final Package Total

Per-Person Cost           = Base Operational Cost / Travellers
Per-Person Selling Price  = Final Package Total / Travellers
```

Implemented exactly as above in `lib/journeyCostModel.ts`'s `calculateJourneyCost()` — 21 tests in `lib/journeyCostModel.test.ts` cover the arithmetic, per-person/room/night math, invalid-input rejection, and optional buffer/margin/tax handling.

## C. Journey fields proposed/added

See Section A — no other schema change was made. `hotelCategoryDescription` (Phase 1) already covers a free-text hotel-tier description; no redundant new field was added for it.

## D. Pricing worksheet implementation

`lib/journeyCostModel.ts` — the reusable calculation engine (`calculateJourneyCost`). `lib/journeyPriceDisplay.ts` — `roundForDisplay()`/`buildDisplayPrice()`, a rounding-only presentation helper (default step = 1, i.e. no rounding at all unless a step is explicitly given) that **never** chooses a "psychologically attractive" ending on its own, and returns an `ownerApproved: false` flag by construction — nothing in this codebase ever flips that to `true` automatically. Both are internal-only: neither is imported by any `app/` page, route, or public component. No interactive worksheet **page** was built this phase (no new route was added — confirmed in the build output above); the worksheet itself, since no real supplier numbers exist yet for any package, is the structural matrix in Section F below, to be filled in once real quotes exist.

## E. Readiness/blocker system

`lib/journeyCommercialReadiness.ts`'s `getCommercialBlockers()` reports, for any Journey-shaped input: `MISSING_PRICE`, `MISSING_HOTEL_PLAN`, `MISSING_TRANSPORT_PLAN`, `MISSING_OCCUPANCY`, `MISSING_INCLUSIONS`, `MISSING_EXCLUSIONS`, and — unconditionally, for anything not already `published` — `OWNER_APPROVAL_REQUIRED`. This last blocker can never be cleared by resolving the others; `isCommerciallyContentComplete()` explicitly excludes it from its own check, precisely so "zero field-level blockers" is never mistaken for "safe to publish." Nothing in this codebase calls either function to trigger a status change — there is no automated publish path at all.

## F. 10-package worksheet matrix (structural — no monetary values, per instruction)

`dharamshala-mcleodganj-dalhousie-khajjiar-circuit` is excluded from this matrix and remains ON HOLD (not priced, not deleted, not published) pending your overlap decision from Phase 2B.

| # | Package | Duration | Nights | Route stops | Accommodation basis | Transport legs | Seasonal complexity |
|---|---|---|---|---|---|---|---|
| 1 | Shimla Manali Tour Package | 5N/6D | 5 | 2 (Shimla, Manali) | 2 nights Shimla + 3 nights Manali | Chandigarh↔Shimla↔Manali↔Chandigarh, 3 drive legs | Low — ordinary hill-road caveats only |
| 2 | Kinnaur Spiti Circuit | 8N/9D | 8 | 5 (Sangla, Kalpa, Tabo, Kaza, Manali) | 1N Sangla + 1N Kalpa + 1N Tabo + 2N Kaza + return leg | Shimla→Sangla→Kalpa→Tabo→Kaza→Manali, 5+ drive legs, high-altitude | High — Kunzum Pass seasonal window, inner-line permit |
| 3 | Kasol Kheerganga Tosh | 4N/5D | 4 | 2 (Kasol, Tosh/Kheerganga) | Kasol base + 1N trek stay near Kheerganga | Bhuntar↔Kasol road + Barshaini↔Kheerganga trek (no vehicle) | Moderate — trek trail condition dependent |
| 4 | Jibhi Tirthan Valley | 3N/4D | 3 | 2 (Jibhi, Tirthan/Gushaini) | 2N Jibhi + 1N Tirthan | Aut↔Jibhi↔Tirthan, 2 drive legs | Low |
| 5 | Kashmir Family Tour | 5N/6D | 5 | 3 (Srinagar, Gulmarg, Pahalgam) | 2N Srinagar + 1N Gulmarg + 2N Pahalgam | Srinagar↔Gulmarg↔Pahalgam↔Srinagar, 3 legs | Moderate — Gondola/houseboat seasonal availability |
| 6 | Kashmir Pahalgam Gulmarg Sonamarg | 6N/7D | 6 | 4 (Srinagar, Sonamarg, Pahalgam, Gulmarg) | 1N Srinagar + Sonamarg day + 2N Pahalgam + 2N Gulmarg | 4-valley circuit, 4+ legs | Moderate-High — Sonamarg road + Gondola seasonal |
| 7 | Char Dham Yatra | 9N/10D | 9 | 4 shrines (Yamunotri, Gangotri, Kedarnath, Badrinath) | 1 base town per shrine leg, 8 overnight bases | Multi-leg road + Kedarnath trek/helicopter | Highest — official yatra-season dates, Kedarnath access not guaranteed |
| 8 | Kedarnath Badrinath Yatra | 6N/7D | 6 | 2 shrines | Guptkashi/Sonprayag base + Badrinath | Road + Kedarnath trek/helicopter | High — same Kedarnath caveat as #7 |
| 9 | Nainital Corbett Mussoorie | 5N/6D | 5 | 3 (Nainital, Ramnagar/Corbett, Mussoorie) | 2N Nainital + 1N Corbett + 2N Mussoorie | 3 drive legs | Moderate — Corbett safari permit + monsoon zone closures |
| 10 | Auli Chopta Tungnath | 5N/6D | 5 | 3 (Joshimath/Auli, Chopta, Tungnath trek) | 1N Joshimath + 3N Chopta | Joshimath↔Auli↔Chopta + Tungnath trek (no vehicle) | Moderate — trek trail condition dependent |

## G. Assumption template — owner/supplier inputs required (all 10 packages)

Every value below is currently unknown to this codebase and must come from you or a supplier — none was filled in, per instruction.

```
PACKAGE: Shimla Manali Tour Package (shimla-manali-tour-package)
Duration: 5N/6D
Suggested costing basis: 2 nights Shimla + 3 nights Manali, standard vehicle for a 4-city-drive route
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (none currently identified as mandatory)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Kinnaur Spiti Circuit (kinnaur-spiti-circuit)
Duration: 8N/9D
Suggested costing basis: 8 nights across 4 towns, high-altitude/remote-area vehicle requirement
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (inner-line permit fee is a real, identified cost line — amount unknown)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Kasol Kheerganga Tosh (kasol-kheerganga-tosh)
Duration: 4N/5D
Suggested costing basis: Kasol-based, 1 trek night near Kheerganga
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (trek guide fee is a real, identified cost line — amount unknown)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Jibhi Tirthan Valley (jibhi-tirthan-valley)
Duration: 3N/4D
Suggested costing basis: 2 nights Jibhi + 1 night Tirthan/Gushaini
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (none currently identified as mandatory)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Kashmir Family Tour (kashmir-family-tour)
Duration: 5N/6D
Suggested costing basis: 2N Srinagar + 1N Gulmarg + 2N Pahalgam — may share supplier rates with the live kashmir-signature-journey package for Srinagar/Gulmarg legs
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (Gulmarg Gondola ticket is a real, identified cost line — amount unknown)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Kashmir Pahalgam Gulmarg Sonamarg Tour (kashmir-pahalgam-gulmarg-sonamarg-tour)
Duration: 6N/7D
Suggested costing basis: 4-valley circuit, 1N Srinagar + Sonamarg day + 2N Pahalgam + 2N Gulmarg
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (Gulmarg Gondola ticket identified; Sonamarg activity costs unknown)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Char Dham Yatra (char-dham-yatra)
Duration: 9N/10D
Suggested costing basis: 4-shrine circuit, 9 overnight bases; helicopter option for Kedarnath is a SEPARATE cost line from the trek option, not interchangeable
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (Kedarnath trek pony/porter or helicopter fee, and any yatra registration fee, are real identified cost lines — amounts unknown)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Kedarnath Badrinath Yatra (kedarnath-badrinath-yatra)
Duration: 6N/7D
Suggested costing basis: 2-shrine subset of Char Dham — same Kedarnath cost-line caveats apply
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (same as Char Dham's Kedarnath leg)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Nainital Corbett Mussoorie Tour (nainital-corbett-mussoorie-tour)
Duration: 5N/6D
Suggested costing basis: 2N Nainital + 1N Corbett + 2N Mussoorie
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (Corbett safari permit fee is a real, identified cost line — amount and availability unknown)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED

PACKAGE: Auli Chopta Tungnath Tour (auli-chopta-tungnath-tour)
Duration: 5N/6D
Suggested costing basis: 1N Joshimath + 3N Chopta, Tungnath as a trek leg (no vehicle)
Travellers assumption: OWNER INPUT REQUIRED
Rooms: OWNER INPUT REQUIRED
Hotel category: OWNER INPUT REQUIRED
Meal plan: OWNER INPUT REQUIRED
Transport vehicle: OWNER INPUT REQUIRED
Transport supplier cost: OWNER INPUT REQUIRED
Activities/permits: OWNER INPUT REQUIRED (Auli ropeway ticket is a real, identified cost line — amount unknown)
Buffer: OWNER INPUT REQUIRED
Margin: OWNER INPUT REQUIRED
Tax: OWNER INPUT REQUIRED
```

## H. On hold

`dharamshala-mcleodganj-dalhousie-khajjiar-circuit` — kept as-is (still `draft`, still unpriced, still unpublished) pending your overlap decision from Phase 2B. Not touched in any way this phase.
