# Phase 3A — Ladakh Foundation: Findings and Prepared Content

## STOP finding (Part 8/11) — Destination has no publication-status field

`models/Destination.ts` has **no `status` field at all** — unlike `Journey` (`status: 'draft' | 'published'`, Phase 2) and `Region` (same field, pre-existing). Verified directly, not assumed:

- `app/sitemap.ts:48` — `Destination.find()`, completely unfiltered; every Destination document is submitted for indexing.
- `services/regions/regionHub.service.ts:71` — `Destination.find({ regionId })`, filtered only by region, never by any publication concept.
- `proxy.ts` — the Destination branch of the soft-404 guard is `Destination.exists({ slug })`, no status filter (contrast with its own Region/Journey branches, both of which do filter `status: 'published'`).
- Every `scripts/syncDestinationBatch*.ts` and `scripts/seed.ts` write path — none sets or reads a status concept for Destination.

**Conclusion: any Destination document inserted into the shared production database is instantly, unconditionally public** — its own page resolves, it appears in `/destinations`, the sitemap, and any Region Hub it belongs to. There is no draft state to rely on, unlike everything this session has built for Journey since Phase 2.

**Per the brief's own explicit instruction, this session stopped before inserting any Ladakh Region or Destination document into production.** Nothing was seeded. `config/ladakhFoundation.config.ts` (new, this phase) holds the prepared content — real, structurally correct, matching `models/Destination.ts`'s actual field shapes — but is not imported by `scripts/seed.ts` or anything else; it is inert until deliberately wired in.

### Required publication-control change (not made this phase — out of scope without separate authorization)

To safely support a non-public Ladakh foundation, `models/Destination.ts` would need the same treatment `models/Region.ts` and `models/Journey.ts` already have:

1. Add `status: { type: String, enum: ['draft', 'published'], required: true, default: 'draft' }` to the schema.
2. Update every public query to filter `status: 'published'`: `app/sitemap.ts`'s `Destination.find()`, `services/regions/regionHub.service.ts`'s per-region query, `lib/destinations.ts`'s `getCuratedDestinations()`/equivalent slug lookup, `proxy.ts`'s existence check, and any destination-listing page (`app/destinations/page.tsx`).
3. Add tests mirroring `proxy.test.ts`/`app/sitemap.test.ts`/`lib/packages.test.ts`'s existing Journey coverage.
4. Only after that ships and is verified in production (the same commit → push → deploy → verify sequence this session has used for every Journey change) would inserting a draft Ladakh Destination be safe.

This is a real, scoped piece of engineering work — recommend it as its own phase, not folded into this already-large one.

## Ladakh Region (prepared, not seeded)

`config/ladakhFoundation.config.ts`'s `ladakhRegionDraft` — real content: Ladakh is a Union Territory (administratively separate from Jammu & Kashmir since 2019, never described as a district of J&K), a high-altitude cold-desert region, with Leh named explicitly as the practical acclimatisation base every itinerary should be built around.

## Ladakh Destinations (8 prepared, not seeded)

| Slug | Title | Role |
|---|---|---|
| `leh` | Leh | Gateway town and mandatory acclimatisation base |
| `nubra-valley` | Nubra Valley | Diskit/Hunder — monastery, sand dunes, Bactrian camels |
| `pangong-lake` | Pangong Lake | Border-adjacent high-altitude lake |
| `turtuk` | Turtuk | Balti village near the Line of Control, opened to tourism in 2010 |
| `hanle` | Hanle | India's first Dark Sky Reserve, genuinely remote |
| `tso-moriri` | Tso Moriri | Quieter, more remote lake, same Changthang region as Hanle |
| `kargil` | Kargil | Highway stopover town, real historical significance (1999) |
| `lamayuru` | Lamayuru | "Moonland" landscape, ancient monastery, highway stopover |

