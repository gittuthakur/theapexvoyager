# Phase 12 — Remaining draft Journeys master audit

Audit is read-only against production. No Journey, Destination or Region was written, and no status changed. The owner-approved Kashmir direction is recorded for preparation only; its guarded dry-run was refused by unresolved gates.

## Baseline and exact draft set

Repository before Phase 12: `HEAD == origin/main == 20c3c30316ac06529920a1230c277e25b91ac847`.

Production: 40 Journeys, 28 published, 12 draft. Public Journey API: 28. Journey sitemap: 28. Every draft route returned HTTP 404; no draft appeared in catalogue or sitemap.

The production query derived exactly these 12 drafts:

1. `auli-tour`
2. `badrinath-yatra`
3. `dharamshala-mcleodganj-dalhousie-khajjiar-circuit`
4. `kashmir-winter-snow-tour`
5. `kedarnath-yatra`
6. `ladakh-hanle-tso-moriri-tour`
7. `leh-nubra-pangong-hanle-tour`
8. `leh-nubra-pangong-tour`
9. `leh-nubra-pangong-turtuk-tour`
10. `spiti-winter-expedition`
11. `srinagar-leh-ladakh-tour`
12. `uttarakhand-honeymoon-circuit`

### Inventory

All 12 production `price` values and `image` values are absent. All have empty `inclusions`/`exclusions`, absent pickup/drop, meal and transport plans, absent occupancy/hotel-category fields, and `usesGeneralCancellationPolicy` absent. The readiness helper reports the standard field blockers (`MISSING_PRICE`, `MISSING_HOTEL_PLAN`, `MISSING_TRANSPORT_PLAN`, `MISSING_OCCUPANCY`, `MISSING_PICKUP_INFO`, `MISSING_DROP_INFO`, `MISSING_MEAL_PLAN`, `MISSING_INCLUSIONS`, `MISSING_EXCLUSIONS`, `CANCELLATION_POLICY_OWNER_APPROVAL_REQUIRED`) plus `OWNER_APPROVAL_REQUIRED` for each current draft. `regionId` is present on seven non-Ladakh drafts and on `srinagar-leh-ladakh-tour`; it is missing on the other four Ladakh drafts.

| Slug | Title | Duration; itinerary days | Route metadata | Region dependency | Destination dependencies | Current price / image |
|---|---|---|---|---|---|---|
| `auli-tour` | Auli Tour | 3N/4D; 4 days | Rishikesh → Rishikesh | Uttarakhand, published | Joshimath, Auli: published | absent / absent |
| `badrinath-yatra` | Badrinath Yatra | 3N/4D; 4 days | Haridwar → Haridwar | Uttarakhand, published | Badrinath: published | absent / absent |
| `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` | Dharamshala McLeodganj Dalhousie Khajjiar Circuit | 6N/7D; 7 days | Pathankot → Dalhousie | Himachal Pradesh, published | Dharamshala, McLeod Ganj, Dalhousie, Khajjiar: published | absent / absent |
| `kashmir-winter-snow-tour` | Kashmir Winter Snow Tour | 4N/5D; 5 days | Srinagar → Srinagar | Jammu & Kashmir, published | Srinagar, Gulmarg, Pahalgam: published | absent / absent |
| `kedarnath-yatra` | Kedarnath Yatra | 4N/5D; 5 days | Haridwar → Haridwar | Uttarakhand, published | Kedarnath: published | absent / absent |
| `ladakh-hanle-tso-moriri-tour` | Ladakh Hanle Tso Moriri Tour | 7N/8D; 8 days | Leh → Leh | no Journey regionId | Leh, Nubra Valley, Pangong Lake, Hanle, Tso Moriri: draft | absent / absent |
| `leh-nubra-pangong-hanle-tour` | Leh Nubra Pangong Hanle Tour | 6N/7D; 7 days | Leh → Leh | no Journey regionId | Leh, Nubra Valley, Pangong Lake, Hanle: draft | absent / absent |
| `leh-nubra-pangong-tour` | Leh Nubra Pangong Tour | 5N/6D; 6 days | Leh → Leh | no Journey regionId | Leh, Nubra Valley, Pangong Lake: draft | absent / absent |
| `leh-nubra-pangong-turtuk-tour` | Leh Nubra Pangong Turtuk Tour | 6N/7D; 7 days | Leh → Leh | no Journey regionId | Leh, Nubra Valley, Turtuk, Pangong Lake: draft | absent / absent |
| `spiti-winter-expedition` | Spiti Winter Expedition | 6N/7D; 7 days | Shimla → Shimla | Himachal Pradesh, published | Shimla, Kinnaur, Tabo, Spiti Valley: published | absent / absent |
| `srinagar-leh-ladakh-tour` | Srinagar Leh Ladakh Tour | 7N/8D; 8 days | Srinagar → Leh | Jammu & Kashmir, published | Srinagar: published; Kargil, Lamayuru, Leh, Nubra Valley, Pangong Lake: draft | absent / absent |
| `uttarakhand-honeymoon-circuit` | Uttarakhand Honeymoon Circuit | 4N/5D; 5 days | Dehradun → Kathgodam | Uttarakhand, published | Mussoorie, Nainital: published | absent / absent |

