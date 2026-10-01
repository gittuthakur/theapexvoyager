# Phase 9 — General Batch-3 commercialization and winter foundation

## Phase 9A — executed owner decisions (current result)

The owner subsequently authorized `hotelCategoryDescription` for the two executable drafts, Dharamshala `endingCity = Pathankot`, and Grand Himachal local Dalhousie drop. Kinnaur was explicitly held without partial commercialization. This section supersedes the earlier Phase-9 pending-decision checkpoint below.

**Two commercial updates completed; zero publications. Both remain draft and return only `OWNER_APPROVAL_REQUIRED` from the existing readiness helper.**

| Field | Dharamshala McLeodganj Short Escape | Grand Himachal Circuit |
|---|---|---|
| Duration, unchanged | 3N/4D | 9N/10D |
| Starting From price | ₹10,999 per person, indicative | ₹29,999 per person, indicative |
| Occupancy | 2 adults / 1 room, double sharing | 2 adults / 1 room, double sharing |
| Pickup | Agreed Pathankot station/local point, timing confirmed | Agreed Chandigarh airport/station/local point, timing confirmed |
| Drop | Agreed Pathankot station/local point after Day-4 checkout | Local Dalhousie point after Day-10 checkout; onward transfers separately quoted |
| endingCity | Corrected to Pathankot | Dalhousie, unchanged |
| Hotel plan | Three Standard/Deluxe hotel-equivalent nights in Dharamshala/McLeod Ganj | Nine Standard/Deluxe hotel-equivalent nights: Shimla 2, Manali 3, Dharamshala 2, Dalhousie 2 |
| Meals | Three breakfasts and three dinners | Breakfast/dinner where operationally provided; exact written schedule before booking |
| Transport | Private cab for approved Pathankot return transfers and local motorable sightseeing | Private cab for approved Chandigarh-to-Dalhousie sectors; long Day-6 Manali–Dharamshala transfer explicit |
| Assigned image | `/images/destination-mcleod-ganj.jpg` | `/images/destination-dalhousie.jpg` |
| Cancellation | Public general policy verified; flag true | Public general policy verified; flag true |
| Remaining blockers | `OWNER_APPROVAL_REQUIRED` | `OWNER_APPROVAL_REQUIRED` |

These are indicative launch proposals, not supplier-verified guaranteed fares. Accommodation is a category, not named inventory or an invented star rating. Double-sharing/indicative wording is stored in approved commercial fields; `priceBasis` was not added because it was outside the allowlist. The existing Starting From rendering and price disclaimer were preserved. No public price appeared because both Journeys remain draft.

### Update and validation evidence

Tool: `scripts/preparePhase9ACommercialData.ts`; tests: `scripts/preparePhase9ACommercialData.test.ts`.

- Final preflight: **2 would update / 0 already correct / 0 refused / 0 conflicts**; both status draft.
- Execution: **2 updated / 0 already correct / 0 refused / 0 conflicts / 0 published**.
- Follow-up dry run: **0 would update / 2 already correct / 0 refused / 0 conflicts**.
- Source Destination paths were resolved from actual production records and checked locally and by HTTP 200 image responses. Both are geographically related, previously reviewed real curated photos with existing attribution.
- Region dependencies were valid, so no regionId correction was necessary.
- Transactions re-read complete target records and reject concurrent changes. Native `$set` modifies only the explicitly allowed fields and preserves timestamps. Draft document validation and commercial-readiness checks run before mutation.
- Every Journey was compared against the exact expected result. Status, slug, duration, itinerary, destinationSlugs and other protected fields remain unchanged. All other 38 Journey documents and all Destination/Region documents are unchanged.
- Kinnaur, all three winter drafts, Uttarakhand Honeymoon, other drafts, all 24 published Journeys and Ladakh are untouched. No Wikimedia image was downloaded or assigned.
- Focused Phase-9A tests: **4 passed**. Full suite: **97 files / 1,244 tests passed**. Typecheck: **PASS** (`tsc --noEmit --incremental false`). ESLint on both new TypeScript files: **PASS**. Build: **PASS**, 41 static pages generated. The first test/typecheck pass exposed a case-sensitive assertion and TypeScript-library compatibility errors; these were corrected before execution and checks rerun.

Machine-readable execution and idempotency evidence: `docs/phase-9a-verification.json`. Historical Phase-9 baseline evidence remains in `docs/phase-9-verification.json`.

