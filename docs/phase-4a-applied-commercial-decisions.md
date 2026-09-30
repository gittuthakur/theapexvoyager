# Phase 4A — Applied Owner Commercial Decisions

Continues from Phase 4 (`docs/phase-4-owner-commercial-decisions.md`). This phase applies the owner's actual commercial decisions to `config/draftJourneys.config.ts`'s 10 target Journey drafts — code and config only. **No database was written. No draft was published. No production mutation occurred.**

## 1. Global decisions applied

- Every `priceBasis` now reads `"per person (starting price, indicative, double sharing)"`.
- Every package gets `minTravellers: 2`, `roomsIncluded: 1` — the model's own documented double-occupancy convention (`models/Journey.ts`: "2 travellers / 1 room = double occupancy"). No new schema semantics invented.
- Every `mealPlan` is Breakfast + Dinner (MAP) *"where operationally provided"* — never implied during a transit/trek-day sector unless the itinerary genuinely supports it (Kasol's Kheerganga night, Char Dham/Kedarnath-Badrinath's trek day, Auli/Chopta's Tungnath trek day all carry an explicit carve-out).
- Every `hotelCategoryDescription` states a category ("Deluxe hotel/equivalent", etc.), never a named property, and every package's `importantNotes` gained a line stating the final hotel is confirmed at booking, subject to availability.
- Cancellation: no package-specific percentage was added anywhere — `lib/journeyCommercialReadiness.ts`'s `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED` blocker (added in Phase 4) stays unconditional and unresolved for all 10, truthfully representing "uses the general site-wide policy" rather than inventing a number.

## 2. Flagged conflicts — owner-stated pickup/drop vs. the actual written itinerary

The brief specified Chandigarh/Chandigarh, Chandigarh/Chandigarh, and Delhi/Delhi pickup-drop for three packages. Checked against each package's actual itinerary (which the brief itself modeled doing for Kashmir Family's houseboat, at Part 5) before applying:

| Package | Owner-stated pickup/drop | What the itinerary actually supports | Applied |
|---|---|---|---|
| Kinnaur Spiti Circuit | Chandigarh / Chandigarh | Starts Shimla (Day 1), **ends Manali** (Day 9 "Onward departure from Manali") — no return-to-Chandigarh leg exists | Pickup: Chandigarh→Shimla transfer (plausible, matches this catalogue's Chandigarh-gateway convention). **Drop: Manali**, not Chandigarh — flagged in `importantNotes` for confirmation. |
| Kasol Kheerganga Tosh | Chandigarh / Chandigarh | Built entirely around the Bhuntar gateway (~2hrs from Kasol); Chandigarh is a ~285km/8hr+ different route, materially inconsistent with a ₹9,999 starting price | **Pickup/Drop: Bhuntar**, matching the existing `startingCity`/`endingCity`. Flagged in `importantNotes` for confirmation. |
| Jibhi Tirthan Valley | Chandigarh / Chandigarh | Built around the Aut gateway (~5km from Jibhi); Chandigarh is ~230km/6hr+ away | **Pickup/Drop: Aut**. Flagged in `importantNotes` for confirmation. |
| Nainital Corbett Mussoorie Tour | Delhi / Delhi | A one-way itinerary: starts Kathgodam (railhead), ends Dehradun/Mussoorie (Day 6 "departure" from Mussoorie, no return leg) | **Pickup: Kathgodam, Drop: Dehradun**, matching the existing `startingCity`/`endingCity`. Flagged in `importantNotes` for confirmation. |

**Auli Chopta Tungnath Tour** was a smaller, low-materiality case: the brief said Haridwar, the config previously said Rishikesh (both are adjacent, already-used gateway towns in this catalogue — Haridwar is already the Char Dham/Kedarnath-Badrinath gateway). Applied directly (`startingCity`/`endingCity` updated to Haridwar to match), not flagged as a conflict.

**Kashmir Family Tour's houseboat** (the brief's own explicit worked example, Part 5): the existing itinerary reads *"overnight on a houseboat or in a hotel"* — an alternative, not a confirmed 1-night houseboat. Per the brief's own fallback instruction, accommodation stayed "Deluxe hotel/equivalent" only; the houseboat question is flagged in `importantNotes`, not silently resolved either way.

## 3. Per-package fields added (all 10)