No record has a current Journey image file or Journey image URL; current image local-file and production-HTTP checks are therefore N/A. All 12 require an approved image before commercial readiness.

### A–F classification

| Slug | Class tags | Findings |
|---|---|---|
| `auli-tour` | B, C, D, E, F | Ropeway terms and Rishikesh/Joshimath endpoint copy need correction; overlap/price decision, suppliers, image and route endpoints remain. |
| `badrinath-yatra` | B, C, D, E, F | Haridwar/Dehradun and overnight/return service need clarification; overlap/price decision, pilgrimage suppliers and image remain. |
| `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` | B, C, D, E, F | Pathankot metadata conflicts with Dharamshala Day 1; live-product overlap/price decision, suppliers and image remain. |
| `kashmir-winter-snow-tour` | B, C, D, E | Hotel-only correction is needed for stored houseboat wording; exact pickup/drop point, meals/transfers supplier costs and image remain despite the owner-approved preparation price/basis. |
| `kedarnath-yatra` | C, D, E, F | Single-shrine overlap/price decision, access-season/operator/overnight plan, supplier basis and image remain. |
| `ladakh-hanle-tso-moriri-tour` | C, D, E | Draft Ladakh taxonomy, high-altitude remote-route suppliers, later owner price decision and image remain. |
| `leh-nubra-pangong-hanle-tour` | C, D, E | Draft Ladakh taxonomy, remote-route/permit suppliers, later owner price decision and image remain. |
| `leh-nubra-pangong-tour` | C, D, E, F | Draft taxonomy, supplier and image gaps; Pangong–Leh plus departure on Day 6 needs flight/overnight confirmation. |
| `leh-nubra-pangong-turtuk-tour` | C, D, E, F | Draft taxonomy, suppliers and image; Day 5 return base is not stated before Day 6 departs Leh. |
| `spiti-winter-expedition` | C, D, E, F | ₹29,999 remains unapproved; Night 6/Day 7 return is unresolved; winter accommodation, heat, vehicle/support and image require work. |
| `srinagar-leh-ladakh-tour` | C, D, E, F | Cross-region draft-destination dependency, seasonal Zoji La, same-day Pangong–Leh departure, supplier costs and image remain. |
| `uttarakhand-honeymoon-circuit` | B, C, D, E | The “honeymoon” distinction and price require owner decisions; hotel/meal/vehicle basis and route image are missing. |

Class meanings: A ready for commercial preparation; B minor content correction; C owner commercial decision; D supplier/operational confirmation; E image/license work; F route/duration conflict. No Journey qualifies for A. These tags are not claims that declared day-count arithmetic is wrong.

### Stored day-wise itineraries

**Auli Tour — 3N/4D**
1. Arrival in Joshimath: Arrive in Joshimath, the usual base for Auli.
2. Auli Excursion: Ropeway ride and meadow views, snow-dependent in winter and green in summer.
3. Auli Local Time: A further, more relaxed day around Auli/Joshimath.
4. Departure: Return journey and departure.

**Badrinath Yatra — 3N/4D**
1. Arrival in Haridwar/Dehradun: Arrive and begin travel toward Badrinath.
2. To Joshimath: Travel toward Joshimath, the usual overnight base en route to Badrinath.
3. Badrinath Darshan: Visit the Badrinath temple, directly road-accessible.
4. Departure: Return journey and departure.

**Dharamshala McLeodganj Dalhousie Khajjiar Circuit — 6N/7D**
1. Arrival in Dharamshala: Arrive and settle in; evening at leisure.
2. McLeod Ganj: A full day dedicated to McLeod Ganj — the Dalai Lama Temple, the Tibetan quarter and Bhagsu Waterfall.
3. Dharamshala Local Time: A more relaxed day around Dharamshala itself, with time for cafes and short walks rather than a packed sightseeing list.
4. Dharamshala to Dalhousie: Scenic drive to Dalhousie; evening walk on Mall Road.
5. Dalhousie Sightseeing: A full day around Dalhousie's colonial-era streets and viewpoints.
6. Khajjiar Day Trip: Visit Khajjiar's meadow and Chamera Lake, with more time on-site than a brief drive-through stop.
7. Departure: Check out and depart.

