# Phase 11A — Gulmarg winter readiness (superseded)

This record documents the original Phase 11A stop and is superseded by
`docs/phase-11b-gulmarg-image-and-commercial-readiness.md`.

## Source audit

- Target: `gulmarg-winter-escape`
- Status: `draft`
- Duration: `3 Nights / 4 Days`
- Stored route: `Srinagar -> Gulmarg -> Srinagar`
- Stored nights: 3 nights in Gulmarg; no live overnights outside Gulmarg
- Contradictions: none in route or duration. The stored itinerary is already consistent with the approved product shape.
- Required copy correction: Day 2 wording must make the Gondola explicitly optional and separately payable.

## Commercial basis

- Price: ₹19,999 per person onwards
- Basis: indicative, per person onwards, double sharing, 2 adults / 1 room
- Pickup: Srinagar Airport
- Drop: Srinagar Airport
- Hotel: 3 nights in a Standard/Deluxe winter-operating Gulmarg hotel or equivalent
- Meals: 3 breakfasts and 3 dinners, subject to confirmed property schedule
- Transport: approved Srinagar Airport ↔ Gulmarg road transfers only
- Excluded: Gondola tickets, skiing, snowboarding, equipment, instructors, sledging, local snow vehicles, paid snow activities and all other separately payable services

## Image gate correction

- Candidate: `Snowfall In Gulmarg`
- Author: Koshur
- Source: https://commons.wikimedia.org/wiki/File:Snowfall_In_Gulmarg.jpg
- License: CC BY-SA 4.0
- License URL: https://creativecommons.org/licenses/by-sa/4.0/
- The initial local file under `public/images/gulmarg-winter-snow.jpg` was a green, snow-free image and was not the Commons candidate.
- At that time the production URL returned HTTP 404 and no user-facing attribution for Koshur was implemented. Documentation alone did not satisfy the image gate.
- Phase 11B replaces the incorrect unreferenced file with the verified Commons rendition and implements public attribution; see the superseding report for exact URLs, dimensions, changes and verification.

## Dry-run and execution

The Phase 11A dry run proposed a single update (`wouldUpdate = 1`, `alreadyCorrect = 0`, `refused = 0`, `conflicts = 0`, `published = 0`). No Phase 11A database write was performed.

The production write is scoped to this single draft and leaves the status as `draft` at all times.

## Readiness and isolation

- Candidate readiness was covered by focused tests; production readiness after the guarded field update had not yet been established.
- The production status remained `draft`; the canonical URL was required to remain 404 and outside the public catalogue and sitemap.
- Phase 11B must re-verify public isolation and production counts after deployment and the commercial update.