Post-update public verification: **PASS**. All 24 published Journey pages return HTTP 200; all 16 drafts, including the two updated records and Kinnaur, return 404 and remain absent from public catalogue/sitemap. Journey sitemap count remains 24. All published Region and relevant Destination relationships pass; all eight Batch-2 pages retain correct rendered commercial content, prices, images, schema and mobile breadcrumbs. Ladakh remains isolated. Global state: **40 total / 24 published / 16 draft**.

**PHASE 9A COMPLETE — DHARAMSHALA AND GRAND HIMACHAL READY FOR FINAL OWNER PUBLICATION APPROVAL; KINNAUR SAFELY HELD**

### Kinnaur follow-up — no correction applied

The table distinguishes explicit destination text from a base inferred from consecutive days. The stored itinerary has no separate overnight field.

| Day | Start | End from stored text | Stated overnight/base |
|---|---|---|---|
| 1 | Shimla | Narkanda | Narkanda implied; no explicit overnight sentence |
| 2 | Narkanda | Sarahan | Sarahan implied |
| 3 | Sarahan | Sangla | Sangla implied |
| 4 | Sangla implied from Day 3 | Chitkul day trip, then “Sangla/Kalpa area” | **Unresolved: two possible return areas** |
| 5 | Not stated; depends on Day 4 | Kalpa sightseeing | Kalpa implied |
| 6 | Kalpa implied | “Return Toward Shimla”; “Begin the return journey” | **Unresolved: no final town or overnight base named** |
| 7 | Not stated; depends on Day 6 | “Onward departure”; endingCity metadata says Shimla | No overnight; exact final transfer is unspecified |

**Minimum proposed correction, for separate owner approval:** replace Day-4 description with “Day trip to Chitkul, then return to [owner-confirmed base] for the overnight stay.” Replace Day-6 description with “Drive from Kalpa to [owner-confirmed return-route base] for the overnight stay.” Clarify Day 7 as departure from Shimla if Night 6 is Shimla, or transfer from the selected Night-6 base to Shimla before departure. Confirm timing supports seven days/six nights and specify the implicit bases in the final accommodation allocation. Do not choose the bracketed towns without owner/operator confirmation. No duration or new sightseeing change is proposed.

Kinnaur status: **draft**. Price written: **NO**. ₹22,999 remains an internal approved planning proposal. All existing Kinnaur fields were preserved.

### Repository/deployment scope

Only Phase-9 tooling, tests and documentation are intended for preservation. No app route, rendering code, authoring Journey config, price disclaimer, HBX, Places, PlaceCache or transport-pricing implementation was changed. The approved database commercial update does not require an application deployment. No push/deployment or Journey publication is performed by this phase.

## Historical Phase-9 audit (before Phase 9A decisions)

Audit: 1 October 2026. Publication is not authorized. Production baseline: **40 total / 24 published / 16 draft**. Track B and Uttarakhand Honeymoon must remain commercially untouched.

## Track A: owner-approved indicative proposals

These are Starting From, per person onwards, indicative launch proposals for two adults sharing one room. They are not supplier-cost-verified fixed fares. Preserve the existing site price disclaimer. No MRP, discount or sale claim.

| Journey | Duration | Proposed price | Pickup / drop | Approved accommodation category | Meals | Transport |
|---|---|---:|---|---|---|---|
| kinnaur-valley-tour | 6N/7D | ₹22,999 | Shimla / Shimla | Standard/Deluxe hotel or guesthouse equivalent appropriate to route | Breakfast + dinner where operationally provided; exact meal schedule confirmed before booking | Private hill-road vehicle for itinerary-approved motorable sectors |
| dharamshala-mcleodganj-short-escape | 3N/4D | ₹10,999 | Pathankot / Pathankot | Standard/Deluxe hotel or equivalent | Breakfast + dinner | Private cab for approved road transfers and sightseeing |
| grand-himachal-circuit | 9N/10D | ₹29,999 | Chandigarh / proposed local Dalhousie drop, decision pending | Standard/Deluxe hotels or equivalent | Breakfast + dinner where operationally provided; exact meal schedule confirmed before booking | Private cab for approved road sectors |

### Kinnaur: overnight audit