**Kashmir Winter Snow Tour — 4N/5D**
1. Arrival in Srinagar: Arrive in Srinagar; evening at leisure, houseboat stay where available.
2. Srinagar to Gulmarg: Travel to Gulmarg for its winter Gondola and snow scenery, conditions permitting.
3. Gulmarg Winter Activities: A further day in Gulmarg; skiing/snow activities are subject to season, snowfall and operator availability, not guaranteed.
4. Gulmarg to Pahalgam: Travel to Pahalgam for its winter valley views.
5. Departure via Srinagar: Return to Srinagar for departure.

**Kedarnath Yatra — 4N/5D**
1. Arrival in Haridwar/Dehradun: Arrive and begin travel toward the Kedarnath access base.
2. To Guptkashi/Sonprayag: Travel toward Guptkashi or Sonprayag, the usual overnight bases for Kedarnath.
3. Kedarnath Darshan: Visit Kedarnath via the trek from Gaurikund/Sonprayag, or by helicopter where booked and weather permits; genuinely access-gated, not guaranteed on every date.
4. Return to Guptkashi/Sonprayag: Return from Kedarnath.
5. Departure: Return journey and departure.

**Ladakh Hanle Tso Moriri Tour — 7N/8D**
1. Arrival in Leh: Arrive in Leh by air; the rest of the day is kept deliberately light for initial acclimatisation, with no sightseeing scheduled.
2. Leh Acclimatisation & Local Time: A further, still-gentle day around Leh itself before any higher-altitude travel begins.
3. Leh to Nubra Valley: Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.
4. Nubra Valley to Pangong Lake: Travel to Pangong Lake via the Shyok valley route.
5. Pangong Lake to Hanle: Travel to Hanle via the Chushul-Nyoma route, a genuinely remote leg.
6. Hanle to Tso Moriri: Travel on to Tso Moriri, in the same southeastern Changthang region as Hanle — a real connecting route, though genuinely remote.
7. Tso Moriri to Leh: Return drive to Leh.
8. Departure: Onward departure from Leh.

**Leh Nubra Pangong Hanle Tour — 6N/7D**
1. Arrival in Leh: Arrive in Leh by air; the rest of the day is kept deliberately light for initial acclimatisation, with no sightseeing scheduled.
2. Leh Acclimatisation & Local Time: A further, still-gentle day around Leh itself before any higher-altitude travel begins.
3. Leh to Nubra Valley: Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.
4. Nubra Valley to Pangong Lake: Travel to Pangong Lake via the Shyok valley route; overnight lakeside, where accommodation availability allows.
5. Pangong Lake to Hanle: Travel on to Hanle via the Chushul-Nyoma route, a genuinely remote leg — road conditions on this stretch should be confirmed closer to travel.
6. Hanle to Leh: Time in Hanle (stargazing conditions are weather and moon-phase dependent, never guaranteed on a specific date) before the return drive to Leh.
7. Departure: Onward departure from Leh.

**Leh Nubra Pangong Tour — 5N/6D**
1. Arrival in Leh: Arrive in Leh by air; the rest of the day is kept deliberately light — check-in and rest, with no sightseeing scheduled, to allow initial acclimatisation to the altitude.
2. Leh Acclimatisation & Local Time: A further, still-gentle day around Leh itself — Leh Palace, Shanti Stupa and the town's monasteries — before any higher-altitude travel begins.
3. Leh to Nubra Valley: Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.
4. Nubra Valley: Diskit Monastery and Hunder's sand dunes.
5. Nubra Valley to Pangong Lake: Travel to Pangong Lake; overnight lakeside, where accommodation availability allows.
6. Pangong Lake to Leh, Departure: Return to Leh for onward departure.

**Leh Nubra Pangong Turtuk Tour — 6N/7D**
1. Arrival in Leh: Arrive in Leh by air; the rest of the day is kept deliberately light for initial acclimatisation, with no sightseeing scheduled.
2. Leh Acclimatisation & Local Time: A further, still-gentle day around Leh itself before any higher-altitude travel begins.
3. Leh to Nubra Valley: Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.
4. Nubra Valley to Turtuk: Continue further into the valley to Turtuk, a Balti village genuinely different in culture from the rest of Ladakh.
5. Turtuk back toward Leh: Turtuk does not connect directly to Pangong Lake by road in a single realistic day — this itinerary honestly routes back toward Leh as a transit day rather than presenting an unrealistic direct crossing.
6. Leh to Pangong Lake: Travel on to Pangong Lake; overnight lakeside, where accommodation availability allows.
7. Pangong Lake to Leh, Departure: Return to Leh for onward departure.

