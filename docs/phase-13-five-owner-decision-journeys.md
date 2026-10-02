# Phase 13 — Five draft Journey owner decisions

## Result and authority

All five targets remain draft. No commercial or publication write is authorized or implemented. None can become publication-ready from owner approval alone: supplier costing, route/transfer details and image selection/credit work remain. Immediate next publication batch: **0**; projected live count: **28 → 28**.

Initial HEAD and remotely queried origin/main: `d1381b7f42d29aa9828c12939adfa2bc5609c487`; Phase 12 implementation `bd5861cf6faba7fff011024d1c6ffaed5e4c7577` is in its history. Existing unrelated working changes, including HBX, were excluded.

The fresh production query returned 40 Journeys, 28 published and 12 draft. Exact targets:

1. `auli-tour`
2. `badrinath-yatra`
3. `dharamshala-mcleodganj-dalhousie-khajjiar-circuit`
4. `kedarnath-yatra`
5. `uttarakhand-honeymoon-circuit` — resolved by production `name = Uttarakhand Honeymoon Circuit` and cross-checked against Phase 12.

Sources: actual production documents in [verification JSON](phase-13-five-owner-decision-verification.json), [Phase 12 audit](phase-12-remaining-drafts-master-readiness.md), Phase 2B/2C and Phase 4 decision documents, repository Phase 8 proposal material, `docs/image-sources.md`, and the current Journey metadata implementation. Phase 8 files were already untracked local artifacts: they are historical proposal evidence only and are not included in this commit. The ₹17,999 history is independently recorded in committed Phase 12 evidence and the owner's Phase 13 request.

No new numerical price is invented. For four targets no target-specific price proposal exists in the reviewed source. The recommendation is to obtain a costed route and occupancy basis first. For Honeymoon, ₹17,999 is retained only as the historical discussion target, not a cost-validated recommendation or approval. Sibling live prices are comparison data, not transferable supplier costs. Price confidence is LOW for all five; no margin or profitability claim is made.

## Current stored commercial inventory

Every target has `status=draft`, `inclusions=[]`, `exclusions=[]`, `stayOptions=[]`, `transportOptions=[]`, `seasonalPricing=[]` and `addOns=[]`. All lack `price`, `priceBasis`, `pickupInfo`, `dropInfo`, `mealPlan`, `transportType`, `minTravellers`, `roomsIncluded`, `hotelCategoryDescription`, `image`, and `usesGeneralCancellationPolicy`. A missing value is not zero, free service or an approved exclusion. No current pricing qualifier is stored.

All five have a published Region and published referenced Destinations. Dharamshala belongs to Himachal Pradesh; the other four belong to Uttarakhand. Unlike the Ladakh drafts, taxonomy status is not their blocker. The verification JSON contains each complete source record, resolved region/destination status, full day-wise itinerary, and readiness blockers. Common blockers: missing price, hotel plan, transport plan, occupancy, pickup/drop, meals, inclusions/exclusions, cancellation-policy applicability, image and final owner approval.

## Route and night matrix

“Implied” is an audit interpretation, not a booked overnight. Every declared day count matches its itinerary length. No duration change is proposed.

