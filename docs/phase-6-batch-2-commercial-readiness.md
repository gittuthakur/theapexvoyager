# Phase 6 — Batch 2 commercial readiness

## Status and evidence

Audit date: 2026-10-01. The existing Phase 6 commit `fea1d27` was already on origin/main, had a successful Vercel deployment, and its eight commercial records were already present in production when this continuation began. No Journey has been published by this work.

Read-only production verification found **40 Journeys: 16 published, 24 draft**. All eight targets were draft, returned genuine HTTP 404, and were absent from `/journeys` and `/sitemap.xml`. All 16 published pages returned 200 with visible breadcrumbs and Product/AggregateOffer lowPrice matching their database price. Production data matched the original Phase 6 config on all eight targets.

This continuation removes unsupported private-cab commitments from six drafts, adds explicit owner-decision notes, improves long breadcrumb wrapping, and hardens the previously untracked production updater. Deployment and final execution evidence is recorded below when completed.

## Commercial matrix

All prices are **indicative, per person onwards**. Occupancy is 2 adults, double sharing, 1 room (`minTravellers = 2`, `roomsIncluded = 1`). No hotel is named or guaranteed. A material accommodation category change must be disclosed in the final quotation before booking confirmation.

| Package | Duration | Price | Occupancy | Accommodation | Meals | Transport | Pickup | Drop | Image source/path | Region | Inclusions | Exclusions | Remaining blocker | Ready for publication approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Shimla Short Escape | 2N/3D | ₹7,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Package-dependent motorable sectors | Chandigarh | Chandigarh | Shimla: `/images/destination-shimla.jpg` | HP | 2 nights, meals, stated transfers/sightseeing | Air/train, personal, entry, optional Kufri, union/restricted transport, unlisted services | Owner vehicle decision + publication approval | No: vehicle decision |
| Manali Short Escape | 3N/4D | ₹8,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Package-dependent motorable sectors | Chandigarh | Chandigarh | Manali: `/images/destination-manali.jpg` | HP | 3 nights, meals, stated transfers, Solang excursion transport | Air/train, personal, entry, Rohtang/Atal Tunnel, union/restricted vehicles, snow/adventure activities, unlisted services | Owner vehicle decision + publication approval | No: vehicle decision |
| Kasol Manikaran Weekend | 2N/3D | ₹6,999 | 2/1 | Standard hotel/guesthouse or equivalent | Breakfast + dinner at hotel | Shared/package-dependent | Bhuntar | Bhuntar | Kasol: `/images/destination-kasol.jpg` | HP | 2 nights, meals, Bhuntar transfers, Manikaran day trip | Air/train, personal, entry/donations, adventure activities, unlisted services | Publication approval | Yes, for owner review |
| Dalhousie Khajjiar Chamba | 4N/5D | ₹10,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Package-dependent motorable sectors | Pathankot | Chamba | Dalhousie: `/images/destination-dalhousie.jpg` | HP | 4 nights, meals, one-way transfers/sightseeing | Air/train, personal, entry, Chamba–Pathankot return, unlisted services | Owner vehicle decision + publication approval | No: vehicle decision |
| Bir Billing Palampur | 3N/4D | ₹9,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Package-dependent motorable sectors | Dharamshala | Palampur | Bir Billing: `/images/destination-bir-billing.jpg` | HP | 3 nights, meals, one-way transfers/sightseeing | Air/train, personal, entry, paragliding, Palampur–Dharamshala return, unlisted services | Owner vehicle decision + publication approval | No: vehicle decision |
| Mussoorie Weekend | 2N/3D | ₹7,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Package-dependent motorable sectors | Dehradun | Dehradun | Mussoorie: `/images/destination-mussoorie.jpg` | UK | 2 nights, meals, stated transfers/sightseeing | Air/train, personal, entry, unlisted services | Owner vehicle decision + publication approval | No: vehicle decision |
| Valley of Flowers / Hemkund Sahib | 5N/6D | ₹12,999 | 2/1 | Joshimath standard hotel/guesthouse; Ghangaria basic trek lodge | Breakfast + dinner at lodging; trek-day meals not implied | Joshimath–Govindghat road sectors; onward trekking on foot | Joshimath, provisional pending gateway decision | Joshimath, provisional pending gateway decision | Hemkund Sahib: `/images/destination-hemkund-sahib.jpg` | UK | 5 nights, stated lodging meals, Joshimath pickup/drop, road transfer | Air/train, personal, Rishikesh transfer, park fees, guide/porter/pony, helicopter, unlisted services | Owner gateway decision + publication approval | No: gateway decision |
| Rishikesh Adventure | 3N/4D | ₹8,999 | 2/1 | Standard/Deluxe or equivalent | Breakfast + dinner at hotel | Package-dependent pickup/drop road transfers | Dehradun | Dehradun | Rishikesh: `/images/destination-rishikesh.jpg` | UK | 3 nights, meals, stated pickup/drop | Air/train, personal, rafting, camping/adventure activities, entry, unlisted services | Owner vehicle decision + publication approval | No: vehicle decision |

