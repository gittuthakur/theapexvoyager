# Phase 6 — Batch 2 Commercialization, Image Assignment, Visible Breadcrumbs

Continues from Phase 5. Applies owner-approved commercial data to the 8 Batch 2 Journey drafts and adds a visible breadcrumb trail to Journey detail pages (affecting all 16 live + these 8 drafts alike). **All 8 target Journeys remain `status: 'draft'` — none were published.**

## 1. Batch 2 Commercial Matrix

| Package | Duration | Price | Occupancy | Accommodation | Meals | Transport | Pickup | Drop | Image | Region | Inclusions | Exclusions | Remaining blocker | Ready for publication approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Shimla Short Escape | 2N/3D | ₹7,999 | Double sharing (2/1) | Standard/Deluxe or equivalent | B+D (MAP) | Private cab | Chandigarh | Chandigarh | `destination-shimla.jpg` | Himachal Pradesh | 4 | 6 | OWNER_APPROVAL_REQUIRED | YES |
| Manali Short Escape | 3N/4D | ₹8,999 | Double sharing (2/1) | Standard/Deluxe or equivalent | B+D (MAP) | Private cab | Chandigarh | Chandigarh | `destination-manali.jpg` | Himachal Pradesh | 5 | 6 | OWNER_APPROVAL_REQUIRED | YES |
| Kasol Manikaran Weekend | 2N/3D | ₹6,999 | Double sharing (2/1) | Standard hotel/guesthouse or equivalent | B+D (MAP) | Shared/package-dependent (no private cab claimed) | Bhuntar | Bhuntar | `destination-kasol.jpg` | Himachal Pradesh | 4 | 5 | OWNER_APPROVAL_REQUIRED | YES |
| Dalhousie Khajjiar Chamba | 4N/5D | ₹10,999 | Double sharing (2/1) | Standard/Deluxe or equivalent | B+D (MAP) | Private cab | Pathankot | Chamba (one-way) | `destination-dalhousie.jpg` | Himachal Pradesh | 4 | 5 | OWNER_APPROVAL_REQUIRED | YES |
| Bir Billing Palampur | 3N/4D | ₹9,999 | Double sharing (2/1) | Standard/Deluxe or equivalent | B+D (MAP) | Private cab (excl. paragliding) | Dharamshala | Palampur (one-way) | `destination-bir-billing.jpg` | Himachal Pradesh | 4 | 6 | OWNER_APPROVAL_REQUIRED | YES |
| Mussoorie Weekend | 2N/3D | ₹7,999 | Double sharing (2/1) | Standard/Deluxe or equivalent | B+D (MAP) | Private cab | Dehradun | Dehradun | `destination-mussoorie.jpg` | Uttarakhand | 4 | 4 | OWNER_APPROVAL_REQUIRED | YES |
| Valley of Flowers / Hemkund Sahib Trek | 5N/6D | ₹12,999 | Double sharing (2/1) | Standard hotel (Joshimath) + basic trek-lodge (Ghangaria) | B+D (MAP), not implied on trek days | Road (Joshimath–Govindghat only); rest on foot | **Joshimath** (flagged — see below) | **Joshimath** (flagged) | `destination-hemkund-sahib.jpg` | Uttarakhand | 4 | 7 | OWNER_APPROVAL_REQUIRED | YES |
| Rishikesh Adventure Package | 3N/4D | ₹8,999 | Double sharing (2/1) | Standard/Deluxe or equivalent | B+D (MAP) | Private cab (excl. rafting/activities) | Dehradun | Dehradun | `destination-rishikesh.jpg` | Uttarakhand | 4 | 6 | OWNER_APPROVAL_REQUIRED | YES |