**Spiti Winter Expedition — 6N/7D**
1. Shimla to Kalpa: Drive along the Sutlej river to Kalpa.
2. Kalpa to Tabo: Cross into the cold desert via Nako to Tabo, continuing to its centuries-old monastery.
3. Tabo to Kaza: Drive on to Kaza.
4. Kaza Local Time: Key Monastery and nearby villages, at a winter pace — some higher-altitude side trips may not be accessible.
5. Kaza Area: A further day around Kaza's accessible villages, weather permitting.
6. Return Toward Kalpa: Begin the return journey — the Manali-side exit is not used in winter.
7. Departure: Onward departure via Shimla.

**Srinagar Leh Ladakh Tour — 7N/8D**
1. Arrival in Srinagar: Arrive in Srinagar; evening at leisure.
2. Srinagar to Kargil: Drive via Sonamarg and Zoji La to Kargil — a genuinely long mountain-road day.
3. Kargil to Leh: Continue via Lamayuru's "Moonland" landscape and ancient monastery to Leh — this gradual overland ascent is itself a natural approach to acclimatisation, unlike flying directly into Leh.
4. Leh Local Time: A still-gentle day around Leh itself before any higher-altitude crossing, even though the overland route has already helped with gradual acclimatisation.
5. Leh to Nubra Valley: Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.
6. Nubra Valley: Diskit Monastery and Hunder's sand dunes.
7. Nubra Valley to Pangong Lake: Travel to Pangong Lake; overnight lakeside, where accommodation availability allows.
8. Pangong Lake to Leh, Departure: Return to Leh for onward departure.

**Uttarakhand Honeymoon Circuit — 4N/5D**
1. Arrival in Mussoorie: Arrive and settle in; evening on Mall Road.
2. Mussoorie Sightseeing: Camel's Back Road and viewpoints, at a relaxed couple pace.
3. Mussoorie to Nainital: Travel to Nainital.
4. Nainital Sightseeing: Boating on Naini Lake and local viewpoints.
5. Departure: Check out and depart.

## Route and night matrix

All 12 declared day counts equal their stored itinerary length and their mathematical night count is `days - 1`. This arithmetic does not establish a lodging booking. “Implied” below is an audit inference only, not an approved overnight or supplier commitment.

| Slug | Required nights | Explicit / implied overnight allocation | Route or night issue |
|---|---:|---|---|
| `auli-tour` | 3 | No exact nights stated; likely Joshimath/Auli area | `startingCity=Rishikesh`, but Day 1 starts with arrival in Joshimath; return transfer to Rishikesh is not described in daily copy. Clarify endpoint and three bases. |
| `badrinath-yatra` | 3 | Joshimath is named as usual overnight base; full three-night allocation not explicit | Day 1 permits Haridwar or Dehradun while metadata is Haridwar; Day 4 return timing/base is unspecified. |
| `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` | 6 | Implied 3 nights Dharamshala/McLeod Ganj, 3 Dalhousie | Metadata starts Pathankot but Day 1 starts in Dharamshala; transport scope and 6 bases need confirmation. |
| `kashmir-winter-snow-tour` | 4 | Srinagar 1N (houseboat wording), Gulmarg 2N, Pahalgam 1N implied | Matches stored route; houseboat wording conflicts with the approved hotel-only base. Day-5 airport/flight buffer is unpriced. |
| `kedarnath-yatra` | 4 | Guptkashi/Sonprayag named as typical bases; other nights not allocated | Access day, trek/helicopter overnight and return-day distance require operator timing; Haridwar/Dehradun start is ambiguous. |
| `ladakh-hanle-tso-moriri-tour` | 7 | Implied Leh 2N, Nubra 1N, Pangong 1N, Hanle 1N, Tso Moriri 1N, Leh 1N | Arithmetic route is continuous on paper; remote sectors, permits, actual operating stays and drive times are unconfirmed. |
| `leh-nubra-pangong-hanle-tour` | 6 | Implied Leh 2N, Nubra 1N, Pangong 1N, Hanle 1N, Leh 1N | Hanle–Leh is a long remote return; last-day onward travel timing and buffer need operator confirmation. |
| `leh-nubra-pangong-tour` | 5 | Implied Leh 2N, Nubra 2N, Pangong 1N | Day 6 combines Pangong–Leh return and departure; flight timing/extra-night responsibility unresolved. |
| `leh-nubra-pangong-turtuk-tour` | 6 | Implied Leh 2N, Nubra 1N, Turtuk 1N, return sector 1N, Pangong 1N | Day 5 only returns “toward Leh”; Day 6 starts “Leh to Pangong.” Explicit Day-5 overnight base is missing. |
| `spiti-winter-expedition` | 6 | Kalpa 1N, Tabo 1N, Kaza 3N imply 5; Day 6 likely return-sector night is unresolved | Day 6 only says “toward Kalpa”; Day 7 says departure via Shimla without describing Kalpa–Shimla timing. Do not assume Night 6. |
| `srinagar-leh-ladakh-tour` | 7 | Implied Srinagar 1N, Kargil 1N, Leh 2N, Nubra 2N, Pangong 1N | Day 8 combines Pangong–Leh and onward departure. Zoji La is seasonal. Journey `regionId` points to published Kashmir while five Ladakh destinations are draft. |
| `uttarakhand-honeymoon-circuit` | 4 | Implied Mussoorie 2N + Nainital 2N | Four nights fit five days; Day 3 is a substantial inter-town hill transfer. Exact hotels, timing and Kathgodam drop are unconfirmed. |

