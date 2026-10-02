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

The publication execution, idempotency result, post-publication counts, live route/content/structured-data QA, deployment commits, and remaining-draft isolation are recorded in `phase-11c-gulmarg-verification.json` after those gates complete. No other Journey publication is authorized.