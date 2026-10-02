# Phase 14 — internal Journey costing

## Architecture decision and scope

Baseline HEAD was `1541f8c304e61bfd95fc3f9725968f3738e5922b`, matching remote main. The worktree already contained uncommitted costing files alongside unrelated HBX, booking, analytics and layout work. Phase 14 completes those costing files and preserves unrelated work.

Audit found `lib/journeyCostModel.ts`, the Phase 2C pure worksheet (one hotel rate, aggregate transport and other costs; its historical `marginPercent` is a markup), `services/pricing/transportPricing.service.ts`, TP2 supplier TransportRate/Partner/Route pricing in minor units, stay pricing utilities, public transport estimates, Journey quote reducers, booking request validation and Mongoose models. There is no session/login/admin identity mechanism. Existing internal tools use `requireInternalDevAccess`.

The new scenario engine is the reusable extension for supplier line items, occupancy, revisions and review. The old worksheet remains compatible for its existing script callers; it is not another new persisted subsystem. TP2 results can be adapted only when EXACT, INR and backed by an explicit supplier rate reference; public ₹13/₹16/₹25 customer transport rates are never imported. HBX, Google Places, PlaceCache, public transport pricing, IndexNow and public Journey behavior are unchanged.

`models/JourneyCosting.ts` defines an internal TypeScript domain model, deliberately **not** a MongoDB collection while safe admin authentication is absent. `journeyCosting.service.ts` is pure calculation/validation shared by live UI and server. `journeyCostingContext.service.ts` reads all Journey context. `journeyCostingStore.service.ts` saves immutable JSON revisions locally in ignored `.local-journey-costing/`. It imports no Journey DB writer. No supplier values enter Journey documents or public DTOs. A future authenticated persistence adapter can use the same input/result model.

## Access and local operation

UI: `/internal/journey-costing`. API: `/api/internal/journey-costing`.

Both require `NODE_ENV=development`; every production build/deployment denies access, irrespective of an environment toggle or supplied local Host. Development requests must use localhost/127.0.0.1/IPv6 loopback, matching forwarded host and same-origin fetch metadata. POST additionally requires an exact matching Origin. Responses containing costs use no-store/noindex headers. Production page denial happens before rendering the client and passing props; API denial precedes DB/store/calculation access. There are no public navigation links to the tool. Host checks are defense in depth, not authentication: **bind the dev server to loopback and never expose it through a tunnel or reverse proxy**.

Start with `npm run dev -- --hostname 127.0.0.1 --port 3100`, then open `http://127.0.0.1:3100/internal/journey-costing`. Supply the repository's normal MongoDB environment privately for read-only context. Local revisions contain confidential commercial data: restrict local filesystem access and back them up privately. They are ignored by Git and are not uploaded by Phase 14. Reviewer text records a local audit acknowledgement; it is not authenticated owner identity. Production internal access remains blocked pending proper authentication/authorization, audit identity and protected persistence.

## Model and line inputs

Each scenario carries stable `journeyId` plus slug, INR currency, name, adults, children, total travellers, rooms, configurable season label, validity dates and private notes. Saved records have ID, version, parent reference, original creation and revision timestamps, review state, owner acknowledgement and a read-only Journey snapshot. Calculation results retain category/line totals, contingency, commission, tax, cost/selling/profit metrics, confirmation rollup and warnings.

Seven arrays cover hotels, transport, meals, activities, permits, local services and miscellaneous costs. Lines have unique IDs, label, optional supplier/location, service date, quantity, unit, blank-or-entered unit cost, basis, dead km, vehicle, tax inclusion flag, notes, quote expiry, confirmation and optional/included flags. Supplements use explicit label × quantity × unit cost. They do not inherit traveller/room multipliers: enter the total count of extra beds, supplements, driver days, tolls, parking, state tax, permits, dead km-related surcharges, local/snow/union vehicles, mandatory charges, fuel, oxygen equipment or other actually supplied services. No supplier rates are prefilled.

