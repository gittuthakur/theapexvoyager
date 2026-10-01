# Phase 11B — Gulmarg winter image and commercial readiness

## Source and license verification

- Target: `gulmarg-winter-escape`; publication is explicitly out of scope.
- Commons file: [Snowfall In Gulmarg](https://commons.wikimedia.org/wiki/File:Snowfall_In_Gulmarg.jpg)
- Author: Koshur; source page identifies the work as the uploader's own work and depicts Gulmarg.
- License: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The license permits commercial reuse and adaptations. Attribution must credit the author/work, link to the source and license, and indicate changes. Adaptations must be shared under CC BY-SA 4.0 or a compatible license.
- Original media URL: https://upload.wikimedia.org/wikipedia/commons/6/64/Snowfall_In_Gulmarg.jpg
- Original resolution: 4096x3072.
- Local media URL: https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Snowfall_In_Gulmarg.jpg/1280px-Snowfall_In_Gulmarg.jpg
- Local resolution: 1280x960; JPEG, 362239 bytes. The original upload host returned HTTP 429 during retrieval; the verified Commons 1280px rendition returned HTTP 200. Its installed SHA-256 is recorded in the verification JSON.
- Change handling: Wikimedia Commons resized the image to 1280x960; no crop or other local edits were made. The image derivative is credited and licensed under CC BY-SA 4.0. No site-wide license claim is made.
- Visual review: the downloaded image shows a snow-covered Gulmarg scene without a visible watermark. It does not depict active snowfall and is not evidence of current conditions.

## Attribution implementation

Structured metadata lives in `config/imageCredits.config.ts` and is reused by the Journey hero caption and `/photo-credits`. The caption identifies the title and author, links the Commons source and license, and discloses the resize and share-alike terms. Attribution is associated with the image, not only stored in repository documentation.

## Commercial preparation

- Proposed indicative starting price: ₹19,999 per person, based on two adults sharing one room.
- Included basis: three Gulmarg nights, three breakfasts, three dinners, Srinagar Airport pickup/drop and approved Srinagar–Gulmarg road transfers. Local/restricted snow transport is excluded unless separately confirmed in writing.
- Gondola: optional and separately payable, subject to operations, weather, availability and local rules; no operation/access guarantee.
- Day 3 activities: skiing, snowboarding, sledging, snowmobile and other snow activities are optional and separately payable unless included in a final written quotation. Snowfall and uninterrupted access are not guaranteed.
- Cancellation: use the existing general Journey cancellation policy; no new percentages are introduced.

## Guarded database update

The exact-target script is `scripts/preparePhase11Gulmarg.ts`; default mode is dry-run and `--execute` is its supported write mode. Only the target's approved commercial fields and the minimal Day 2/Day 3 itinerary wording are writable. Status, slug, duration and gateway city fields are not in the write set.

Production dry-run evidence, guarded execution, post-execution idempotency, readiness blockers, public isolation, deployment, test gates and protected-record comparisons are captured in `phase-11b-gulmarg-verification.json` after each corresponding gate is completed. No publication is authorized by this phase.