# Site-Wide Real Image Audit (Phase 4D)

Covers every Destination, Journey, and Region image, cross-referenced against `public/images/` and the project's own pre-existing media-authenticity infrastructure (`config/destinationImageOverrides.ts`, `docs/image-sources.md`, `/photo-credits`). Produced as part of the first-10-Journey publication phase — see `docs/phase-4b-final-commercial-approval.md`, `docs/phase-4c-r-blocker-recovery.md`.

## IMAGE SUMMARY

| Metric | Count |
|---|---|
| Destinations audited | 70 (published, non-Ladakh) + 8 (Ladakh, draft) = 78 |
| Journeys audited | 6 (live) + 34 (draft, incl. 10 publication targets) = 40 |
| Total image files on disk (`public/images/`) | 75 |
| Referenced by a Destination or Journey `image` field | 67 (after this phase's fixes) |
| Unused by Destination/Journey fields (used elsewhere — hero/CTA/experiences/tours) | 10 (`cta-real-himachal.jpg`, `dharamshala-retreat.jpg`, `kinnaur-rampur-trek.jpg`, `manali-leh-highway.jpg`, `manali-riverside-resort.jpg`, `shimla-heritage-hotel.jpg`, `shimla-heritage-walk.jpg`, `spiti-circuit.jpg`, `spiti-valley-boutique-hotel.jpg`, `Villas-and-Cottages.jpg`) |
| Broken references (path set, file missing) | 0 |
| Verified relevant (A) | 69 Destinations + 9 Journeys (6 live + 9 of the 10 targets after fixes; see note on Jibhi Tirthan Valley below) |
| Reusable related (B) | 1 Destination-level cluster (Kasol photo reused by 4 real, geographically-adjacent Parvati/Tirthan/Sainj valley destinations at the *Destination* config level — see Part C) |
| Generic/placeholder, but already honestly handled (not a defect) | 9 Destinations (`DESTINATIONS_WITHOUT_VERIFIED_IMAGE`) |
| Wrong/misleading | 1 found and fixed this phase (Jibhi Tirthan Valley Journey — see below) |
| Missing/broken | 0 |

## P0 / P1 / P2 / P3 / P4

**P0 (blocked publication) — 1 found, fixed:**
- `jibhi-tirthan-valley` (Journey): previously assigned `images.destinations.kasol` on the mistaken assumption that this matched what the real `jibhi`/`tirthan-valley` Destination pages show. It does not — `config/destinationImageOverrides.ts`'s `DESTINATIONS_WITHOUT_VERIFIED_IMAGE` set already flags both (plus `sainj-valley`) as having no rights-cleared, identity-verified photo of themselves; `DestinationHero`/`DestinationCard` substitute a neutral icon+label placeholder (`MediaPlaceholder`) instead of ever rendering the Kasol photo. Fixed to `images.destinationsHero` — the exact same honest, non-misattributing fallback `chail`/`patnitop`/`bhaderwah`/`kullu`/`pragpur`/`pangi-valley`'s own Destination `image` fields already use for this identical situation. Never the Ladakh placeholder (a different, unrelated fallback).

**P1 (public page, generic/misleading, existing safe asset available) — 3 found, fixed:**
- `kashmir-signature-journey` (live, published): was `/images/hero-hero.jpg` (generic) → now `/images/destination-srinagar.jpg` (real, verified — this journey's itinerary opens and centers on Srinagar).
- `himachal-himalayan-explorer` (live, published): was `/images/feature-tour-hero.jpg` (generic) → now `/images/destination-manali.jpg` (real, verified — Manali is the itinerary's larger, dominant portion, Days 3-8 of 8).
- `uttarakhand-explorer` (live, published): was `/images/img-hero-hero.jpg` (generic) → now `/images/destination-rishikesh.jpg` (real, verified — this journey's own SEO title/H1 is "Rishikesh Haridwar Mussoorie Tour Package"; the image was left generic in an earlier phase specifically because no Rishikesh photo existed yet — it now does).

**P1 (public page, generic — no confident existing safe asset, left alone deliberately):**
- `chail`, `patnitop`, `bhaderwah`, `kullu`, `pragpur`, `pangi-valley` (Destinations): each already uses `config/destinationImageOverrides.ts`'s honest-placeholder mechanism (a `MediaPlaceholder`, not a photo at all, not even the generic hero visually — the hero path in config is a fallback value, but the actual rendered UI shows an icon+label card). **Not touched this phase** — the project's own prior, documented sourcing process (`docs/image-sources.md`) already searched Wikimedia Commons/Unsplash/Pexels/Flickr for each of these and explicitly rejected every candidate found (Kullu's only candidate: a festival-crowd photo with insufficient destination identity; Pragpur/Chail/Patnitop/Bhaderwah/Pangi Valley: no rights-cleared candidate found at all). Substituting a neighboring destination's photo (e.g. Kufri for Chail, Manali for Kullu) was considered and explicitly rejected in favor of an honest placeholder — reapplying that substitution now would contradict this project's own careful, documented decision, not correct an oversight. See **OWNER IMAGE REQUIRED** below.

**P2 (remaining non-public Journey drafts needing future imagery):** 24 of the 34 Journey drafts have no `image` set at all (everything outside this phase's 10 publication targets — e.g. `shimla-short-escape`, `kedarnath-yatra`, `rishikesh-adventure-package`, ...). None are public; none block this phase. Deferred to whichever future phase prepares their own publication.

**P3 (Ladakh imagery required before Ladakh publication):** all 8 Ladakh Destinations and all 5 Ladakh Journeys use the Ladakh generic placeholder (`images.hero`, `/images/img-hero-hero.jpg`) — a distinct fallback from the one used above. Per this phase's explicit instruction, **not touched, not fixed, Ladakh not published.**

**P4 (cosmetic/non-critical):**
- `spiti-valley` (Destination) uses `images.destinations.spitiValley` (file `destination-spiti.jpg`) rather than a same-slug `destination-spiti-valley.jpg` — a key-naming mismatch only, not a misattribution (it's spiti-valley's own real photo, just filed under a shorter key). No action needed.
- 6 of the original, pre-`image-sources.md`-era destination/journey images (Manali, Shimla, Spiti Valley, Kasol, Kinnaur, Dharamshala) predate the formal Wikimedia-sourcing ledger and have no licensing entry in `docs/image-sources.md`. No evidence any is wrong — all are real, already serving live traffic without a `DESTINATIONS_WITHOUT_VERIFIED_IMAGE` flag — but backfilling their sourcing documentation into `docs/image-sources.md` would be a reasonable future cosmetic/compliance task.
- `experiences.config.ts` extensively reuses three generic fallback images (`himalayanVista`, `mountainDusk`, `valleyGeneric`) across dozens of Experience cards. Out of scope for this Journey-publication phase (Experiences aren't part of the audited Destination/Journey tables this phase requires) — flagged for a future, dedicated Experiences image pass.

## OWNER IMAGE REQUIRED

No rights-safe existing asset is available for these 6 Destinations (all already honestly placeholder-handled, none blocks this phase's publication):

- **Chail** (Himachal Pradesh)
- **Patnitop** (Jammu & Kashmir)
- **Bhaderwah** (Jammu & Kashmir)
- **Kullu** (Himachal Pradesh)
- **Pragpur** (Himachal Pradesh)
- **Pangi Valley** (Himachal Pradesh)

## DESTINATION IMAGE AUDIT (exceptions only — the other 61 of 70 published Destinations each have their own dedicated, Wikimedia-sourced, licensed photo per `docs/image-sources.md`, classification A, no replacement required)

| Destination | Current image | Classification | Replacement required |
|---|---|---|---|
| tirthan-valley | `destination-kasol.jpg` (config value; actual render = honest placeholder) | Handled (no live misattribution) | No — owner-sourced photo would be an upgrade, not a fix |
| jibhi | `destination-kasol.jpg` (config value; actual render = honest placeholder) | Handled | No |
| sainj-valley | `destination-kasol.jpg` (config value; actual render = honest placeholder) | Handled | No |
| chail | `destination-hero-img.jpg` (config value; actual render = honest placeholder) | Handled | Yes — OWNER IMAGE REQUIRED |
| patnitop | `destination-hero-img.jpg` (config value; actual render = honest placeholder) | Handled | Yes — OWNER IMAGE REQUIRED |
| bhaderwah | `destination-hero-img.jpg` (config value; actual render = honest placeholder) | Handled | Yes — OWNER IMAGE REQUIRED |
| kullu | `destination-hero-img.jpg` (config value; actual render = honest placeholder) | Handled | Yes — OWNER IMAGE REQUIRED |
| pragpur | `destination-hero-img.jpg` (config value; actual render = honest placeholder) | Handled | Yes — OWNER IMAGE REQUIRED |
| pangi-valley | `destination-hero-img.jpg` (config value; actual render = honest placeholder) | Handled | Yes — OWNER IMAGE REQUIRED |
| spiti-valley | `destination-spiti.jpg` | A (own photo, key-naming mismatch only) | No |

## JOURNEY IMAGE AUDIT

| Journey | Current image | Classification | Replacement required |
|---|---|---|---|
| manali-premium-escape (live) | `destination-manali.jpg` | A | No |
| kashmir-signature-journey (live) | `destination-srinagar.jpg` (**fixed this phase**, was generic) | A | No |
| spiti-valley-adventure (live) | `destination-spiti.jpg` | A | No |
| himachal-himalayan-explorer (live) | `destination-manali.jpg` (**fixed this phase**, was generic) | A | No |
| dharamshala-dalhousie-escape (live) | `destination-dharamshala.jpg` | A | No |
| uttarakhand-explorer (live) | `destination-rishikesh.jpg` (**fixed this phase**, was generic) | A | No |
| shimla-manali-tour-package | `destination-manali.jpg` | A | No |
| kinnaur-spiti-circuit | `destination-spiti.jpg` | A | No |
| kasol-kheerganga-tosh | `destination-kasol.jpg` | A | No |
| jibhi-tirthan-valley | `destinationsHero` generic (**fixed this phase**, was misattributed Kasol photo) | Handled (honest, not A) | Owner-sourced Jibhi/Tirthan photo would be an upgrade |
| kashmir-family-tour | `destination-srinagar.jpg` | A | No |
| kashmir-pahalgam-gulmarg-sonamarg-tour | `destination-pahalgam.jpg` | A | No |
| char-dham-yatra | `destination-kedarnath.jpg` | A | No |
| kedarnath-badrinath-yatra | `destination-badrinath.jpg` | A | No |
| nainital-corbett-mussoorie-tour | `destination-nainital.jpg` | A | No |
| auli-chopta-tungnath-tour | `destination-auli.jpg` | A | No |
| 24 other drafts | none set | E (not public, not blocking) | P2 — deferred |
| 5 Ladakh drafts | Ladakh generic placeholder | P3 | Deferred, Ladakh not published |

## DUPLICATE IMAGE MAP

Legitimate reuse (same real place, or the project's own documented adjacent-valley precedent):
- `destination-manali.jpg` — Manali (Destination), manali-premium-escape, shimla-manali-tour-package, himachal-himalayan-explorer (all genuinely about/centered on Manali).
- `destination-spiti.jpg` — Spiti Valley (Destination), spiti-valley-adventure, kinnaur-spiti-circuit (all genuinely about Spiti).
- `destination-kasol.jpg` — Kasol (Destination), kasol-kheerganga-tosh (genuinely Kasol-based); ALSO the raw config value (not the live render) for tirthan-valley/jibhi/sainj-valley Destinations, which the UI honestly overrides — not a live duplication.
- `destination-srinagar.jpg`, `destination-pahalgam.jpg`, `destination-kedarnath.jpg`, `destination-badrinath.jpg`, `destination-nainital.jpg`, `destination-auli.jpg`, `destination-rishikesh.jpg` — each used by exactly its own real Destination plus the one or two Journeys genuinely centered there.

Not legitimate (would have been wrong, not applied): substituting Kufri's photo for Chail, Manali's photo for Kullu, or Kangra's photo for Pragpur — considered during this audit, explicitly rejected as contrary to this project's own established, documented image-authenticity standard (a specific place's photo should depict that place, not merely a "nearby enough" one, once the project has committed to rights-cleared identity verification as its bar).

## LADAKH IMAGE REQUIREMENTS (P3 — not actioned this phase)

All 8 Ladakh Destinations and all 5 Ladakh Journeys use the Ladakh generic hero placeholder (`images.hero`). Real, rights-cleared, identity-verified photography is required for Leh, Nubra Valley, Pangong Lake, Turtuk, Hanle, Tso Moriri, Kargil, and Lamayuru before any Ladakh publication phase — recorded here for that future phase, not sourced now.
