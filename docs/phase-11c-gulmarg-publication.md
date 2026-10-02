# Phase 11C — Gulmarg winter publication

## Approval and pre-publication checks

- Owner approval: granted for `gulmarg-winter-escape` only.
- Production baseline: 40 Journeys, 27 published, 13 draft; catalogue and Journey sitemap each contain 27 entries.
- Target: `gulmarg-winter-escape`, draft, `3 Nights / 4 Days`, price 19999, Srinagar start/end.
- Commercial basis, pickup/drop, accommodation, meals, road transport, inclusions, exclusions, and the complete four-day itinerary were re-read from production and remain as approved in Phase 11B.
- Day 2 identifies Gondola as optional/separately payable and subject to operations, weather, availability, and applicable local rules. Day 3 makes snow activities optional/separately payable unless included in a written quotation and disclaims guaranteed snowfall or uninterrupted access.
- Readiness before approval consumption: `OWNER_APPROVAL_REQUIRED` only. The candidate published document validates successfully.
- The production image is `/images/gulmarg-winter-snow.jpg`, HTTP 200. `/photo-credits` is HTTP 200 and identifies “Snowfall In Gulmarg”, Koshur, the Commons source, CC BY-SA 4.0, and the resize notice.
- Before publication: canonical Journey URL 404; public Journey API and sitemap each contain 27 entries and exclude Gulmarg.

## Guarded publication

`scripts/publishPhase11CGulmarg.ts` allowlists exactly one slug and persists only `status: draft -> published`. Dry-run output: targetCount 1, wouldPublish 1, alreadyPublished 0, refused 0; protected fields unchanged. Execute mode requires both `--owner-approved` and `--deployment-ready` and verifies an exact production snapshot before and after the transaction.

Owner approval was consumed by the explicit `--owner-approved` execute invocation after Vercel reported Ready. Exactly one document was updated, with only `status` changing from `draft` to `published`; no commercial field was rewritten. Execution reported published 1, skipped 0, refused 0. Immediate dry-run reported wouldPublish 0, alreadyPublished 1, refused 0.

## Post-publication verification

- Production database: 40 total, 28 published, 12 draft. Every non-target Journey document matched the pre-publication snapshot.
- Public Journey API/catalogue: 28 entries; Gulmarg appears exactly once.
- Journey sitemap: 28 entries; canonical Gulmarg URL appears exactly once.
- The remaining 12 draft routes each return 404 and are absent from both catalogue and sitemap.
- Canonical target URL returns HTTP 200 and visibly renders the approved title, duration, starting price, pickup/drop, stay, meals, transport, inclusions/exclusions, Gondola and snow-activity safeguards, winter/cancellation information, breadcrumbs, and image credit.
- Browser QA passed at desktop 1440×1000 and mobile 390×844; hero image loaded at both sizes, no horizontal overflow, no console errors.
- Structured data contains Product, AggregateOffer with `lowPrice: 19999` and currency INR, and BreadcrumbList. It contains no unsupported rating, review, availability, inventory, discount or price-validity claims.
- Production winter image and `/photo-credits` both return HTTP 200; the hero credit links to the Commons source and CC BY-SA 4.0 license and discloses the resize.
- Vercel reported Ready for implementation commit `dca1e909b0959d2b127cc5d63a350bc340c20d8e` at `https://www.theapexvoyager.in` before publication execution.

Detailed machine-readable evidence is in `phase-11c-gulmarg-verification.json`. No other Journey publication was authorized or performed. Search Console submission is ready but was not submitted; IndexNow remains deferred.