**Khardung La** is deliberately *not* a standalone destination — per the brief's own steer, it's a mountain pass en route to Nubra Valley with no overnight base of its own, so it appears only as a highlight of `leh` and a route note on `nubra-valley` (the same pattern this app already uses for Kunzum Pass within the existing Spiti Valley content).

**No fabrication**: no hotel counts, ratings, reviews, Google Places data, supplier availability, permit guarantees, or exact road-opening dates anywhere in the prepared content. Permit *requirements* (Inner Line Permit / Protected Area Permit for the border-adjacent destinations) are stated as real, well-known facts without inventing fees, validity periods, or a guaranteed approval process. Every entry conservatively hedges its `bestTime` ("broadly May–September... exact dates vary year to year") rather than asserting a fixed window.

**Acclimatisation**: `leh`'s own content explicitly frames it as the mandatory rest base; every higher-altitude/more remote destination (`nubra-valley`, `pangong-lake`, `turtuk`, `hanle`, `tso-moriri`) carries `bestFor: [...already acclimatised in Leh...]` and a `requiresPriorAcclimatisation: true` flag (a Phase 3A prep-file marker, not a database field) as an explicit signal for whoever authors the eventual Journey itineraries.

## Ladakh Journey draft plan (Part 9) — evaluation only, nothing created

**No Journey document can honestly be created yet** — `destinationSlugs` referencing `leh`, `nubra-valley`, etc. would be invalid until those Destinations actually exist in the database (violates the standing "never invent a destinationSlug" rule this session has held to throughout Phase 2/3). This section is a duplicate-first *evaluation* of the 7 proposed concepts, to execute once the Destination foundation is safely live.

| # | Concept | Duration | Verdict | Reasoning |
|---|---|---|---|---|
| 1 | Leh Nubra Pangong | 5N/6D | **Retain — canonical** | The core, foundational Ladakh circuit |
| 2 | Leh Nubra Pangong Turtuk | 6N/7D | **Retain** | Turtuk adds a genuinely distinct cultural stop (Balti village, different from the rest of Ladakh) |
| 3 | Leh Nubra Pangong Hanle | 6N/7D | **Retain** | Hanle is a different direction/theme (Changthang dark-sky remoteness) from Turtuk, despite the same duration as #2 |
| 4 | Leh Nubra Pangong Hanle Tso Moriri | 7N/8D | **Retain** | The natural longer extension of #3 — Tso Moriri is geographically adjacent to Hanle, genuinely adds ground covered |
| 5 | Srinagar Kargil Leh Nubra Pangong | 7N/8D | **Retain** | A fundamentally different entry route (overland via Kargil, not flying into Leh) — real, distinct product |
| 6 | Ladakh Family Tour | 5N/6D | **Reject as duplicate** | Same core route and duration as #1, audience-only differentiation — the same pattern already rejected for Manali/Kashmir in Phase 3. Recommend writing #1's own copy to be family-welcoming rather than a separate page. |
| 7 | Ladakh Couple/Honeymoon | 5N/6D | **Reject as duplicate** | Same reasoning as #6 |

**Retained: 5. Rejected as duplicate: 2.** All prices, when these are eventually authored, remain NOT SET per the brief.

## Ladakh safety requirements (Part 10) — encoded in the prepared content

None of the prepared destination content implies a guaranteed permit, guaranteed access to Pangong/Hanle/Tso Moriri, guaranteed road opening, guaranteed snowfall/clear skies, medical suitability, or immediate high-altitude touring on arrival. When the 5 retained Journey concepts above are eventually authored, each must open with a Leh-based acclimatisation day (or two) before any onward high-altitude leg — exactly matching the pattern `leh`'s own prepared content already establishes as mandatory.

## Ladakh DB operations performed

**NONE.** No Region, Destination, or Journey document referencing Ladakh was created, updated, or seeded anywhere. `config/ladakhFoundation.config.ts` is a new, local, uncommitted file with no import path into any script that touches the database.