| Target | Duration / days / required nights | Explicit overnight locations | Implied allocation | Unresolved nights / route | Gate |
|---|---|---|---|---|---|
| Auli | 3N/4D / 4 / 3 | Joshimath called usual base; no numbered nights | Nights 1–3 around Joshimath/Auli | All three exact bases unspecified; Rishikesh metadata but Day 1 starts Joshimath; Day 4 does not describe Rishikesh return | ROUTE FIX REQUIRED |
| Badrinath | 3N/4D / 4 / 3 | Day 2 calls Joshimath usual overnight base | Night 2 Joshimath; other nights undetermined | Nights 1 and 3 unresolved; Badrinath stay is not promised; Haridwar metadata conflicts with Haridwar/Dehradun option | ROUTE FIX REQUIRED |
| Dharamshala circuit | 6N/7D / 7 / 6 | No explicit numbered stay allocation | Dharamshala/McLeod Ganj 3N + Dalhousie 3N | Arithmetic fits; six actual stays and Pathankot arrival transfer unconfirmed; Dalhousie is stored end, not Pathankot | ROUTE FIX REQUIRED |
| Kedarnath | 4N/5D / 5 / 4 | Guptkashi/Sonprayag called usual overnight bases | Access base before/after shrine; overnight near shrine on Day 3 only implied by next-day return | Night 1 and 3 not allocated; exact base choice for Nights 2/4 unconfirmed; Haridwar/Dehradun gateway ambiguous | ROUTE FIX REQUIRED |
| Uttarakhand Honeymoon | 4N/5D / 5 / 4 | No explicit overnight statements | Mussoorie 2N + Nainital 2N | No arithmetic gap; Dehradun arrival and Kathgodam drop absent from daily copy; Day 3 timing requires operator confirmation | ROUTE FIX REQUIRED for complete saleable gateway-to-gateway service; internal two-town night pattern coherent |

## Owner decision packs

### Auli Tour — `auli-tour`

- **Current route:** metadata Rishikesh → Rishikesh; Day 1 Joshimath arrival, Day 2 Auli excursion, Day 3 Auli/Joshimath, Day 4 unspecified return. Duration 3N/4D.
- **Recommended interpretation for approval:** retain the focused Auli product without Chopta/Tungnath. Resolve whether Rishikesh transfers are included; if retained, operator must demonstrate Day 1/4 transfer timing within four days. Allocate each of three nights between actual Joshimath/Auli stays. Do not substitute a new gateway or invent a stay.
- **Price/basis:** current absent; no documented previous target price; recommendation pending supplier costing and owner decision on party size, room sharing and season. LOW confidence.
- **Hotel/meals:** category, bases, dates, room count and meal schedule undecided. Do not import the live Auli–Chopta package's services.
- **Pickup/drop/transport:** city metadata Rishikesh at both ends; exact point/time, vehicle class, private/shared basis and local vehicle scope require approval and supplier cost.
- **Inclusions:** none approved. Cost the selected three nights and agreed transfers/meals before making a list.
- **Proposed exclusions:** paid ropeway, skiing, snow activities, equipment/instructors and local vehicles unless expressly costed into a later quote; travel to/from agreed endpoints, personal expenses and unlisted services. No blanket exclusion may conceal a mandatory local transfer cost.
- **Activity evidence:** ropeway appears in Day 2 and highlights; skiing, snow activities and local vehicles do not appear as included services. Proposed Day-2 wording: “Explore Auli's meadow views. Any ropeway ride is optional, separately payable and subject to operation and conditions; snow is not guaranteed.” This is proposal text, not a stored correction.
- **Image:** existing Auli photo is a candidate, not assigned. Owner must accept its snow scene for the selected season and crop.
- **Supplier/operational dependencies:** stays, meals, vehicles, transfer feasibility, local access and paid activities. No road, snow or ropeway-operation guarantee. Cannot finalize without supplier confirmation.
- **Owner decisions:** retain the single-destination distinction, approve gateways, all three nights, season, occupancy, costed services, price and visual.
- **Readiness:** MULTIPLE BLOCKERS — route, costing, image, owner approval; moderate overlap risk.

### Badrinath Yatra — `badrinath-yatra`