- ROOM_NIGHT: room rate × scenario rooms × nights. Hotel rooms can also use PER_ROOM or an explicitly quantified fixed supplier total.
- PER_KM: supplier rate × (base km + dead km); other costs are explicit supplements.
- PER_DAY: daily supplier rate × days. FIXED_ROUTE/SUPPLIER_QUOTE/FIXED: quantity × entered total/rate (normally quantity 1 for a quote).
- PER_PERSON: entered quantity/meal occurrences × travellers × unit cost, then divide the final package only once.
- PER_ROOM: quantity × rooms × unit cost.
- INCLUDED_IN_HOTEL: meals only, linked to an included hotel, zero unit cost and no supplements; prevents a hotel-included meal from adding cost again.

Activities/local services default optional and excluded. Optional entries contribute only if the operator explicitly checks “Count in base package”; a warning then makes this visible. Pilgrimage pony/palki/helicopter/porter/shuttle and Ladakh permits/union vehicles/support are capabilities, not promised inclusions. Meal and activity names are configurable labels. Children count in the chosen traveller scenario; enter a fixed explicitly quantified adult/child split if different rates apply, rather than assuming discounts. Single occupancy, extra beds and child supplements are supported without predefined prices. Presets create independent 2/1, 4/2 and 6/3 adult/room scenarios; save-as-new preserves both scenarios.

## Formulas and money semantics

Amounts are INR, supplier line subtotals and category totals rounded to paise. Required selling amounts and per-person prices round upward to paise to avoid underpricing. Let B = included supplier base, K = B + contingency, f = fixed commission (otherwise zero), c = percentage commission fraction (otherwise zero), p = markup/margin fraction.

Contingency is fixed or B × percentage; default 0. Commission is a separate **deduction from pre-tax selling proceeds**, not markup or a supplier base percentage; default 0. Total internal cost = K + actual commission.

- MARKUP_ON_COST: required pre-tax selling S = (K × (1+p) + f) / (1-c).
- TARGET_GROSS_MARGIN: S = (K+f) / (1-p-c). Margin + percentage commission must be below 100%.
- ₹10,000 at 20% markup sells at ₹12,000; 20% target gross margin sells at ₹12,500.
- Gross profit = net revenue excluding tax − K − commission.
- Gross margin = gross profit / net revenue × 100; markup = gross profit / K × 100. Zero denominators show 0 rather than NaN.

Tax is configurable and disabled by default. Exclusive tax adds S × configured rate. Inclusive tax treats S as the tax-inclusive quote and extracts tax, reducing net proceeds and potentially the selected profit target; the UI warns explicitly. Commission is calculated on actual net revenue excluding tax. Tax-inclusive quotations can show losses; low margin/loss does not prevent draft saving. The engine makes no GST/accounting claim. Tax treatment must follow actual business registration and accounting advice.

Per-person = selling total / traveller count, upward to paise. Recommended rounding is configurable, defaults to UP_TO_999, and never lowers the required per-person amount:

- NONE: upward to the next paise if needed.
- NEAREST_100: ceiling to a multiple of 100 (despite its historical requested strategy name, never nearest downward).
- UP_TO_499: ceiling to the sequence 499, 999, 1499, 1999, … (₹500 becomes ₹999).
- UP_TO_999: ceiling to 999, 1999, 2999, … (₹999 stays ₹999; ₹999.01 becomes ₹1,999).
- Zero stays zero for every strategy.

The summary separately shows rounded scenario total and resulting profit. It does not automatically publish this recommendation as a customer price.

## Confirmation, review and price application

ESTIMATE is unresolved; QUOTED means received but not confirmed; CONFIRMED requires actual supplier confirmation. All lines roll up into confirmed/quoted/estimated counts; any estimate keeps the overall state ESTIMATE, any remaining quote keeps it QUOTED. No entries = EMPTY. Optional estimates also remain visible in this rollup. Missing amounts and nonconfirmed included entries block review. Expired quotes warn; expired included quotes and expired scenario validity block review, not draft saving. Nothing is deleted automatically.

