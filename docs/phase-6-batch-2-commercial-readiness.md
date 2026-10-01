# Phase 6 — Batch 2 commercial readiness

## Status and evidence

Audit date: 2026-10-01. Commit `8619fba` was explicitly authorized, pushed to origin/main and deployed successfully by Vercel: [deployment 9yVAhmdi8LLQhkMumkaydxidffzV](https://vercel.com/gittuthakur-1851s-projects/theapexvoyager-oc46/9yVAhmdi8LLQhkMumkaydxidffzV). Production alias: https://www.theapexvoyager.in.

The owner supplied final commercial decisions for all eight and separately authorized correcting the trek's startingCity/endingCity to Joshimath and removing obsolete pending-decision notes. These decisions match the actual day-wise itineraries. No itinerary or status change is authorized or made.

Before mutation, production verification found **40 Journeys: 16 published, 24 draft**. All eight targets returned genuine HTTP 404 and were absent from the catalogue, sitemap and public Region pages. All 16 published pages returned 200 with matching Product/AggregateOffer prices and visible breadcrumbs. All eight curated image URLs returned image content with HTTP 200.

Final production execution results are recorded below.

## Commercial matrix

All prices are **indicative, per person onwards**. Occupancy is 2 adults, double sharing, 1 room (`minTravellers = 2`, `roomsIncluded = 1`). No hotel is named or guaranteed. A material accommodation category change must be disclosed in the final quotation before booking confirmation.

| Package | Duration | Price | Occupancy | Accommodation | Meals | Transport | Pickup | Drop | Image source/path | Region | Inclusions | Exclusions | Remaining blocker | Ready for publication approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Shimla Short Escape | 2N/3D | ₹7,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Private cab, approved road sectors | Chandigarh | Chandigarh | Shimla: `/images/destination-shimla.jpg` | HP | 2 nights, meals, stated transfers/sightseeing | Air/train, personal, entry, optional Kufri, union/restricted transport, unlisted services | OWNER_APPROVAL_REQUIRED | Yes, for owner review |
| Manali Short Escape | 3N/4D | ₹8,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Private cab, approved road sectors | Chandigarh | Chandigarh | Manali: `/images/destination-manali.jpg` | HP | 3 nights, meals, stated transfers, Solang excursion transport | Air/train, personal, entry, Rohtang/Atal Tunnel, union/restricted vehicles, snow/adventure activities, unlisted services | OWNER_APPROVAL_REQUIRED | Yes, for owner review |
| Kasol Manikaran Weekend | 2N/3D | ₹6,999 | 2/1 | Standard hotel/guesthouse or equivalent | Breakfast + dinner at hotel | Shared/package-dependent | Bhuntar | Bhuntar | Kasol: `/images/destination-kasol.jpg` | HP | 2 nights, meals, Bhuntar transfers, Manikaran day trip | Air/train, personal, entry/donations, adventure activities, unlisted services | OWNER_APPROVAL_REQUIRED | Yes, for owner review |
| Dalhousie Khajjiar Chamba | 4N/5D | ₹10,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Private cab, approved road sectors | Pathankot | Chamba | Dalhousie: `/images/destination-dalhousie.jpg` | HP | 4 nights, meals, one-way transfers/sightseeing | Air/train, personal, entry, onward Chamba transfers unless quoted, unlisted services | OWNER_APPROVAL_REQUIRED | Yes, for owner review |
| Bir Billing Palampur | 3N/4D | ₹9,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Private cab, approved road sectors | Dharamshala | Palampur | Bir Billing: `/images/destination-bir-billing.jpg` | HP | 3 nights, meals, one-way transfers/sightseeing | Air/train, personal, entry, paragliding, Palampur–Dharamshala return, unlisted services | OWNER_APPROVAL_REQUIRED | Yes, for owner review |
| Mussoorie Weekend | 2N/3D | ₹7,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Private cab, approved road sectors | Dehradun | Dehradun | Mussoorie: `/images/destination-mussoorie.jpg` | UK | 2 nights, meals, stated transfers/sightseeing | Air/train, personal, entry, unlisted services | OWNER_APPROVAL_REQUIRED | Yes, for owner review |
| Valley of Flowers / Hemkund Sahib | 5N/6D | ₹12,999 | 2/1 | Joshimath standard hotel/guesthouse; Ghangaria basic trek lodge | Breakfast + dinner at lodging; trek-day meals not implied | Joshimath–Govindghat road sectors; onward trekking on foot | Joshimath | Joshimath | Hemkund Sahib: `/images/destination-hemkund-sahib.jpg` | UK | 5 nights, stated lodging meals, Joshimath pickup/drop, road transfer | Air/train, personal, other-city transfers, park fees, guide/porter/pony/palki, helicopter, personal equipment, unlisted services | OWNER_APPROVAL_REQUIRED | Yes, for owner review |
| Rishikesh Adventure | 3N/4D | ₹8,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Private/package road transfers | Dehradun | Dehradun | Rishikesh: `/images/destination-rishikesh.jpg` | UK | 3 nights, meals, stated pickup/drop | Air/train, personal, rafting, bungee, camping/adventure activities, entry, unlisted services | OWNER_APPROVAL_REQUIRED | Yes, for owner review |

Five packages have owner-approved private cabs for the stated road sectors, excluding restricted/local-union services and paid activities unless explicitly listed. Rishikesh uses private/package road transfers; rafting, bungee, camping and other paid activities remain excluded. Kasol remains shared/package-dependent. Ordinary destination overlap is not a blocker.

Preserved disclaimer:

> Starting price is indicative and based on selected occupancy/package configuration. Final price may vary by travel dates, group size, hotel category, transport, season and availability.

## Itinerary and operational review

Day counts match all eight durations. Pickup/drop for seven packages uses their existing authored gateway fields, with one-way endings at Chamba and Palampur preserved. The final owner approval explicitly establishes the private-cab basis for Shimla, Manali, Dalhousie, Bir and Mussoorie; it is no longer inferred from abbreviated arrival/departure descriptions. Rishikesh uses the approved private/package road-transfer basis. Kasol retains shared/package-dependent transport.

The trek's actual itinerary starts in Joshimath, reaches Ghangaria via Govindghat, visits the two trek destinations, then returns to Joshimath. The owner confirmed Joshimath pickup/drop and separately approved aligning the stale Rishikesh route-summary metadata. Transfers from any other city remain optional and separately quoted. All day-wise descriptions remain unchanged.

Accommodation categories, occupancy and lodging meals remain as prepared. Trek-day meals are not implied. Basic trek lodging is not called deluxe. Porter, pony, palki, helicopter and personal trekking equipment are excluded. No trail opening, uninterrupted access, flowering, weather or medical-fitness guarantee is offered.

All eight are ready for **final publication approval**, with `OWNER_APPROVAL_REQUIRED` remaining. This is not permission to publish.

## Image and region verification

All eight configured files exist locally and exactly match the image field on their actual production Destination record. Each source Destination is one of the Journey's own destinationSlugs. None is in the repository's unverified-image override set. No new imagery, fallback, Google Places, HBX or external image was introduced.

Actual production Region IDs:

- Himachal Pradesh: `6a8acd3bb91782afaca681c4` (five targets).
- Uttarakhand: `6a8acd3bb91782afaca681c6` (three targets).

All destinationSlugs resolve to published Destinations with the expected published Region. The updater derives references from Destinations using the established backfill approach; it does not embed these IDs or run the global backfill script. Existing conflicting region references are refused.

## SEO differentiation

| Package | Live comparison | Result | Distinction |
|---|---|---|---|
| Shimla Short Escape | Shimla-Manali / Honeymoon in Hills | PASS | 2N/3D single-stop break, rather than a multi-stop circuit |
| Manali Short Escape | Manali Premium Escape | PASS | 3N/4D sightseeing break versus 4N/5D premium/adventure structure |
| Kasol Manikaran Weekend | Kasol Kheerganga Tosh | PASS | Short non-trekking Kasol–Manikaran route versus 4N/5D trek itinerary |
| Dalhousie Khajjiar Chamba | Himachal Family Escape | PASS | Adds Chamba and omits the live route's Dharamshala anchor |
| Bir Billing Palampur | All 16 live Journeys | PASS | New Bir/Palampur route and activity audience; paragliding sold separately |
| Mussoorie Weekend | Uttarakhand Explorer / Nainital Corbett Mussoorie | PASS | Focused 2N/3D stay versus multi-stop circuits |
| Valley of Flowers / Hemkund Sahib | All 16 live Journeys | PASS | Dedicated two-trek product with no live equivalent |
| Rishikesh Adventure | Uttarakhand Explorer | PASS | Single-stop activity audience versus spiritual multi-stop circuit; paid activities excluded |

## Breadcrumbs and structured data

Reusable `components/ui/Breadcrumb.tsx` renders `<nav aria-label="Breadcrumb"><ol>…</ol></nav>`. Home and Journeys link to real pages. The final item is plain text with `aria-current="page"`. It uses the same visible title as the H1 and BreadcrumbList. Flex wrapping, constrained item width, `min-w-0`, and overflow wrapping accommodate long mobile labels.

All 16 production pages passed HTTP, visible-breadcrumb and Product/AggregateOffer price checks after deployment of 8619fba. Existing Product, AggregateOffer, lowPrice and BreadcrumbList remain intact; FAQPage remains conditional on visible FAQs. No Review, AggregateRating, inventory, fake availability/discount, or priceValidUntil was added.

## Cancellation

The live `/cancellation-policy` returned HTTP 200 and contained Journey-applicable booking-cancellation content on 2026-10-01. It describes case-by-case terms; no percentages are invented. All eight retain `usesGeneralCancellationPolicy = true`, resolving the policy blocker. No other Journey's policy field is updated.

## Production updater

`scripts/seedPhase6Batch2CommercialData.ts` defaults to a read-only dry run. `--audit-public` also verifies all eight 404s, listing/sitemap exclusion and all 16 live pages. Execution requires `--execute --deployment-ready` after independently verifying Vercel success for the intended commit.

Preflight checks all eight before writing: exact allowlist, draft status, itinerary/duration/destination consistency with production, approved price, local image and real Destination match, valid Region and public cancellation policy. Updates use a transaction and optimistic `updatedAt`/draft guards. Status and itinerary fields are never written. The only gateway metadata write is the separately authorized Joshimath correction on the trek; obsolete pending-decision notes may be corrected on these exact eight. Price basis and hotel category fields are excluded from this continuation's update allowlist. Unchanged records are skipped. Pre-mutation HTTP smoke tests cover the homepage, catalogue, destinations, sitemap, cancellation policy and three representative published Journeys. Postchecks verify exact target values, commercial blockers, unchanged non-target Journey documents, unchanged Destination/Region documents and unchanged global counts. Public audits include Region listings and real image responses.

## Owner decisions still required

Only final publication approval remains for all eight. The six transport questions and the trek gateway question have been resolved by explicit owner decisions. The additional route-summary and obsolete-note corrections were separately authorized in the conversation. No Journey is published in this phase.

## Deferred and untouched scope

IndexNow: **DEFERRED**. No key, submission, secret or configuration added.

HBX, Google Places, PlaceCache, transport pricing, Ladakh and other drafts are untouched by this work. Unrelated pre-existing workspace changes are excluded from the Phase 6 commit.

## Validation and deployment record

- Requested commit `8619fba`: pushed; Vercel reports Deployment has completed.
- Focused tests before the metadata correction: 25 passed.
- Final full suite: 95 files, 1,237 tests passed, including the authorized gateway-update boundary test.
- Typecheck: `tsc --noEmit --incremental false` passed.
- ESLint on changed code: passed without errors or warnings.
- Production build: passed; 41 static pages generated.
- Production browser checks: all 16 published Journey pages passed at 320px, 360px and 1280px in headless Edge. Breadcrumbs were visible, within the viewport, without overflow, with the correct ancestor links, no current-page self-link, and labels matching BreadcrumbList. Additional 390px check passed.
- Final production update: 7 updated, 1 already correct (Kasol Manikaran Weekend), 0 refused, 0 conflicts. No status changes.
- Idempotency: a subsequent read-only run found 0 updates needed and all 8 records already correct.

## Production execution results

The update ran after Vercel completed deployment of `8619fba` and the following fresh pre-mutation smoke tests returned HTTP 200: `/`, `/journeys`, `/destinations`, `/sitemap.xml`, `/cancellation-policy`, and the Manali Premium Escape, Shimla Manali Tour Package and Uttarakhand Explorer pages.

All eight owner decisions are applied. The seven changed records match the approved fields exactly; Kasol already matched. The trek's route-summary fields now both say Joshimath, its old pending-confirmation note is replaced, and its original six day-wise descriptions are unchanged. No itinerary or publication status was written.

Post-update database results:

- Journeys: **40 total / 16 published / 24 draft**.
- Batch 2: **8 draft / 0 published**.
- Commercial blockers: exactly `OWNER_APPROVAL_REQUIRED` on each of the eight.
- Existing 16 published Journeys and other 16 drafts: all document values unchanged, including prices and commercial content.
- All Destination and Region documents unchanged, including the Ladakh Region and eight Ladakh Destinations. The five Ladakh Journeys are part of the unchanged non-target Journey set.
- HBX, Google Places, PlaceCache and transport pricing: no writes or code changes in this work.

Post-update public verification:

- Eight draft URLs: **8 genuine 404s**, no catalogue/sitemap/public Region listing leaks.
- Eight intended Destination images: **8 real / 0 generic / 0 missing or broken**; exact paths and source Destinations are in the commercial matrix. Every local asset exists and every production image response was HTTP 200 with image content.
- Existing 16 Journey pages: **16 HTTP 200s**, visible breadcrumbs and Product/AggregateOffer lowPrice matching unchanged database prices.
- General cancellation policy: public and applicable; all eight retain `usesGeneralCancellationPolicy = true`.

Only separate final publication approval remains. IndexNow remains deferred.
