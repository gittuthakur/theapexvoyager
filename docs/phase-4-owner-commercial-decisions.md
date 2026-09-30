# Phase 4 — Owner Commercial Decisions for the First 10 Journey Drafts

Continues from Phase 3C (`e1c9a10c35fb4c03edfd82d7fd37f711898482e0`). This is a preparation/audit document — **no Journey document was written to the database this phase**, no draft was published, no approved price was changed, and no fabricated commercial value (inclusion, exclusion, meal plan, transport basis, cancellation percentage) was written anywhere, in code or in the database. Everything below marked **PROPOSED** is a conservative, category-level starting point for you to approve, edit, or reject — never a value this codebase has treated as final.

## 1. Scope

The 10 packages, all `status: 'draft'`, all carrying their Phase 3 owner-approved starting price (unchanged):

| # | Package | Slug | Duration | Price |
|---|---|---|---|---|
| 1 | Shimla Manali Tour Package | `shimla-manali-tour-package` | 5N/6D | ₹13,999 |
| 2 | Kinnaur Spiti Circuit | `kinnaur-spiti-circuit` | 8N/9D | ₹21,999 |
| 3 | Kasol Kheerganga Tosh | `kasol-kheerganga-tosh` | 4N/5D | ₹9,999 |
| 4 | Jibhi Tirthan Valley | `jibhi-tirthan-valley` | 3N/4D | ₹11,999 |
| 5 | Kashmir Family Tour | `kashmir-family-tour` | 5N/6D | ₹14,999 |
| 6 | Kashmir Pahalgam Gulmarg Sonamarg Tour | `kashmir-pahalgam-gulmarg-sonamarg-tour` | 6N/7D | ₹18,999 |
| 7 | Char Dham Yatra | `char-dham-yatra` | 9N/10D | ₹19,999 |
| 8 | Kedarnath Badrinath Yatra | `kedarnath-badrinath-yatra` | 6N/7D | ₹14,999 |
| 9 | Nainital Corbett Mussoorie Tour | `nainital-corbett-mussoorie-tour` | 5N/6D | ₹15,999 |
| 10 | Auli Chopta Tungnath Tour | `auli-chopta-tungnath-tour` | 5N/6D | ₹16,999 |

## 2. Price display contract (implemented, code-only, not wired to any live page)

`lib/journeyPriceDisplay.ts` now exposes:

- `buildStartingFromLabel(price)` → exactly `"Starting From ₹13,999 per person*"` (throws rather than fabricating a label for a zero/negative/missing price).
- `JOURNEY_PRICE_DISCLAIMER` (already existed, unchanged) → *"Starting price is indicative and based on selected occupancy/package configuration. Final price may vary by travel dates, group size, hotel category, transport, season and availability."*

Neither function is imported by any `app/` route or public component yet — both are ready for whenever a future phase wires real display.

## 3. Commercial readiness checker (extended)

`lib/journeyCommercialReadiness.ts`'s `getCommercialBlockers()` now returns, in order:

`MISSING_PRICE`, `MISSING_HOTEL_PLAN`, `MISSING_TRANSPORT_PLAN`, `MISSING_OCCUPANCY`, `MISSING_PICKUP_INFO`, `MISSING_DROP_INFO`, `MISSING_MEAL_PLAN`, `MISSING_INCLUSIONS`, `MISSING_EXCLUSIONS`, `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`, `OWNER_APPROVAL_REQUIRED`.

`MISSING_TRANSPORT_PLAN` is this codebase's existing name for what the Phase 4 brief calls "MISSING_TRANSPORT_TYPE" — same field (`transportType`), not renamed, to avoid an unnecessary breaking change to an existing, tested blocker code. `MISSING_HOTEL_PLAN` is the existing equivalent of "accommodation basis."

`CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED` is new and, like `OWNER_APPROVAL_REQUIRED`, is **unconditional and permanent** — nothing in this codebase can ever clear it by itself, because there is no field or process anywhere that records a real, owner-approved, package-specific cancellation schedule (see `components/modules/CancellationPolicyContent.tsx`, which deliberately only describes a general, case-by-case policy with no fixed percentages, for every booking type site-wide). It will keep appearing until that real infrastructure is built as its own piece of work — out of scope here.