- **Current route:** Haridwar → travel toward Badrinath → Joshimath → Badrinath temple → unspecified return to Haridwar metadata; Day 1 also permits Dehradun. Duration 3N/4D.
- **Recommended interpretation for approval:** focused single-shrine road pilgrimage. Choose the actual gateway, specify Night 1, confirm Joshimath Night 2, and decide Night 3 plus Day-4 return. No Badrinath overnight can be inferred from a temple visit. Pipalkoti is absent from source; do not add it.
- **Price/basis:** absent; no previous target price found. Obtain seasonal supplier costs and approve occupancy before a numerical proposal. LOW confidence.
- **Hotel/meals:** overnight bases, category and meals undecided. **Pickup/drop:** Haridwar metadata only, exact services unresolved. **Transport:** private/shared, vehicle class and daily timing unconfirmed.
- **Inclusions:** none approved. **Proposed exclusions:** travel to/from agreed endpoints, personal expenses, special temple services/paid guides, and unlisted services; exact service boundaries require approval.
- **Content correction proposal:** “Visit Badrinath temple subject to official opening, local access and conditions; darshan timing and queue duration are not guaranteed.” Stored road-accessible wording describes route type, not current road availability. Review the broader short-description/highlight wording before publication; no copy changed here.
- **Image:** shrine photo available as a candidate; it does not demonstrate current temple opening or darshan availability.
- **Supplier/operational dependencies:** exact yatra dates, temple access, stays, road transport and return timing. No opening, weather, road, queue or darshan promise. Cannot finalize without supplier confirmation.
- **Owner decisions:** gateway, three overnight bases, single-shrine positioning, seasonal service basis, price, visual and policy applicability.
- **Readiness:** MULTIPLE BLOCKERS — route, costing, image and owner approval.

### Dharamshala McLeodganj Dalhousie Khajjiar Circuit — `dharamshala-mcleodganj-dalhousie-khajjiar-circuit`

- **Current route:** Pathankot metadata → Dharamshala/McLeod Ganj Days 1–3 → Dalhousie Days 4–5 → Khajjiar/Chamera excursion Day 6 → Day-7 departure; ending city Dalhousie. Duration 6N/7D.
- **Recommended interpretation for approval:** 3N Dharamshala/McLeod Ganj + 3N Dalhousie as an explicit slower-paced option, subject to selected stays. Confirm Day-1 Pathankot transfer and Dalhousie drop scope. A return to Pathankot is not currently supported and must not be silently added.
- **Price/basis:** absent; no previous numerical proposal found. Price the full seven-day vehicle and six-night plan first; LOW confidence.
- **Hotel/meals:** categories and schedules absent. **Pickup/drop:** Pathankot → Dalhousie metadata, exact points/times unconfirmed. **Transport:** private/shared basis and daily sectors unconfirmed.
- **Inclusions:** none approved. **Proposed exclusions:** paid guides, admission/activity tickets, endpoint travel, personal expenses and unlisted services.
- **Differentiation:** live Himachal Family Escape already includes McLeod Ganj, Dalai Lama Temple, Bhagsu, Dalhousie, Khajjiar and Chamera. Calling McLeod Ganj a new destination is not defensible. The real potential distinction is two extra nights and less compressed days. The live Short Escape already contains the same first three days. Owner must approve the incremental time/stay value and distinct copy; no borrowed transport or hotel assumptions.
- **Image:** monastery corridor is geographically relevant to one stop, but weak as a whole-circuit hero; select an accurately captioned lead stop image or acquire a documented alternative.
- **Supplier/operational dependencies:** six-night room allocation, meals, gateway transfer and full vehicle schedule. No guaranteed road/weather access. Cannot finalize without supplier confirmation.
- **Owner decisions:** retain or defer the longer variant, substantiate added value, confirm gateway/drop, stay split, services, price and hero.
- **Readiness:** MULTIPLE BLOCKERS; primary DUPLICATION REVIEW REQUIRED, plus route/costing/image.

### Kedarnath Yatra — `kedarnath-yatra`

