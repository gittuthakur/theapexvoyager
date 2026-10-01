# Phase 10 — Kinnaur completion and winter decisions

## Scope and housekeeping

The owner authorized a Kinnaur-only draft route/commercial update after validation. No Journey publication, winter mutation or winter image import is authorized. Production started at 40 Journeys: 26 published and 14 draft.

Housekeeping commit **452f5c7 — Preserve Phase 9B publication tooling** contains exactly:

- `scripts/publishPhase9BJourneys.ts`
- `scripts/publishPhase9BJourneys.test.ts`
- `docs/phase-9b-publication.md`
- `docs/phase-9b-verification.json`

The four files were inspected, checked for credential patterns and staged explicitly. No environment files, credentials, unrelated code, generated files or Phase-10 work entered that commit. It remains local: no push or deployment was authorized for this new commit. Production remains on the earlier Phase-9B deployment of `4a19c43`. Historical Phase-9B reports describe the state at that phase's completion.

Phase-10 files are the read-only source auditor, Kinnaur updater and tests, this report and its verification JSON. Pre-existing HBX/booking/UI/analytics work and older Phase-8 reports remain untouched. `next-env.d.ts` and `tsconfig.tsbuildinfo` are pre-existing generated changes; temporary catalogue snapshots/browser research remain outside the repository and are excluded from commits.

## Kinnaur source-of-truth audit

Fresh production records were read before preparing mutations. The complete Journey and its six related published Destinations were inspected.

- Title: **Kinnaur Valley Tour**; slug `kinnaur-valley-tour`; status draft; duration **6 Nights / 7 Days**.
- startingCity and endingCity: **Shimla / Shimla**.
- Stored overview describes a Kinnaur-only circuit via Narkanda and Sarahan into the Baspa Valley, avoiding a Spiti extension. Its existing lower-altitude/permit-free comparison was read and preserved; this audit does not independently certify blanket permit exemptions.
- Highlights: Sarahan's Bhimakali Temple, Sangla/Chitkul and Kalpa's Kinner Kailash views. Important note expressly excludes continuing into Spiti.
- Best-time copy describes March–June and September–November, with possible winter road disruption.
- Destination relationships: `shimla`, `narkanda`, `sarahan`, `sangla-valley`, `chitkul`, `kinnaur`. All six are published in Himachal Pradesh. Kalpa is explicitly represented within the published Kinnaur Destination's places; no new Kalpa slug or Destination is needed.
- Before update: no price, image, hotel plan, pickup/drop, meal plan, transport, occupancy or cancellation flag; inclusions/exclusions and stay/transport options were empty. No supplier quotation or inventory was present.
- Other source text, including booking-process and importantNotes fields, is outside the allowlist and remains unchanged.

| Day | Exact stored title and description before correction | Stored overnight interpretation |
|---|---|---|
| 1 | Shimla to Narkanda — Drive to Narkanda, a highway hill town. | Narkanda implied |
| 2 | Narkanda to Sarahan — Continue to Sarahan to see the Bhimakali Temple. | Sarahan implied |
| 3 | Sarahan to Sangla — Drive into the Baspa valley to Sangla. | Sangla implied |
| 4 | Chitkul Day Trip — Day trip to Chitkul and back to the Sangla/Kalpa area. | Ambiguous Sangla/Kalpa |
| 5 | Kalpa — Kalpa sightseeing, with views toward the Kinner Kailash range where weather allows. | Kalpa implied |
| 6 | Return Toward Shimla — Begin the return journey. | Unspecified |
| 7 | Departure — Onward departure. | No night; Shimla endpoint in metadata |

### Route judgment

**KINNAUR_ROUTE_CORRECTION_RECOMMENDED.** The proposed structure resolves ambiguity without materially redesigning the package. Day 4 already allows Kalpa, so arriving there that evening makes Day 5's starting point consistent. Day 6 moves back along the existing Shimla approach to Narkanda; Day 7 completes the return to the existing Shimla endpoint. Six nights remain six nights, with no new sightseeing or Spiti sector.

