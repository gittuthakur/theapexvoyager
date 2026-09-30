# Phase 2B — Draft Package Commercial Audit and Pricing Preparation

Audit date: 30 September 2026. Continues from Phase 2A commit `ea10477` (production: 17 Journey documents — 6 published, 11 draft). This is a read-only audit: no draft was published, no existing published Journey was modified, and no production database mutation occurred while producing this report.

## A. Scope and method

Inspected all 11 draft Journey records directly against `config/draftJourneys.config.ts` (the seed source of truth — content matches the live DB exactly, since Phase 2A's `scripts/seedDraftJourneys.ts` wrote from this file with no transformation beyond forcing `status: 'draft'`) and against `models/Journey.ts`'s schema, including its `pre('validate')` publish-readiness hook (a Journey cannot be saved as `status: 'published'` without a positive `price`, at least one `inclusion`, at least one `exclusion`, and an `image` — see Phase 1's report). No live Google/Mongo write beyond what Phase 2A already performed.

**Schema gap worth flagging up front:** `models/Journey.ts` has no field at all for pickup/drop text, hotel category description as a structured concept (only free-text `hotelCategoryDescription` and price-tiered `stayOptions`), meal plan, transport type, or occupancy/minimum-traveller count. Today these live only as prose inside `itinerary`/`inclusions`/`importantNotes` on the *live* 6 packages (e.g. `CHANDIGARH_PICKUP_NOTE` in `app/journeys/[slug]/page.tsx`'s per-slug SEO overrides) — there is no dedicated schema field the audit table below could check against. This is noted as a **model gap**, not a per-package content gap; no schema change was made this phase (not authorized, and not requested).

## B. Package readiness matrix

Every commercial field below reads "**NOT SET**" for every one of the 11 drafts — this is a byte-for-byte confirmation of Phase 2's own design (Part 4/6: never fabricate a placeholder), not 11 independent findings. Route, overnight plan, seasonal restrictions and important notes ARE populated with real, conservative content for all 11.

| Slug | Duration | Route & overnight plan | Pickup/drop | Hotel category | Meal plan | Transport type | Occupancy/min travellers | Inclusions | Exclusions | Permits/activities | Seasonal restrictions | Cancellation terms | Price status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `shimla-manali-tour-package` | 5N/6D | Chandigarh→Shimla (2N)→Manali (3N)→Chandigarh | NOT SET | NOT SET | NOT SET | NOT SET (itinerary says "drive," no vehicle class) | NOT SET | [] | [] | Rohtang/Atal Tunnel access noted as seasonal/permit-dependent, not structured | ✅ Present (conditional, snow/monsoon caveat) | Generic sitewide policy link only, no package-specific terms | NOT SET |
| `kinnaur-spiti-circuit` | 8N/9D | Shimla→Sangla(1N)→Kalpa(1N)→Tabo(1N)→Kaza(2N)→Manali, 9 days total | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | Inner-line permit need flagged narratively; not costed | ✅ Present (Kunzum Pass seasonal window explicitly caveated) | Generic sitewide policy link only | NOT SET |
| `kasol-kheerganga-tosh` | 4N/5D | Kasol→Tosh(day trip)→Kheerganga trek(1N)→Kasol | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | Trek guide "advisable," not included/costed | ✅ Present | Generic sitewide policy link only | NOT SET |
| `jibhi-tirthan-valley` | 3N/4D | Aut→Jibhi(2N)→Tirthan/Gushaini(1N) | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | None flagged (low-complexity route) | ✅ Present | Generic sitewide policy link only | NOT SET |
| `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` | 6N/7D | Dharamshala(2N)→McLeod Ganj day→Dalhousie(2N)→Khajjiar day | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | None | ✅ Present | Generic sitewide policy link only | NOT SET |
| `kashmir-family-tour` | 5N/6D | Srinagar(2N)→Gulmarg(1N)→Pahalgam(2N)→Srinagar | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | Gondola/houseboat availability flagged as seasonal, not costed | ✅ Present | Generic sitewide policy link only | NOT SET |
| `kashmir-pahalgam-gulmarg-sonamarg-tour` | 6N/7D | Srinagar(1N)→Sonamarg day→Pahalgam(2N)→Gulmarg(2N)→Srinagar | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | Sonamarg road access + Gondola flagged as seasonal | ✅ Present | Generic sitewide policy link only | NOT SET |
| `char-dham-yatra` | 9N/10D | Haridwar→Barkot→Yamunotri→Uttarkashi→Gangotri→Guptkashi→Kedarnath→Badrinath, 10 days | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | Kedarnath trek/helicopter access explicitly flagged as not guaranteed; yatra-season dates flagged as year-specific, not assumed | ✅ Present (strongest caveat of all 11 — official yatra season, closed in winter) | Generic sitewide policy link only | NOT SET |
| `kedarnath-badrinath-yatra` | 6N/7D | Haridwar→Guptkashi/Sonprayag→Kedarnath→Badrinath, 7 days | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | Same Kedarnath access caveat as Char Dham | ✅ Present | Generic sitewide policy link only | NOT SET |
| `nainital-corbett-mussoorie-tour` | 5N/6D | Nainital(2N)→Corbett/Ramnagar(1N)→Mussoorie(2N) | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | Corbett safari permit explicitly flagged as limited/not guaranteed | ✅ Present (Corbett monsoon closure) | Generic sitewide policy link only | NOT SET |
| `auli-chopta-tungnath-tour` | 5N/6D | Joshimath(1N)→Auli day→Chopta(3N)→Tungnath trek | NOT SET | NOT SET | NOT SET | NOT SET | NOT SET | [] | [] | Tungnath trail condition flagged, not costed | ✅ Present | Generic sitewide policy link only | NOT SET |

**Internal consistency check (duration vs. itinerary day count):** all 11 pass — every package's itinerary has exactly as many days as its stated duration's "D" number (e.g. 5N/6D → 6 itinerary days), matching the convention already used by the 6 live packages. No inconsistency found.

**Supplier inputs still required, common to all 11:** hotel/homestay rates per category per season, private-vehicle/transport-supplier rates by vehicle class, meal-plan cost (if any meals are to be included), permit fees where applicable (Spiti/Kinnaur inner-line, Corbett safari, Char Dham), activity/entry-ticket costs, and a per-package minimum-traveller/occupancy assumption to base per-person pricing on.

## C. Detected issues

### Duplicate/overlapping packages (all previously flagged in Phase 2, reconfirmed here)
- **`dharamshala-mcleodganj-dalhousie-khajjiar-circuit` vs. live `dharamshala-dalhousie-escape`** — same 3 real destination slugs already present on the live package (McLeod Ganj is already named in its highlights). Differentiation is pace/depth only. **Still requires your explicit go/no-go before any pricing work begins** — pricing a package you may decide not to publish would be wasted supplier-negotiation effort.
- **`kinnaur-spiti-circuit` vs. live `spiti-valley-adventure`** — shares the Kalpa→Tabo→Kaza→Manali backbone; differentiated by the added Sangla/Chitkul leg and longer duration. Legitimate, but real.

### SEO cannibalisation risk with the existing 6 published packages
- **`shimla-manali-tour-package` vs. live `himachal-himalayan-explorer`** — this overlap is the *intended fix* for the Phase 1 audit's redirect-intent-mismatch finding, not an accident. Once this draft is published, the `next.config.mjs` redirect must be repointed (documented in Phase 2's report, not yet done, not touched this phase) — until that happens, both pages will compete for "Shimla Manali package" search intent simultaneously.
- **`kashmir-family-tour` vs. `kashmir-pahalgam-gulmarg-sonamarg-tour`** (two drafts, not yet public) — both target Srinagar+Gulmarg+Pahalgam-adjacent search intent. Differentiated by scope (3 stops/paced vs. 4 stops/fuller circuit) in body copy, but their `<title>`/H1 metadata has not been written yet — when it is, make sure the two titles read as clearly distinct queries (e.g. "family" vs. "complete circuit") rather than near-identical strings, or they will cannibalise each other in search rather than the live Kashmir package.
- **`char-dham-yatra` vs. `kedarnath-badrinath-yatra`** — the shorter package is a deliberate 2-of-4-shrine subset of the longer one. Expect them to compete for "Kedarnath Badrinath package" search intent specifically; this is an accepted, by-design overlap (per the original Phase 2 brief's own framing), not a defect.

### Vague transport wording
All 11 drafts' itineraries use generic verbs ("drive," "travel," "scenic drive") with no vehicle class specified — consistent with Part 4's no-fabrication instruction (no transport supplier exists yet to name), but this is a real publish blocker: `transportOptions` is `[]` on every draft and the prose gives a future reader no concrete transport expectation either.

### Missing pickup/drop information
Confirmed absent on all 11 — the live packages that have this (e.g. Manali/Kashmir/Kinnaur-Spiti/Dharamshala) carry it as hand-authored, per-slug text in `app/journeys/[slug]/page.tsx`'s `JOURNEY_SEO_OVERRIDES` map, not a Journey schema field. None of the 11 drafts has an equivalent entry yet (correctly — they're not published, so no SEO-override entry should exist for them).

### Unsupported inclusions / unsafe or misleading claims
None found. `inclusions`/`exclusions` are `[]` on all 11 (nothing to be "unsupported"), and a manual re-read of every itinerary/`importantNotes` entry found consistent conditional language ("weather permitting," "subject to... availability," "not guaranteed on every date") with no absolute claim needing correction.

## D. Special review — the 4 named packages

**Naming note:** the request named `kinnaur-valley-tour-package`; no draft carries that exact slug. The actual Kinnaur-related draft from Phase 2 is `kinnaur-spiti-circuit`, reviewed below in its place.

- **`shimla-manali-tour-package`** — Lowest commercial complexity of the flagged four: no permits, no altitude/seasonal-closure risk beyond ordinary hill-road caveats, and the business already operates live packages independently covering both Manali (`manali-premium-escape`) and Shimla-adjacent routes (`himachal-himalayan-explorer`), meaning hotel/transport supplier relationships in both towns most likely already exist. Highest business priority of all 11 (fixes the Phase 1 redirect-intent mismatch). **Recommended for Phase 2C pricing first.**
- **`kinnaur-spiti-circuit`** — Highest commercial complexity of the four: high-altitude acclimatization risk, inner-line permit sourcing, remote-area supplier sourcing (Sangla/Chitkul/Tabo have thinner hotel markets than Shimla/Manali), and a hard seasonal window (Kunzum Pass). Real duplicate-overlap risk with the live Spiti package (above). Recommend pricing only after the live `spiti-valley-adventure`'s own supplier costs are confirmed as a reference baseline, given the shared backbone route.
- **`kasol-kheerganga-tosh`** — Moderate complexity: a real trek is involved (guide/safety planning needed before any "included" trek claim), but no permit/altitude-shrine complexity. Budget/youth positioning likely means thinner margins per booking, worth confirming the business wants this segment before investing supplier-negotiation time.
- **`dharamshala-mcleodganj-dalhousie-khajjiar-circuit`** — Commercial complexity is low (same towns as an existing live package, supplier relationships likely already exist), but **the duplicate-overlap decision (Section C) blocks pricing work entirely** until you confirm this should proceed as a distinct product rather than, say, a duration variant folded into the existing package instead.

## E. Pricing worksheet structure (formula only — no monetary values)

No price, cost, or rate exists in any verified source data for any of the 11 drafts, so none is inserted here, per instruction. The structure below is the same additive model requested, laid out as a per-package worksheet template to fill in once real supplier quotes exist:

| Cost component | Source of truth once available | Status for all 11 drafts |
|---|---|---|
| Hotel cost | Per-night, per-category supplier rate × nights × rooms (occupancy-dependent) | Not sourced |
| Transport cost | Per-vehicle-class supplier rate × route distance/days | Not sourced |
| Meals cost | Per-meal-plan supplier or in-house catering rate × pax × days (only if meals are to be included at all — not yet decided per package) | Not sourced |
| Activities/permits cost | Per-activity/entry-ticket/permit fee × pax (Spiti/Kinnaur inner-line, Corbett safari, Char Dham-specific fees) | Not sourced |
| Operational buffer | A company-set contingency percentage or flat amount (owner policy, not something this audit can set) | Not defined |
| Company margin | Owner-set target margin (business decision) | Not defined |
| Applicable tax | GST/other, per current company policy — same as `exclusions` language already used on live packages ("GST and applicable taxes") | Not defined |
| **Selling price** | **= Hotel + Transport + Meals + Activities/Permits + Operational buffer + Company margin + Applicable tax** | **NOT SET on every draft** |

This table is a structure, not a decision — every row needs an owner or supplier input before any number can be entered anywhere in the codebase (which would otherwise violate Part 4's no-fabrication rule and `models/Journey.ts`'s own publish-validation hook).

## F. Recommended publication order (top 3), with evidence

1. **`shimla-manali-tour-package`** — highest business priority (the Phase 1 redirect-mismatch fix) + lowest sourcing complexity (likely-existing Shimla/Manali supplier relationships) + no permit/seasonal-closure risk.
2. **`jibhi-tirthan-valley`** — shortest, simplest route of all 11 (2 stops, 3N/4D), no permits, no altitude risk, no trek-safety planning needed — fastest to source and price cleanly.
3. **`kashmir-family-tour`** — moderate complexity but the business already operates a live Kashmir package covering 2 of its 3 stops (Srinagar, Gulmarg), meaning only Pahalgam needs new supplier sourcing; also directly addresses the Phase 1 audit's own flagged gap ("no family/budget Kashmir variant exists").

Recommend holding `char-dham-yatra`, `kedarnath-badrinath-yatra`, `kinnaur-spiti-circuit`, and `auli-chopta-tungnath-tour` for a later batch — each carries genuine safety/permit/seasonal-access complexity that deserves more supplier-confirmation time before pricing, not because the content itself is deficient.

## G. Explicit confirmations

- No draft's `status` was changed — all 11 remain `draft` in the live database (spot-checked: unchanged from Phase 2A's confirmed 17 total / 6 published / 11 draft).
- No existing published Journey's price, content, or slug was modified.
- No commit, push, or deploy was performed this phase.
- No production database write of any kind occurred while producing this report (read-only inspection of `config/draftJourneys.config.ts` and the already-known live DB state from Phase 2A only).
- HBX/Hotelbeds, Google Places, Stays refresh, TTL migration, transport pricing rules, and the Shimla-Manali redirect were not touched.