- **Current route:** Haridwar metadata (Day 1 also Dehradun) → Guptkashi/Sonprayag → shrine via trek or separately booked helicopter → return to Guptkashi/Sonprayag → departure; 4N/5D.
- **Recommended interpretation for approval:** single-shrine pilgrimage with an explicit road-access segment and separate onward access arrangements. Confirm all four overnight bases and actual trek start, transfer points, timing and support. Day 3/4 implies an overnight around the shrine but does not confirm a stay. No assumed same-day ascent/descent or heli booking.
- **Source references:** Guptkashi, Sonprayag, Gaurikund, trek and helicopter are present. Sitapur, pony, palki and local shuttle are absent. Their absence is not evidence that they are free or included.
- **Price/basis:** absent; no previous target price found. Quote only after overnight and access-mode costing; LOW confidence.
- **Hotel/meals:** access-base and shrine accommodation, room standard, meals and operating availability unresolved. **Pickup/drop:** Haridwar city metadata only. **Transport:** vehicle may cover only confirmed permitted road sectors; do not describe a private drive to the shrine.
- **Inclusions:** none approved. **Proposed exclusions:** helicopter, pony, palki, local shuttle, guide/porter unless expressly costed and approved; endpoint travel, personal expenses and unlisted services. If a local shuttle is mandatory for the chosen plan, resolve its cost/responsibility before approval rather than hiding it as an unspecified extra.
- **Content correction proposal:** “Reach the confirmed permitted road transfer point, then continue using the separately agreed trek/access arrangements. Helicopter travel is optional only where separately booked and operational. Access and darshan are not guaranteed.” Exact points remain supplier decisions, not new route facts.
- **Image:** shrine/pilgrim scene is a candidate; crop and credit require approval.
- **Supplier/operational dependencies:** seasonal access, permitted road endpoints, transfer/trek schedule, overnight capacity, support, closures, and cost responsibility. No helicopter, weather, access or darshan guarantee. Cannot finalize without supplier confirmation.
- **Owner decisions:** gateway, trek versus optional helicopter boundary, all four nights, actual vehicle scope, costed services, price, image and booking terms.
- **Readiness:** MULTIPLE BLOCKERS — route, access/operator plan, costing, image and owner approval.

### Uttarakhand Honeymoon Circuit — `uttarakhand-honeymoon-circuit`

- **Current route:** Dehradun metadata → Mussoorie Days 1–2 → Nainital Days 3–4 → Kathgodam metadata; Day 1 only says arrival in Mussoorie and Day 5 only departure. Duration 4N/5D; implied 2N Mussoorie + 2N Nainital.
- **Recommended interpretation for approval:** a standard couple-focused two-town circuit, with the long Day-3 transfer disclosed. Verify Dehradun–Mussoorie and Nainital–Kathgodam services. No “relaxed” promise for the transfer day.
- **Price/basis:** current absent. Previous ₹17,999 per person onwards remains unapproved and LOW confidence. Historical discussion basis: two paying adults, one double-sharing room, four nights, breakfast and private intercity/local transfers. These are proposals, not stored services or supplier confirmation. Recommend re-costing this historical target before owner price approval.
- **Hotel/meals:** historical proposal was standard double room with four breakfasts; no suite, view or dinner promise. Actual category/availability and meals unconfirmed.
- **Pickup/drop:** city metadata Dehradun → Kathgodam. Historical airport/rail pickup and railway drop were proposals only; exact point, times and cost need approval. **Transport:** historical private-transfer proposal only; production has no private/shared basis.
- **Inclusions:** none approved. **Proposed exclusions:** boating, cake, flowers/decor, candlelight dinner and upgrades unless expressly approved; endpoint travel, personal expenses and unlisted services. No honeymoon freebies exist in source.
- **Minimal wording proposal:** “Optional, separately payable boating on Naini Lake, subject to local operation, plus local viewpoints.” Do not make boating a base inclusion.
- **Image:** Mall Road candidate depicts an actual route stop, not romantic accommodation; visual is busy/soft and owner may prefer a separately reviewed Nainital candidate or commission a better place image.
- **Supplier/operational dependencies:** four hotel nights, meal costs, private/shared vehicle decision, long Day-3 feasibility, gateway schedules, paid boating and any separately approved couple service. Cannot finalize without supplier confirmation.
- **Owner decisions:** retain honest couple positioning or approve a real differentiated service; approve route transfers, occupancy, costed meals/hotel/vehicle, revisited price and image. No invented romantic benefit.
- **Readiness:** MULTIPLE BLOCKERS — differentiation, costing, gateway content and image.