## Price decision matrix

All current production prices are absent. Prior proposals below are historical planning values, not supplier quotes, profitability claims or publication approvals.

| Journey | Previous proposal | Owner-approved for preparation? | Supplier dependency / largest uncertainty | Recommended status |
|---|---:|---|---|---|
| `auli-tour` | None found | No | Auli/Joshimath winter hotel and vehicle; ropeway ticket inclusion; overlap with live Auli–Chopta–Tungnath product | OWNER PRICE DECISION REQUIRED |
| `badrinath-yatra` | None found | No | Seasonal temple operations, hotel bases and trek/road service boundaries; overlaps live combined and Char Dham journeys | OWNER PRICE DECISION REQUIRED |
| `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` | None found | No | Pathankot transfer versus local start; supplier scope; material overlap with live Himachal Family Escape | OWNER PRICE DECISION REQUIRED |
| `kashmir-winter-snow-tour` | ₹21,999 pp onwards (Phase 8 internal proposal) | **Yes, preparation only** | Four winter hotel nights, heating, meals, three-sector transfers, local-union vehicle fees, Day-5 airport buffer | SUPPLIER COSTING REQUIRED |
| `kedarnath-yatra` | None found | No | Yatra-season operations, trek/helicopter and access-base costs; deliberate subset of live products needs owner differentiation | OWNER PRICE DECISION REQUIRED |
| `ladakh-hanle-tso-moriri-tour` | None found | No | Remote vehicle/driver, high-altitude stays, permits, closures, fuel/support and draft destination/region dependencies | SUPPLIER COSTING REQUIRED |
| `leh-nubra-pangong-hanle-tour` | None found | No | Remote route/vehicle and permit costs; Hanle–Leh day and overnight | SUPPLIER COSTING REQUIRED |
| `leh-nubra-pangong-tour` | None found | No | Flight-day return buffer, permits, remote stays and vehicle | SUPPLIER COSTING REQUIRED |
| `leh-nubra-pangong-turtuk-tour` | None found | No | Turtuk/Leh overnight and route, permits, remote stays and vehicle | SUPPLIER COSTING REQUIRED |
| `spiti-winter-expedition` | ₹29,999 pp onwards (Phase 8 internal proposal; Phase 10 says revise before approval) | No | Night 6/return, winter-operating stays, heat/water, suitable vehicle/driver, buffer/support | SUPPLIER COSTING REQUIRED |
| `srinagar-leh-ladakh-tour` | None found | No | Zoji La season, two-region taxonomy, route-day departure buffer, remote vehicle and permits | SUPPLIER COSTING REQUIRED |
| `uttarakhand-honeymoon-circuit` | ₹17,999 pp onwards (Phase 8 conditional proposal; not finally approved) | No | Standard room/meal/vehicle rates, long Day-3 transfer, no approved couple-specific service basis | OWNER PRICE DECISION REQUIRED |

No supplier margin, cost, rate, or profitability is asserted. The Phase-8 allowance worksheets are expressly assumptions, not booked supplier rates.

## Auto-safe / already approved vs. decision required

**Auto-safe or already approved for preparation only:** the actual stored slugs, titles, route metadata, durations, destination references, day copy, missing-field state and present blockers are audit facts; they are not write payloads. The owner explicitly approved Kashmir's ₹21,999 per-person-onwards target, hotel-only base, four-night Srinagar/Gulmarg/Pahalgam allocation, Standard/Deluxe winter-operating hotel category, double-sharing/two-adult/one-room basis, and exclusion of paid snow activities unless later quoted. A hotel-only Day-1 wording correction and optional/separately-payable Day-2/Day-3 safety wording are appropriate explicit Kashmir plan text, but remain dry-run-only while other gates fail. No auto-safe database update is eligible today.