Each of the 10 gained: `hotelCategoryDescription`, `mealPlan`, `transportType`, `pickupInfo`, `dropInfo`, `minTravellers: 2`, `roomsIncluded: 1`, a real `inclusions` array, and a real `exclusions` array (previously all `[]`). Special-rule exclusions were applied per package (see `config/draftJourneys.config.ts` itself for the exact wording): Kashmir packages exclude Gondola/pony/snow-activities/local-union transport; Char Dham and Kedarnath-Badrinath exclude helicopter/pony/palki/VIP darshan/porter; Nainital Corbett Mussoorie excludes the safari/permit charges; Jibhi Tirthan Valley excludes any Jalori Pass/Serolsar Lake excursion; Auli Chopta Tungnath excludes the ropeway ticket and trek guide/porter charges; Kasol Kheerganga Tosh's transport basis explicitly states "private cab is not claimed at this starting price."

Every exclusions array ends with the same honest catch-all: *"Anything not specifically mentioned in Inclusions."*

`config/draftJourneys.phase4Commercial.test.ts` (21 tests) locks in all of this: the occupancy basis, the presence of all six commercial fields, the no-private-cab-at-₹9,999 rule, the accommodation-is-a-category rule, and — critically — that every risky item (Gondola, pony, safari, helicopter, palki, VIP darshan, porter, Jalori/Serolsar, ropeway) appears in `exclusions` and never in `inclusions`.

## 4. Product JSON-LD honesty fix (`lib/schema.ts`)

**Previous behavior:** `buildJourneyProductSchema()` emitted a plain schema.org `Offer` with a bare `price` — a semantic that reads as a fixed, guaranteed, universally-purchasable price, which none of this catalogue's prices actually are (every one is an owner-approved *indicative* "Starting From" per-person, double-sharing figure).

**New behavior:** emits an `AggregateOffer` with `lowPrice` instead — the standards-compliant schema.org pattern for representing an indicative/starting price without claiming a fixed one. `price` is now optional on the function's input; when it's missing or not a real positive number, the entire `offers` block is omitted rather than emitting one with a fabricated or invalid price. No `highPrice` or `offerCount` was added — neither is backed by real data, and inventing either would be exactly the kind of fabricated commercial claim this function has always avoided (it already excluded `availability`, `aggregateRating`, `review`, `priceValidUntil`, `sku`/`gtin`/`mpn`, and continues to).

**Standards/honesty result:** the smallest correction that fixes the gap — same function, same call site (`app/journeys/[slug]/page.tsx`, unchanged), same fields everywhere else. Breadcrumb and FAQ schema (`buildBreadcrumbListSchema`, `buildFaqPageSchema`) are untouched and still only ever mirror real, on-page content. `lib/schema.test.ts` (7 tests) locks in: no `aggregateRating`/`review`/`availability`/`priceValidUntil`/`highPrice`/`offerCount` ever; `AggregateOffer`/`lowPrice` shape; and that the `offers` block is omitted entirely for an invalid/missing price rather than fabricated.

This is shared code that also affects the 6 already-published packages' structured data — this was a deliberate instruction this phase ("Audit buildJourneyProductSchema before publication... implement the smallest standards-compliant correction"), not an accidental scope expansion. It has not been deployed (see Section 6).

## 5. UI changes (dev/test-fixture verified only, no draft made publicly reachable)

- `lib/journeyPriceDisplay.ts` (from Phase 4) already provided `buildStartingFromLabel()` and `JOURNEY_PRICE_DISCLAIMER`; both are now actually wired into `components/modules/journey-detail/JourneyBookingSidebar.tsx`. The desktop panel now reads `Starting From ₹13,999 per person*` with the exact disclaimer sentence directly beneath it; the mobile sticky bar shows the same label (space doesn't allow the full disclaimer there). A journey with no valid price still falls back to the existing `"Get Your Custom Quote"` copy, with no disclaimer.
- `components/modules/PackageDetailContent.tsx`'s existing "Good to Know" section gained four new conditional rows — **Meals**, **Transport**, **Pickup**, **Drop** — alongside the pre-existing **Accommodation** row (renamed from "Hotel category" for consistency with the other four). Each renders only when the corresponding field is actually populated; nothing is fabricated for the 6 live packages, which still have none of these six fields set and render exactly as before except for the new price/disclaimer format.
- Verified via `components/modules/PackageDetailContent.test.tsx` (renders to static markup with fixture `TravelPackage` objects — the same dev/test-fixture pattern the file already used, never a live/public route) — 12 tests, all passing, including new coverage for the price/disclaimer contract and the four new fields.
- No visual/structural redesign — every change is either a new conditional row using the section's existing pattern, or a like-for-like replacement of the existing price line.

## 6. What did NOT happen this phase

- No Journey document was created, updated, or seeded in the database.
- No draft's `status` changed; no draft was published.
- No approved price changed.
- No commit, push, or deploy occurred — this phase's code changes sit as working-tree changes, exactly like Phase 4's.
- Ladakh, the existing 6 published packages, the Shimla-Manali redirect, HBX, Google Places, and transport pricing were all untouched.