## Duplication and title/meta review

The verification JSON compares each target against **all 28 published Journeys** (140 comparisons), retaining name, duration, description, route metadata and shared destinations. Destination intersection is a screening aid: the live Family Escape visits McLeod Ganj in its daily text even though its destination list omits it. Full itinerary review of the nearest products informed this table.

| Target | Closest live / other overlap | Duration overlap | Intent and commercial distinction | Title/meta recommendation; risk |
|---|---|---|---|---|
| Auli | `auli-chopta-tungnath-tour`; Joshimath/Auli overlap | 4D vs 6D | Single destination without Chopta/Tungnath trek; price/stay distinction uncosted | Emphasize “Auli & Joshimath, 4 days”; avoid snow/ropeway promises. MODERATE |
| Badrinath | `kedarnath-badrinath-yatra`, `char-dham-yatra` | 4D vs 7D/10D | One shrine and no Kedarnath trek; seasonal road pilgrimage | State single-shrine 4-day scope; avoid “always accessible” or guaranteed darshan. MODERATE |
| Dharamshala circuit | `dharamshala-dalhousie-escape`, `dharamshala-mcleodganj-short-escape`, `dalhousie-khajjiar-chamba`, `grand-himachal-circuit` | 7D vs 5D/4D/5D/10D | Same core circuit as Family Escape; two extra nights, dedicated local time only | Distinguish 7-day pace and actual stay/service value. Existing live SEO title already targets Dharamshala/Dalhousie/Khajjiar. HIGH |
| Kedarnath | `kedarnath-badrinath-yatra`, `char-dham-yatra` | 5D vs 7D/10D | Single shrine and separate trek/access plan; no Badrinath | State 5-day single-shrine itinerary and conditional access; no guaranteed helicopter. MODERATE |
| Honeymoon | `nainital-corbett-mussoorie-tour`, `mussoorie-weekend`, `uttarakhand-explorer` | 5D vs 6D/3D/6D | Two towns/two nights each, no Corbett/spiritual extension; couple framing alone is weak commercial differentiation | Emphasize Mussoorie–Nainital 5-day couple circuit; do not promise decor/luxury. HIGH |

Current titles are production `name`; current short descriptions are captured verbatim. Journey metadata uses a curated override for the live Family Escape and fallback package title/short description for other slugs (`app/journeys/[slug]/page.tsx`). Draft URLs remain 404: no draft metadata is exposed. No title/meta/code changes were made to public pages, and no product was merged/deleted.

## Image audit

Every current target `image` is absent: current file/URL, watermark, geographic/season fit and hero quality are **N/A**. All five classify **IMAGE REPLACEMENT REQUIRED**. Candidate status is separately **OWNER VISUAL REVIEW REQUIRED**. Fresh checks found all five candidate local files present and production HTTP 200 with nonempty `image/jpeg` responses. No candidate was assigned, downloaded or edited.

Local visual inspection and source-page review:

| Target / existing candidate | Geography / season / visible quality | Source, author, license | Remaining decision |
|---|---|---|---|
| Auli — `/images/destination-auli.jpg` | Snow-covered mountain/meadow view, 1600×900; no obvious watermark; source identifies Auli, no ropeway/service evidence | [Auli, India](https://commons.wikimedia.org/wiki/File:Auli,_India.jpg), Amit Shaw, CC0 1.0 | Strong landscape candidate; approve snow-season representation/crop; do not imply guaranteed snow. Attribution voluntary |
| Badrinath — `/images/destination-badrinath.jpg` | Recognizable shrine facade, 1600×1067; no obvious watermark; not evidence of opening or quiet queues | [Badrinath Temple](https://commons.wikimedia.org/wiki/File:Badrinath_Temple.jpg), Harshit SR, CC BY-SA 4.0 | Suitable place candidate; owner crop/season review and Journey credit required |
| Dharamshala — `/images/destination-mcleod-ganj.jpg` | Monastery corridor/prayer wheels, 1600×900; no obvious watermark; people and large floor area dominate; only one stop represented | [Namgyal Monastery](https://commons.wikimedia.org/wiki/File:Namgyal_Monastery_India_Himachal_Pradesh_Mc_Leod_Ganj.jpg), “(in search for a new country of residence)”, CC BY-SA 2.0 | Weak whole-circuit hero; approve accurately captioned stop image or review an alternative; credit crop |
| Kedarnath — `/images/destination-kedarnath.jpg` | Recognizable shrine, mountains and pilgrims, 1600×1200; no obvious watermark; people-heavy foreground | [KEDARNATH](https://commons.wikimedia.org/wiki/File:%E2%80%9CKEDARNATH%E2%80%9D.jpg), Sarika Shirbhate, CC BY-SA 4.0 | Approve crop; preserve truth about access/queues; Journey credit required |
| Honeymoon — `/images/destination-mussoorie.jpg` | Mall Road street, 1600×1067; no obvious watermark, busy composition and soft detail; no romantic hotel/service evidence | [Mall Road, Mussoorie](https://commons.wikimedia.org/wiki/File:Mall_Road,_Mussoorie.jpg), ArmouredCyborg, CC BY-SA 4.0 | Owner hero review; possible better route-stop photo after separate review; credit existing crop |

The source pages confirm the named licenses. CC0 permits commercial copying/modification without mandatory attribution. CC BY-SA permits commercial reuse and adaptation subject to credit, license link, change notice and applicable share-alike terms; see [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). Existing crop notes are in `docs/image-sources.md`. Retain source/title/author/license and modification details in the existing `JOURNEY_IMAGE_CREDITS` architecture in `config/imageCredits.config.ts` after selection; do not build another credit system. Source licensing does not establish supplier service or owner visual approval.

## Commercial recommendation matrix

| Slug | Duration / proposed route interpretation | Recommended price / confidence | Hotel / meals | Pickup → drop | Transport | Image | Supplier dependency / primary blocker |
|---|---|---|---|---|---|---|---|
| `auli-tour` | 3N/4D; focused Joshimath/Auli, gateways unresolved | No supported number; LOW | Three bases/category/meals undecided | Rishikesh → Rishikesh metadata only | Unconfirmed | Missing; Auli candidate | Yes; route/overnights |
| `badrinath-yatra` | 3N/4D; single shrine via Joshimath, Nights 1/3 unresolved | No supported number; LOW | Bases/category/meals undecided | Haridwar → Haridwar; Day 1 ambiguity | Unconfirmed | Missing; shrine candidate | Yes; route/overnights |
| `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` | 6N/7D; proposed 3N + 3N | No supported number; LOW | Six nights/category/meals unconfirmed | Pathankot → Dalhousie metadata only | Unconfirmed | Missing; candidate weak | Yes; duplication/value decision |
| `kedarnath-yatra` | 4N/5D; single shrine with separate road/trek access | No supported number; LOW | Four overnight bases/meals unresolved | Haridwar → Haridwar; Day 1 ambiguity | Road limits/access unresolved | Missing; shrine candidate | Yes; access and nights |
| `uttarakhand-honeymoon-circuit` | 4N/5D; Mussoorie 2N + Nainital 2N implied | Re-cost historical ₹17,999 pp proposal; LOW | Historical standard double room/4 breakfasts, unapproved | Dehradun → Kathgodam; points unapproved | Historical private proposal, unconfirmed | Missing; Mall Road candidate | Yes; costing and differentiation |

## Exact proposed payloads and source labels

Machine-readable payloads are `proposals[0..4].fields` in the verification JSON. Every field records `current`, `proposed`, `source`, and `basis`. Each proposal has its own exact slug, complete expected source snapshot and field allowlist. These are **decision objects**, never MongoDB update payloads. `null` means unresolved and must never be written to “complete” a record. `EXISTING` itinerary content is retained; no pending route interpretation is treated as `NORMALIZED` fact.

| Field | Auli | Badrinath | Dharamshala circuit | Kedarnath | Honeymoon | Source / decision |
|---|---|---|---|---|---|---|
| price | null | null | null | null | 17999 historical only | OWNER DECISION REQUIRED; supplier re-costing |
| pickupInfo | null | null | null | null | null | OWNER DECISION REQUIRED; stored city is not a transfer promise |
| dropInfo | null | null | null | null | null | OWNER DECISION REQUIRED |
| mealPlan | null | null | null | null | null | SUPPLIER CONFIRMATION REQUIRED; Honeymoon history is breakfast-only |
| transportType | null | null | null | null | null | SUPPLIER CONFIRMATION REQUIRED |
| minTravellers | null | null | null | null | 2 historical | OWNER DECISION REQUIRED |
| roomsIncluded | null | null | null | null | 1 historical | OWNER DECISION REQUIRED |
| hotelCategoryDescription | null | null | null | null | null | SUPPLIER CONFIRMATION REQUIRED |
| inclusions | null | null | null | null | null | OWNER DECISION REQUIRED after costed service selection |
| exclusions | Auli paid items below | Temple paid items below | Paid guides/tickets below | Access paid items below | Boating/romantic extras below | OWNER DECISION REQUIRED |
| image | null | null | null | null | null | OWNER DECISION REQUIRED; candidate selection/credit outstanding |
| usesGeneralCancellationPolicy | null | null | null | null | null | OWNER DECISION REQUIRED after applicability verification |
| itinerary | Exact stored itinerary | Exact stored itinerary | Exact stored itinerary | Exact stored itinerary | Exact stored itinerary | EXISTING; no production correction |

Every proposed exclusions array starts with `Travel to/from agreed endpoints`, `Personal expenses`, then the following exact per-record entries, and ends with `Services not expressly included in the final written quote`:

- **Auli:** `Ropeway tickets`; `Skiing and snow activities`; `Equipment and instructors`; `Local vehicles`.
- **Badrinath:** `Special temple services and paid guides`.
- **Dharamshala:** `Paid guides and attraction/activity tickets`.
- **Kedarnath:** `Helicopter`; `Pony`; `Palki`; `Local shuttle`; `Trek guide or porter`.
- **Honeymoon:** `Boating`; `Cake`; `Flowers and room decoration`; `Candlelight dinner`; `Room upgrades`.

Minimal wording proposals appear in the decision packs above. Gateway/night edits require owner/operator decisions and are deliberately absent from the executable architecture. No new price, airport transfer, hotel, meal, vehicle or activity has been represented as approved.

## Guarded tool and validation

Run `npx tsx scripts/preparePhase13OwnerDecisionJourneys.ts` for a read-only dry-run, or add `--write-report` to save the verification JSON. `--execute` always refuses **before** loading environment variables or connecting to MongoDB. `--owner-approved` cannot unlock it. A future authorized write phase requires separately reviewed implementation and an approved complete payload; this script does not claim to be a production writer.

The tool reuses Phase 12 inventory/public-isolation guards; adds exact five-target resolution, per-record source snapshots, exact field allowlists, protected status/slug/duration, conflict detection, deterministic proposal generation, per-record refusal, and whole-catalogue/taxonomy before/after verification. All twelve draft page and detail-API URLs are checked for 404; public catalogue and sitemap are compared with the actual 28 published slugs, not merely counted. Five proposals are refused; zero fields change.

Focused tests cover exact inventory/allowlist, missing/published targets, protected fields, mismatched records, unsupported fields, disabled execution including approval flags, source conflicts, deterministic proposals, historical unapproved prices and draft leaks. Full-suite/typecheck/lint/build results are recorded in the verification artifact after validation.

## Final readiness and protection

- **READY FOR OWNER COMMERCIAL APPROVAL as a complete saleable payload:** none. All five decision packs are ready for owner review, but contain unresolved values.
- **MULTIPLE BLOCKERS:** all five, with specific route, supplier, image and differentiation decisions above.
- **Immediate after owner approval alone:** none. All five still require supplier/route/image work. Next publication batch size 0; live count remains 28.
- **Production:** 40 total / 28 published / 12 draft; catalogue 28; Journey sitemap 28. All twelve draft direct pages and detail APIs return 404.
- **Protected records:** all 40 Journey documents and all queried Region/Destination documents compare equal before/after; all 28 live Journeys, Spiti Winter, Kashmir Winter and the five Ladakh drafts are untouched.
- **Protected systems:** HBX, Google Places, PlaceCache and transport pricing untouched by Phase 13. Existing unrelated working changes are excluded. IndexNow deferred.
- **Publication/commercial writes:** zero. This phase prepares decisions; owner approval alone cannot eliminate supplier/image/route blockers.

## Appendix: full current day-wise source (unchanged)

### Auli Tour — auli-tour

**Day 1: Arrival in Joshimath**

Arrive in Joshimath, the usual base for Auli.

**Day 2: Auli Excursion**

Ropeway ride and meadow views, snow-dependent in winter and green in summer.

**Day 3: Auli Local Time**

A further, more relaxed day around Auli/Joshimath.

**Day 4: Departure**

Return journey and departure.


### Badrinath Yatra — badrinath-yatra

**Day 1: Arrival in Haridwar/Dehradun**

Arrive and begin travel toward Badrinath.

**Day 2: To Joshimath**

Travel toward Joshimath, the usual overnight base en route to Badrinath.

**Day 3: Badrinath Darshan**

Visit the Badrinath temple, directly road-accessible.

**Day 4: Departure**

Return journey and departure.


### Dharamshala McLeodganj Dalhousie Khajjiar Circuit — dharamshala-mcleodganj-dalhousie-khajjiar-circuit

**Day 1: Arrival in Dharamshala**

Arrive and settle in; evening at leisure.

**Day 2: McLeod Ganj**

A full day dedicated to McLeod Ganj — the Dalai Lama Temple, the Tibetan quarter and Bhagsu Waterfall.

**Day 3: Dharamshala Local Time**

A more relaxed day around Dharamshala itself, with time for cafes and short walks rather than a packed sightseeing list.

**Day 4: Dharamshala to Dalhousie**

Scenic drive to Dalhousie; evening walk on Mall Road.

**Day 5: Dalhousie Sightseeing**

A full day around Dalhousie's colonial-era streets and viewpoints.

**Day 6: Khajjiar Day Trip**

Visit Khajjiar's meadow and Chamera Lake, with more time on-site than a brief drive-through stop.

**Day 7: Departure**

Check out and depart.


### Kedarnath Yatra — kedarnath-yatra

**Day 1: Arrival in Haridwar/Dehradun**

Arrive and begin travel toward the Kedarnath access base.

**Day 2: To Guptkashi/Sonprayag**

Travel toward Guptkashi or Sonprayag, the usual overnight bases for Kedarnath.

**Day 3: Kedarnath Darshan**

Visit Kedarnath via the trek from Gaurikund/Sonprayag, or by helicopter where booked and weather permits; genuinely access-gated, not guaranteed on every date.

**Day 4: Return to Guptkashi/Sonprayag**

Return from Kedarnath.

**Day 5: Departure**

Return journey and departure.


### Uttarakhand Honeymoon Circuit — uttarakhand-honeymoon-circuit

**Day 1: Arrival in Mussoorie**

Arrive and settle in; evening on Mall Road.

**Day 2: Mussoorie Sightseeing**

Camel's Back Road and viewpoints, at a relaxed couple pace.

**Day 3: Mussoorie to Nainital**

Travel to Nainital.

**Day 4: Nainital Sightseeing**

Boating on Naini Lake and local viewpoints.

**Day 5: Departure**

Check out and depart.