All 8: `minTravellers: 2`, `roomsIncluded: 1` (the model's own documented double-sharing convention, unchanged semantics), `usesGeneralCancellationPolicy: true` (verified applicable — see Section 5), `getCommercialBlockers()` resolves to exactly `['OWNER_APPROVAL_REQUIRED']`.

## 2. Flagged conflict — Valley of Flowers / Hemkund Sahib Trek

Per this phase's explicit "do not repeat the Phase 4A problem" instruction, the itinerary was checked before assigning pickup/drop. `startingCity`/`endingCity` say **Rishikesh**, but the actual Day 1/Day 6 itinerary text begins and ends in **Joshimath** (~250km away, no transfer narrated) — the same class of mismatch found and resolved for other packages in Phase 4B. Pickup/drop were set to **Joshimath** (itinerary-supported), not Rishikesh. Flagged in `importantNotes` for explicit owner confirmation: a Rishikesh-to-Joshimath road transfer is not part of this itinerary or its starting price, and would need separate confirmation and pricing if the intent was genuinely a Rishikesh-origin package.

## 3. Package-specific safety applied

- **Manali Short Escape**: Rohtang Pass/Atal Tunnel, local-union/RTO transport, and Solang snow activities are excluded, never implied included.
- **Kasol Manikaran Weekend**: transport basis is "Shared/package-dependent" — private cab is explicitly NOT claimed at this ₹6,999 starting price; no adventure activities implied.
- **Dalhousie Khajjiar Chamba**: kept as the real one-way Pathankot→Chamba route; no seasonal/weather-dependent activity promised.
- **Bir Billing Palampur**: paragliding is excluded (weather/licensed-operator dependent, quoted separately), never claimed included merely because Bir Billing is known for it.
- **Mussoorie Weekend**: pickup/drop kept at Dehradun (the itinerary's own already-correct gateway) — no Delhi pickup fabricated.
- **Valley of Flowers / Hemkund Sahib**: trek-lodge accommodation at Ghangaria is explicitly never called "Deluxe"; trail opening, weather, access, pony/porter, helicopter, and medical fitness are all explicitly not guaranteed; road transport is explicitly scoped to the Joshimath–Govindghat sector only, distinct from the on-foot trek sectors.
- **Rishikesh Adventure Package**: rafting and other adventure-activity charges are excluded (seasonal, water-level and operator dependent, quoted separately); no safety guarantee is made or implied for any activity.

## 4. SEO Differentiation (re-verified against the 16 live Journeys)

| Package | Compared against | Result | Reason |
|---|---|---|---|
| Shimla Short Escape | Shimla Manali Tour Package, Honeymoon in Hills | PASS | Single-destination 2N/3D short-break vs multi-city circuits |
| Manali Short Escape | Manali Premium Escape | PASS | Shorter tier (3N/4D vs 5D/4N), different category (Sightseeing vs Adventure), already-authored distinct framing |
| Kasol Manikaran Weekend | Kasol Kheerganga Tosh | PASS | Explicitly non-trekking, adds Manikaran, distinct from the trek-focused sibling |
| Dalhousie Khajjiar Chamba | Himachal Family Escape (Dharamshala Dalhousie Escape) | PASS | Adds Chamba (not in the live package), Dalhousie-anchored vs Dharamshala-anchored |
| Bir Billing Palampur | (none — zero destination overlap with any live package) | PASS | Entirely new destinations |
| Mussoorie Weekend | Uttarakhand Explorer, Nainital Corbett Mussoorie Tour | PASS | Single-destination weekend vs both live multi-stop packages |
| Valley of Flowers / Hemkund Sahib Trek | (none — zero existing coverage) | PASS | Unique trek product |
| Rishikesh Adventure Package | Uttarakhand Explorer | PASS | Adventure/rafting framing vs the live spiritually-framed package |

No package required a STOP — every one remains meaningfully distinct by route, duration, audience, or intent, consistent with the Phase 5 cannibalisation analysis that originally proposed this batch.

## 5. Cancellation

Re-verified (not re-assumed): `https://www.theapexvoyager.in/cancellation-policy` returns `200`, is not disallowed by `robots.txt`, and its content explicitly covers "journeys" in general, case-by-case terms with no fixed percentages. `usesGeneralCancellationPolicy: true` applied to exactly these 8, via the same verified mechanism `lib/journeyCommercialReadiness.ts` already uses (Phase 4B) — no new percentage invented, no blocker suppressed.

## 6. Visible Breadcrumbs

**Finding (Phase 5):** every Journey page already emitted a valid `BreadcrumbList` JSON-LD, but no page rendered an equivalent visible trail.

**Implemented:** `components/ui/Breadcrumb.tsx` — a small, reusable component (`<nav aria-label="Breadcrumb"><ol>...</ol></nav>`, semantic list markup, `flex-wrap` for mobile with no horizontal overflow, the current page's own item rendered as plain text with `aria-current="page"`, never a self-link). Wired into `JourneyHero.tsx` (via `DetailHero`'s pre-existing, previously-unused `breadcrumb` prop) and `PackageDetailContent.tsx`, which builds the one real, always-true hierarchy — **Home → Journeys → [this journey's own visible title]** — using the exact same `heroTitleOverride ?? pkg.name` value already used for the H1. `app/journeys/[slug]/page.tsx`'s `BreadcrumbList` JSON-LD was also corrected to use this same `visibleTitle` for its final item (previously used the internal `pkg.name`, which differs from the visible H1 for the 3 SEO-overridden live packages) — the visible trail and the structured data now always agree.

This applies to **all 16 live Journeys and all drafts alike** (it's part of the shared `JourneyHero`/`PackageDetailContent` component, not scoped to just these 8) — regression-verified against the live site (see the in-conversation final report).

## 7. Owner Decisions Still Required

1. **Valley of Flowers / Hemkund Sahib Trek's Rishikesh gateway** — confirm whether a Rishikesh-to-Joshimath road transfer should be bundled into the package (requiring separate pricing) or left as a traveller's own responsibility, with Joshimath remaining the actual pickup/drop point.
2. **Final publication approval** for all 8 (this phase prepares commercial readiness only — `OWNER_APPROVAL_REQUIRED` remains by design).