Applying this checker to all 10 packages today (none has `pickupInfo`/`dropInfo`/`mealPlan`/`transportType`/`minTravellers`/`roomsIncluded`/`hotelCategoryDescription`/non-empty `inclusions`/`exclusions` set) gives every one of them the **same 10 blockers** (all except `MISSING_PRICE`, already resolved):

`MISSING_HOTEL_PLAN`, `MISSING_TRANSPORT_PLAN`, `MISSING_OCCUPANCY`, `MISSING_PICKUP_INFO`, `MISSING_DROP_INFO`, `MISSING_MEAL_PLAN`, `MISSING_INCLUSIONS`, `MISSING_EXCLUSIONS`, `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`, `OWNER_APPROVAL_REQUIRED`.

## 4. Content-quality and special-rules audit (Parts 6 & 9) — result: clean, no edits needed

All 10 packages' existing copy (`shortDescription`, `highlights`, itinerary day text, `importantNotes`, `idealTraveller`, `bestTimeToVisit`) was audited against:

- Forbidden superlatives ("best", "cheapest", "guaranteed" used as a bare claim, "lowest price", "100% confirmed") — **none found**. Every existing use of "guaranteed" in this catalogue is already a negation ("not a guaranteed part of every departure," "not guaranteed on every date") used to honestly hedge a weather/permit/season-dependent leg.
- Package-specific rules (Part 6): Kashmir packages never claim Gondola/pony/union transport as included; Char Dham and Kedarnath-Badrinath never claim helicopter/pony/palki/VIP darshan as included; the Corbett package never claims the safari as included (already phrased "subject to park permit availability... not guaranteed"); Jibhi Tirthan Valley never mentions Jalori Pass or Serolsar Lake; Shimla Manali already hedges Rohtang/Atal Tunnel access conservatively; Auli Chopta Tungnath never guarantees snow/ropeway/trek accessibility; Kinnaur Spiti already carries explicit permit/weather/road caveats.

This is now a permanent regression guard: `config/draftJourneys.phase4Commercial.test.ts` (11 tests) locks in every one of these findings so a future content edit that quietly reintroduces an unsupported claim will fail CI.

## 5. Per-package proposed commercial basis (PROPOSED — OWNER DECISION REQUIRED on every unresolved line)

Conservative, non-fabricated candidates only — no named hotel, no named transport operator, no specific meal claim invented. Where Part 3 of the brief says "do not silently assume," the row says **OWNER DECISION REQUIRED** instead of proposing a default.