Save draft → AWAITING_SUPPLIER_CONFIRMATION → READY_FOR_OWNER_REVIEW → OWNER_APPROVED. A fully confirmed, valid draft may go directly to review. Approval requires the exact saved ready-for-review revision, reviewer text and explicit acknowledgement. Edits/save create another DRAFT revision, clearing approval; stale version requests fail instead of overwriting history. Approved revisions remain immutable. Local lock/exclusive file creation serializes saves; a stale lock after a crashed process must be inspected locally before manual removal.

“Apply approved commercial price” is a **preview-only guarded action** in Phase 14. It requires OWNER_APPROVED, latest revision, `APPLY <slug>` confirmation, a draft Journey, exact unchanged source context, no current review/expiry blockers and a positive recommendation. It constructs only `{price: recommendedStartingPrice}` and reports execution disabled. There is no DB write executor. It cannot mutate status, slug, duration, itinerary or a published Journey price. Owner approval never means publication. This deliberate restriction satisfies Phase 14's build/test-only authorization; a future separately authorized implementation may execute a protected commercial update after safe admin authentication exists.

## First real supplier quote

1. Start the loopback server and choose the intended draft (for example Auli Tour). Read its duration, endpoints, itinerary and current status; supplier inputs start blank.
2. Name the scenario, select actual travellers/rooms, and enter the quote's season and effective dates.
3. Add a Hotels line with a real supplier's destination, ROOM_NIGHT basis, quoted nights, and actual room/night rate. Enter only explicitly quoted supplements, their total quantities and tax inclusion. Add quote expiry and factual notes; choose QUOTED until confirmed. Do not enter secrets or payment credentials.
4. Add real transport/meals/etc. quotes separately. Link hotel-included breakfast with INCLUDED_IN_HOTEL and zero cost. Keep excluded/optional services out of base. Do not use public cab selling rates as supplier rates.
5. Enter owner-chosen contingency, commission and markup or target margin; defaults are zero. Leave tax disabled until the actual treatment is agreed. Review the live totals and warnings.
6. Save draft locally and mark awaiting supplier confirmation. Obtain and record confirmations before requesting owner review. The owner acknowledges the saved revision; any price preview remains nonexecuting. No publication or public-price change is authorized in this phase.

## Synthetic demonstration and verification

`journeyCosting.fixture.ts` is explicitly DEMO / SYNTHETIC and imported only by tests. Hotel ₹2,000 × 1 room × 3 nights = ₹6,000; fixed transport ₹4,000; dinner ₹200 × 2 travellers × 3 = ₹1,200; optional ₹500 activity excluded. Base ₹11,200; 5% contingency ₹560; cost ₹11,760; 20% markup gives ₹14,112 total, ₹7,056/person, recommended ₹7,999/person. Unrounded gross profit ₹2,352, margin 16.67%, markup 20%. Rounded scenario total ₹15,998 and profit ₹4,238. Synthetic browser data is saved only to the local QA store, never MongoDB.

Focused tests exercise hotel supplements, transport bases, occupancy, mixed units, included meals, optional activities, permits, commission, tax, markup/margin, zero cost, invalid fields/numbers/dates/enums, expiry/confirmation, revisions/approval, protected public serialization and access checks. The browser harness verifies controls, save/reload, review, preview and overflow at 1440/390/320 widths. `verifyPhase14JourneyProtection.ts before|after` makes raw read-only DB queries (model indexing disabled), compares full Journey document fingerprints/prices, checks catalogue/sitemap, every draft page/API and production costing GET/POST denial. Local evidence lives under ignored `.tmp/phase14-qa`; the published summary is `docs/phase-14-journey-costing-verification.json`.

Production-derived supported drafts (12): `auli-tour`, `badrinath-yatra`, `dharamshala-mcleodganj-dalhousie-khajjiar-circuit`, `kashmir-winter-snow-tour`, `kedarnath-yatra`, `ladakh-hanle-tso-moriri-tour`, `leh-nubra-pangong-hanle-tour`, `leh-nubra-pangong-tour`, `leh-nubra-pangong-turtuk-tour`, `spiti-winter-expedition`, `srinagar-leh-ladakh-tour`, `uttarakhand-honeymoon-circuit`. The selector also shows published Journeys read-only; approved price previews reject published Journeys.