**Owner decision or written supplier/operator evidence still required:** Kashmir pickup/drop point (Srinagar airport is not present in current production fields), meal schedule and cost, permitted road-transfer scope and local-union vehicle responsibilities, winter hotel availability/heating, date-specific costs, and a verified multi-location winter image with rights/credit. The other eleven have no newly approved prices in this prompt. All twelve need an explicitly selected, verified Journey image before they can clear publication readiness. Spiti needs the return-night/route and winter supplier decisions; Ladakh needs its taxonomy and operational/supplier decisions; Uttarakhand Honeymoon needs its product/price distinction decision. No guessed service, supplier, image, price, or margin is auto-safe.

## Commercial field matrix

For every one of the 12 drafts the following are currently missing: `price`, `pickupInfo`, `dropInfo`, `mealPlan`, `transportType`, `minTravellers`, `roomsIncluded`, `hotelCategoryDescription`, `inclusions`, `exclusions`, `image`, and `usesGeneralCancellationPolicy`. Inclusions and exclusions are `[]`. `regionId` is present for the seven non-Ladakh regional drafts and `srinagar-leh-ladakh-tour`; it is absent for four Ladakh-only drafts. No production commercial field changed in Phase 12.

## Image matrix

Every current Journey image is `null`: local Journey-image file is N/A, production Journey-image URL is N/A, and no assigned Journey image can be judged for crop, watermark, license or hero suitability. All 12 classify **IMAGE REPLACEMENT REQUIRED**. The following are existing, local, source-documented Destination assets only; none is assigned or approved for a Journey by this audit. They returned production HTTP 200 as JPEGs. Before assignment, review their actual visual and season fit and register the Journey credit in the existing `config/imageCredits.config.ts` plus the associated hero credit UI.

| Journey(s) | Existing place asset, provenance and direct visual review | Relevance, season, watermark and hero decision |
|---|---|---|
| `auli-tour` | `/images/destination-auli.jpg`: “Auli, India” by Amit Shaw, CC0 1.0; `/images/destination-joshimath.jpg`: Rohanshah657, CC BY-SA 4.0. Both local and production HTTP 200. Auli view shows a snow-covered alpine meadow/ridge; Joshimath shows a hillside town. | No obvious watermark. Auli is seasonally useful, but no clear ropeway landmark and no Rishikesh coverage; **owner visual review required**, then add selected-image credit. |
| `badrinath-yatra` | `/images/destination-badrinath.jpg`: “Badrinath Temple” by Harshit SR, CC BY-SA 4.0; local/HTTP 200. | Visibly the Badrinath shrine, no obvious watermark; general-season temple image rather than proof of access/operation. Suitable place candidate pending owner hero/crop approval and Journey credit. |
| `dharamshala-mcleodganj-dalhousie-khajjiar-circuit` | `/images/destination-mcleod-ganj.jpg`: Namgyal Monastery, CC BY-SA 2.0; `/images/destination-dalhousie.jpg` and `/images/destination-khajjiar.jpg`: CC BY-SA 4.0; all local/HTTP 200. Viewed assets show a monastery/courtyard, a forested hill-town scene and a green meadow. | Place-relevant individual stops, no obvious watermark; non-winter, and no single image represents all four stops. Owner must select one truthfully captioned stop image or commission/source a route image; wire credit. |
| `kashmir-winter-snow-tour` | Srinagar panorama and Pahalgam valley: KennyOMG, CC BY-SA 3.0; Gulmarg asset is the documented Gulmarg destination photograph; local/HTTP 200. Visuals show a city/lake panorama, green river valley and green Gulmarg meadow. | No visible winter representation in the Gulmarg asset. Do not automatically reuse the Phase-11 Gulmarg winter hero; the route spans three towns and needs a separate selected, rights-checked multi-stop winter image and Journey attribution. |
| `kedarnath-yatra` | `/images/destination-kedarnath.jpg`: “KEDARNATH” by Sarika Shirbhate, CC BY-SA 4.0; local/HTTP 200. | Shows the shrine and pilgrims; no obvious watermark. Exact-place candidate, but crowd/season image does not guarantee darshan/access; owner crop/season approval and Journey credit required. |
| Four Leh/Nubra/Pangong/Turtuk/Hanle/Tso Moriri Journeys | Each destination record points to `/images/img-hero-hero.jpg`; local/HTTP 200, but direct visual review shows a generic mountain scene with no verified Ladakh landmark. | **IMAGE REPLACEMENT REQUIRED**. The placeholder is not geographically verified or a specific Ladakh scene. Source a location-verified image and rights, then credit it; do not use the placeholder as Ladakh. |
| `spiti-winter-expedition` | `/images/destination-spiti.jpg`: source-documented Spiti landscape; `/images/destination-tabo.jpg`: Tabo monastery; both local/HTTP 200. Direct view shows the Spiti file is a bordered valley/riverscape with no meaningful snow; Tabo file shows the monastery. | Neither proves winter conditions; the Spiti candidate has prominent rounded white borders and weak hero treatment. Prior “SPITI IN WINTER” candidate was rejected for visible “Shot on OnePlus” watermark. **IMAGE REPLACEMENT REQUIRED** for the winter Journey; no random download or reuse of rejected candidate. |
| `srinagar-leh-ladakh-tour` | `/images/destination-srinagar.jpg`: “Srinagar pano” by KennyOMG, CC BY-SA 3.0; local/HTTP 200. | Wide Srinagar-only panorama, no obvious watermark, but does not represent the overland Srinagar–Kargil–Leh–Nubra–Pangong itinerary. Needs owner-approved, route-relevant lead image or accurately captioned selected stop image. |
| `uttarakhand-honeymoon-circuit` | `/images/destination-mussoorie.jpg` and `/images/destination-nainital.jpg`: source-documented destination photos; both local/HTTP 200. Direct views show Mussoorie's hillside town/Mall Road and Nainital lake. | Place-relevant, general-season images; no apparent watermark. They do not evidence honeymoon-specific services. Owner selects the route lead image and approves corresponding credit; do not imply romantic amenities. |

