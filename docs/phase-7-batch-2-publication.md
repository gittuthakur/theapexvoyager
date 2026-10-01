# Phase 7 — Batch 2 controlled publication

## Deployment

- Authorized follow-up commit: `ed1e82b806eaa321ea5c47e3f6d044e5d2c22c3a`.
- At Phase-7 completion, local HEAD and origin/main both matched that commit.
- Vercel: [deployment B1RqzPrA9amPnyQzZdy9hWgPwzSo](https://vercel.com/gittuthakur-1851s-projects/theapexvoyager-oc46/B1RqzPrA9amPnyQzZdy9hWgPwzSo), successful / Ready.
- Production alias: https://www.theapexvoyager.in.

## Pre-publication gates

All passed against actual production records on 2026-10-01:

- Homepage, /journeys, /destinations, /sitemap.xml, /cancellation-policy and all 16 existing Journey pages return HTTP 200.
- All eight targets are draft, with approved prices and commercial fields matching the final Phase 6 configuration.
- Each has occupancy 2 adults / 1 room, meals, pickup/drop, transport, accommodation, inclusions/exclusions and confirmed general cancellation policy.
- Only OWNER_APPROVAL_REQUIRED remains on each.
- Images match real related Destination records, exist locally and return HTTP 200 with image content.
- All destinationSlugs resolve to published Destinations with the expected published Region.
- Day-wise itineraries and durations match the approved configuration.
- The real Journey document pre-validate hook passes with each candidate set to published in memory.

## SEO differentiation

| New Journey | Existing comparison | Finding |
|---|---|---|
| Shimla Short Escape | Shimla Manali Tour Package / Honeymoon in Hills | PASS: 3-day single-destination stay versus multi-stop circuits |
| Manali Short Escape | Manali Premium Escape | PASS: 4-day sightseeing route versus 5-day premium adventure route with an additional Rohtang/Kasol excursion day |
| Kasol Manikaran Weekend | Kasol Kheerganga Tosh | PASS: 3-day non-trekking Manikaran visit versus 5-day Tosh/Kheerganga trek |
| Dalhousie Khajjiar Chamba | Himachal Family Escape | PASS: Chamba extension replaces the live route's Dharamshala anchor |
| Bir Billing Palampur | Existing Himachal Journeys | PASS: new Bir/Palampur route; paid paragliding remains excluded |
| Mussoorie Weekend | Uttarakhand Explorer / Nainital Corbett Mussoorie | PASS: 3-day single-stop stay versus 6-day multi-stop routes |
| Valley of Flowers Hemkund Sahib | Char Dham / Kedarnath Badrinath | PASS: dedicated two-trek itinerary from Joshimath, different destinations and structure |
| Rishikesh Adventure | Uttarakhand Explorer | PASS: 4-day single-destination activity trip versus 6-day Haridwar/Rishikesh/Mussoorie circuit; the live circuit also has an adventure day, but its overall route and purpose differ |

Ordinary destination overlap was not treated as duplication. No itinerary, price, activity inclusion or SEO copy was rewritten for publication.

## Publication workflow

Local script: `scripts/publishSecondJourneyBatch.ts`.

- Dry-run by default; execution requires --execute and --deployment-ready.
- Exact allowlist of eight slugs; unknown arguments/slugs refused.
- Every candidate undergoes document-level validation before mutation.
- A transaction re-reads each candidate and refuses concurrent edits.
- The only write is `$set: { status: 'published' }`; native single-field updates preserve timestamps and all other data.
- Complete before/after checks verify status-only changes and unchanged non-target Journeys, Destinations and Regions.
- Already published records are skipped, making execution idempotent.

Dry-run result: **8 would publish / 0 already published / 0 refused**.

Execution completed after direct in-conversation owner approval: **8 published / 0 skipped / 0 refused**. Re-query confirmed **40 total / 24 published / 16 draft**. Complete before/after comparison confirmed only the eight status fields changed; all prices, commercial content, images, references, itineraries, duration, SEO fields and timestamps remained unchanged. All non-target Journey, Destination and Region documents remained unchanged.

## Tests

- Focused publication and Batch-2 tests: 21 passed.
- Full suite: 96 files, 1,240 tests passed.
- Typecheck: passed (`tsc --noEmit --incremental false`).
- ESLint on new publication script and tests: passed.
- Production build: passed; 41 static pages generated.

## Scope

Existing 16 commercial records, other drafts, Ladakh, HBX, Google Places, PlaceCache and transport pricing are outside the publication mutation scope. IndexNow remains DEFERRED.

At Phase-7 completion, the publication script/tests and this report remained local, preserving the requested HEAD == origin/main == ed1e82b. Phase 8 preserves these four artifacts in a housekeeping commit; its deployment and regression results are recorded separately in `docs/phase-8-winter-batch-3-readiness.md`.

## Post-publication verification

Publication executed successfully. Live verification passed for all 24 sitemap URLs, public API/catalogue counts, every remaining draft URL, Region and Destination relationships, Ladakh isolation, and rendered content/price/schema/breadcrumb/image checks on all eight new pages at desktop and 320px widths.


## Catalogue discoverability

The public Journey API contains 24 published records. Headless Edge visited all three catalogue result pages using the actual pagination controls and found all 24 published Journey cards. No published Journey is missing due to pagination.

## Post-publication idempotency

A read-only rerun found **0 would publish / 8 already published / 0 refused**. All eight actual production records have zero commercial blockers after publication. Global counts remain 40 / 24 / 16.

## Remaining draft isolation

All 16 remaining draft Journey URLs return genuine 404s and are absent from the public API, catalogue and sitemap. Ladakh remains a draft Region, with its eight known Destinations and five Journeys still draft. The Destination records use their existing Ladakh state field and do not have regionId; isolation was verified by their exact slugs rather than assuming that reference exists. No Ladakh Region or Destination links appear on the homepage, Destination catalogue or sitemap. No Ladakh record was modified.

## Final live verification

- New Journeys: 8/8 return HTTP 200 with correct canonical URLs, titles and durations.
- All eight hero images render successfully and match their approved curated image paths.
- Exact Starting From prices, per-person qualifiers and the approved disclaimer are visible.
- Pickup, drop, meals, transport, every inclusion/exclusion and every important note match the stored approved values.
- Visible breadcrumbs match BreadcrumbList, without self-links or overflow at desktop (1280px) and 320px. A representative existing Journey also passes both widths.
- Product/AggregateOffer lowPrice matches the visible price on all eight. No fabricated Review, AggregateRating, availability, discount, priceValidUntil or inventory fields; no FAQPage without corresponding FAQs.
- Activity exclusions and safety caveats are retained: no silently included Rohtang/local-union/snow activities, paragliding, rafting/bungee, porter/pony/palki, helicopter or trekking equipment; no trail/weather/flowering/fitness/access guarantees.
- Public Journey API/catalogue: 24 published, zero draft. All 24 cards found across the three rendered pagination pages.
- Sitemap: exactly 24 unique canonical Journey URLs, all direct HTTP 200; no draft URLs or unexpected redirects.
- Region relationships: correct published Journey sets for Himachal Pradesh, Kashmir and Uttarakhand; five new Himachal and three new Uttarakhand relationships.
- Destination relationships: all 12 relevant Destination API graphs and rendered pages expose the correct related Journeys, with no draft relationships.
- Destination pages use the existing 300-second ISR cache; initially stale pages refreshed naturally and then passed link checks. No cache configuration or application code was changed.
- Remaining drafts: all 16 direct URLs verified as genuine 404 and absent from catalogue/sitemap.
- Ladakh: Region draft, eight exact Destination URLs 404, five Journeys draft/404, no public discovery leaks.
- Existing 16 regression: all remain HTTP 200, all complete database records unchanged (including prices and commercial data).
- Other drafts, Destinations and Regions: complete before/after comparison unchanged.
- IndexNow: DEFERRED; no submission, key or configuration. HBX, Google Places, PlaceCache and transport pricing untouched by this work.

Detailed machine-readable checks: [phase-7-batch-2-verification.json](phase-7-batch-2-verification.json).

## Search Console submission list

**READY FOR SEARCH CONSOLE SUBMISSION**. No search submission was made and Google indexing has not been independently verified.

```text
https://www.theapexvoyager.in/journeys/shimla-short-escape
https://www.theapexvoyager.in/journeys/manali-short-escape
https://www.theapexvoyager.in/journeys/kasol-manikaran-weekend
https://www.theapexvoyager.in/journeys/dalhousie-khajjiar-chamba
https://www.theapexvoyager.in/journeys/bir-billing-palampur
https://www.theapexvoyager.in/journeys/mussoorie-weekend
https://www.theapexvoyager.in/journeys/valley-of-flowers-hemkund-sahib-trek
https://www.theapexvoyager.in/journeys/rishikesh-adventure-package
```