Related project data places Narkanda on the Shimla approach, Sarahan at the Kinnaur gateway and Sangla below Chitkul in the Baspa Valley. The [Kinnaur district route material](https://hpkinnaur.nic.in/adventures/) also describes Sangla/Chitkul and Kalpa as linked route stops; the [district Kalpa page](https://hpkinnaur.nic.in/tourist-place/kalpa/) supports Kalpa's location. This supports route compatibility, not guaranteed driving times or current road clearance. Day 4 needs departure time for the Chitkul excursion and onward drive; Day 6 is a dedicated return transfer. Exact timing and access remain operator-confirmed.

| Day | Approved route | Overnight |
|---|---|---|
| 1 | Shimla → Narkanda | Narkanda |
| 2 | Narkanda → Sarahan | Sarahan |
| 3 | Sarahan → Sangla | Sangla |
| 4 | Sangla → Chitkul → back through Sangla → Kalpa | Kalpa |
| 5 | Kalpa sightseeing | Kalpa |
| 6 | Kalpa → Narkanda | Narkanda |
| 7 | Narkanda → Shimla departure/drop | None |

### Exact authorized itinerary correction

Only Day-4/6/7 titles and descriptions are updated. Days 1–3 and 5, every day number, every subdocument ID and all unrelated metadata remain unchanged. Night 5 is made explicit in the accommodation plan without rewriting its already-compatible sightseeing text.

- **Day 4 — Sangla to Chitkul to Kalpa:** Travel from Sangla to Chitkul, subject to road and weather conditions, then return through Sangla and continue to Kalpa. Overnight in Kalpa.
- **Day 6 — Kalpa to Narkanda:** Begin the return toward Shimla, driving from Kalpa to Narkanda. Overnight in Narkanda.
- **Day 7 — Narkanda to Shimla Departure:** Drive from Narkanda to Shimla for the agreed departure/drop.

## Kinnaur commercial basis

| Field | Owner-approved value |
|---|---|
| Starting From | ₹22,999 per person onwards, indicative; two adults / one double-sharing room |
| Pickup/drop | Agreed local Shimla points; Day-1 departure and Day-7 onward timing confirmed |
| Accommodation | Six nights: Narkanda 2 (Nights 1/6), Sarahan 1, Sangla 1, Kalpa 2 (Nights 4/5); Standard/Deluxe hotel or guesthouse equivalents |
| Meals | Breakfast and dinner where operationally provided; exact written meal schedule before booking |
| Transport | Private hill-road vehicle for approved motorable sectors and sightseeing transfers; agreed itinerary only |
| Inclusions | Approved six-night accommodation, meal schedule, private Shimla-return transport and approved motorable sightseeing transfers |
| Exclusions | Air/train fare, personal expenses, unlisted meals, tickets/activities, guides/porters/treks, unapproved restricted/local-union vehicles, off-route/Spiti extensions, extra vehicle use and unlisted services |
| Disruption | Weather, road conditions, local restrictions, landslides and temporary closures may require confirmed changes; additional services/costs are not automatically included |
| Image | `/images/destination-sangla-valley.jpg`, resolved from actual Sangla Valley Destination data |
| Cancellation | Existing general Journey cancellation policy, subject to its booking-specific terms; no invented refund percentages |

The image exists locally, was visually inspected and shows a real forested Sangla valley landscape. Existing provenance credits [“Sangla Valley,” Pushkar Prashar, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Sangla_Valley.jpg) in `docs/image-sources.md`; its production asset and public credits were rechecked. It illustrates an actual itinerary area, not a promised winter condition. No filename was guessed. No external image was imported.

The update script defaults to dry run, permits only the exact draft, rejects unexpected route/commercial values and applies only the owner's allowed fields. It validates the draft and exercises published-document validation in memory, without persisting published status. A transaction re-reads the entire target to detect concurrent edits. Postchecks compare every Journey, Destination and Region against the exact expected result, preserving timestamps and all non-target records.

**Executed successfully at 2026-10-01 16:31:38 UTC.** Preflight: 1 would update / 0 already correct / 0 refused / 0 conflicts. Execution: 1 updated / 0 refused / 0 conflicts / 0 published. Follow-up dry run: 0 would update / 1 already correct / 0 refused / 0 conflicts. Actual Kinnaur status remains draft, price is 22999, and the only blocker is OWNER_APPROVAL_REQUIRED. Starting/ending cities and regionId already matched and required no value change. Whole-document comparison from the initial audit through completion confirms all other 39 Journeys and every Destination/Region unchanged; Kinnaur timestamps and protected fields are unchanged.

## Winter decision sheets — no production changes

All prices below remain internal proposals. Suggested commercial bases use two adults / one double-sharing room so the owner can compare them consistently. Supplier rates, heating charges, transport boundaries and disruption costs are not available; no profitability or availability conclusion is made.

### Spiti Winter Expedition

**6N/7D**, Shimla → Kalpa → Nako transit → Tabo → Kaza → return toward Kalpa → Shimla. Stored Days 1–5 imply Kalpa 1 night, Tabo 1 night and Kaza 3 nights. Day 6 only says return toward Kalpa; Night 6 is genuinely unspecified. Day 7 says departure via Shimla. All stored winter notes retain the Shimla/Kinnaur approach and exclude the Manali/Kunzum exit.

**Recommended Night 6: Kalpa, subject to supplier confirmation.** It is the return town expressly named in Day 6 and the already-used outbound base. Approximate route logic: Kaza back through the Tabo/Nako/Sutlej corridor toward Kalpa, then Kalpa to Shimla on Day 7. This is a long return sector, not an additional sightseeing day. Six nights still fit arithmetically (Kalpa 2, Tabo 1, Kaza 3), but actual winter drive feasibility and a winter-operating Kalpa stay must be confirmed. If the operator cannot support that sector within daylight and driver limits, revise the duration or redistribute days through a separate owner decision; do not insert a made-up town to clear validation.

The [district access guide](https://hplahaulspiti.nic.in/how-to-reach/) distinguishes the Kinnaur/Sumdo approach from the winter-closed Kunzum connection. Its general route information is not a clearance for a particular departure.

| Decision field | Proposed basis / exact unresolved requirement |
|---|---|
| Pickup/drop | Agreed Shimla local points, with onward-connection buffer |
| Hotel | Six confirmed winter-operating hotel/guesthouse nights at the stated bases; supplier names, room type, toilets and dates required |
| Heating | Confirm heating method, operating hours, charges, safe operation/ventilation and fuel/power backup for each property; no blanket “heated rooms” promise |
| Water | Confirm drinking water, hot-water schedule, washroom arrangements and frozen-pipe alternatives at each stay |
| Meals | Propose breakfast/dinner under a written six-night schedule; confirm availability and dietary limits |
| Vehicle/driver | Supplier to specify winter-suitable vehicle class and drivetrain, luggage/seating, tyres/chains/recovery equipment, fuel plan, driver experience and duty/rest limits |
| Included services | Proposed stays, confirmed meal plan and approved road sectors; only specifically documented basic support |
| Exclusions | Travel to/from Shimla, unlisted meals/personal costs, tickets/paid activities, guides/porters, unapproved local vehicles and separately agreed disruption services |
| Road disruption | Identify road-status checker, departure/no-go/turnaround authority and confirmation deadlines |
| Buffer/alternatives | Six nights have no dedicated closure buffer. Owner/operator must decide spare days, alternate stays, extra-night payer, rerouting/refund terms and missed onward-connection handling |
| Basic support | Confirm named local contact, communications limitations, first-aid competence/equipment, nearest-help and evacuation arrangements and cost responsibility; do not imply uncontracted rescue services |
| Altitude advisory | Publish overnight/side-trip elevations and an honest ascent profile; ask travellers to seek qualified medical advice on suitability, especially with relevant conditions; operator needs a symptom-response and descent plan |

The [CDC altitude guidance](https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html) supports gradual acclimatization and individualized assessment. Fitness or prior successful travel does not guarantee protection. This decision sheet does not prescribe medication or certify the itinerary medically safe.

**Price proposal: ₹29,999. Result: REVISE BEFORE APPROVAL.** The six-night architecture is coherent if Kalpa is confirmed, but the return sector, heating, vehicle/support costs and absence of a buffer prevent a complete saleable basis. “Revise” means resolve and cost those services; it does not assert a particular replacement price.

### Kashmir Winter Snow Tour

**4N/5D.** Actual sequence: Day 1 Srinagar arrival with houseboat “where available”; Day 2 transfer to Gulmarg; Day 3 further Gulmarg day; Day 4 transfer to Pahalgam; Day 5 return via Srinagar. This supports **Srinagar 1 / Gulmarg 2 / Pahalgam 1**. Both accommodation options fit the route and night count; neither is selected here.

| Field | Option A — all hotels | Option B — one houseboat night |
|---|---|---|
| Allocation | Srinagar hotel 1, Gulmarg hotel 2, Pahalgam hotel 1 | Srinagar winter-operating houseboat 1, Gulmarg hotel 2, Pahalgam hotel 1 |
| Copy implication | Owner must authorize later adjustment of the houseboat-focused highlight and Day-1 wording to match hotel basis | Retain only once a named, available winter houseboat and facilities are confirmed; no unconditional substitution promise |
| Heating/water | Confirm room heating method/hours, extra charges, backup and hot water at all three bases | Same hotel requirements plus houseboat room/bathroom heating, water/power reliability and safe boarding/access |
| Transport | Agreed Srinagar Airport pickup, Gulmarg/Pahalgam transfers and airport drop; vehicle operating boundary confirmed | Same road plan plus exact boarding point, luggage handling and any required water-transfer scope/cost |
| Price risk | Heated Gulmarg rooms for two nights, peak-date rates and snow/local transport surcharges | Same risks plus winter houseboat premium, heating and transfers; not assumed cheaper |
| Airport timing | Arrival must allow first-night check-in; Day-5 Pahalgam-to-airport timing must accommodate actual roads and flight requirements | Same Day-5 constraint; arrival also must allow houseboat boarding/transfer operation |

For both: propose double sharing, breakfast/dinner according to the confirmed four-night schedule, and private approved road transfers. Included services would be four approved nights, those meals and agreed transfers only. Exclude airfare/train fare, personal costs, unlisted meals, entry tickets, Gondola, snow activities/equipment/instructors, local-union vehicles and local snow vehicles unless explicitly costed and approved later. Confirm who arranges/pays if a transfer requires such a vehicle; an exclusion must not conceal an unavoidable unquoted connection. No snow, Gondola operation or road guarantee.

**Price proposal: ₹21,999. Result: REVISE BEFORE APPROVAL** for both options until an option is chosen and costed. Four nights and three bases are internally consistent, but houseboat choice, heated Gulmarg inventory and required transport extras can materially change the basis. Day-5 flight timing may make an extra night necessary; that is a separate route/price decision.

### Gulmarg Winter Escape

**3N/4D.** Day 1 arrives via Srinagar and transfers to Gulmarg; Days 2–3 remain in Gulmarg; Day 4 returns via Srinagar. Thus **all three nights are Gulmarg**. Srinagar is the gateway, not an overnight base.

- Proposed pickup/drop: **Srinagar Airport → Gulmarg → Srinagar Airport**, compatible with existing Srinagar metadata; exact arrival/departure windows require supplier confirmation.
- Hotel: three nights in a confirmed winter-operating Gulmarg hotel, double sharing for two adults/one room; property category, heating, hot water and backup must be specified.
- Meals: propose **three breakfasts and three dinners**, subject to property confirmation and arrival/departure timing; otherwise approve an exact revised written schedule before pricing.
- Transport: airport and approved motorable road transfers, with clear main-cab boundaries. Do not describe the cab as unlimited or promise access to snow-restricted sectors.
- Proposed inclusions: three approved hotel nights, confirmed meals and stated road transfers only.
- Exclusions: airfare/train fare, personal expenses, unlisted meals, tickets, **Gondola, skiing, snowboarding, ski equipment, instructor, sledging, local snow vehicle and other paid activities**, plus unapproved local-union transport and disruption extras.
- Day 2 currently describes a Gondola ride. Before commercialization, owner must authorize optional/separately paid wording so it matches these exclusions; do not quietly sell the current copy as an included ticket.
- Largest cost uncertainty: three heated Gulmarg hotel nights plus winter transfer charges. Operational uncertainty: road access, flight windows, lift/activity operation and local vehicle requirements. No snowfall guarantee. A late-flight Srinagar stay would change the approved three-night basis.

**Price proposal: ₹19,999. Result: COHERENT FOR OWNER APPROVAL**, as a conditional three-night land-package structure excluding paid snow activities. This is not price approval, a supplier quote or evidence of profitability. Named stay/meal/transfer rates and the Gondola wording decision are still required before any production commercial write.

## Winter image visual and license review

Source pages and license deeds were rechecked on 1 October 2026. All three images were visually viewed in their Commons source pages using a browser after the web preview fetch failed. No originals were downloaded, no winter assets were added, and no winter Journey image field changed. Review observations concern the displayed source previews, not an exhaustive full-resolution pixel audit.

| Candidate | Location/season and resolution | Visual judgment | License |
|---|---|---|---|
| [SPITI IN WINTER](https://commons.wikimedia.org/wiki/File:SPITI_IN_WINTER.jpg), Konu-9712 | Spiti river/valley; February 2018; 4608×3456 | **REJECT CANDIDATE** for hero use as supplied: obvious bottom-left “Shot on OnePlus” watermark; snow-striped mountains but a largely bare riverbed/open river. Do not label it a frozen river. | CC BY-SA 4.0 |
| [Snowfall In Gulmarg](https://commons.wikimedia.org/wiki/File:Snowfall_In_Gulmarg.jpg), Koshur | Gulmarg; February 2024; 4096×3072 | **APPROVE CANDIDATE** for owner selection: clear snow-covered foreground, conifers and blue sky; no obvious watermark in preview. Small people are visible. A landscape crop is plausible; test mobile focus and text contrast. Photograph shows snow cover, not active falling snow. | CC BY-SA 4.0 |
| [Snow in Gulmarg, Kashmir](https://commons.wikimedia.org/wiki/File:Snow_in_Gulmarg,_Kashmir.jpg), Nitin Ticku | Gulmarg chairlift/Gondola scene; March 2013; 4864×2024 | **NEEDS OWNER VISUAL REVIEW**: wide but grey, flat snowfield with faint lift infrastructure; no obvious watermark in preview. Weak mobile crop/contrast compared with Koshur. Do not present its March date as December–February evidence. | CC BY-SA 3.0 |

Koshur's image can represent the Gulmarg leg of Kashmir Winter or Gulmarg Winter itself. Caption it as Gulmarg, never Srinagar/Pahalgam or current conditions. Approval here is a suitability recommendation only; **OWNER WINTER IMAGE SELECTION REQUIRED: YES**. Spiti needs a replacement candidate or an owner-supplied original with source/place/reuse permission.

Both [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) permit commercial use and modification under their terms. Preserve creator/title/source/license credits, license links and required notices; record changes. Adapted image derivatives must carry the applicable same/share-alike license. Use the same version for a straightforward implementation. Do not add restrictions that negate those rights or imply photographer endorsement. The image license does not automatically license unrelated site code, copy or photographs.

### Implementation plan — proposal only

After owner image selection, preserve the source revision/date and original attribution data in `docs/image-sources.md`, record actual crop/resize/format changes and license the derivative accordingly. Add a visible photo credit beside/below the hero or a clearly linked credit at that location, plus the full entry on `/photo-credits`. Cover any new image on cards through an accessible image-credit link. Alt text alone and repository-only documentation are insufficient public attribution.

| Candidate | Proposed local filename, only if selected later | Exact proposed public credit |
|---|---|---|
| Spiti candidate, rejected | No import planned; do not reserve an asset for this rejected source | If reconsidered separately: “SPITI IN WINTER” — Konu-9712, via Wikimedia Commons, CC BY-SA 4.0; describe actual modifications. |
| Koshur, suitable for Kashmir/Gulmarg | `public/images/winter-gulmarg-koshur.jpg` (one shared asset) | “Snowfall In Gulmarg” — Koshur, via Wikimedia Commons, CC BY-SA 4.0. Cropped/resized for display [only if performed]; derivative CC BY-SA 4.0. |
| Nitin Ticku alternate | `public/images/winter-gulmarg-nitin-ticku.jpg` | “Snow in Gulmarg, Kashmir” — Nitin Ticku, via Wikimedia Commons, CC BY-SA 3.0. Cropped/resized for display [only if performed]; derivative CC BY-SA 3.0. |

Link each title to its source URL in the review table and each license to `https://creativecommons.org/licenses/by-sa/4.0/` or `https://creativecommons.org/licenses/by-sa/3.0/` as applicable. Retain any existing change notices. Do not populate an attribution entry as though the image were installed until implementation actually occurs. Cropping/creative alteration should be treated as a licensed derivative; simple format conversion does not justify dropping credits. No download, image implementation or attribution UI change occurred in Phase 10.

## Exact owner/supplier decisions still required

1. **Spiti Night 6:** approve Kalpa only after the operator confirms Day-6 Kaza–Kalpa and Day-7 Kalpa–Shimla daylight/driver feasibility; otherwise approve revised duration/day allocation.
2. **Spiti stays:** identify and price winter-operating properties/room categories for Kalpa 2, Tabo 1 and Kaza 3 nights on the intended dates.
3. **Spiti heating/water:** confirm heating method, hours, fees, safe operation, power/fuel backup, drinking/hot water and toilets at each stay.
4. **Spiti vehicle/driver:** choose class/drivetrain/seating, winter equipment and a driver with relevant route experience; confirm duty/rest/fuel plan.
5. **Spiti disruptions:** designate road-check and no-go/turnaround responsibility; decide buffer days, alternatives, extra-night costs and missed-connection terms.
6. **Spiti support/advisory:** contract the actual contact/communications/first-aid/emergency support; approve altitude/ascent advisory and qualified assessment process without medical guarantees.
7. **Spiti price:** approve/revise ₹29,999 only after items 1–6 and meal schedule are costed; obtain a replacement image for separate selection.
8. **Kashmir accommodation:** choose Option A hotels or Option B one Srinagar houseboat; authorize later copy alignment, especially for Option A.
9. **Kashmir facilities/meals:** confirm property dates, heating/hot water/backup and meal schedule; for Option B also boarding/access/water-transfer costs.
10. **Kashmir transfers/flights:** confirm airport windows, Day-5 Pahalgam return buffer, vehicle boundaries and who supplies/pays for any required local/snow vehicle.
11. **Kashmir price:** approve/revise ₹21,999 against the selected option and supplier rates, retaining Gondola/snow activities/local-union transport exclusions unless separately approved.
12. **Gulmarg basis:** approve three Gulmarg hotel nights, proposed three breakfasts/dinners and Srinagar Airport return transfers; obtain heating/water and transport quotes.
13. **Gulmarg wording/activities:** authorize Day-2 Gondola to be clearly optional/separately paid; retain the exact paid-activity exclusions above unless separately costed and approved.
14. **Gulmarg price:** approve/revise ₹19,999 using confirmed room/meal/transfer rates and flight windows; no silent Srinagar night addition.
15. **Winter images:** choose Koshur for either/both Kashmir and Gulmarg or review the Nitin alternate; approve public attribution and derivative-license implementation. Choose a replacement for Spiti. Image selection remains separate from commercial/publication approval.
16. **Publication:** Kinnaur still needs separate final publication approval; all winter products remain draft pending later commercial and publication decisions.

## Final verification

- Actual production: **40 total / 26 published / 14 draft**. Public catalogue and Journey sitemap: **26 each**.
- All 26 published Journey URLs return HTTP 200. All 14 draft URLs, including Kinnaur and winter products, return genuine HTTP 404 and are absent from catalogue/sitemap. Published Region APIs and the six Kinnaur Destination relationships also exclude drafts. **DRAFT LEAK: PASS**.
- Kinnaur remains draft and commercially content-complete; no publication was performed.
- Winter products remain byte-for-byte unchanged, with no production prices or images. Uttarakhand Honeymoon remains unchanged HOLD/draft, with no price/image/publication.
- Ladakh: Region draft; eight Destinations (leh, nubra-valley, pangong-lake, turtuk, hanle, tso-moriri, kargil, lamayuru) draft and 404; five Journeys (leh-nubra-pangong-tour, leh-nubra-pangong-turtuk-tour, leh-nubra-pangong-hanle-tour, ladakh-hanle-tso-moriri-tour, srinagar-leh-ladakh-tour) draft and 404. No public leak; all documents unchanged.
- Existing 26 published Journey documents unchanged. HBX, Google Places, PlaceCache and transport pricing untouched. IndexNow deferred.
- Focused tests: **5 passed**. Full suite: **99 files / 1,251 tests passed**. Typecheck, changed-file ESLint and production build: **PASS**; build generated 41 static pages. An initial typecheck/build caught a helper return-type issue in the test; it was corrected and focused tests/typecheck/lint/build passed afterward. Full-suite runtime behavior is unchanged by that type-only fix.
- Local broad checks include the pre-existing working tree; unrelated work has not been committed, pushed or deployed. Only the four Phase-9B files are in housekeeping commit 452f5c7. Phase-10 files remain local/uncommitted.
- Supporting source records, exact post-update Kinnaur content and checks: [phase-10-verification.json](phase-10-verification.json).

PHASE 10 COMPLETE ? KINNAUR READY FOR FINAL PUBLICATION APPROVAL; WINTER PRODUCTS READY FOR OWNER/SUPPLIER DECISIONS
