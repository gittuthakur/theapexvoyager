# Phase 9B — Exact two-Journey publication

## Authorized deployment

Reviewed and pushed only commit `4a19c434295c2c3de9f38acefade0dbc89ef3dc1`. HEAD and origin/main match. Its five files are the Phase-9A updater, its tests, and three intended Phase-9 reports/evidence files. No environment files, credentials, temporary files, unrelated changes, winter/Kinnaur mutations or publication changes were included.

[Vercel deployment CZo2yXXA7MZYfyj8MgVvYMDY7hmT](https://vercel.com/gittuthakur-1851s-projects/theapexvoyager-oc46/CZo2yXXA7MZYfyj8MgVvYMDY7hmT) reported success / completed before publication execution. Production alias: `https://www.theapexvoyager.in`.

Pre-publication regression passed on `/`, `/journeys`, `/destinations`, `/destinations/mcleod-ganj`, `/regions/himachal-pradesh`, `/sitemap.xml`, `/cancellation-policy`, and all 24 existing published Journey URLs.

## Publication gates

Exact allowlist: `dharamshala-mcleodganj-short-escape`, `grand-himachal-circuit`.

Both actual production records were draft, had only `OWNER_APPROVAL_REQUIRED`, matched all approved Phase-9A commercial fields, and had unchanged authored routes/durations and valid published Region/Destination dependencies. Dharamshala retains Pathankot pickup/drop and endingCity; Grand Himachal retains Chandigarh pickup, Dalhousie local drop, nine-night allocation and explicit long Day-6 transfer.

Images: `/images/destination-mcleod-ganj.jpg` and `/images/destination-dalhousie.jpg`. Both match related Destination records, exist locally, return production HTTP 200 image content and retain existing geographic/provenance verification. **2 valid / 0 broken**.

`scripts/publishPhase9BJourneys.ts` follows the established publication workflow: dry-run default, exact allowlist, real document `validate()` with published status in memory, transactional re-read of complete records, native status-only update, and whole-catalogue postchecks. No commercial field or timestamp is rewritten. Execution additionally requires the deployment-ready acknowledgement after actual deployment verification.

Preflight: **2 would publish / 0 already published / 0 refused**.

## Validation

- Focused publication tests: **2 passed**; reject every other draft slug and validate both complete/incomplete documents using the real publication hook.
- Full suite: **98 files / 1,246 tests passed**.
- Typecheck: **PASS**, `tsc --noEmit --incremental false`.
- ESLint on the two new files: **PASS**.
- Build: **PASS**, 41 static pages generated.
- Local broad checks include the pre-existing working tree. Only the authorized commit was pushed/deployed; unrelated local files remain excluded.

## Final results

Publication completed: **2 published / 0 skipped / 0 refused**. Actual production totals: **40 total / 26 published / 14 draft**. A follow-up dry run returned **0 would publish / 2 already published / 0 refused**.

Whole-document comparisons proved that only the two authorized status fields changed. All 38 other Journeys, every Destination and every Region remained unchanged, including timestamps. The existing 24 published Journeys all return HTTP 200 with unchanged prices, commercial data and images.

| Published Journey | HTTP | Starting From, per person | Pickup/drop | Image |
| --- | --- | --- | --- | --- |
| Dharamshala McLeod Ganj Short Escape | 200 | INR 10,999 | Pathankot / Pathankot; endingCity Pathankot | destination-mcleod-ganj.jpg |
| Grand Himachal Circuit | 200 | INR 29,999 | Chandigarh / Dalhousie local drop | destination-dalhousie.jpg |

Actual desktop and 320px browser checks passed for titles, durations, indicative price disclaimers, per-person qualifiers, exact images, pickup/drop, accommodation, meals, transport, inclusions, exclusions, important notes and all day-wise itinerary text. Grand Himachal's long Day-6 Manali-to-Dharamshala transfer remains explicit. Both itineraries are unchanged.

Both pages have Product/AggregateOffer with lowPrice equal to the visible price, matching BreadcrumbList and working desktop/mobile breadcrumbs. No fabricated review/rating, availability, discount, priceValidUntil or inventory fields were found. Both records have no FAQs and neither page emits FAQPage.

Public API/catalogue: **26**. Actual pagination across three pages exposes all 26. Sitemap: **26 unique Journey URLs**, all HTTP 200. Related published Region/Destination relationships passed after the destination page cache refreshed.

All **14 draft URLs return genuine HTTP 404** and are absent from public catalogue and sitemap. Kinnaur remains draft with no production price or itinerary change. The three winter products remain unchanged drafts with no prices or images. Ladakh remains one draft Region, eight draft Destinations and five draft Journeys, with no public leak. Uttarakhand and other held records remain unchanged.

HBX, Google Places, PlaceCache and transport pricing were untouched by this phase. IndexNow remains deferred.

Evidence: [phase-9b-verification.json](phase-9b-verification.json).

## Search Console

**READY FOR SEARCH CONSOLE SUBMISSION** ? both return HTTP 200, are indexable, use self-referencing canonical URLs and appear in the sitemap:

- https://www.theapexvoyager.in/journeys/dharamshala-mcleodganj-short-escape
- https://www.theapexvoyager.in/journeys/grand-himachal-circuit

No Search Console submission or Google indexing claim. IndexNow remains deferred.

## Repository scope

Phase-9B publication tooling/tests and this report remain local so HEAD and origin/main stay at the specifically authorized `4a19c43`. No further commit/deployment is introduced. No HBX, Google Places, PlaceCache, transport-pricing or application rendering changes.