The six package-dependent descriptions exclude activity, local-union and restricted-area transport unless expressly quoted. Ordinary destination overlap is not a blocker.

Preserved disclaimer:

> Starting price is indicative and based on selected occupancy/package configuration. Final price may vary by travel dates, group size, hotel category, transport, season and availability.

## Itinerary and operational review

Day counts match all eight durations. Pickup/drop for seven packages uses their existing authored gateway fields, with one-way endings at Chamba and Palampur preserved. Their abbreviated arrival/departure days do not establish a particular vehicle class; no private cab is inferred from those days.

The trek has a real inconsistency: `startingCity` and `endingCity` say Rishikesh, while Day 1 is arrival in Joshimath and Day 5 returns there before Day 6 departure. Its existing commercial fields describe Joshimath and exclude the Rishikesh transfer. This is a provisional itinerary-supported proposal, **not a resolved owner decision**. Do not publish until the gateway is settled. No route or gateway fields were silently rewritten.

Accommodation is a proposed category, subject to availability and quotation. Trek lodging is basic; no deluxe trek accommodation, trail opening, access, flowering, pony/porter, helicopter or medical-fitness guarantee is offered. Paid paragliding, rafting and other adventure activities remain excluded.

`getCommercialBlockers()` returns `OWNER_APPROVAL_REQUIRED` for each target because all required descriptive fields exist. That helper checks field presence; it does not resolve commercial judgment or the gateway contradiction. The additional decisions above remain explicit publication holds and must not be mistaken for a clean readiness result.

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

All 16 production pages passed HTTP, visible-breadcrumb and Product/AggregateOffer price checks before this continuation's deployment. Existing Product, AggregateOffer, lowPrice and BreadcrumbList remain intact; FAQPage remains conditional on visible FAQs. No Review, AggregateRating, inventory, fake availability/discount, or priceValidUntil was added.

## Cancellation

The live `/cancellation-policy` returned HTTP 200 and contained Journey-applicable booking-cancellation content on 2026-10-01. It describes case-by-case terms; no percentages are invented. All eight retain `usesGeneralCancellationPolicy = true`, resolving the policy blocker. No other Journey's policy field is updated.

## Production updater

`scripts/seedPhase6Batch2CommercialData.ts` defaults to a read-only dry run. `--audit-public` also verifies all eight 404s, listing/sitemap exclusion and all 16 live pages. Execution requires `--execute --deployment-ready` after independently verifying Vercel success for the intended commit.

Preflight checks all eight before writing: exact allowlist, draft status, itinerary/duration/destination consistency with production, approved price, local image and real Destination match, valid Region and public cancellation policy. Updates use a transaction and optimistic `updatedAt`/draft guards. Status, itinerary and gateway fields are never written. Unchanged records are skipped. Postchecks verify exact target values, unchanged non-target Journey documents and unchanged global counts.

## Owner decisions still required

1. Confirm vehicle arrangements and covered motorable services at the listed prices for Shimla, Manali, Dalhousie–Chamba, Bir–Palampur, Mussoorie and Rishikesh. Until then their basis is package-dependent, not a guaranteed private cab.
2. Resolve the trek gateway: retain Joshimath pickup/drop and align the gateway fields in a separately approved correction, or price and describe Rishikesh transfers before including them.
3. Give separate publication approval for all eight. No publication occurs in this phase.

## Deferred and untouched scope

IndexNow: **DEFERRED**. No key, submission, secret or configuration added.

HBX, Google Places, PlaceCache, transport pricing, Ladakh and other drafts are untouched by this work. Unrelated pre-existing workspace changes are excluded from the Phase 6 commit.

## Validation and deployment record

- Initial focused tests: 37 passed.
- Updated full suite: 95 files, 1,236 tests passed.
- ESLint on continuation code: passed. Broader existing Phase 6 files have one pre-existing `set-state-in-effect` warning in PackageDetailContent; no errors.
- Typecheck: `tsc --noEmit --incremental false` passed. Production build passed with network access (41 static pages); the sandboxed attempt failed on MongoDB DNS during prerendering.
- Final updater dry run: six transport corrections, two unchanged drafts, zero conflicts; all non-target records unchanged.
- Final deployment/update evidence: pending deployment of this continuation.
- Mobile layout: headless Edge checked all 16 live Journey routes against the local production build at 320px. All breadcrumbs were visible, within the viewport, without overflow, with real ancestor links, no current-page self-link and matching BreadcrumbList labels. Additional 360px and 390px checks passed on Auli Chopta Tungnath.
