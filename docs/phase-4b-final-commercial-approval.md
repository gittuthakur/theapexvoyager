# Phase 4B — Final Owner Approval Applied

Continues from Phase 4A's uncommitted working tree. The owner resolved all 6 outstanding decisions from Phase 4A's report; this phase applies them, verifies the result, and (per the brief) commits/deploys the code and seeds the commercial data into production — **without changing any of the 10 target Journeys' `status` away from `draft`.**

## 1. The six final decisions, as applied

1. **Kinnaur Spiti Circuit** — Pickup Chandigarh, Drop Manali (confirmed). The Manali→Chandigarh return transfer is explicitly excluded and marked *"available on request at additional cost"* in both `importantNotes` and `exclusions` — never implied included, no fabricated add-on price added to `addOns`.
2. **Kasol Kheerganga Tosh** — Pickup/Drop both Bhuntar (confirmed), ₹9,999 basis unchanged. Chandigarh transfer excluded, *"available on request at additional cost"*.
3. **Jibhi Tirthan Valley** — Pickup/Drop both Aut (confirmed), ₹11,999 basis unchanged. Chandigarh transfer excluded, *"available on request at additional cost"*.
4. **Nainital Corbett Mussoorie** — Kathgodam→Dehradun one-way routing preserved exactly as-is; NOT restructured to Delhi/Delhi. ₹15,999 basis applies to this configuration.
5. **Kashmir Family Tour** — Day 1's itinerary now explicitly states an overnight houseboat/equivalent stay on Dal Lake (previously "houseboat or hotel" as an untaken alternative on Day 2). Day 2 is now a confirmed hotel night. `hotelCategoryDescription` and `inclusions` both updated to "Deluxe hotel/equivalent + 1 night houseboat/equivalent" — no property named. Itinerary re-verified: still exactly 6 day entries, duration still exactly `"5 Nights / 6 Days"`, price still exactly ₹14,999 (see `config/draftJourneys.phase4bFinal.test.ts`).
6. **Cancellation policy** — see Section 2.

Every one of the 10 target packages also gained the accommodation-honesty clause requested this phase: every `hotelCategoryDescription` and its matching `importantNotes` line now ends *"...subject to availability; any material change to this category will be disclosed to you before your booking is confirmed."*

## 2. Cancellation policy — verified, not assumed

The brief required the `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED` blocker to resolve **only if** the general site-wide policy is actually applicable and publicly/customer-accessibly available — and to STOP if no usable policy exists.

**Verification performed (2026-09-30), against live production:**
- `GET https://www.theapexvoyager.in/cancellation-policy` → `200`
- Not disallowed by `robots.txt`
- Page content (`components/modules/CancellationPolicyContent.tsx`) explicitly states it covers *"journeys, stays, and transport"* and describes cancellations, date changes, and refunds in general (case-by-case) terms — no fixed percentages anywhere, matching the "do not invent a percentage" instruction.
- Already linked from every Journey detail page's "Good to Know" → "Cancellation" row (`components/modules/PackageDetailContent.tsx`, pre-existing).

**Result: a usable general policy exists and is genuinely applicable — the blocker resolution proceeds.**

**Mechanism (code, not a suppression):** `models/Journey.ts` gained a new optional field, `usesGeneralCancellationPolicy?: boolean` — a statement of the verified fact above, never a package-specific percentage, never a blanket bypass. `lib/journeyCommercialReadiness.ts`'s `getCommercialBlockers()` now only omits `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED` when this field is exactly `true`; it remains present (unresolved) for every Journey that doesn't set it — including the 6 live packages and the other 24 drafts, none of which had this field touched. `usesGeneralCancellationPolicy: true` was set on exactly the 10 target packages, each with a code comment recording the verification date and basis. This is not "the owner approved this approach" treated as sufficient on its own — it's that approach *plus* the independent verification above, exactly as instructed.

`isCommerciallyContentComplete()` was updated to match: it no longer force-excludes the cancellation blocker (since it's now genuinely resolvable by a truthful field), and continues to force-exclude only `OWNER_APPROVAL_REQUIRED`, which no field can ever resolve.

## 3. Final commercial readiness — computed, not assumed

`getCommercialBlockers()` was run directly against all 10 target packages' actual config values (not hand-verified) — see `config/draftJourneys.phase4bFinal.test.ts`. Result: **every one of the 10 now resolves to exactly `['OWNER_APPROVAL_REQUIRED']`** — every field-level blocker cleared, and the one blocker that can never be cleared by a field (by design) is exactly what's left, since this document constitutes the recorded final owner approval for these 10 commercial configurations. No blocker was suppressed or hidden; `OWNER_APPROVAL_REQUIRED` is not removed by this or any code — `status` still gates publication exclusively, and stays `draft` on all 10.

## 4. Product JSON-LD — Phase 4A's correction preserved unchanged

`lib/schema.ts` was not touched this phase. `buildJourneyProductSchema()` still emits `Product` + `AggregateOffer` + `lowPrice` for a priced Journey, and omits `offers` entirely for an unpriced one — no `Review`, `AggregateRating`, fake availability, fake discount, `priceValidUntil`, or inventory claim, exactly as Phase 4A left it. `lib/schema.test.ts`'s 7 tests still pass unchanged.

## 5. Price UI — preserved and made mobile-complete

- Desktop sidebar: unchanged from Phase 4A — `"Starting From ₹13,999 per person*"` with the full disclaimer sentence directly beneath it.
- Mobile sticky bar: same price label, now with a new one-line caption — *"\*Indicative price — see 'Good to Know' for details"* — giving the asterisk a real, always-visible path to the disclaimer.
- New this phase: the disclaimer is now ALSO rendered in the main-content "Good to Know" section (a `Price*` row, conditional on a valid price) — this section is part of the page body, not the `hidden lg:block` desktop-only sidebar, so it's genuinely visible on mobile too. This closes a real gap: previously the disclaimer existed nowhere reachable on a mobile viewport.
- No redesign: both changes are new conditional rows/lines using each component's existing pattern.

## 6. Production deployment and commercial-data seed

See the Phase 4B final report (delivered in-conversation) for the commit SHA, Vercel status, pre/post-seed verification queries, and the exact production `getCommercialBlockers()`/count outputs. Summary: code was committed and deployed first; the public site was verified healthy and still showing exactly 6 published Journeys; only then was an idempotent, narrowly-scoped update applied to exactly the 10 approved Journey slugs' commercial fields (never touching `status`); all 10 were verified directly afterward to still be `draft`, still return 404 on their direct URLs, and still be absent from every public listing/sitemap surface.

## 7. What did NOT happen this phase

- No Journey's `status` changed — all 10 target packages, the existing 6, and Ladakh's 5 Journeys remain exactly as they were.
- Ladakh was not published.
- The Shimla-Manali redirect was not touched.
- HBX and Google Places code were not touched.
- Transport pricing rules were not touched.