### 1. Shimla Manali Tour Package
- Occupancy: PROPOSED double-sharing (matches this catalogue's stated `priceBasis`)
- Accommodation: OWNER DECISION REQUIRED (Standard vs Deluxe category)
- Meals: OWNER DECISION REQUIRED (no plan proposed)
- Transport: OWNER DECISION REQUIRED (private vehicle vs shared) — do not default to "private cab" without approval
- Pickup/Drop: Chandigarh (exact point/instructions — OWNER DECISION REQUIRED)
- Inclusions (proposed candidates, pending approval): accommodation for 5 nights, scheduled transfers per itinerary, itinerary sightseeing (Shimla local, Manali local)
- Exclusions (proposed candidates): airfare/train fare, personal expenses, entry tickets, adventure activities at Solang, **any Atal Tunnel/Rohtang excursion, local union/RTO vehicle charges, permits** (Special Rule: handle Rohtang/local union vehicle restrictions conservatively — never implied included), guide charges
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED` (general site policy applies)
- **NOT READY** — 10 blockers outstanding (see Section 3)

### 2. Kinnaur Spiti Circuit
- Occupancy: PROPOSED double-sharing
- Accommodation: OWNER DECISION REQUIRED
- Meals: OWNER DECISION REQUIRED
- Transport: OWNER DECISION REQUIRED (this is a high-altitude multi-leg route — vehicle type materially affects cost; do not assume)
- Pickup/Drop: Shimla / Manali (exact points — OWNER DECISION REQUIRED)
- Inclusions (proposed candidates): accommodation for 8 nights, scheduled transfers per itinerary, itinerary sightseeing (Sangla, Chitkul, Kalpa, Tabo, Kaza)
- Exclusions (proposed candidates): airfare/train fare, personal expenses, entry/monastery fees where applicable, **Inner Line Permit charges**, Chandratal/Kunzum-area optional excursions, guide charges, adventure activities
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
- **NOT READY**

### 3. Kasol Kheerganga Tosh
- Occupancy: PROPOSED double-sharing for the Kasol hotel nights only — the Kheerganga night is a genuinely different, trek-based stay type and must be priced/described separately (Special Rule: separate trekking-related services from standard hotel/cab assumptions)
- Accommodation: OWNER DECISION REQUIRED (Kasol hotel category; Kheerganga trek-stay type — guesthouse/tent — is a distinct decision)
- Meals: OWNER DECISION REQUIRED
- Transport: OWNER DECISION REQUIRED (Bhuntar↔Kasol road only — the Barshaini↔Kheerganga leg is on foot, not a vehicle line item)
- Pickup/Drop: Bhuntar (exact point — OWNER DECISION REQUIRED)
- Inclusions (proposed candidates): accommodation for 4 nights (Kasol + Kheerganga, basis TBC), scheduled Bhuntar↔Kasol transfer
- Exclusions (proposed candidates): airfare/train fare, personal expenses, **trek guide/porter charges**, Kheerganga trail entry/eco fees where applicable, adventure activities
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
- **NOT READY**

### 4. Jibhi Tirthan Valley
- Occupancy: PROPOSED double-sharing
- Accommodation: OWNER DECISION REQUIRED
- Meals: OWNER DECISION REQUIRED
- Transport: OWNER DECISION REQUIRED
- Pickup/Drop: Aut (exact point — OWNER DECISION REQUIRED)
- Inclusions (proposed candidates): accommodation for 3 nights, scheduled transfers per itinerary
- Exclusions (proposed candidates): airfare/train fare, personal expenses, **any Jalori Pass/Serolsar Lake excursion (not part of this itinerary at all — see Special Rule)**, guide charges, adventure activities
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
- **NOT READY**

### 5. Kashmir Family Tour
- Occupancy: PROPOSED double-sharing
- Accommodation: OWNER DECISION REQUIRED (houseboat vs hotel category in Srinagar is itself a real commercial decision, not just a tier)
- Meals: OWNER DECISION REQUIRED
- Transport: OWNER DECISION REQUIRED
- Pickup/Drop: Srinagar (exact point — OWNER DECISION REQUIRED)
- Inclusions (proposed candidates): accommodation for 5 nights, scheduled transfers per itinerary, Dal Lake shikara ride (a real, low-cost, already-itemized experience — confirm before including)
- Exclusions (proposed candidates): airfare/train fare, personal expenses, **Gulmarg Gondola tickets, pony rides, local/union transport at any stop, snow activities** (Special Rule: none of these are automatically included), entry tickets, guide charges
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
- **NOT READY**

### 6. Kashmir Pahalgam Gulmarg Sonamarg Tour
- Occupancy/Accommodation/Meals/Transport/Pickup/Drop: same open decisions as #5, applied to a longer 4-stop route
- Inclusions (proposed candidates): accommodation for 6 nights, scheduled transfers per itinerary
- Exclusions (proposed candidates): same Kashmir special-rule list as #5 (Gondola, pony, local/union transport, snow activities not included), plus Sonamarg pony/sledge activities specifically
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
- **NOT READY**

### 7. Char Dham Yatra
- Occupancy: PROPOSED double-sharing
- Accommodation: OWNER DECISION REQUIRED (8 different overnight bases — a real per-stop decision, not one uniform tier)
- Meals: OWNER DECISION REQUIRED
- Transport: OWNER DECISION REQUIRED (road transport only as the base assumption — Kedarnath's trek/helicopter leg is a separate decision entirely)
- Pickup/Drop: Haridwar (exact point — OWNER DECISION REQUIRED)
- Inclusions (proposed candidates): accommodation for 9 nights across the route's bases, scheduled road transfers between bases
- Exclusions (proposed candidates): airfare/train fare, personal expenses, **helicopter tickets, pony/palki/doli charges, VIP/special darshan** (Special Rule: none of these are automatically included), the Kedarnath trek's porter/guide charges, entry/aarti-seating charges where applicable
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
- **NOT READY**

### 8. Kedarnath Badrinath Yatra
- Same open decisions and exclusion candidates as #7, scoped to 2 shrines / 6 nights
- **NOT READY**

### 9. Nainital Corbett Mussoorie Tour
- Occupancy: PROPOSED double-sharing
- Accommodation: OWNER DECISION REQUIRED
- Meals: OWNER DECISION REQUIRED
- Transport: OWNER DECISION REQUIRED
- Pickup/Drop: Kathgodam / Dehradun (exact points — OWNER DECISION REQUIRED)
- Inclusions (proposed candidates): accommodation for 5 nights, scheduled transfers per itinerary, Naini Lake boating (real, low-cost, already-itemized — confirm before including)
- Exclusions (proposed candidates): airfare/train fare, personal expenses, **Corbett safari/jeep and park permit charges** (Special Rule: never implied included — permits are limited and allocated separately), entry tickets, guide charges
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
- **NOT READY**

### 10. Auli Chopta Tungnath Tour
- Occupancy: PROPOSED double-sharing
- Accommodation: OWNER DECISION REQUIRED
- Meals: OWNER DECISION REQUIRED
- Transport: OWNER DECISION REQUIRED
- Pickup/Drop: Rishikesh (exact point — OWNER DECISION REQUIRED)
- Inclusions (proposed candidates): accommodation for 5 nights, scheduled transfers per itinerary
- Exclusions (proposed candidates): airfare/train fare, personal expenses, **Auli ropeway tickets, Tungnath trek guide/porter charges** (Special Rule: snow/ropeway/trek accessibility is never guaranteed and never implied included), adventure activities
- Cancellation: `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
- **NOT READY**

## 6. SEO readiness (Part 10) — proposed copy, not yet wired to any code

Each package already has a unique `slug` (its future canonical path) and a unique route/duration, so nothing here is a duplicate-content risk. Proposed title/H1/meta description (derived only from facts already in each draft — no invented claim), for eventual use in a `JOURNEY_SEO_OVERRIDES`-style entry once published:

| Package | Proposed title | Proposed H1 | Proposed meta description |
|---|---|---|---|
| Shimla Manali Tour Package | Shimla Manali Tour Package from Chandigarh \| 5N/6D | Shimla Manali Tour Package from Chandigarh | Plan a 5N/6D Shimla Manali tour from Chandigarh covering Mall Road, Old Manali cafes, Hadimba Temple and a seasonal Solang Valley excursion. |
| Kinnaur Spiti Circuit | Kinnaur Spiti Circuit Tour \| 8N/9D Shimla to Manali | Kinnaur Spiti Circuit — Sangla, Chitkul, Tabo & Kaza | Book an 8N/9D Kinnaur Spiti circuit from Shimla to Manali via Sangla, Chitkul, Kalpa, Tabo and Kaza. |
| Kasol Kheerganga Tosh | Kasol Kheerganga Tosh Trek Package \| 4N/5D | Kasol Kheerganga Tosh Trek Package | A 4N/5D Parvati Valley trip from Bhuntar covering Kasol, Tosh village and a trek to Kheerganga's hot springs. |
| Jibhi Tirthan Valley | Jibhi Tirthan Valley Tour Package \| 3N/4D | Jibhi Tirthan Valley Tour Package | A short 3N/4D offbeat escape from Aut to Jibhi village and the Tirthan Valley's Gushaini riverside. |
| Kashmir Family Tour | Kashmir Family Tour Package \| Srinagar Gulmarg Pahalgam 5N/6D | Kashmir Family Tour — Srinagar, Gulmarg & Pahalgam | A paced 5N/6D Kashmir family tour covering Srinagar, Gulmarg and Pahalgam, with a Dal Lake houseboat stay. |
| Kashmir Pahalgam Gulmarg Sonamarg Tour | Kashmir Tour Package \| Pahalgam Gulmarg Sonamarg 6N/7D | Kashmir Tour — Pahalgam, Gulmarg & Sonamarg | A fuller 6N/7D Kashmir sightseeing circuit covering Srinagar, Pahalgam, Gulmarg and Sonamarg. |
| Char Dham Yatra | Char Dham Yatra Package \| 9N/10D Yamunotri Gangotri Kedarnath Badrinath | Char Dham Yatra — Yamunotri, Gangotri, Kedarnath & Badrinath | A 9N/10D Char Dham Yatra covering Yamunotri, Gangotri, Kedarnath and Badrinath in the traditional order, from Haridwar. |
| Kedarnath Badrinath Yatra | Kedarnath Badrinath Yatra Package \| 6N/7D | Kedarnath Badrinath Yatra | A shorter 6N/7D Uttarakhand pilgrimage covering only Kedarnath and Badrinath, from Haridwar. |
| Nainital Corbett Mussoorie Tour | Nainital Corbett Mussoorie Tour Package \| 5N/6D | Nainital Corbett Mussoorie Tour | A 5N/6D Kumaon-Garhwal family circuit covering Nainital's Naini Lake, a Jim Corbett wildlife stop and Mussoorie's hill views. |
| Auli Chopta Tungnath Tour | Auli Chopta Tungnath Tour Package \| 5N/6D | Auli Chopta Tungnath Tour | A 5N/6D Uttarakhand nature-and-trek trip from Rishikesh covering Auli's meadows and the Tungnath trek from Chopta. |

**Visible FAQs / FAQPage eligibility:** all 10 currently carry `faqs: []`. `buildFaqPageSchema()` only ever mirrors real, on-page FAQ content (see its own doc comment) — so none of these is FAQPage-eligible until real, approved FAQ copy is written. No FAQ was fabricated to close this gap.

**Product schema eligibility and a flagged honesty gap:** `buildJourneyProductSchema()` mechanically works once a Journey is published (name/description/image/url/category/price all resolve). However, its `offers.price` is a single number with no "starting from" semantic — schema.org's plain `Offer.price` reads as a literal, fixed purchasable price, not an indicative one. This gap already exists today for the 6 live packages (this function is shared, unchanged code) and is **not fixed in this phase** — changing it would alter the live packages' structured data, which is out of scope here ("do not touch existing 6 packages"). Flagged per Part 10's instruction ("report the issue instead of forcing schema") for a future phase to resolve, e.g. by adding a clarifying `description` inside `offers` or moving to `AggregateOffer` with a real `lowPrice`/`highPrice` once range data exists — no schema code changed this phase.

## 7. UI review (Part 12) — findings only, no redesign performed

Reviewed `components/modules/journey-detail/JourneyBookingSidebar.tsx` and `components/modules/PackageDetailContent.tsx` (the live Journey detail UI, shared by the 6 published packages):

Already present: "Starting from" price framing with a `/ person` (or `priceBasis`) qualifier, duration, destination, a WhatsApp enquiry CTA, a "Hotel category" row driven by `hotelCategoryDescription` when set, and conditional rendering of `inclusions`/`exclusions`/`bookingProcess`/`importantNotes`/`faqs` when populated.

Gaps found (not fixed — would touch shared UI the 6 live packages already render):
- No visible price-disclaimer text anywhere on the page (the exact `JOURNEY_PRICE_DISCLAIMER` string is not rendered).
- No asterisk on the displayed price tying it to a disclaimer.
- `mealPlan`, `transportType`, `pickupInfo`, `dropInfo` are not rendered anywhere on this page, despite existing on the Journey model since Phase 2C — unlike `hotelCategoryDescription`, which already has a dedicated row.
- Occupancy basis (`minTravellers`/`roomsIncluded`) is not rendered anywhere.
- No cancellation/booking-terms section or link to `/cancellation-policy` on the Journey detail page itself.

No drafts were made publicly reachable to test this — reviewed by reading the component source and the existing 6 live pages only.

## 8. What did NOT happen this phase

- No Journey document was created, updated, or seeded.
- No draft's `status` changed.
- No approved price changed.
- No inclusions/exclusions/pickupInfo/dropInfo/mealPlan/transportType/minTravellers/roomsIncluded were written to any of the 10 drafts.
- Ladakh (Region, 8 Destinations, 5 Journeys) untouched — still all `draft`.
- HBX and Google Places code untouched.
- `PackageDetailContent.tsx`/`JourneyBookingSidebar.tsx` untouched.