For an adapted third-party image, retain title, creator, source URL, license URL, modification notice and applicable share-alike obligations in the existing image-credit system. No image was downloaded, relabeled or committed in this phase.

## Kashmir Winter owner decision and guarded dry-run

Owner-approved preparation direction only: `4 Nights / 5 Days`, ₹21,999 per person onwards, hotel-only base, standard/Deluxe winter-operating hotels or equivalent, double sharing for two adults/one room. Stored route supports Srinagar 1N, Gulmarg 2N, Pahalgam 1N. Day-1 houseboat copy is a contradiction to the hotel-only base; proposed correction removes it from the base and describes any houseboat only as a separately priced/availability-confirmed optional upgrade. Paid snow activities remain excluded unless quoted in writing.

No write was executed. The new default dry-run of `scripts/preparePhase12DraftJourneys.ts` identifies one explicit Kashmir plan and reports `wouldUpdate=0`, `refused=1`, with these gates unresolved: `IMAGE_FIELD_MISSING`, image verification, supplier confirmation, `MISSING_PICKUP_INFO`, `MISSING_DROP_INFO`, `MISSING_MEAL_PLAN`, and `MISSING_TRANSPORT_PLAN`. Srinagar city gateways are present, but the stored record does not authorize assuming airport pickup/drop. The owner authorized breakfast+dinner preparation only if supported by package economics; there are no actual seasonal supplier costs or meal schedule to verify. Therefore no Kashmir field was written. Idempotency is not claimed as a production update; repeated dry-run remains a refusal until the missing gates clear.

## Specific hold reviews

### Spiti Winter

The stored route is Shimla → Kalpa → Tabo → Kaza → return toward Kalpa → Shimla; no Manali/Kunzum exit is described. Nights 1–5 imply Kalpa 1N, Tabo 1N, Kaza 3N. Day 6 says only “begin the return journey” and does not identify the Night-6 stop; Day 7 does not specify the Kalpa–Shimla drive. Kalpa on Night 6 is plausible but not confirmed, so ₹29,999 remains unapproved and unwritten.

Supplier/operator decisions still required: winter-opening/room availability and accommodation class by date; heating fuel/method, hours, safe operation and charges; hot/drinking water and toilet arrangements; winter vehicle class/drivetrain/equipment, driver experience and duty limits; daylight feasibility of Kaza–Kalpa and Kalpa–Shimla; road closure/no-go authority; alternate stays/routes; buffer/extra-night allocation and cost; communications limitations and actual support arrangements; altitude sequence/advisory and response plan. Do not claim guaranteed access, snowfall, heating, hot water, communications or rescue support.

### Uttarakhand Honeymoon

Stored route is Dehradun → Mussoorie → Nainital → Kathgodam, `4 Nights / 5 Days`, with implied 2N Mussoorie + 2N Nainital. Price is absent; the prior ₹17,999 proposal was conditional and is not approved. Standard hotel/meal/transport quotes and the long Day-3 transfer need confirmation. The draft says couple-paced sightseeing but contains no approved honeymoon-specific hotel/service. Owner must approve a truthful standard couple circuit or a concrete differentiated service before naming it a honeymoon offer.

### Ladakh

