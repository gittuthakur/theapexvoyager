# Phase 8 — Winter-priority Batch 3 commercial readiness

Audit date: 1 October 2026. Planning season: winter 2026–27.

**Production remains 40 total / 24 published / 16 draft. No Batch-3 commercial values, images, copy or statuses were written.** Prices below are internal proposals for owner decisions. They are not bookable offers or supplier quotations.

## 1. Phase-7 housekeeping

Preserved exactly these four files:

- `scripts/publishSecondJourneyBatch.ts`
- `scripts/publishSecondJourneyBatch.test.ts`
- `docs/phase-7-batch-2-publication.md`
- `docs/phase-7-batch-2-verification.json`

Commit: `19cd6e2a94b05fd5a36877b1a118ea199ebba3ff` — **Preserve Batch 2 publication tooling and verification**. Pushed to `origin/main`; HEAD and origin/main match. [Vercel deployment](https://vercel.com/gittuthakur-1851s-projects/theapexvoyager-oc46/937vj4nNp6iSBmenELQLEim8XT7X) completed successfully / Ready. Only tooling, tests and historical verification were deployed; no runtime or configuration change was included.

Reviewed the actual status-only transaction, exact eight-slug gate, real document validation, concurrent-edit protection, idempotency and whole-document comparison. The dry run before and after deployment returned 0 would publish / 8 already published / 0 refused. No execution flag was used. The historical report was adjusted to distinguish Phase-7 HEAD from the later housekeeping commit.

The entire dirty-tree inventory is in Appendix A. Initially nothing was staged. All four Phase-7 files were untracked; only those four were staged and committed. Reviewed contents and credential-pattern checks found no embedded credentials in them. No local environment/settings files, logs, catalogue dumps, build output or temporary browser scripts were committed. `.env.example`, local settings and all unrelated work remained outside the commit. A broad URI scan flagged the example environment file, which was excluded; this scan is not a claim that every excluded file is secret-free.

Post-deployment regression:

- All 24 canonical Journey sitemap URLs return direct HTTP 200; sitemap and public Journey API both contain 24 published Journeys. All 24 cards are discoverable across three rendered catalogue pagination pages.
- All 16 draft Journey URLs return 404 and are absent from public catalogue/sitemap.
- Homepage, Journey/Destination catalogues, cancellation policy, all three published Region hubs and the 12 Batch-2 Destination relationships pass.
- Eight Batch-2 pages pass desktop/320px content, price, image, schema and breadcrumb checks.
- A complete JSON comparison of every Journey, Destination and Region document before versus after deployment passes, including timestamps, prices, itinerary and commercial fields.
- Ladakh remains a draft Region, eight draft Destinations and five draft Journeys; direct URLs and public discovery checks show no leak.

Evidence: [phase-8-verification.json](phase-8-verification.json). This contains public catalogue verification summaries, not database credentials or full database exports. Phase-8 documents remain local for owner review and are outside the four-file housekeeping deployment.

## 2. Search Console ready list

**READY FOR SEARCH CONSOLE SUBMISSION** — all eight rechecked after deployment: HTTP 200, exact self-canonical, no meta/header noindex, allowed by robots.txt, present in sitemap. These technical checks do not establish Google indexing.

| Exact URL | HTTP | Canonical | Indexable | Sitemap |
|---|---|---|---|---|
| https://www.theapexvoyager.in/journeys/shimla-short-escape | 200 | PASS | PASS | PASS |
| https://www.theapexvoyager.in/journeys/manali-short-escape | 200 | PASS | PASS | PASS |
| https://www.theapexvoyager.in/journeys/kasol-manikaran-weekend | 200 | PASS | PASS | PASS |
| https://www.theapexvoyager.in/journeys/dalhousie-khajjiar-chamba | 200 | PASS | PASS | PASS |
| https://www.theapexvoyager.in/journeys/bir-billing-palampur | 200 | PASS | PASS | PASS |
| https://www.theapexvoyager.in/journeys/mussoorie-weekend | 200 | PASS | PASS | PASS |
| https://www.theapexvoyager.in/journeys/valley-of-flowers-hemkund-sahib-trek | 200 | PASS | PASS | PASS |
| https://www.theapexvoyager.in/journeys/rishikesh-adventure-package | 200 | PASS | PASS | PASS |

Submission performed: **No**. Google indexing independently verified: **No**. IndexNow: **DEFERRED**.

## 3. Batch-3 selection and actual inventory

Actual production drafts match the expected seven candidates, four held variants and five Ladakh drafts. All 16 day-wise itineraries match authoring configuration. Configuration statuses are authoring defaults; production queries determine publication counts.

KEEP means retain for commercial preparation, not ready to publish. Six KEEP; one OWNER REVIEW REQUIRED. The three winter products retain priority.

| Journey slug | Duration | Region | Season in current draft | Decision | Reason |
|---|---|---|---|---|---|
| spiti-winter-expedition | 6N/7D | Himachal Pradesh | Dec–Feb | KEEP, winter priority 1 | Shimla/Kinnaur out-and-back; different exit and accessible-village pacing from live summer circuits |
| kashmir-winter-snow-tour | 4N/5D | Kashmir | Dec–Feb | KEEP, winter priority 2 | Two Gulmarg nights/activity days in a shorter winter circuit; overlaps live family route and needs clear exclusions |
| gulmarg-winter-escape | 3N/4D | Kashmir | Dec–Feb | KEEP, winter priority 3 | Three-night Gulmarg base with Srinagar transfers; no multi-town sightseeing circuit |
| kinnaur-valley-tour | 6N/7D | Himachal Pradesh | Broadly Mar–Jun, Sep–Nov; route conditions govern | KEEP | Narkanda/Sarahan/Baspa/Kalpa circuit stops before Spiti and returns to Shimla |
| dharamshala-mcleodganj-short-escape | 3N/4D | Himachal Pradesh | Broadly Mar–Jun, Sep–Nov | KEEP | Single-area short stay; no Dalhousie/Khajjiar leg |
| grand-himachal-circuit | 9N/10D | Himachal Pradesh | Broadly Mar–Jun, Sep–Nov | KEEP | Actual continuous east-to-west route, nine nights and long transfer day support a distinct longer holiday |
| uttarakhand-honeymoon-circuit | 4N/5D | Uttarakhand | Broadly Mar–Jun, Sep–Nov | OWNER REVIEW REQUIRED | Couple pace is stated, but activities are ordinary sightseeing and no couple-specific accommodation/service is approved; long Day-3 transfer weakens blanket relaxed positioning |

### Held items — no new evidence to release

- `kedarnath-yatra`: single-shrine subset of live Kedarnath Badrinath/Char Dham; dedicated operational/commercial distinction unresolved.
- `badrinath-yatra`: shorter single-shrine variant; distinct road-only intent is plausible, but prior hold and missing commercial plan remain unresolved.
- `auli-tour`: shorter subset of live Auli Chopta Tungnath; no new approved service basis or differentiation evidence.
- `dharamshala-mcleodganj-dalhousie-khajjiar-circuit`: same corridor as live Himachal Family Escape; extra time alone does not resolve overlap.

No prices or commercialization proposed for those four.

### Ladakh — separate five drafts

`leh-nubra-pangong-tour`, `leh-nubra-pangong-turtuk-tour`, `leh-nubra-pangong-hanle-tour`, `ladakh-hanle-tso-moriri-tour`, `srinagar-leh-ladakh-tour` all remain draft. The last has an existing Kashmir region reference because it starts in Srinagar; the five were checked by exact slug, not inferred from regionId.

Ladakh Region: draft. Destinations `leh`, `nubra-valley`, `pangong-lake`, `turtuk`, `hanle`, `tso-moriri`, `kargil`, `lamayuru`: all draft. Their existing documents have no regionId, so checks use exact slugs. Publication dependencies, missing commercial data/prices and appropriate photography remain unresolved. No Ladakh record changed.

## 4. Proposed pricing worksheet

**Every figure requires owner approval and date-specific supplier validation.** Indicative **Starting From, per person onwards**, based on two paying adults sharing one room (`minTravellers = 2`, `roomsIncluded = 1`, both proposed). Private transport shared by those two adults. Non-peak dates only; no assumed New Year/Christmas availability. No fixed fare, MRP, discount or supplier-rate claim.

These are internal planning targets informed by actual live catalogue positioning plus explicit cost allowances below. Live prices are comparison points, not evidence that another route's costs are covered. Until actual quotations, taxes, margin and contingency are checked, do not display these proposals publicly.

| Journey | Duration and key route | Proposed Starting From | Basis / main risks | Confidence |
|---|---|---|---|---|
| Spiti Winter | 6N/7D; Shimla–Kalpa–Tabo–Kaza–Kalpa–Shimla | ₹29,999 pp onwards | Six basic winter-operating nights, breakfast+dinner, private suitable winter vehicle; scarce stays, heating, road disruption, long return and support costs | Low; winter operator and room/vehicle quotes required |
| Kashmir Winter | 4N/5D; Srinagar–Gulmarg–Pahalgam–Srinagar | ₹21,999 pp onwards | Four nights, breakfast, private permitted road transfers; two Gulmarg nights drive cost, heating and seasonal supplements; activities/local union vehicles extra | Low; houseboat/hotel choice and winter rooms unresolved |
| Gulmarg Winter | 3N/4D; Srinagar–Gulmarg–Srinagar | ₹19,999 pp onwards | Three Gulmarg nights, breakfast, Srinagar return transfers; no included ski/Gondola package | Low; winter property costs and access vehicle arrangements unresolved |
| Kinnaur Valley | 6N/7D; Shimla–Narkanda–Sarahan–Sangla/Chitkul–Kalpa–Shimla | ₹22,999 pp onwards | Six standard hotel/guesthouse nights, breakfast, private hill-road vehicle; exact Night 4/6 bases, road delays and dead mileage | Low–medium; overnight plan and vehicle quotes required |
| Dharamshala Short | 3N/4D; Dharamshala/McLeod Ganj | ₹10,999 pp onwards | Three standard hotel nights, breakfast, local pickup/drop and listed local transfers; **Pathankot transfer excluded from this proposed basis** until decided | Medium as a planning target; endpoint mismatch must be resolved |
| Grand Himachal | 9N/10D; Chandigarh–Shimla–Manali–Dharamshala–Dalhousie | ₹29,999 pp onwards | Nine standard hotel nights, breakfast, private transfers; long Day 6, driver nights, one-way vehicle return; ends Dalhousie | Low–medium; final drop and transport cost validation |
| Uttarakhand Honeymoon | 4N/5D; Dehradun–Mussoorie–Nainital–Kathgodam | ₹17,999 pp onwards, conditional | Four standard double-room nights, breakfast, private transfers; long cross-state hill-town transfer, no honeymoon extras assumed | Low; selection and couple-service basis need owner review first |

### Transparent internal allowances

The following are **assumed budget allocations per two-person booking**, not observed market rates or supplier quotes. Formula: `(stay + vehicle/driver + operating reserve) / 2`, rounded down by ₹1 for proposed display. Stay allowance includes the proposed meals. Reserve must be validated for taxes, operating costs, contingency and margin; it is not a declared tax rate or guaranteed profit. Additional closure nights are not silently funded by this reserve.

| Journey | Stay + meals assumption | Vehicle/driver assumption | Operating reserve assumption | Total / two | Proposed pp |
|---|---:|---:|---:|---:|---:|
| Spiti Winter | ₹18,000 / 6 nights | ₹32,000 | ₹10,000 | ₹60,000 / 2 | ₹29,999 |
| Kashmir Winter | ₹24,000 / 4 nights | ₹12,000 | ₹8,000 | ₹44,000 / 2 | ₹21,999 |
| Gulmarg Winter | ₹22,500 / 3 nights | ₹9,000 | ₹8,500 | ₹40,000 / 2 | ₹19,999 |
| Kinnaur Valley | ₹15,000 / 6 nights | ₹23,000 | ₹8,000 | ₹46,000 / 2 | ₹22,999 |
| Dharamshala Short | ₹9,000 / 3 nights | ₹8,000 | ₹5,000 | ₹22,000 / 2 | ₹10,999 |
| Grand Himachal | ₹22,500 / 9 nights | ₹27,500 | ₹10,000 | ₹60,000 / 2 | ₹29,999 |
| Uttarakhand Honeymoon | ₹14,000 / 4 nights | ₹15,000 | ₹7,000 | ₹36,000 / 2 | ₹17,999 |

Catalogue benchmarks inspected: live Spiti Circuit ₹18,999/6N, Kinnaur Spiti ₹21,999/8N, Kashmir Family ₹14,999/5N, Kashmir Paradise ₹24,999/5N, Himachal Family ₹15,999/4N, Bir/Palampur ₹9,999/3N, Shimla Manali ₹13,999/5N, Nainital Corbett Mussoorie ₹15,999/5N. Proposed winter prices reflect a different assumed service/cost basis; the numbers do not imply verified seasonal rates.

## 5. Commercial decisions

**DERIVED FROM ITINERARY** below means route, day structure and implied overnight count only. The drafts do not name booked hotels, vehicles, meals or room allocations. All accommodation categories, transfer endpoints, meals, inclusions/exclusions and 2-adult/1-room values below are **OWNER DECISION REQUIRED**. An overnight inferred from the sequence is not a confirmed reservation.

| Journey | Derived route / proposed nights | Proposed pickup → drop | Proposed stay and meals | Proposed transport | Remaining decisions |
|---|---|---|---|---|---|
| Spiti Winter | Day 1 Kalpa, Day 2 Tabo, Days 3–5 Kaza, Day 6 toward Kalpa: 6 nights | Confirmed Shimla city point → Shimla city point | Basic winter-operating homestay/guesthouse; 6 breakfasts + 6 dinners, exact heating/water/toilet arrangements disclosed | Private winter-suitable vehicle with experienced local driver; exact vehicle/equipment subject to operator approval | Day-6 overnight, departure buffers, winter availability, heating, emergency/support plan, vehicle, disruption terms |
| Kashmir Winter | Srinagar 1N, Gulmarg 2N, Pahalgam 1N inferred | Srinagar airport → Srinagar airport, times confirmed | Standard winter-operating stays; 4 breakfasts; houseboat only if specifically available and approved | Private permitted road transfers; local union/snow vehicle supplements excluded unless approved | Hotel vs houseboat Night 1, heating, actual Gulmarg nights, transfer boundaries, Day-5 flight buffer |
| Gulmarg Winter | Gulmarg 3N inferred | Srinagar airport → Srinagar airport | Standard winter-operating hotel; 3 breakfasts; no resort/luxury claim | Return road transfers and agreed accessible local transfers; no ski pass or snow vehicle inclusion | Hotel/heating, Tangmarg/Gulmarg transfer arrangements, activity booking responsibility |
| Kinnaur Valley | Narkanda 1N, Sarahan 1N, Sangla 1N, Sangla/Kalpa 1N, Kalpa 1N, return-route base 1N | Shimla city point → Shimla city point | Standard hotel/guesthouse, 6 breakfasts | Private suitable hill-road vehicle; permitted accessible sightseeing transfers | Night 4 and 6 locations, Chitkul access fallback, vehicle, travel-date season, endpoint times |
| Dharamshala Short | Three nights in Dharamshala/McLeod Ganj area | Propose local Dharamshala pickup → local Dharamshala drop | Standard hotel; 3 breakfasts | Private local transfers for agreed itinerary, not unlimited use | **Metadata says Pathankot start; itinerary starts Dharamshala. Choose local basis with later authorized metadata correction, or quote/include Pathankot transfer explicitly.** Exact local base |
| Grand Himachal | Shimla 2N, Manali 3N, Dharamshala 2N, Dalhousie 2N | Chandigarh airport/rail/city point → Dalhousie local point | Standard hotels; 9 breakfasts | Private hill-road vehicle, driver allowance/parking/tolls on approved route | Day-6 drive timing, Dalhousie endpoint versus separately priced Pathankot/Chandigarh exit, seasonal Khajjiar/Solang access |
| Uttarakhand Honeymoon | Mussoorie 2N + Nainital 2N | Dehradun airport/rail → Kathgodam railway station | Standard double room; 4 breakfasts; no view/suite/decor/dinner promise | Private intercity/local transfers; long Day 3 acknowledged | Approve couple-specific service basis or reconsider title/selection; endpoint times, room standard, boating charge, long transfer feasibility |

Proposed common inclusions, requiring approval: stated number of nights in one double-sharing room for two adults; stated breakfasts (and Spiti dinners); agreed pickup/drop and accessible itinerary transfers; driver allowance, parking and tolls for the agreed route. Sightseeing **transport** does not automatically include attraction admission, guides or activity tickets. Confirm tax treatment before a public quote.

Proposed common exclusions, requiring approval: travel to/from the agreed endpoints; additional meals/drinks; personal expenses; guides and entrance/activity tickets unless specifically listed; insurance; unapproved vehicle detours/upgrades; extra nights/services caused by delay or closure, with costs and alternatives disclosed before acceptance; peak-date supplements confirmed in the quote. No unpriced optional item should be presented as included.

Package-specific exclusions/clarifications:

- Spiti: no Chandratal, Kunzum or Manali exit; no assumed village/monastery access; personal winter gear, permits where required, specialist guide/support or evacuation services not silently included. Operator must settle required safety/support services before commercial approval, not defer them to an undisclosed extra.
- Kashmir Winter: Gondola, skiing, snowboarding, equipment, instructors, sledging, snow vehicles and local union transport excluded unless explicitly approved; shikara and Pahalgam local sightseeing vehicle charges not assumed included. Houseboat replacement cannot be silently described as identical service.
- Gulmarg Winter: the same Gondola/ski/snow exclusions apply. The current Day-2 wording mentions a Gondola ride; commercial copy must make its optional, separately ticketed status explicit before publication, or owner must approve and price an inclusion.
- Kinnaur: no Spiti extension, off-route activities or guaranteed Chitkul road access. Review the blanket “permit-free” claim against traveller nationality and current requirements before publication.
- Dharamshala: Pathankot transfer outside the local-price proposal; no Dalhousie/Khajjiar, Triund trek or paid guide assumed.
- Grand Himachal: no automatic Rohtang/Atal Tunnel extension, adventure activities or return transfer beyond Dalhousie.
- Uttarakhand: boating, decor, cake, candlelight dinner, suite/view upgrade and other honeymoon extras excluded unless approved; no Corbett/Haridwar/Rishikesh extension.

### Cancellation

`/cancellation-policy` is publicly reachable (HTTP 200). Its content covers journeys and weather/road disruption with booking-specific written supplier terms, rather than fixed percentages. **Propose `usesGeneralCancellationPolicy = true` for the six KEEP candidates and, conditionally, Uttarakhand if retained.** Owner must approve applicability to the finalized services and provide written booking terms. No production flag was changed; the existing cancellation blocker remains on each draft. No full refund/free rescheduling guarantee is inferred.

## 6. Winter safety and route review

### Spiti Winter — route audit PASS, operational approval pending

The stored itinerary is Shimla → Kalpa → Tabo via Nako → Kaza → accessible local villages → return toward Kalpa → Shimla. It explicitly rejects the Manali-side exit. Neither Chandratal nor Kunzum is an included stop. No inappropriate summer-pass leg was found, so the route-conflict STOP condition was not triggered.

The [Lahaul and Spiti district access guide](https://hplahaulspiti.nic.in/how-to-reach/) distinguishes the Kinnaur approach from the winter-closed Kunzum connection. This supports the route distinction, not a promise of any particular day's access. [Himachal Tourism's Spiti guide](https://himachaltourism.gov.in/destination/spiti-valley/) describes severe winter cold and the need for suitable vehicles. Current permissions/road conditions and winter suppliers must be verified for each departure. No 2026–27 opening or weather prediction is claimed.

Owner/operator must approve Day-6 overnight, Day-7 onward timing and disruption buffers; six nights do not contain an extra closure day. Confirm which stays actually operate, safe heating arrangements, toilet/water limitations, communications and support arrangements. Never guarantee snowfall, road opening, weather, power, running water, connectivity, village access or medical suitability. Do not imply this is an easy substitute for the summer journey. No itinerary was rewritten.

### Kashmir Winter and Gulmarg Winter

The [Baramulla district Gulmarg description](https://baramulla.nic.in/tourist-place/gulmarg/) supports winter-sports positioning, not dates, snow depth or activity operation. No snow, Gondola, flight, road or winter-activity guarantee is permissible. Keep the proposed paid-activity and local-union exclusions visible beside itinerary mentions. Snow vehicle arrangements and charges must be confirmed before travel.

Kashmir Winter retains an actual extra Gulmarg day, rather than just renaming the family circuit. Confirm the Night-1 houseboat option and transfer buffer from Pahalgam on departure day. Gulmarg Winter must be presented as a stay/transfer base with optional activities unless separately priced services are approved. Calling it an inclusive skiing package would overstate the current content.

The district also publishes dated closure notices; a July 2026 notice is not clearance for winter departures. Use current local notices/operator confirmation before accepting bookings. No external images were downloaded during this review.

### Other candidates

- Kinnaur: Narkanda/Sarahan/Sangla/Chitkul/Kalpa routing matches the draft. The [district Chhitkul page](https://hpkinnaur.nic.in/tourist-place/chhitkul/) identifies the high Baspa-valley stop. Keep current spring/autumn positioning conditional on roads; do not promise year-round unrestricted access or treat an official destination page as current road clearance.
- Dharamshala Short: a local three-night base is genuinely distinct from the family/extended Dalhousie circuit. Resolve Pathankot pickup mismatch before pricing is accepted.
- Grand Himachal: nine nights and a continuous route support the broader product. Day 6 Manali–Dharamshala is explicitly a demanding transfer; avoid an all-trip “relaxed” claim. “See all of Himachal” / “zero-existing-coverage” in current draft description overstates coverage and should be replaced, subject to a later approved copy edit.
- Uttarakhand Honeymoon: two nights per town and couple-paced sightseeing support a couple audience, but do not establish a special honeymoon service. Day 3 is a substantial transfer. Retain OWNER REVIEW REQUIRED until the owner accepts an honestly described standard-room couple circuit or approves a real service distinction. No invented romantic/luxury benefits.

## 7. Image readiness

All seven actual Journey `image` fields are absent. Available Destination assets are candidates only, **not assigned**. Each selected source is a published related Destination, with a local file and a direct production HTTP 200 `image/jpeg` response with nonzero bytes. Local images were viewed, not judged by filenames alone. Provenance is recorded in [image-sources.md](image-sources.md); retain required `/photo-credits` attribution when assigning later.

| Journey | Source Destination / exact candidate path | Local / production | Real / geographic relevance | Winter classification | Owner image required |
|---|---|---|---|---|---|
| Spiti Winter | Tabo — `/images/destination-tabo.jpg` | Exists / 200 | Documented real Tabo monastery, on Day 2 | GEOGRAPHICALLY REAL BUT SEASONALLY WEAK: bare ground and leafy vegetation | Yes, verified winter Spiti hero; current asset is only a non-winter reference |
| Kashmir Winter | Gulmarg — `/images/destination-gulmarg.jpg` | Exists / 200 | Documented real Gulmarg, Days 2–3 | GEOGRAPHICALLY REAL BUT SEASONALLY WEAK: green meadow, no winter scene | Yes, real winter route image |
| Gulmarg Winter | Gulmarg — `/images/destination-gulmarg.jpg` | Exists / 200 | Documented real Gulmarg base | GEOGRAPHICALLY REAL BUT SEASONALLY WEAK | Yes, real winter Gulmarg hero |
| Kinnaur Valley | Sangla Valley — `/images/destination-sangla-valley.jpg` | Exists / 200 | Documented real Baspa-valley route photo | Non-winter product; relevant general-season landscape | No new photo required for proposed general-season use; assignment approval needed |
| Dharamshala Short | McLeod Ganj — `/images/destination-mcleod-ganj.jpg` | Exists / 200 | Documented real Namgyal Monastery corridor, relevant to Tibetan-quarter visit | Non-winter product; no snow claim | No new photo required; assignment approval needed |
| Grand Himachal | Dalhousie — `/images/destination-dalhousie.jpg` | Exists / 200 | Documented real route stop; must not be captioned as all five towns | Non-winter product; no winter-season promise | No new photo required; assignment approval needed |
| Uttarakhand Honeymoon | Mussoorie — `/images/destination-mussoorie.jpg` | Exists / 200 | Documented real Mall Road; does not depict a promised hotel/romantic service | Non-winter product | No new photo required if retained; assignment approval needed |

None of the three winter candidates is WINTER-APPROPRIATE for hero use. Their publication readiness is **OWNER WINTER IMAGE REQUIRED**. New photos must have verified place/season and reuse rights; no synthetic snow transformation or arbitrary stock substitution.

Legacy `/images/destination-spiti.jpg`, `destination-kinnaur.jpg`, `destination-dharamshala.jpg` and `destination-shimla.jpg` were also visually inspected. Their absence from the reviewed external-source register prevents treating filename/location alone as sufficient provenance for a fresh assignment. This report chooses documented related alternatives; it does not alter or make unsupported authenticity claims about existing live assets.

## 8. SEO differentiation and winter presentation

Comparison covered all 24 live Journeys' routes, duration, audience and structure. Nearest comparisons follow. Risk is editorial overlap judgment, not a search-volume estimate.

| Candidate / primary intent | Closest live Journey | Route, duration, audience/structure distinction | Risk | Result |
|---|---|---|---|---|
| Spiti Winter / winter Spiti from Shimla | `spiti-valley-adventure` (7D), `kinnaur-spiti-circuit` (9D) | Winter out-and-back versus Manali-exit summer routes; accessible-village days, winter operator basis | MEDIUM | KEEP; season and actual return route must stay explicit |
| Kashmir Winter / five-day winter Kashmir circuit | `kashmir-family-tour` (6D), `kashmir-signature-journey` (6D) | Same major towns, but 5D, two Gulmarg nights and winter activity opportunity replace Srinagar/Pahalgam sightseeing depth | MEDIUM | KEEP with actual overnight/service distinction; title alone would be insufficient |
| Gulmarg Winter / short Gulmarg winter base | `kashmir-pahalgam-gulmarg-sonamarg-tour` (7D) | 4D single base versus multi-town circuit; optional sports audience, Srinagar only as gateway | LOW | KEEP; distinguish from Batch-3 Kashmir Winter too |
| Kinnaur Valley / Kinnaur-only Baspa circuit | `kinnaur-spiti-circuit` (9D) | 7D Narkanda/Sarahan/Baspa/Kalpa and Shimla return, no Tabo/Kaza/Manali exit | MEDIUM | KEEP; avoid blanket permit-free/low-risk claim |
| Dharamshala Short / short McLeod Ganj stay | `dharamshala-dalhousie-escape` (5D) | 4D one-area base without Dalhousie/Khajjiar, fewer transfers | LOW | KEEP; distinct from held 7D same-corridor variant |
| Grand Himachal / ten-day combined Himachal holiday | `shimla-manali-tour-package` (6D) plus `dharamshala-dalhousie-escape` (5D) | Continuous 10D/9N route across both corridors; different trip length and booking need, not a duplicate page for each leg | MEDIUM | KEEP; avoid “all Himachal” and acknowledge long transfer |
| Uttarakhand Honeymoon / Mussoorie–Nainital for couples | `nainital-corbett-mussoorie-tour` (6D), `mussoorie-weekend` (3D) | 5D/4N two towns, no safari, two nights each; couple intent currently rests mostly on framing | HIGH | OWNER REVIEW REQUIRED; no unsupported luxury/romance promises |

The remaining live products cover Manali-only, Shimla-only, Kasol/trek, Bir/Palampur, Jibhi/Tirthan, Chamba, pilgrimages, meadow/trek, Rishikesh and Haridwar routes. They do not provide a closer exact route/season/structure match than the rows above. Appendix B records the complete 24-Journey comparison inventory.

### Winter titles/meta — proposals only

All three current names already identify winter. They have no custom stored SEO title/description; the route uses the name/title template and `shortDescription` fallback. Current descriptions include internal comparisons and, for Gulmarg, a skiing emphasis without approved activity inclusion. Draft URLs remain 404/noindex; these are future copy proposals, not public metadata changes.

| Journey | Proposed title before site branding | Proposed meta description |
|---|---|---|
| Spiti Winter | Spiti Winter Expedition from Shimla — 7 Days | Plan a 7-day winter Spiti journey via Kalpa and Tabo to Kaza, returning through Kinnaur. Roads, stays and local visits depend on conditions. |
| Kashmir Winter | Kashmir Winter Tour — Srinagar, Gulmarg & Pahalgam | Explore a 5-day winter Kashmir route with two nights in Gulmarg. Snow and access vary; Gondola and winter activities require separate confirmation. |
| Gulmarg Winter | Gulmarg Winter Escape — 4 Days via Srinagar | Plan three nights in Gulmarg with Srinagar transfers. Gondola and snow sports are optional, separately charged and subject to conditions. |

The night/transfer claims in proposed copy depend on approval of Section 5. No mass SEO rewrite, keyword variants, superlatives or indexing claim.

## 9. Exact blockers

Ran `getCommercialBlockers` from `lib/journeyCommercialReadiness.ts` against actual production snapshot records. Every one of the seven returns the same full set below; no blocker was filtered out:

1. `MISSING_PRICE`
2. `MISSING_HOTEL_PLAN`
3. `MISSING_TRANSPORT_PLAN`
4. `MISSING_OCCUPANCY`
5. `MISSING_PICKUP_INFO`
6. `MISSING_DROP_INFO`
7. `MISSING_MEAL_PLAN`
8. `MISSING_INCLUSIONS`
9. `MISSING_EXCLUSIONS`
10. `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`
11. `OWNER_APPROVAL_REQUIRED`

The existing helper does not evaluate imagery, route operations or SEO overlap. Additional issues are reported separately, rather than pretending the helper returns them.

| Journey | Helper blockers | Additional unresolved issues |
|---|---|---|
| spiti-winter-expedition | All 11 above | Journey image missing; owner winter image required; winter-operating stays/vehicle, support, Day-6 night and disruption plan |
| kashmir-winter-snow-tour | All 11 above | Journey image missing; owner winter image required; houseboat/heating, Gulmarg stay costs, activity/local vehicle exclusions and departure timing |
| gulmarg-winter-escape | All 11 above | Journey image missing; owner winter image required; Gondola itinerary mention versus excluded-ticket basis, hotel/heating and snow transfer arrangements |
| kinnaur-valley-tour | All 11 above | Journey image missing; Night 4/6, road/season contingency and permit wording review |
| dharamshala-mcleodganj-short-escape | All 11 above | Journey image missing; Pathankot metadata versus local-arrival itinerary/pickup decision |
| grand-himachal-circuit | All 11 above | Journey image missing; final drop, long transfer validation and overstated “all Himachal” copy |
| uttarakhand-honeymoon-circuit | All 11 above | Journey image missing; selection/couple-service decision, long Day-3 transfer and paid-boating clarification |

Exact per-slug arrays are preserved in [phase-8-verification.json](phase-8-verification.json). Proposed values in this document clear none of the production blockers.

## 10. Owner decisions required

1. Approve or revise each proposed Starting From price and the two-paying-adults/one-double-room basis; validate actual supplier costs, tax treatment, operating reserve and margin before display. Uttarakhand's number is conditional on retaining that product.
2. Confirm Spiti winter operator, vehicle/equipment/support scope, actual winter stays and facilities, six-night allocation, Day-6 base, departure buffers and written disruption handling. No summer route substitution.
3. Confirm Kashmir Winter's Srinagar/Gulmarg/Pahalgam 1/2/1 nights, Night-1 hotel versus houseboat, heating and airport transfer timing.
4. Confirm Gulmarg's three-night property basis, airport transfer boundaries and local union/snow vehicle handling. Approve explicit exclusions for Gondola, skiing/snowboarding, gear, instructors, sledging and snow vehicles for both winter Kashmir products, or supply separately priced inclusions.
5. Supply rights-cleared, geographically verified winter Spiti and winter Kashmir/Gulmarg hero photos. A single verified Gulmarg photo may serve both if approved; do not represent summer references as winter imagery.
6. Confirm Kinnaur Nights 4 and 6, seasonal sale window, Chitkul fallback and traveller-specific permit wording.
7. Choose Dharamshala local pickup/drop at the proposed ₹10,999 basis, with a later authorized `startingCity` correction, or explicitly include/price Pathankot pickup. No silent correction was made.
8. Confirm Grand Himachal's Chandigarh pickup and Dalhousie drop, or quote a different onward endpoint; approve realistic Day-6 timing and narrower coverage wording.
9. Decide whether Uttarakhand stays in Batch 3 as an honestly described standard-room couple circuit, gains a real approved service distinction, or moves to HOLD. No decor, dinner, suite or view promise without approval.
10. Approve the per-package accommodation categories, meal counts, transfer scope, common/specific inclusions and exclusions in Section 5; confirm room and transport suppliers for proposed dates.
11. Approve general cancellation-policy applicability with supplier-specific written booking terms. No fixed cancellation percentages proposed.
12. Approve later assignment of the four general-season image candidates, and the three concise winter metadata proposals after their commercial basis is settled. Preserve existing attribution.

These decisions authorize no publication by themselves. This phase performed no Batch-3 database writes, prepared no production commercial seed execution, and published no Journey.

## Final verification

- Global Journeys: **40 total / 24 published / 16 draft**. Published Journey sitemap: **24**.
- Draft leak: **PASS**. Ladakh: Region draft / eight Destinations draft / five Journeys draft / no public leak.
- HBX untouched by this phase: **YES**. Google Places / PlaceCache / refresh architecture untouched: **YES**. Transport pricing and all published commercial values unchanged: **YES**.
- IndexNow: **DEFERRED**. Search Console submission: **NO**. Indexing verified: **NO**.
- Focused publication/updater tests: **6 passed**. Full suite: **96 files / 1,240 tests passed**.
- ESLint on preserved TypeScript files: **PASS**. Typecheck (`tsc --noEmit --incremental false`): **PASS**. Production build: **PASS**, 41 static pages generated. Local full-suite/type/build checks include the pre-existing working tree; the deployed four-file commit is separately covered by Vercel's completed build and production regression.

## Appendix A — Complete initial working-tree inventory

| Initial status | File | Classification |
|---|---|---|
| Modified, unstaged | `.env.example` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `app/globals.css` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `components/layout/Footer.tsx` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `components/layout/Navbar.tsx` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `components/ui/BackToTopButton.tsx` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `config/hbxEnvironment.config.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `lib/metaPixel.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `next-env.d.ts` | C: generated/local settings; excluded |
| Modified, unstaged | `services/pricing/stayPricing.types.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `services/providers/hbx/hbx.client.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `services/providers/hbx/hbx.mapper.test.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `services/providers/hbx/hbx.mapper.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `services/providers/hbx/hbx.types.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `services/providers/hbx/hbxAvailability.service.test.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `services/providers/hbx/hbxAvailability.service.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `services/providers/hbx/hbxHotels.service.ts` | B: unrelated pre-existing; excluded |
| Modified, unstaged | `tsconfig.tsbuildinfo` | C: generated/local settings; excluded |
| Untracked | `.claude/settings.local.json` | C: generated/local settings; excluded |
| Untracked | `app/api/meta-capi/route.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `app/api/meta-capi/route.ts` | B: unrelated pre-existing; excluded |
| Untracked | `app/bookings/hbx/[reference]/voucher/page.test.tsx` | B: unrelated pre-existing; excluded |
| Untracked | `app/bookings/hbx/[reference]/voucher/page.tsx` | B: unrelated pre-existing; excluded |
| Untracked | `app/internal/hbx-certification-preview/page.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `app/internal/hbx-certification-preview/page.tsx` | B: unrelated pre-existing; excluded |
| Untracked | `components/modules/bookings/HbxVoucherDocument.test.tsx` | B: unrelated pre-existing; excluded |
| Untracked | `components/modules/bookings/HbxVoucherDocument.tsx` | B: unrelated pre-existing; excluded |
| Untracked | `components/modules/bookings/PrintVoucherButton.tsx` | B: unrelated pre-existing; excluded |
| Untracked | `docs/phase-7-batch-2-publication.md` | A: Phase-7 preserved |
| Untracked | `docs/phase-7-batch-2-verification.json` | A: Phase-7 preserved |
| Untracked | `lib/fpixel.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `lib/fpixel.ts` | B: unrelated pre-existing; excluded |
| Untracked | `lib/hbxVoucher.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `lib/hbxVoucher.ts` | B: unrelated pre-existing; excluded |
| Untracked | `models/HbxBooking.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `models/HbxBooking.ts` | B: unrelated pre-existing; excluded |
| Untracked | `scripts/publishSecondJourneyBatch.test.ts` | A: Phase-7 preserved |
| Untracked | `scripts/publishSecondJourneyBatch.ts` | A: Phase-7 preserved |
| Untracked | `services/providers/hbx/hbxBooking.service.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `services/providers/hbx/hbxBooking.service.ts` | B: unrelated pre-existing; excluded |
| Untracked | `services/providers/hbx/hbxBookingWorkflow.service.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `services/providers/hbx/hbxBookingWorkflow.service.ts` | B: unrelated pre-existing; excluded |
| Untracked | `services/providers/hbx/hbxCheckRate.service.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `services/providers/hbx/hbxCheckRate.service.ts` | B: unrelated pre-existing; excluded |
| Untracked | `services/providers/hbx/hbxHotels.service.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `services/providers/hbx/hbxRateComments.service.test.ts` | B: unrelated pre-existing; excluded |
| Untracked | `services/providers/hbx/hbxRateComments.service.ts` | B: unrelated pre-existing; excluded |

No unrelated file was staged, reverted or deleted. Temporary browser scripts and catalogue snapshots remain outside the repository; no debug/log/build output entered the housekeeping commit.

## Appendix B — All 24 live comparison records

| Live slug | Duration | Route/day structure |
|---|---|---|
| `auli-chopta-tungnath-tour` | 5 Nights / 6 Days | Arrival in Joshimath; Auli Excursion; Joshimath to Chopta; Tungnath Trek; Chopta Local Time; Departure |
| `bir-billing-palampur` | 3 Nights / 4 Days | Arrival in Bir; Bir Billing Paragliding; Bir to Palampur; Departure |
| `char-dham-yatra` | 9 Nights / 10 Days | Arrival in Haridwar/Dehradun; To Barkot; Yamunotri Darshan; To Uttarkashi; Gangotri Darshan; To Guptkashi/Sonprayag; Kedarnath Darshan; To Badrinath; Badrinath Darshan; Departure |
| `dalhousie-khajjiar-chamba` | 4 Nights / 5 Days | Arrival in Dalhousie; Dalhousie Sightseeing; Khajjiar Day Trip; Dalhousie to Chamba; Departure |
| `dharamshala-dalhousie-escape` | 5 Days / 4 Nights | Arrival in Dharamshala; Dharamshala Sightseeing; Dharamshala to Dalhousie; Khajjiar Day Trip; Departure |
| `himachal-himalayan-explorer` | 8 Days / 7 Nights | Arrival in Shimla; Shimla to Kufri; Shimla to Manali; Solang Valley; Manali to Manikaran; Kasol & Parvati Valley; Manikaran to Manali; Departure |
| `jibhi-tirthan-valley` | 3 Nights / 4 Days | Arrival in Jibhi; Jibhi Local Walks; Tirthan Valley (Gushaini); Departure |
| `kashmir-family-tour` | 5 Nights / 6 Days | Arrival in Srinagar — Houseboat Stay; Srinagar Sightseeing; Srinagar to Gulmarg; Gulmarg to Pahalgam; Pahalgam Local Sightseeing; Departure via Srinagar |
| `kashmir-pahalgam-gulmarg-sonamarg-tour` | 6 Nights / 7 Days | Arrival in Srinagar; Srinagar to Sonamarg; Srinagar to Pahalgam; Pahalgam Sightseeing; Pahalgam to Gulmarg; Gulmarg Sightseeing; Departure via Srinagar |
| `kashmir-signature-journey` | 6 Days / 5 Nights | Arrival in Srinagar; Srinagar Sightseeing; Gulmarg Excursion; Pahalgam Day Trip; Leisure & Local Experiences; Departure |
| `kasol-kheerganga-tosh` | 4 Nights / 5 Days | Arrival in Kasol; Tosh Village; Trek to Kheerganga; Trek Back to Kasol; Departure |
| `kasol-manikaran-weekend` | 2 Nights / 3 Days | Arrival in Kasol; Manikaran Day Trip; Departure |
| `kedarnath-badrinath-yatra` | 6 Nights / 7 Days | Arrival in Haridwar/Dehradun; To Guptkashi/Sonprayag; Kedarnath Darshan; Return to Guptkashi/Sonprayag; To Badrinath; Badrinath Darshan; Departure |
| `kinnaur-spiti-circuit` | 8 Nights / 9 Days | Shimla Arrival; Shimla to Sangla; Chitkul Day Trip; Kalpa; Kalpa to Tabo; Tabo to Kaza; Kaza Local Sightseeing; Kaza to Manali; Departure |
| `manali-premium-escape` | 5 Days / 4 Nights | Arrival in Manali; Solang Valley Adventure; Old Manali & Local Sightseeing; Rohtang Pass / Kasol Day Trip; Departure |
| `manali-short-escape` | 3 Nights / 4 Days | Arrival in Manali; Manali Sightseeing; Solang Valley Excursion; Departure |
| `mussoorie-weekend` | 2 Nights / 3 Days | Arrival in Mussoorie; Mussoorie Sightseeing; Departure |
| `nainital-corbett-mussoorie-tour` | 5 Nights / 6 Days | Arrival in Nainital; Nainital Sightseeing; Nainital to Corbett (Ramnagar); Corbett Safari; Corbett to Mussoorie; Departure |
| `rishikesh-adventure-package` | 3 Nights / 4 Days | Arrival in Rishikesh; White-Water Rafting; Riverside Camping & Activities; Departure |
| `shimla-manali-tour-package` | 5 Nights / 6 Days | Chandigarh to Shimla; Shimla Sightseeing; Shimla to Manali; Manali Local Sightseeing; Solang Valley Excursion; Manali to Chandigarh |
| `shimla-short-escape` | 2 Nights / 3 Days | Arrival in Shimla; Shimla Sightseeing; Departure |
| `spiti-valley-adventure` | 7 Days / 6 Nights | Shimla to Kalpa; Kalpa to Nako; Nako to Kaza; Kaza Local Sightseeing; Hikkim & Komic; Chandratal Lake; Kaza to Manali |
| `uttarakhand-explorer` | 6 Days / 5 Nights | Arrival in Haridwar; Haridwar Local Sightseeing; Haridwar to Rishikesh; Rishikesh Adventure Day; Mussoorie Day Trip; Departure |
| `valley-of-flowers-hemkund-sahib-trek` | 5 Nights / 6 Days | Arrival in Joshimath; Joshimath to Govindghat to Ghangaria; Valley of Flowers Trek; Hemkund Sahib Trek; Ghangaria to Joshimath; Departure |
