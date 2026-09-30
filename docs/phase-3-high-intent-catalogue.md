# Phase 3 — High-Intent Himalayan Package Catalogue Expansion

Continues from Phase 2C. No draft published, no existing published Journey modified, Shimla-Manali redirect untouched, no commit/push/deploy, no production database mutation.

## Baseline (Part 0)

Verified read-only against the live database: **17 Journey documents — 6 published, 11 draft**, matching Phase 2A/2B/2C exactly, no drift. Ladakh verified absent from both the live database and `config/destinations.config.ts`/`config/regions.config.ts` (only incidental mentions of "Ladakh"/"Leh" inside Kashmir destinations' own prose — e.g. Gulmarg's "views into Ladakh," Sonamarg's "Srinagar–Leh road" — no actual Region or Destination document). HBX/Hotelbeds/Meta-Pixel/CSS uncommitted work confirmed byte-identical to the original baseline throughout (diff-stat check repeated at the end of this phase, unchanged).

## Master table

*(Abbreviations: HP = Himachal Pradesh, JK = Jammu & Kashmir, UK = Uttarakhand. "Price approval" — ✅ = owner-approved this phase, — = not set, no price exists.)*

| Region | Package | Slug | Duration | Primary search intent | Existing/New | Duplicate status | Price | Price approval | Commercial blockers | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| HP | Manali Premium Escape | `manali-premium-escape` | 5D/4N | "Manali tour package" | Existing | — | ₹12,999 | ✅ (Phase 1) | none | **Published** |
| HP | Kashmir Paradise | `kashmir-signature-journey` | 6D/5N | "Kashmir tour package" | Existing | — | ₹24,999 | ✅ (Phase 1) | none | **Published** |
| HP | Spiti Circuit Expedition | `spiti-valley-adventure` | 7D/6N | "Spiti valley package" | Existing | — | ₹18,999 | ✅ (Phase 1) | none | **Published** |
| HP | Honeymoon in Hills | `himachal-himalayan-explorer` | 8D/7N | "Himachal honeymoon package" | Existing | — | ₹22,999 | ✅ (Phase 1) | none | **Published** |
| HP | Himachal Family Escape | `dharamshala-dalhousie-escape` | 5D/4N | "Dharamshala Dalhousie package" | Existing | — | ₹15,999 | ✅ (Phase 1) | none | **Published** |
| UK | Uttarakhand Explorer | `uttarakhand-explorer` | 6D/5N | "Rishikesh Haridwar Mussoorie package" | Existing | — | ₹20,999 | ✅ (Phase 1) | none | **Published** |
| HP | Shimla Manali Tour Package | `shimla-manali-tour-package` | 5N/6D | "Shimla Manali tour package" | Existing draft, reused | — | ₹13,999 | ✅ (Phase 3) | hotel/transport/meal/occupancy plan | Draft |
| HP | Kinnaur Spiti Circuit | `kinnaur-spiti-circuit` | 8N/9D | "Kinnaur Spiti circuit" | Existing draft, reused | Overlaps live Spiti package (documented Phase 1/2) | ₹21,999 | ✅ (Phase 3) | same as above | Draft |
| HP | Kasol Kheerganga Tosh | `kasol-kheerganga-tosh` | 4N/5D | "Kasol Kheerganga trek package" | Existing draft, reused | — | ₹9,999 | ✅ (Phase 3) | same as above | Draft |
| HP | Jibhi Tirthan Valley | `jibhi-tirthan-valley` | 3N/4D | "Jibhi Tirthan Valley package" | Existing draft, reused | — | ₹11,999 | ✅ (Phase 3) | same as above | Draft |
| HP | Dharamshala McLeodganj Dalhousie Khajjiar Circuit | `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` | 6N/7D | "Dharamshala Dalhousie 7 day package" | Existing draft, reused | **ON HOLD — meaningful overlap with live Family Escape** | — | Not set (on hold) | pricing decision blocked by overlap | Draft (on hold) |
| JK | Kashmir Family Tour | `kashmir-family-tour` | 5N/6D | "Kashmir family package" | Existing draft, reused | — | ₹14,999 | ✅ (Phase 3) | hotel/transport/meal/occupancy plan | Draft |
| JK | Kashmir Pahalgam Gulmarg Sonamarg Tour | `kashmir-pahalgam-gulmarg-sonamarg-tour` | 6N/7D | "Kashmir complete tour package" | Existing draft, reused | — | ₹18,999 | ✅ (Phase 3) | same as above | Draft |
| UK | Char Dham Yatra | `char-dham-yatra` | 9N/10D | "Char Dham Yatra package" | Existing draft, reused | — | ₹19,999 | ✅ (Phase 3) | same as above | Draft |
| UK | Kedarnath Badrinath Yatra | `kedarnath-badrinath-yatra` | 6N/7D | "Kedarnath Badrinath package" | Existing draft, reused | — | ₹14,999 | ✅ (Phase 3) | same as above | Draft |
| UK | Nainital Corbett Mussoorie Tour | `nainital-corbett-mussoorie-tour` | 5N/6D | "Nainital Corbett Mussoorie package" | Existing draft, reused | — | ₹15,999 | ✅ (Phase 3) | same as above | Draft |
| UK | Auli Chopta Tungnath Tour | `auli-chopta-tungnath-tour` | 5N/6D | "Auli Chopta Tungnath package" | Existing draft, reused | — | ₹16,999 | ✅ (Phase 3) | same as above | Draft |
| HP | Shimla Short Escape | `shimla-short-escape` | 2N/3D | "Shimla weekend package" | **New** | — | — | — | price, hotel, transport, meals, occupancy, inclusions, exclusions | Draft |
| HP | Manali Short Escape | `manali-short-escape` | 3N/4D | "Manali weekend package" | **New** | — | — | — | same | Draft |
| HP | Kinnaur Valley Tour | `kinnaur-valley-tour` | 6N/7D | "Kinnaur valley tour package" | **New** | Adjacent to Kinnaur Spiti Circuit (Spiti-free alternative) | — | — | same | Draft |
| HP | Spiti Winter Expedition | `spiti-winter-expedition` | 6N/7D | "Spiti winter tour" | **New** | — | — | — | same | Draft |
| HP | Kasol Manikaran Weekend | `kasol-manikaran-weekend` | 2N/3D | "Kasol Manikaran weekend" | **New** | — | — | — | same | Draft |
| HP | Dharamshala McLeodganj Short Escape | `dharamshala-mcleodganj-short-escape` | 3N/4D | "Dharamshala McLeod Ganj short trip" | **New** | — | — | — | same | Draft |
| HP | Dalhousie Khajjiar Chamba | `dalhousie-khajjiar-chamba` | 4N/5D | "Dalhousie Chamba package" | **New** | — | — | — | same | Draft |
| HP | Bir Billing Palampur | `bir-billing-palampur` | 3N/4D | "Bir Billing paragliding package" | **New** | — | — | — | same | Draft |
| HP | Grand Himachal Circuit | `grand-himachal-circuit` | 9N/10D | "complete Himachal tour package" | **New** | — | — | — | same | Draft |
| JK | Kashmir Winter Snow Tour | `kashmir-winter-snow-tour` | 4N/5D | "Kashmir snow tour" | **New** | — | — | — | same | Draft |
| JK | Gulmarg Winter Escape | `gulmarg-winter-escape` | 3N/4D | "Gulmarg skiing package" | **New** | Adjacent to Kashmir Winter Snow Tour (Gulmarg-only subset) | — | — | same | Draft |
| UK | Kedarnath Yatra | `kedarnath-yatra` | 4N/5D | "Kedarnath yatra package" | **New** | Subset of Kedarnath Badrinath Yatra / Char Dham (by design) | — | — | same | Draft |
| UK | Badrinath Yatra | `badrinath-yatra` | 3N/4D | "Badrinath yatra package" | **New** | Subset of Kedarnath Badrinath Yatra / Char Dham (by design) | — | — | same | Draft |
| UK | Mussoorie Weekend | `mussoorie-weekend` | 2N/3D | "Mussoorie weekend package" | **New** | — | — | — | same | Draft |
| UK | Auli Tour | `auli-tour` | 3N/4D | "Auli tour package" | **New** | Adjacent to Auli Chopta Tungnath Tour (Auli-only subset) | — | — | same | Draft |
| UK | Valley of Flowers Hemkund Sahib Trek | `valley-of-flowers-hemkund-sahib-trek` | 5N/6D | "Valley of Flowers trek package" | **New** | — | — | — | same | Draft |
| UK | Rishikesh Adventure Package | `rishikesh-adventure-package` | 3N/4D | "Rishikesh rafting package" | **New** | — | — | — | same | Draft |
| UK | Uttarakhand Honeymoon Circuit | `uttarakhand-honeymoon-circuit` | 4N/5D | "Uttarakhand honeymoon package" | **New** | — | — | — | same | Draft |

## 1. Existing production packages preserved
All 6 — verified unchanged (`config/packages.config.test.ts`, still passing).

## 2. Existing drafts reused
11 (unchanged content, 10 of them newly priced — see §6). `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` remains on hold, untouched, unpriced.

## 3. New drafts proposed/created
18 (9 Himachal, 2 Kashmir, 7 Uttarakhand), all `status: 'draft'`, all `price` unset.

## 4. Duplicates rejected

| Proposed | Rejected because |
|---|---|
| Shimla Manali Honeymoon | Same core stops + intent as live `himachal-himalayan-explorer` |
| Manali Couple/Honeymoon (4N/5D) | Same duration/destination as live `manali-premium-escape`, audience-only differentiation |
| Manali Family Tour (4N/5D) | Same duration/destination as live `manali-premium-escape`, audience-only differentiation |
| Jibhi Jalori Pass Serolsar Lake (3N/4D) | Same duration as existing `jibhi-tirthan-valley` draft, geographically overlapping — recommend enriching that draft instead |
| Kashmir Honeymoon (5N/6D) | Same duration/destinations as live `kashmir-signature-journey` |
| Srinagar Gulmarg Pahalgam (4N/5D) | Same 3 destinations as existing `kashmir-family-tour` draft, 1 night shorter only |
| Srinagar Gulmarg Pahalgam Sonamarg (5N/6D) | Same 4 destinations as existing `kashmir-pahalgam-gulmarg-sonamarg-tour` draft, 1 night shorter only |
| Kashmir + Gurez Valley | No `gurez` destinationSlug exists — not invented |
| Kashmir + Doodhpathri | No `doodhpathri` destinationSlug exists — not invented |
| Kashmir + Yusmarg | No `yusmarg` destinationSlug exists — not invented |
| Haridwar Rishikesh Mussoorie (4N/5D) | Same 3 destinations as live `uttarakhand-explorer`, 1 night shorter only |
| Nainital Corbett (4N/5D) | Subset of existing `nainital-corbett-mussoorie-tour` draft |
| Rishikesh + Haridwar (standalone) | Subset of live `uttarakhand-explorer`, no independent content |
| Himachal + Amritsar Grand Circuit | Amritsar has no curated Destination in this app and sits outside the business's 3 stated regions — out of scope, not invented |

**Deferred (not rejected as duplicates — good ideas, held back to keep this phase's scope deliberate rather than maximal):** Sangla Chitkul Kalpa Escape, Bir Billing Adventure Weekend, the 6-stop Chamba-Dalhousie-Khajjiar-Dharamshala-Palampur-Bir circuit, a standalone Kedarnath+Chopta/Tungnath combination, a standalone Chopta-Tungnath-Chandrashila trek package. Each is individually defensible; recommend revisiting in a future phase once the current 18 are reviewed.

## 5. Ladakh Region/Destination work required (Part 5)

**Verified: no Ladakh Region or Destination exists** in the live database or config. Per the brief's own instruction, no destinationSlug was invented and no Journey draft was created for Ladakh this phase — that curation must happen first. What it needs, concretely:

- **Region**: a new `config/regions.config.ts` entry (id/slug `ladakh`), matching the shape already used for Himachal Pradesh/Jammu & Kashmir/Uttarakhand — name, description, image, and the Region Hub fields `scripts/seed.ts` populates (hero, overview, travelGuide, SEO), all real (non-fabricated) copy.
- **Destinations** (`config/destinations.config.ts`), each needing the same full field set every existing destination has (title, category, description, editorialDescription, bestTime, idealDuration, highlights, places, experiences, relatedSlugs, seo, apexPicks, accessType where relevant): **Leh** (the hub), **Nubra Valley**, **Pangong Lake**, **Khardung La**, **Turtuk**, **Hanle**, **Tso Moriri**, **Kargil**, **Lamayuru** — only create the ones with genuine, verifiable content; do not pad the list to match the brief's full candidate set if some can't be written honestly.
- **Stay-location rule** (`config/stayLocations.config.ts`) for each new destination, following the existing `STAY_LOCATION_RULES` convention.
- Only after that exists should Ladakh Journey drafts (Leh-Nubra-Pangong circuits, a Manali-Leh or Srinagar-Kargil-Leh overland route, a Ladakh Family/Honeymoon/Bike variant) be authored — each with **explicit acclimatisation planning** (no itinerary may send a traveller from the airport directly to Pangong/Nubra without at least one full rest day in Leh first, per the brief's own high-altitude safety instruction) and conservative permit-requirement language.

Recommend this as its own dedicated phase rather than an addendum here — writing 9 destinations' worth of accurate geographic/seasonal/permit content deserves focused attention, not a rushed pass inside an already-large catalogue expansion.

## 6. Pricing status
10 of the 11 Phase 2 drafts now carry the exact owner-approved indicative starting price from the brief — verified by test (`config/draftJourneys.config.test.ts`) to match precisely, with no value inferred onto any other package. `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` and all 18 new Phase 3 drafts remain unpriced. The reusable disclaimer text (Part 7) now lives at `lib/journeyPriceDisplay.ts`'s `JOURNEY_PRICE_DISCLAIMER` — not wired into any page (nothing using it is published).

## 7. Destination-slug validation
Every `destinationSlugs` entry across all 29 drafts verified (by test) to resolve to a real, curated destination and to belong to one of the business's 3 known states — zero invented slugs.

## 8. SEO cannibalisation findings
Deliberate, by-design overlaps (documented in the duplicate table above, not treated as defects): Kedarnath Yatra / Kedarnath Badrinath Yatra / Char Dham Yatra share the Kedarnath leg; Gulmarg Winter Escape is a subset of Kashmir Winter Snow Tour; Auli Tour is a subset of Auli Chopta Tungnath Tour; Kinnaur Valley Tour is adjacent to Kinnaur Spiti Circuit. Each pair/trio is differentiated by real scope or duration, but all draw on the same core keywords — worth clear, distinct page titles once these move toward publication so search engines don't see them as near-identical.

## 9. Changed files
**New:** `docs/phase-3-high-intent-catalogue.md`.
**Modified:** `config/draftJourneys.config.ts` (10 prices added, 18 new drafts appended), `config/draftJourneys.config.test.ts` (rewritten for Phase 3), `lib/journeyPriceDisplay.ts` (+disclaimer constant), `lib/journeyPriceDisplay.test.ts` (+disclaimer test).

## 10. Tests/typecheck/lint/build
Full suite: **1,108 tests / 84 files, all passing** (7 new tests this phase, plus the 13-test rewrite of `draftJourneys.config.test.ts` — including automated verification that every one of the 29 drafts' itinerary day-counts match their stated durations). `tsc --noEmit` clean. `eslint` on every changed file: 0 errors. `next build` succeeds, no new routes.

## 11. DB operations performed
**NONE.** All work this phase is local/uncommitted config + test changes. `scripts/seedDraftJourneys.ts` was run in **dry-run only** (read-only against the live database) to verify it would correctly recognize the 11 existing drafts and propose creating the 18 new ones with zero conflicts — confirmed, but `--execute` was never invoked.

## 12. HBX untouched
✅ Confirmed — diff-stat identical to the Phase 0 baseline.

## 13. Google Places untouched
✅ Confirmed — zero uncommitted changes to any Places/Stays/TTL/cron file.