There are exactly five Ladakh drafts. The actual `ladakh` Region is `draft`; eight associated Destinations (`leh`, `nubra-valley`, `pangong-lake`, `turtuk`, `hanle`, `tso-moriri`, `kargil`, `lamayuru`) are `draft`, with null `regionId` and generic `img-hero-hero.jpg` images. Four Ladakh-only Journeys have null `regionId`; `srinagar-leh-ladakh-tour` points to published Kashmir because Srinagar is first, despite five draft Ladakh destinations in its route. Publishing a Journey now would expose references to draft taxonomy and leave incomplete region association; do not publish or publish taxonomy in this phase.

Per Journey: `ladakh-hanle-tso-moriri-tour` is a plausible eight-day loop but has multiple remote high-altitude legs and no images/commercial basis; `leh-nubra-pangong-hanle-tour` has long Pangong/Hanle/Leh legs and no pricing/supplier data; `leh-nubra-pangong-tour` combines Pangong–Leh return and departure on Day 6; `leh-nubra-pangong-turtuk-tour` does not name the Day-5 overnight between Turtuk “back toward Leh” and Day-6 Leh–Pangong; `srinagar-leh-ladakh-tour` contains a seasonal Zoji La crossing, cross-region taxonomy mismatch and Day-8 Pangong–Leh departure buffer issue. All require location-verified images, region/destination owner work, current permits/road/operator confirmation, vehicle/driver plan, stay/meal costing, pickup/drop and other missing commercial fields. All stay on hold.

## Readiness board and future publication batch

No draft is ready for final owner publication approval because all 12 lack a Journey image and commercial plan. The future safe publication batch **now** is empty; if the empty set were later approved/published, the total would remain 28 live Journeys.

| Primary next-action group | Slugs | Additional blocker tags |
|---|---|---|
| GROUP 1 — READY FOR FINAL OWNER PUBLICATION APPROVAL | None | All 12 have missing images and commercial fields. |
| GROUP 2 — OWNER DECISION REQUIRED | `auli-tour`, `badrinath-yatra`, `dharamshala-mcleodganj-dalhousie-khajjiar-circuit`, `kedarnath-yatra`, `uttarakhand-honeymoon-circuit` | Overlap/differentiation holds; honeymoon service/price decision. |
| GROUP 3 — SUPPLIER / OPERATIONAL CONFIRMATION REQUIRED | All 12 drafts | Hotel, meal, transport and pickup/drop fields are empty; pilgrimage, winter and remote-Ladakh products also require season/access/permit/vehicle confirmation. |
| GROUP 4 — ROUTE / CONTENT FIX REQUIRED | `auli-tour`, `dharamshala-mcleodganj-dalhousie-khajjiar-circuit`, `badrinath-yatra`, `kedarnath-yatra`, `spiti-winter-expedition`, `leh-nubra-pangong-turtuk-tour`, `leh-nubra-pangong-tour`, `srinagar-leh-ladakh-tour`, `kashmir-winter-snow-tour` | Endpoint/overnight/flight/houseboat corrections and explicit service boundaries noted above. No route was silently rewritten. |
| GROUP 5 — IMAGE / LICENSE BLOCKED | All 12 | Current Journey `image` is null for every draft. Candidate files are not Journey selections; hero-credit entries are not assigned. |

## Bulk preparation design and Phase 12 execution result

`scripts/preparePhase12DraftJourneys.ts` uses one explicit per-slug plan list, default dry-run mode, and an explicit `--execute --owner-approved` mechanism. The reusable pure guard in `scripts/phase12DraftPreparationGuard.ts` enforces an exact 12-draft snapshot, unique slug allowlists, per-record field allowlists, protected `status`/`slug`/`duration`, explicit values only, baseline conflict detection, idempotency, readiness plus owner/supplier/image evidence, whole-document before/after equality outside the payload, per-record refusal, and public draft isolation. It never derives prices, hotels, meals, transport or routes from sibling packages.

The one current explicit plan is Kashmir's owner-approved preparation subset. Dry-run output: inventory 12, targetCount 1, wouldUpdate 0, alreadyCorrect 0, refused 1. No production write occurred. The remaining 11 drafts have no explicit approved preparation payload and were not offered guessed values. Focused guard tests cover the twelve-record invariant, protected fields, per-record allowlists, conflict detection, idempotency, evidence gates and public isolation.

## Protected state after Phase 12

- Production remains 40 total / 28 published / 12 draft. Catalogue and sitemap remain 28; every draft URL remains HTTP 404.
- All 28 published Journey documents are protected by read-only audit; `kinnaur-valley-tour` and `gulmarg-winter-escape` remain unchanged.
- The bulk tool made no DB write. Destination and Region documents were read-only; Ladakh Region/Destinations remain draft.
- HBX, Google Places, PlaceCache and transport pricing were not changed. IndexNow remains deferred.