Actual Day 1 ends Narkanda, Day 2 Sarahan, Day 3 Sangla, Day 4 says “back to the Sangla/Kalpa area”, Day 5 Kalpa, Day 6 “Return Toward Shimla” / “Begin the return journey”, Day 7 onward departure. Thus Nights 1–3 and 5 are reasonably derived as Narkanda, Sarahan, Sangla and Kalpa, but **Night 4 is a choice of area and Night 6 has no named overnight base**. Six nights are required; the stored itinerary does not resolve all six exactly.

Do not invent Kalpa for Night 4 or Shimla/Rampur/Narkanda for Night 6. Package is pending those owner/operator decisions before any commercial write. Accommodation selection and actual road access must then support the same 6N/7D duration.

Prepared road contingency wording: “Travel covers itinerary-approved motorable sectors, subject to current road and weather conditions. Chitkul and other affected sectors may require a revised plan. Any change to stops, accommodation, meals or price will be explained and agreed before confirmation; extra disruption costs are not automatically included.” This belongs in approved transport/inclusion/exclusion wording unless separate permission is given to modify importantNotes.

### Dharamshala: Pathankot basis

Day 1 is arrival/settling in Dharamshala, Days 2–3 are local visits, Day 4 is checkout/departure. A Pathankot transfer before Day-1 arrival and after Day-4 checkout fits this sequence without adding a night. Exact train/arrival times must leave sufficient transfer time; no fixed transfer duration is promised. Official tourism material identifies Pathankot as the nearby broad-gauge gateway, about 94 km from Dharamshala. [Tourism project report](https://himachaltourism.gov.in/wp-content/uploads/2024/07/7.-DDR-Dharamshala-Kangra-F.pdf).

Three nights remain within Dharamshala/McLeod Ganj; final hotel location is confirmed before booking. The old local-pickup price assumption is superseded by the owner's explicit ₹10,999 Pathankot-return proposal. This does not imply supplier cost verification.

Stored startingCity already says Pathankot; endingCity still says Dharamshala. Permission was requested to align endingCity because it falls outside the explicit field allowlist. No itinerary rewrite is needed for the transfer basis itself.

### Grand Himachal: endpoint and Day 6

Derived nights: Shimla 2, Manali 3, Dharamshala 2, Dalhousie 2 = nine. Day 9 is a Khajjiar/Chamera day trip from the Dalhousie base; Day 10 says checkout/depart. Existing endingCity is Dalhousie. **Proposed drop: a confirmed local point in Dalhousie.** No Pathankot/Chandigarh return leg is stored. Reported to the owner before any commercial write; onward transport would require a separate quote.

Day 6 is explicitly Manali–Dharamshala, with no additional sightseeing scheduled that day. Day 7 has the McLeod Ganj visits. The route is a substantial intercity drive; official tourism project material gives approximately 252 km between the towns. Treat it as a dedicated transfer day, with an early departure, rest stops and actual road/driver timing confirmed. No inherent contradiction requiring a route STOP was found; this is not a guarantee of feasibility on every date. [Official tourism project report](https://himachaltourism.gov.in/wp-content/uploads/2024/07/IEE-Convention-Centre-Dharamshala-110724.pdf).

### Accommodation field scope

The owner approved categories, but the production allowlist omits `hotelCategoryDescription`. Actual records have no hotel plan, and the helper requires either that field or stayOptions. Permission was requested for `hotelCategoryDescription`; inventing priced stayOptions or treating inclusion text as clearing the blocker would be incorrect.

### Prepared package-specific inclusions/exclusions

All three use two adults / one double-sharing room. Hotel names, star ratings, room views and availability are not invented.

- **Kinnaur inclusions, pending night decisions:** six nights in the approved hotel/guesthouse category at confirmed overnight bases; breakfast/dinner where operationally provided with a written meal schedule; Shimla-return private hill-road transport; motorable transfers for Narkanda, Sarahan, Sangla, Chitkul and Kalpa visits subject to access. **Exclusions:** air/train travel to Shimla; unlisted meals, personal costs, entrance tickets and guides; porter/trek services, activities, restricted/local-union transport unless listed; off-route extensions and separately agreed disruption services. No Spiti extension or guaranteed Chitkul access.
- **Dharamshala inclusions:** three hotel nights; three breakfasts and three dinners; agreed Pathankot pickup/return transfers; private cab for the approved Dharamshala/McLeod Ganj road sightseeing. **Exclusions:** air/train fare; lunch, personal costs, entry tickets, guides and activities; porter/trek services or Triund trip; restricted/local-union vehicles not listed; Dalhousie/Khajjiar extensions; any service not explicitly included. Exact Pathankot station/location and timings confirmed before booking.
- **Grand Himachal inclusions, pending drop decision:** nine hotel nights distributed 2/3/2/2; breakfast/dinner where operationally provided with a written schedule; Chandigarh pickup, approved intercity transfers and local motorable sightseeing; local Dalhousie drop if approved. **Exclusions:** air/train fare; personal expenses, unlisted meals, entrance tickets, guides and paid activities; Rohtang/Atal Tunnel extensions, restricted/local-union transport unless approved; onward transport beyond the agreed endpoint; separately agreed additional disruption services. No unlimited cab use or guaranteed Solang/Khajjiar access.

General cancellation policy was rechecked publicly, HTTP 200, and covers Journeys with booking-specific terms. `usesGeneralCancellationPolicy = true` is appropriate for fully resolved Track-A packages under those terms; it does not promise fixed percentages, full refunds or free rescheduling. No flag has yet been written in this phase.

### Track-A image checks

Resolved paths from the actual related Destination records, then checked local existence and production HTTP 200, image/jpeg and nonzero content. Existing provenance and visual review establish route relevance. No filename was inferred and no assignment has yet been applied.

| Journey | Source Destination | Actual path | Result |
|---|---|---|---|
| Kinnaur | Sangla Valley | `/images/destination-sangla-valley.jpg` | PASS, real related valley photo |
| Dharamshala | McLeod Ganj | `/images/destination-mcleod-ganj.jpg` | PASS, real related monastery photo |
| Grand Himachal | Dalhousie | `/images/destination-dalhousie.jpg` | PASS, real route-stop photo |

## Track B: winter operational foundation only

No winter commercial price, image, status or other field is authorized for mutation. All operational allocations below are inferred from the stored sequence, not booked inventory.

### Spiti Winter — 6N/7D

- Entry: Shimla → Kalpa → Nako transit → Tabo → Kaza.
- Return: Kaza → toward Kalpa → Shimla. No Manali exit is used.
- Nights: Kalpa 1, Tabo 1, Kaza 3, **return-route Night 6 unspecified**. “Toward Kalpa” is not proof of a booked Kalpa overnight.
- Kunzum/Manali appear as an explicitly excluded winter exit in the stored content. No Chandratal visit appears in the actual itinerary. No summer-pass dependency was found.
- Altitude progression: climbs from Shimla to the Kinnaur highlands, crosses the higher Nako sector before Tabo, then sleeps higher in Kaza and may visit higher side villages. It is not a continuously gradual ascent. Multiple Kaza nights do not establish medical suitability or guarantee acclimatization. Supplier must specify exact overnight/side-trip elevations and a qualified assessment process without blanket fitness promises. The district identifies Tabo at roughly 3,049 m and Key Monastery around 4,115 m. [District monastery information](https://hplahaulspiti.nic.in/monasteries-in-spiti/) and [tourist places](https://hplahaulspiti.nic.in/tourist-places/).
- Long sectors: Shimla–Kalpa, Kalpa–Tabo, return from Kaza toward Kalpa and onward to Shimla. Actual departure times, rest stops, daylight, fuel and road conditions must be validated by the operator.
- Six nights contain no dedicated closure buffer. Decide spare days, extra-night funding, turnaround triggers and missed onward-connection handling before sale.

The district's [access guide](https://hplahaulspiti.nic.in/how-to-reach/) describes the Kinnaur approach separately from the winter-closed Kunzum connection. Its general information is not a winter-2026–27 clearance. No guarantee of access, snowfall, connectivity, power, water, weather or medical suitability.

**Exact supplier decisions:** named winter-operating stays for all six nights; confirmed Night 6; room/toilet/water arrangements; safe heating method and fuel/power backup; exact vehicle and winter equipment; driver winter-route experience and duty schedule; support/communications plan; traveller assessment and qualified medical advice where appropriate; road-status checks and departure/turnaround authority; emergency/return plan; spare days and written disruption cost terms; any traveller-specific permits. No answers fabricated.

### Kashmir Winter — 4N/5D

Stored sequence implies Srinagar 1N → Gulmarg 2N → Pahalgam 1N → Srinagar departure. Day 1 says houseboat stay **where available**; it does not establish an unconditional houseboat inclusion. Two Gulmarg nights are supported by Days 2–3, not day excursions back to Srinagar.

Commercially coherent options for later approval:

1. One confirmed winter-operating Srinagar houseboat night, two Gulmarg hotel nights, one Pahalgam hotel night, with heating/facilities and any water-transfer costs explicitly confirmed.
2. One Srinagar hotel night plus the same Gulmarg/Pahalgam nights. Before selling this basis, revise the houseboat-focused highlight/Day-1 presentation through an authorized copy change; do not silently substitute a hotel while promising a houseboat.

Confirm safe heating and backup at every property; exact airport timing and Day-5 Pahalgam–airport buffer; permitted main vehicle sectors, current local-union restrictions, who supplies/pays for any Tangmarg/Gulmarg snow vehicle and Pahalgam local vehicle. Current Gondola/skiing references describe opportunities, not approved paid inclusions. Tickets, activities, equipment, instructors, sledging and snow vehicles remain excluded pending explicit later approval. No snowfall, road/flight or Gondola operation guarantee.

### Gulmarg Winter — 3N/4D

Day 1 arrives through Srinagar and transfers to Gulmarg; Days 2–3 remain there; Day 4 returns through Srinagar. Thus **all three nights are implied in Gulmarg**. Srinagar is a transport gateway, not a stored overnight. A late-flight Srinagar night would change the basis and must be approved rather than silently inserted.

Confirm airport transfer windows, early departure/flight buffers, property and heating, main-cab boundary, local-union requirements and whether weather requires a specialist local snow vehicle. Exact vehicle rules/charges depend on current operations; no unsupported fixed rule or tariff is assumed.

Gondola tickets, skiing, snowboarding, equipment, instructors, sledging and local snow vehicles are excluded unless later explicitly approved. Day 2 currently mentions a Gondola ride: later commercial presentation must clearly identify it as optional/separately paid, or approve and cost the inclusion. No snow or operation guarantee.

### Winter price status

Spiti ₹29,999; Kashmir Winter ₹21,999; Gulmarg Winter ₹19,999 remain **Phase-8 internal proposals only**, not approved selling prices. No production price write.

## Winter image candidate research

Research-only shortlist; no image added to the project, no asset assigned. Source-page identity/license checked on 1 October 2026. Preview fetch failed for two candidates, so visual suitability/crop review remains outstanding and no candidate is claimed as a completed image assignment.

| Journey | Candidate / depicted location | Source and author | License | Commercial reuse / modification | Attribution / confidence / owner selection |
|---|---|---|---|---|---|
| Spiti Winter | SPITI IN WINTER; Spiti river/valley, source coordinates 32.208999, 78.078388; February 2018, 4608×3456 | [Commons source page](https://commons.wikimedia.org/wiki/File:SPITI_IN_WINTER.jpg), Konu-9712, own work | CC BY-SA 4.0 | Yes / yes, subject to terms | Credit author, source and license; identify edits and retain share-alike for derivative. Medium: location/date/license evidence, visual/crop review pending. Owner selection pending |
| Kashmir Winter | Snowfall In Gulmarg; source identifies Gulmarg, February 2024, 4096×3072 | [Commons source page](https://commons.wikimedia.org/wiki/File:Snowfall_In_Gulmarg.jpg), Koshur, own work | CC BY-SA 4.0 | Yes / yes, subject to terms | Same credit/license/change/share-alike requirements. Medium pending visual review. Use a Gulmarg caption, not Srinagar/Pahalgam. Owner selection pending |
| Gulmarg Winter | Snowfall In Gulmarg; same candidate as above | [Commons source page](https://commons.wikimedia.org/wiki/File:Snowfall_In_Gulmarg.jpg), Koshur | CC BY-SA 4.0 | Yes / yes, subject to terms | Same requirements. Shared use is possible if owner selects it; no exclusivity claim |
| Gulmarg Winter, alternate | Snow in Gulmarg, Kashmir; chairlift/Gondola snow scene, March 2013, 4864×2024 | [Commons source page](https://commons.wikimedia.org/wiki/File:Snow_in_Gulmarg,_Kashmir.jpg), Nitin Ticku, own work | CC BY-SA 3.0 | Yes / yes, subject to terms | Author/source/license credit and derivative share-alike. Medium; March date means no claim it documents December–February. Visual/crop review pending |

License conditions: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) permits commercial sharing/adaptation with attribution and share-alike conditions. Before importing any selection, preserve exact author/title/source/license and edit notes in `docs/image-sources.md` and `/photo-credits`, and identify the derivative license. Recheck file history and actual rendered composition. Do not alter snow/season or portray the photograph as current conditions.

Rejected/deferred research examples: “Snow capped Gulmarg during snowfall” has a visible-watermark notice; “Snow white gulmarg” is dated June and is weak evidence for the requested winter season; Copernicus's lack-of-snow comparison is satellite analysis, not a suitable destination hero. Owner-supplied originals are an alternative only with place/date and reuse permission established. No generic snowy mountains, competitor photos, Google Places/HBX imagery or AI documentary substitutes.

**OWNER WINTER IMAGE REQUIRED / selection unresolved:** `spiti-winter-expedition`, `kashmir-winter-snow-tour`, `gulmarg-winter-escape`. Rights-documented candidates exist, but none is yet selected, visually approved, attributed in the project or assigned.

## Current blockers and decisions

The actual drafts lack price, hotel plan, transport, occupancy, pickup, drop, meals, inclusions, exclusions, cancellation confirmation and owner publication approval. Track B retains these truthful unresolved fields plus winter-image/operational issues. Uttarakhand Honeymoon remains HOLD, without price, image assignment or commercial mutation.

Pending owner replies before Track-A execution:

1. Permit `hotelCategoryDescription` for resolved Track-A records, outside the original field allowlist.
2. Confirm Kinnaur Night 4 and Night 6, or leave that package pending.
3. Approve proposed local Dalhousie drop for Grand Himachal, or leave it pending.
4. Permit Dharamshala endingCity correction to Pathankot, outside the original field allowlist.

No unresolved decision will be filled with a guess merely to clear readiness. Final execution/check results will be recorded after these decisions.

### Exact readiness-helper output

Every one of the six Track-A/Track-B records currently returns:

`MISSING_PRICE`, `MISSING_HOTEL_PLAN`, `MISSING_TRANSPORT_PLAN`, `MISSING_OCCUPANCY`, `MISSING_PICKUP_INFO`, `MISSING_DROP_INFO`, `MISSING_MEAL_PLAN`, `MISSING_INCLUSIONS`, `MISSING_EXCLUSIONS`, `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`, `OWNER_APPROVAL_REQUIRED`.

Imagery and operational decisions are additional issues outside this helper. The proposed document content does not clear production blockers. Per-slug output and production checks are in [phase-9-verification.json](phase-9-verification.json).

## Execution checkpoint — awaiting owner replies

- Track-A mutation dry run: not executed; the prerequisite decision review has not passed.
- Updated: 0. Idempotent skips: not evaluated. Deferred: 3. Write/concurrency conflicts: not evaluated because no writes were attempted. Published: 0.
- No commercial update script or speculative production execution was created while the required decisions remain pending.
- Global counts: **40 total / 24 published / 16 draft**. Sitemap: **24**. All 24 live Journey URLs return 200; all 16 draft URLs, including Track A and B, return 404 without public listing/sitemap leaks.
- Region/Destination relationships, Ladakh isolation and the eight Batch-2 rendered pages pass the existing read-only regression checks.
- Uttarakhand Honeymoon HOLD confirmed: **YES**, commercially untouched. Winter prices remain internal proposals only: **YES**.
- HBX / Google Places / PlaceCache / transport pricing / existing published Journeys / other drafts / Ladakh untouched: **YES**. IndexNow: **DEFERRED**.
- Code/config changes in Phase 9: none. Focused/full tests, typecheck, lint and build: not rerun for this documentation-only checkpoint; Phase-8 results are not represented as new Phase-9 test runs.
- Phase-9 report and verification JSON remain local, uncommitted. No new push/deployment. Earlier Phase-8 documents and all unrelated working-tree changes remain untouched.

**STOP — Track-A writes await accommodation-field authorization, Kinnaur Night-4/Night-6 decisions, Grand Himachal drop confirmation and Dharamshala endpoint metadata decision.** Winter operational/image research is prepared for review; no production commercialization or publication is claimed.
