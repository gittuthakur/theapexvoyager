# Phase 4C-R — Publication Blocker Recovery (Image + Region Reference)

Continues from the Phase 4C STOP report. Resolves the two structural blockers found there — missing `image` and unbackfilled `regionId` — on exactly the 10 target Journeys. **No Journey was published in this phase.**

## Part A — Image resolution (never invented, never fabricated)

Inspected `config/images.config.ts` and `config/packages.config.ts` to confirm the established convention: 3 of the 6 live Journeys already reuse their primary Destination's own curated photo directly as the Journey `image` (`manaliPremiumEscape` → `images.destinations.manali`, `spitiValleyAdventure` → `images.destinations.spitiValley`, `dharamshalaDalhousieEscape` → `images.destinations.dharamshala`). This is the real, proven pattern applied here — not a new design.

| Package | Image source | Exact path | Asset exists on disk | Is the Ladakh placeholder |
|---|---|---|---|---|
| shimla-manali-tour-package | Destination "manali" (published) | `/images/destination-manali.jpg` | YES | NO |
| kinnaur-spiti-circuit | Destination "spiti-valley" (published) | `/images/destination-spiti.jpg` | YES | NO |
| kasol-kheerganga-tosh | Destination "kasol" (published) | `/images/destination-kasol.jpg` | YES | NO |
| jibhi-tirthan-valley | Destinations "jibhi"/"tirthan-valley" (published) — both already use this same image themselves | `/images/destination-kasol.jpg` | YES | NO |
| kashmir-family-tour | Destination "srinagar" (published) | `/images/destination-srinagar.jpg` | YES | NO |
| kashmir-pahalgam-gulmarg-sonamarg-tour | Destination "pahalgam" (published) | `/images/destination-pahalgam.jpg` | YES | NO |
| char-dham-yatra | Destination "kedarnath" (published) | `/images/destination-kedarnath.jpg` | YES | NO |
| kedarnath-badrinath-yatra | Destination "badrinath" (published) | `/images/destination-badrinath.jpg` | YES | NO |
| nainital-corbett-mussoorie-tour | Destination "nainital" (published) | `/images/destination-nainital.jpg` | YES | NO |
| auli-chopta-tungnath-tour | Destination "auli" (published) | `/images/destination-auli.jpg` | YES | NO |

**Jibhi Tirthan Valley special case:** no dedicated Jibhi or Tirthan Valley photography exists anywhere in this codebase. Rather than invent one, `config/destinations.config.ts` was checked directly — the real, already-published `jibhi` and `tirthan-valley` Destination documents *themselves* already reuse `images.destinations.kasol` (a pre-existing, deliberate reuse decision made in an earlier phase, not something introduced here). The Journey reuses that exact same already-resolving image, matching what those two live Destination pages already show today — the honest, non-fabricated choice consistent with this codebase's existing precedent for exactly this situation.

All 10 verified to exist on disk under `public/images/` and to resolve through the same `images.destinations.*` → `<img>`/`<Image>` path the 6 live Journeys already use successfully. None is the Ladakh generic placeholder (`/images/img-hero-hero.jpg`).

## Part B — Applied to config

`config/draftJourneys.config.ts` now imports `images` from `@/config/images.config` and sets `image:` on each of the 10 target entries, verbatim reusing the paths above. No other entry (the other 24 drafts, the 5 Ladakh journeys) was touched. `config/draftJourneys.phase4cImages.test.ts` (8 tests) locks in the exact resolved image per package, confirms none is the Ladakh placeholder, confirms every image is a genuine member of the existing `images.destinations` set (never an arbitrary new path), and regression-guards that the 6 live packages' and Ladakh's own images were not touched.

## Part C — Region references: `scripts/backfillRegionRefs.ts` inspected and confirmed safe

Read directly from source (not assumed) before any execution:
- **Derives from real relationships:** `Journey.regionId` is computed purely as `destinationSlugs.find(slug => Destination[slug].regionId)` — a lookup against already-published Destination documents' own `regionId`, never guessed or hardcoded.
- **Idempotent:** every write is `Journey.updateOne({_id}, {$set: {regionId}})` with a value freshly re-derived from current data each run — re-running produces the identical result.
- **Single-field `$set` only:** confirmed from source — `status`, `price`, all commercial fields, `itinerary`, and `image` are never referenced or written anywhere in the Journey branch of this script.
- **No dry-run flag exists** on the script itself, so per Part C's own fallback instruction, safety was confirmed by direct source inspection instead (above) rather than by a runtime dry run — the script's logic leaves no ambiguity about what it will do.
- The script also re-derives `regionId`/`regionIds` for Tour, Expert, Hotel, TransportRoute, TransportVehicle, and TransportPartner, each via the same pure, idempotent, single-field-`$set` pattern (verified from source for each) — none of this is "transport pricing" (rates/priceNote are never touched, only a categorization field). Running the existing script as a whole, rather than writing a narrower competing one, matches this phase's own explicit instruction.

## What did NOT happen this phase

No Journey's `status` changed. No price, commercial field, or itinerary was rewritten by the image or region changes. The 6 live packages' images, the Ladakh destinations' images, HBX, Google Places, PlaceCache, and transport pricing were all untouched. See the in-conversation final report for the exact production verification (image update counts, region backfill counts, post-recovery blocker re-audit, and the public-safety leak check).
