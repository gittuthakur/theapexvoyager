import type { DraftTravelPackageInput } from '@/types/package';
// Phase 4C-R: real, already-resolving curated Destination photography — the same
// `images.destinations.*` map config/packages.config.ts's 6 live Journeys already use
// (e.g. manaliPremiumEscape -> images.destinations.manali). Never a fabricated path;
// every value below is reused verbatim from an existing, published Destination's own
// image, confirmed to exist on disk under public/images/.
import { images } from '@/config/images.config';

/**
 * DRAFT CATALOGUE (Phase 2 + Phase 3) — NOT the live public catalogue (see
 * config/packages.config.ts for that). Every entry here is `status: 'draft'`.
 * `destinationSlugs` are drawn ONLY from real, already-curated destinations in
 * config/destinations.config.ts. Route/itinerary text uses conservative, conditional
 * language for any weather/road/altitude/permit-dependent leg — never a guaranteed
 * claim. Seeded into MongoDB (as drafts only) by scripts/seedDraftJourneys.ts — NOT yet
 * executed for the Phase 3 additions; see docs/phase-3-high-intent-catalogue.md.
 *
 * PRICING (Phase 3, Part 6): 10 of the original 11 Phase 2 drafts carry an
 * owner-approved INDICATIVE starting `price` — see each entry's own comment and
 * docs/phase-3-high-intent-catalogue.md for the full list. This price is stored on the
 * still-draft record only; setting it does NOT publish anything (see models/Journey.ts's
 * pre-validate hook — `status` alone gates publication). Every Phase 3 addition, and the
 * one still-on-hold Phase 2 draft (`dharamshala-mcleodganj-dalhousie-khajjiar-circuit`),
 * carries NO price — never inferred from a sibling package.
 *
 * DUPLICATES DELIBERATELY NOT CREATED — see docs/phase-3-high-intent-catalogue.md for
 * the full duplicate-first analysis (Part 1 of the Phase 3 brief) behind every skip:
 *  - A second "Spiti Valley Adventure" (Phase 2) — substantially duplicative of the live
 *    spiti-valley-adventure package.
 *  - Shimla Manali Honeymoon, Manali Couple/Honeymoon, Manali Family Tour (Phase 3) —
 *    each insufficiently differentiated from an existing live/draft package at the same
 *    duration.
 *  - Jibhi Jalori Pass Serolsar Lake (Phase 3) — near-duplicate of the existing Jibhi
 *    Tirthan Valley draft at the same duration; recommend enriching that draft instead.
 *  - Kashmir Honeymoon, a shorter Srinagar-Gulmarg-Pahalgam variant, a shorter
 *    Pahalgam-Gulmarg-Sonamarg variant (Phase 3) — each too close to an existing
 *    live/draft Kashmir package.
 *  - Kashmir + Gurez/Doodhpathri/Yusmarg (Phase 3) — none of these three destinations
 *    has a curated Destination in config/destinations.config.ts; never invented.
 *  - A plain Haridwar-Rishikesh-Mussoorie variant, a Nainital-Corbett-only variant, a
 *    Rishikesh+Haridwar-only variant (Phase 3) — each a near-subset duplicate of the
 *    live uttarakhand-explorer package or an existing draft.
 *  - Himachal + Amritsar Grand Circuit (Phase 3) — Amritsar has no curated Destination
 *    in this app and is outside the business's three stated primary regions; out of
 *    scope for this phase, not invented.
 *  - A handful of closely-adjacent Himachal concepts (Sangla-Chitkul-Kalpa Escape, Bir
 *    Billing Adventure Weekend, a 6-stop Chamba-Dalhousie-Khajjiar-Dharamshala-Palampur-
 *    Bir circuit, a standalone Kedarnath+Chopta/Tungnath combo, a standalone
 *    Chopta-Tungnath-Chandrashila trek) — deferred (not rejected as duplicates, just not
 *    authored this phase) to keep this expansion's size deliberate rather than
 *    maximal — see the Phase 3 report's own reasoning.
 *
 * LADAKH (Phase 3C, added below the Phase 2/3 catalogue above): exactly 5 canonical
 * Ladakh Journey drafts — leh-nubra-pangong-tour, leh-nubra-pangong-turtuk-tour,
 * leh-nubra-pangong-hanle-tour, ladakh-hanle-tso-moriri-tour, srinagar-leh-ladakh-tour.
 * Each references only real destinationSlugs from config/ladakhFoundation.config.ts's 8
 * draft Destinations (also still `status: 'draft'`, per Phase 3B) — never an invented
 * slug, never Khardung La as a standalone destination. No price/inclusions/exclusions on
 * any of them. See config/ladakhFoundation.config.test.ts for the full route/
 * acclimatisation/destination-slug validation.
 */
export const draftJourneys: DraftTravelPackageInput[] = [
  {
    slug: 'shimla-manali-tour-package',
    status: 'draft',
    image: images.destinations.manali,
    name: 'Shimla Manali Tour Package',
    destination: 'Shimla & Manali, Himachal Pradesh',
    destinationSlugs: ['shimla', 'manali'],
    duration: '5 Nights / 6 Days',
    category: 'Family',
    // Owner-approved INDICATIVE starting price (Phase 3, Part 6) — stored on this
    // still-draft record only; status remains 'draft' and this is NOT published by this
    // change. See docs/phase-3-high-intent-catalogue.md's price-disclaimer section —
    // any eventual public display of this figure must carry that disclaimer.
    price: 13999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Deluxe hotel/equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 5 nights on this itinerary.',
    transportType: 'Private cab throughout, for all pickup/drop transfers and itinerary sightseeing.',
    pickupInfo: 'Pickup from Chandigarh (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Chandigarh (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A classic first Himachal circuit pairing Shimla\'s colonial hill-station charm with Manali\'s valley and adventure-sports base — built for families, couples and groups alike, not framed around any one of those.',
    highlights: [
      'Shimla\'s Mall Road and The Ridge',
      'Old Manali cafes and Hadimba Temple',
      'Solang Valley (seasonal adventure activities)',
      'Scenic Chandigarh–Shimla–Manali drive'
    ],
    itinerary: [
      { day: 1, title: 'Chandigarh to Shimla', description: 'Drive from Chandigarh to Shimla; evening at leisure on Mall Road and The Ridge.' },
      { day: 2, title: 'Shimla Sightseeing', description: 'Local sightseeing around Shimla — Jakhoo Temple viewpoint and the town\'s colonial-era buildings; a Kufri excursion can be added where road and weather conditions allow.' },
      { day: 3, title: 'Shimla to Manali', description: 'Scenic drive from Shimla to Manali via the Kullu valley; evening at leisure.' },
      { day: 4, title: 'Manali Local Sightseeing', description: 'Visit Hadimba Temple, explore Old Manali\'s lanes and riverside cafes, and browse Manali\'s Mall Road.' },
      { day: 5, title: 'Solang Valley Excursion', description: 'Day trip to Solang Valley for valley views and, where seasonally open, adventure activities; a further excursion toward Atal Tunnel/Rohtang depends on road and permit conditions on the day.' },
      { day: 6, title: 'Manali to Chandigarh', description: 'Return drive to Chandigarh; tour concludes on arrival.' }
    ],
    inclusions: [
      'Accommodation for 5 nights on a double-sharing basis (Deluxe hotel/equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Pickup and drop at Chandigarh',
      'Itinerary transport and sightseeing by private cab as per the itinerary'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry tickets',
      'Adventure activities (e.g. at Solang Valley)',
      'Any Atal Tunnel/Rohtang Pass excursion, local union/RTO vehicle charges, or other restricted-area transport where separately required',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Chandigarh',
    endingCity: 'Chandigarh',
    idealTraveller: 'Families, couples, friend groups and first-time Himachal visitors wanting one classic circuit rather than a single-destination trip.',
    bestTimeToVisit: 'Broadly a year-round route; conditions differ by season — expect snow access at higher points (e.g. Solang, Atal Tunnel/Rohtang) mainly in winter and early summer, and monsoon-season landslide risk on some stretches. Confirm current road conditions closer to travel.',
    importantNotes: [
      'Any excursion beyond Solang toward Atal Tunnel/Rohtang Pass depends on seasonal road opening, weather and, at times, permits — it is not a guaranteed part of every departure.',
      'Hill roads between Shimla and Manali can be affected by weather or landslides, particularly in the monsoon; the exact drive time can vary accordingly.',
      'Accommodation shown here is a category ("Deluxe hotel/equivalent"), not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kinnaur-spiti-circuit',
    status: 'draft',
    image: images.destinations.spitiValley,
    name: 'Kinnaur Spiti Circuit',
    destination: 'Kinnaur & Spiti Valley, Himachal Pradesh',
    destinationSlugs: ['shimla', 'kinnaur', 'sangla-valley', 'chitkul', 'tabo', 'spiti-valley', 'manali'],
    duration: '8 Nights / 9 Days',
    category: 'Offbeat',
    price: 21999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Standard/Deluxe hotels, guesthouses or equivalent according to each stop — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel/guesthouse for each of the 8 nights on this itinerary; not implied for any meal taken during a transit-day drive.',
    transportType: 'Package-dependent private or shared vehicle for this multi-leg, high-altitude route — confirmed against group size and the final quotation.',
    pickupInfo: 'Pickup from Chandigarh, with onward road transfer to Shimla to begin the itinerary (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Manali on Day 9 (exact point and time confirmed at the time of booking) — a Manali–Chandigarh return transfer is not included in the starting price; see this package\'s important notes.',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A full high-altitude circuit through the Baspa valley\'s Sangla and Chitkul before crossing into Spiti\'s monasteries and cold desert — longer and more thorough than a direct Spiti-only run, genuinely covering the Kinnaur valley loop the shorter route does not.',
    highlights: [
      'Sangla and Chitkul in the Baspa valley',
      'Kalpa\'s Kinner Kailash views',
      'Tabo\'s thousand-year-old monastery',
      'Kaza, Key Monastery and the Spiti cold desert'
    ],
    itinerary: [
      { day: 1, title: 'Shimla Arrival', description: 'Arrive in Shimla; evening at leisure.' },
      { day: 2, title: 'Shimla to Sangla', description: 'Drive into the Baspa valley to Sangla.' },
      { day: 3, title: 'Chitkul Day Trip', description: 'Day trip to Chitkul, one of the last inhabited villages on this road, then return to Sangla/Kalpa area.' },
      { day: 4, title: 'Kalpa', description: 'Kalpa sightseeing, with views toward the Kinner Kailash range where weather allows.' },
      { day: 5, title: 'Kalpa to Tabo', description: 'Cross into the cold desert via Nako, continuing to Tabo to see its centuries-old monastery.' },
      { day: 6, title: 'Tabo to Kaza', description: 'Drive on to Kaza, the valley\'s main hub.' },
      { day: 7, title: 'Kaza Local Sightseeing', description: 'Visit Key Monastery, Kibber and Langza; a Hikkim/Komic or Chandratal extension depends on the day\'s road and weather conditions.' },
      { day: 8, title: 'Kaza to Manali', description: 'Cross Kunzum Pass (seasonal access) to Manali.' },
      { day: 9, title: 'Departure', description: 'Onward departure from Manali.' }
    ],
    inclusions: [
      'Accommodation for 8 nights on a double-sharing basis (Standard/Deluxe hotels, guesthouses or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Chandigarh pickup with road transfer to Shimla',
      'Scheduled itinerary transport and sightseeing as per the route (Shimla to Manali)'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry/monastery fees where applicable',
      'Inner Line Permit charges and processing',
      'Manali–Chandigarh return transfer (not part of this itinerary — available on request at additional cost)',
      'Adventure activities',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Shimla',
    endingCity: 'Manali',
    idealTraveller: 'Offbeat and adventure travellers with time for a longer, higher-altitude circuit rather than a direct Spiti run.',
    bestTimeToVisit: 'Broadly mid-June to early October, when the Kunzum Pass crossing to Manali is typically open — exact opening/closing dates vary by year with snowfall and road-clearing work. Outside this window the Manali-side crossing may not be possible and the route would need to reverse via Shimla instead.',
    importantNotes: [
      'This is a genuinely high-altitude circuit (Kaza and surrounding villages sit above 3,500m) — acclimatization matters, and travellers with relevant health conditions should take medical advice before booking.',
      'Chandratal, Kunzum Pass and some Kaza-area excursions are seasonal and weather/road-condition dependent, not guaranteed on every departure.',
      'Inner-line permit requirements for parts of this route should be confirmed at the time of booking, as rules can change.',
      'Accommodation shown here is a category ("Standard/Deluxe hotels, guesthouses or equivalent"), not a specific named property — the final hotel/guesthouse at each stop is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
      'OWNER-APPROVED (Phase 4B): pickup is from Chandigarh; this itinerary\'s route ends in Manali on Day 9. The ₹21,999 starting price does not include a return transfer from Manali to Chandigarh — this is available on request at additional cost, quoted separately, and is never implied as included.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kasol-kheerganga-tosh',
    status: 'draft',
    image: images.destinations.kasol,
    name: 'Kasol Kheerganga Tosh',
    destination: 'Kasol, Parvati Valley, Himachal Pradesh',
    destinationSlugs: ['kasol'],
    duration: '4 Nights / 5 Days',
    category: 'Adventure',
    price: 9999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Standard hotel/guesthouse or equivalent for the Kasol nights, plus a basic trek/camp stay or equivalent near Kheerganga for that one night — the specific property/stay is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for the Kasol nights; meals during the Kheerganga trek night depend on the confirmed trek-stay arrangement and are not guaranteed to match the same MAP standard.',
    transportType: 'Shared/package-dependent road transport for the Bhuntar–Kasol sector — private cab is not claimed at this starting price. The Barshaini–Kheerganga leg is on foot, not by vehicle.',
    pickupInfo: 'Pickup from Bhuntar (exact point and time confirmed at the time of booking) — this package\'s starting price is based on the Bhuntar gateway, not a Chandigarh transfer; see this package\'s important notes.',
    dropInfo: 'Drop at Bhuntar (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A budget-friendly Parvati Valley base in Kasol with a trek up to Kheerganga\'s hot springs and a stop in Tosh — built for friends and young travellers on a trekking-focused trip.',
    highlights: [
      'Kasol\'s riverside cafe culture',
      'Tosh village views',
      'Trek to Kheerganga\'s hot springs',
      'Parvati river walks'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Kasol', description: 'Arrive in Kasol; evening at leisure by the river.' },
      { day: 2, title: 'Tosh Village', description: 'Day trip (or overnight stop) in Tosh, a short drive/walk from Kasol, for its village views.' },
      { day: 3, title: 'Trek to Kheerganga', description: 'Trek from the Barshaini roadhead up to Kheerganga; overnight near the hot springs, trail and weather conditions permitting.' },
      { day: 4, title: 'Trek Back to Kasol', description: 'Trek back down to Barshaini and return to Kasol.' },
      { day: 5, title: 'Departure', description: 'Onward departure from Kasol.' }
    ],
    inclusions: [
      'Accommodation for 4 nights (Kasol hotel/guesthouse + 1 night Kheerganga trek/camp stay) on a double-sharing basis',
      'Daily breakfast and dinner (MAP) at the Kasol hotel; Kheerganga night meals per the confirmed trek-stay arrangement',
      'Bhuntar pickup/drop',
      'Scheduled Bhuntar–Kasol road transfer'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Trek guide/porter charges for the Kheerganga trek',
      'Kheerganga trail entry/eco fees where applicable',
      'Chandigarh road transfer (not part of this itinerary — available on request at additional cost)',
      'Adventure activities',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Bhuntar',
    endingCity: 'Bhuntar',
    idealTraveller: 'Friends and young/budget-conscious travellers comfortable with a moderate trek.',
    bestTimeToVisit: 'Broadly March–June and September–November, avoiding heavy monsoon rain and the coldest winter weeks — the Kheerganga trail can be slippery or snow-affected outside these windows; confirm current trail conditions before departure.',
    importantNotes: [
      'The Kheerganga trek requires a reasonable level of fitness and is affected by weather — it should not be treated as guaranteed easy or open on every date.',
      'A local guide is advisable for the Kheerganga trail, particularly outside peak season.',
      'Accommodation shown here is a category, not a specific named property — the final hotel/guesthouse and trek-stay are confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
      'OWNER-APPROVED (Phase 4B): this package\'s ₹9,999 starting price is based on Bhuntar pickup/drop. A Chandigarh-origin transfer is not included — available on request at additional cost, quoted separately as an optional add-on, and never implied as included.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'jibhi-tirthan-valley',
    status: 'draft',
    // CORRECTED (Phase 4D — site-wide image audit): earlier believed to legitimately
    // reuse images.destinations.kasol because the real 'jibhi'/'tirthan-valley'
    // Destination *config records* set that same path — but their actual LIVE
    // rendering does NOT show that photo: config/destinationImageOverrides.ts's
    // DESTINATIONS_WITHOUT_VERIFIED_IMAGE set (a prior, documented media-authenticity
    // audit — see docs/image-sources.md) already flags 'jibhi'/'tirthan-valley'/
    // 'sainj-valley' as having no rights-cleared, identity-verified photo of
    // themselves, and DestinationHero/DestinationCard substitute a neutral
    // icon+label placeholder instead of ever rendering that Kasol photo. This
    // Journey has no equivalent placeholder mechanism, so it instead reuses
    // images.destinationsHero — the exact same real, honest, non-misattributing
    // fallback chail/patnitop/bhaderwah/kullu/pragpur/pangi-valley's own `image`
    // fields already use for this identical "no verified photo of this specific
    // place" situation (see docs/site-wide-real-image-audit.md). Never the Ladakh
    // placeholder (images.hero) — a different, unrelated fallback.
    image: images.destinationsHero,
    name: 'Jibhi Tirthan Valley',
    destination: 'Jibhi & Tirthan Valley, Himachal Pradesh',
    destinationSlugs: ['jibhi', 'tirthan-valley'],
    duration: '3 Nights / 4 Days',
    category: 'Offbeat',
    price: 11999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Deluxe cottage/hotel or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the property for each of the 3 nights on this itinerary.',
    transportType: 'Private cab throughout, for all pickup/drop transfers and itinerary sightseeing.',
    pickupInfo: 'Pickup from Aut (exact point and time confirmed at the time of booking) — this package\'s starting price is based on the Aut gateway, not a Chandigarh transfer; see this package\'s important notes.',
    dropInfo: 'Drop at Aut (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A quiet, short offbeat escape pairing Jibhi\'s wooden-guesthouse village lanes with the Tirthan Valley\'s riverside base at Gushaini — built as a weekend-length trip for couples, not a long circuit.',
    highlights: [
      'Jibhi village walks and waterfall',
      'Tirthan river at Gushaini',
      'Quiet, low-crowd pace',
      'Short drive from Aut/Kullu'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Jibhi', description: 'Arrive in Jibhi; evening at leisure in the village.' },
      { day: 2, title: 'Jibhi Local Walks', description: 'Explore Jibhi\'s waterfall and village lanes at a relaxed pace.' },
      { day: 3, title: 'Tirthan Valley (Gushaini)', description: 'Move to the Tirthan Valley\'s Gushaini area for riverside time.' },
      { day: 4, title: 'Departure', description: 'Onward departure from the Tirthan Valley.' }
    ],
    inclusions: [
      'Accommodation for 3 nights on a double-sharing basis (Deluxe cottage/hotel or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Aut pickup/drop',
      'Itinerary transport and sightseeing by private cab as per the itinerary'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry tickets',
      'Any Jalori Pass or Serolsar Lake excursion (not part of this itinerary — access is never guaranteed regardless of weather/road conditions)',
      'Chandigarh road transfer (not part of this itinerary — available on request at additional cost)',
      'Adventure activities',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Aut',
    endingCity: 'Aut',
    idealTraveller: 'Couples and small groups wanting a short, quiet weekend-length offbeat trip rather than a longer circuit.',
    bestTimeToVisit: 'Broadly March–June and September–November; monsoon months bring heavier rain to this valley and winter can be cold, so check seasonal conditions before booking.',
    importantNotes: [
      'This is a short, low-key itinerary by design — travellers looking for a longer multi-stop circuit should consider a different package.',
      'Accommodation shown here is a category, not a specific named property — the final property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
      'OWNER-APPROVED (Phase 4B): this package\'s ₹11,999 starting price is based on Aut pickup/drop. A Chandigarh-origin transfer is not included — available on request at additional cost, quoted separately as an optional add-on, and never implied as included.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'dharamshala-mcleodganj-dalhousie-khajjiar-circuit',
    status: 'draft',
    name: 'Dharamshala McLeodganj Dalhousie Khajjiar Circuit',
    destination: 'Dharamshala, McLeod Ganj, Dalhousie & Khajjiar, Himachal Pradesh',
    destinationSlugs: ['dharamshala', 'mcleod-ganj', 'dalhousie', 'khajjiar'],
    duration: '6 Nights / 7 Days',
    category: 'Family',
    shortDescription: 'A longer, unhurried version of this region covering McLeod Ganj as its own dedicated stop alongside Dharamshala, Dalhousie and Khajjiar — for travellers who want more time in each town rather than a fast 4-5 day pass through the same places.',
    highlights: [
      'McLeod Ganj\'s Tibetan quarter as its own dedicated stop',
      'Dalai Lama Temple and Bhagsu Waterfall',
      'Dalhousie\'s colonial-era Mall Road',
      'Khajjiar meadow and Chamera Lake'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Dharamshala', description: 'Arrive and settle in; evening at leisure.' },
      { day: 2, title: 'McLeod Ganj', description: 'A full day dedicated to McLeod Ganj — the Dalai Lama Temple, the Tibetan quarter and Bhagsu Waterfall.' },
      { day: 3, title: 'Dharamshala Local Time', description: 'A more relaxed day around Dharamshala itself, with time for cafes and short walks rather than a packed sightseeing list.' },
      { day: 4, title: 'Dharamshala to Dalhousie', description: 'Scenic drive to Dalhousie; evening walk on Mall Road.' },
      { day: 5, title: 'Dalhousie Sightseeing', description: 'A full day around Dalhousie\'s colonial-era streets and viewpoints.' },
      { day: 6, title: 'Khajjiar Day Trip', description: 'Visit Khajjiar\'s meadow and Chamera Lake, with more time on-site than a brief drive-through stop.' },
      { day: 7, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Pathankot',
    endingCity: 'Dalhousie',
    idealTraveller: 'Families, couples and groups wanting a slower, more thorough pass through this region rather than a compressed 4-5 day version.',
    bestTimeToVisit: 'Broadly March–June and September–November for the most reliable road conditions; winter can bring snow (scenic, but check road status) and monsoon brings heavier rain to these hill roads.',
    importantNotes: ['This itinerary deliberately overlaps in destinations with the existing, shorter Himachal Family Escape package — the difference is pace and depth (a dedicated McLeod Ganj day, more time in each town), not a different route.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kashmir-family-tour',
    status: 'draft',
    image: images.destinations.srinagar,
    name: 'Kashmir Family Tour',
    destination: 'Srinagar, Gulmarg & Pahalgam, Jammu & Kashmir',
    destinationSlugs: ['srinagar', 'gulmarg', 'pahalgam'],
    duration: '5 Nights / 6 Days',
    category: 'Family',
    price: 14999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    // Houseboat check (Phase 4A, Part 5): Day 2 below reads "overnight on a houseboat OR
    // in a hotel" — an alternative, not a confirmed 1-night houseboat stay. Per the brief's
    // own instruction ("only state 1N houseboat if the existing itinerary actually
    // contains and supports that overnight arrangement — otherwise keep accommodation as
    // Deluxe hotel/equivalent and report the houseboat decision separately") originally
    // kept this as Deluxe hotel/equivalent only, flagging the houseboat question.
    // RESOLVED (Phase 4B): the owner approved including 1 night houseboat/equivalent —
    // the itinerary below now states it as an explicit Day 1 overnight, not an
    // alternative to a hotel, and the night count still matches 5N/6D exactly (verified
    // by config/draftJourneys.phase4bFinal.test.ts).
    hotelCategoryDescription: 'Deluxe hotel/equivalent + 1 night houseboat/equivalent on Dal Lake — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 5 nights on this itinerary, including the houseboat night.',
    transportType: 'Private cab for applicable itinerary sectors (Srinagar, Gulmarg, Pahalgam). Local-union transport/services at any stop are not automatically included.',
    pickupInfo: 'Pickup from Srinagar Airport (exact time confirmed at the time of booking).',
    dropInfo: 'Drop at Srinagar Airport (exact time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A paced, three-stop Kashmir introduction for families — Srinagar, Gulmarg and Pahalgam only, with rest built into the schedule rather than a packed multi-valley circuit.',
    highlights: [
      'Dal Lake houseboat stay and shikara ride',
      'Gulmarg\'s Gondola cable car',
      'Pahalgam\'s Lidder valley',
      'Mughal Gardens in Srinagar'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar — Houseboat Stay', description: 'Arrive in Srinagar; evening shikara ride on Dal Lake, followed by an overnight stay aboard a houseboat/equivalent on Dal Lake.' },
      { day: 2, title: 'Srinagar Sightseeing', description: 'Visit the Mughal Gardens and central Srinagar; overnight at the hotel.' },
      { day: 3, title: 'Srinagar to Gulmarg', description: 'Day trip or transfer to Gulmarg; Gondola ride where seasonally operating.' },
      { day: 4, title: 'Gulmarg to Pahalgam', description: 'Travel to Pahalgam; evening at leisure by the Lidder river.' },
      { day: 5, title: 'Pahalgam Local Sightseeing', description: 'A relaxed day around Pahalgam\'s valley viewpoints, paced for families.' },
      { day: 6, title: 'Departure via Srinagar', description: 'Return to Srinagar for departure.' }
    ],
    inclusions: [
      'Accommodation for 5 nights on a double-sharing basis (Deluxe hotel/equivalent + 1 night houseboat/equivalent on Dal Lake)',
      'Daily breakfast and dinner (MAP)',
      'Srinagar Airport pickup/drop',
      'Itinerary transport by private cab for the Srinagar–Gulmarg–Pahalgam sectors',
      'Dal Lake shikara ride (Day 1, as described in the itinerary)'
    ],
    exclusions: [
      'Airfare',
      'Personal expenses',
      'Entry/activity tickets',
      'Gulmarg Gondola tickets',
      'Pony rides',
      'Snow activities',
      'Local-union transport/services at any stop',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Srinagar',
    endingCity: 'Srinagar',
    idealTraveller: 'Families wanting a paced, three-stop Kashmir trip rather than a fuller multi-valley sightseeing circuit.',
    bestTimeToVisit: 'Broadly April–June and September–October for milder weather; winter brings snow (Gulmarg becomes a ski destination but access can be weather-dependent) and access/road conditions should be checked seasonally.',
    importantNotes: [
      'The Gulmarg Gondola\'s operation can vary by season and demand — confirm current status closer to travel.',
      'OWNER-APPROVED (Phase 4B): this package includes 1 night aboard a houseboat/equivalent on Dal Lake (Day 1), plus 4 nights at a Deluxe hotel/equivalent — no specific houseboat or hotel name is promised.',
      'Accommodation shown here is a category, not a specific named property — the final houseboat/hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kashmir-pahalgam-gulmarg-sonamarg-tour',
    status: 'draft',
    image: images.destinations.pahalgam,
    name: 'Kashmir Pahalgam Gulmarg Sonamarg Tour',
    destination: 'Srinagar, Pahalgam, Gulmarg & Sonamarg, Jammu & Kashmir',
    destinationSlugs: ['srinagar', 'pahalgam', 'gulmarg', 'sonamarg'],
    duration: '6 Nights / 7 Days',
    category: 'Sightseeing',
    price: 18999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Deluxe hotel/equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 6 nights on this itinerary.',
    transportType: 'Private cab for applicable itinerary sectors (Srinagar, Sonamarg, Pahalgam, Gulmarg); local-union transport/services at any stop are excluded where separately required.',
    pickupInfo: 'Pickup from Srinagar Airport (exact time confirmed at the time of booking).',
    dropInfo: 'Drop at Srinagar Airport (exact time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A broader, four-valley Kashmir sightseeing circuit adding Sonamarg to Srinagar, Pahalgam and Gulmarg — more ground covered than the paced three-stop family version, for travellers who want to see more of the region in one trip.',
    highlights: [
      'Sonamarg\'s glacier-fed valley',
      'Gulmarg\'s Gondola cable car',
      'Pahalgam\'s Lidder valley',
      'Dal Lake houseboat stay in Srinagar'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar', description: 'Arrive in Srinagar; evening shikara ride on Dal Lake.' },
      { day: 2, title: 'Srinagar to Sonamarg', description: 'Day trip to Sonamarg for its glacier-fed valley views, road conditions permitting.' },
      { day: 3, title: 'Srinagar to Pahalgam', description: 'Travel to Pahalgam; evening by the Lidder river.' },
      { day: 4, title: 'Pahalgam Sightseeing', description: 'Explore Pahalgam\'s valley viewpoints.' },
      { day: 5, title: 'Pahalgam to Gulmarg', description: 'Travel to Gulmarg via Srinagar.' },
      { day: 6, title: 'Gulmarg Sightseeing', description: 'Gondola ride where seasonally operating, and time in Gulmarg\'s meadow.' },
      { day: 7, title: 'Departure via Srinagar', description: 'Return to Srinagar for departure.' }
    ],
    inclusions: [
      'Accommodation for 6 nights on a double-sharing basis (Deluxe hotel/equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Srinagar Airport pickup/drop',
      'Itinerary transport by private cab for the Srinagar–Sonamarg–Pahalgam–Gulmarg sectors'
    ],
    exclusions: [
      'Airfare',
      'Personal expenses',
      'Entry/activity tickets',
      'Gulmarg Gondola tickets',
      'Pony rides',
      'Snow activities',
      'Local-union transport/services at any stop',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Srinagar',
    endingCity: 'Srinagar',
    idealTraveller: 'Couples and families wanting a fuller multi-valley Kashmir circuit rather than the shorter, more paced Kashmir Family Tour.',
    bestTimeToVisit: 'Broadly April–June and September–October; Sonamarg\'s road access and Gulmarg\'s Gondola operation are both seasonal and weather-dependent — confirm current status closer to travel.',
    importantNotes: [
      'This itinerary deliberately covers more ground than the shorter Kashmir Family Tour package — travellers wanting a slower pace across fewer stops should consider that package instead.',
      'Accommodation shown here is a category, not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'char-dham-yatra',
    status: 'draft',
    image: images.destinations.kedarnath,
    name: 'Char Dham Yatra',
    destination: 'Yamunotri, Gangotri, Kedarnath & Badrinath, Uttarakhand',
    destinationSlugs: ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'],
    duration: '9 Nights / 10 Days',
    category: 'Spiritual',
    price: 19999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Standard/Deluxe hotels/guesthouses or equivalent according to each stop — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel/guesthouse for each of the 9 nights on this itinerary; not implied for any meal taken during the Kedarnath trek day itself unless specifically arranged as part of a confirmed trek-stay.',
    transportType: 'Package-dependent road transport between bases; this covers the motorable route only — it does not extend to the Kedarnath shrine itself, which is trek- or helicopter-access only (see this package\'s important notes).',
    pickupInfo: 'Pickup from Haridwar (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Haridwar (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'The traditional four-shrine Uttarakhand pilgrimage circuit — Yamunotri, Gangotri, Kedarnath and Badrinath — sequenced in the customary order, with genuine access differences between the road-accessible and trek/helicopter-gated shrines called out honestly.',
    highlights: [
      'Yamunotri shrine and hot springs',
      'Gangotri, source of the Ganges',
      'Kedarnath temple (trek or helicopter access)',
      'Badrinath temple, road-accessible'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Haridwar/Dehradun', description: 'Arrive and begin the yatra preparations.' },
      { day: 2, title: 'To Barkot', description: 'Travel toward Barkot, the usual overnight base for Yamunotri.' },
      { day: 3, title: 'Yamunotri Darshan', description: 'Visit Yamunotri via Janki Chatti (the trek-gated final stretch); return to Barkot or onward base.' },
      { day: 4, title: 'To Uttarkashi', description: 'Travel toward Uttarkashi en route to Gangotri.' },
      { day: 5, title: 'Gangotri Darshan', description: 'Visit Gangotri, the source of the Ganges; road-accessible.' },
      { day: 6, title: 'To Guptkashi/Sonprayag', description: 'Travel toward the Kedarnath access base.' },
      { day: 7, title: 'Kedarnath Darshan', description: 'Visit Kedarnath via the trek from Gaurikund/Sonprayag, or by helicopter where booked and weather permits; this leg is genuinely access-gated and not guaranteed on every date.' },
      { day: 8, title: 'To Badrinath', description: 'Travel to Badrinath, which — unlike Kedarnath — is directly road-accessible.' },
      { day: 9, title: 'Badrinath Darshan', description: 'Visit the Badrinath temple.' },
      { day: 10, title: 'Departure', description: 'Return journey and departure.' }
    ],
    inclusions: [
      'Accommodation for 9 nights on a double-sharing basis (Standard/Deluxe hotels/guesthouses or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Haridwar pickup/drop',
      'Scheduled road transport between bases as per the itinerary, up to each shrine\'s own roadhead'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Helicopter tickets',
      'Pony/palki/doli charges',
      'VIP/special darshan',
      'Porter charges',
      'Personal pilgrimage services (e.g. pandit/puja arrangements)',
      'Entry/aarti-seating charges where applicable',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Haridwar',
    endingCity: 'Haridwar',
    idealTraveller: 'Pilgrims and spiritually-motivated travellers prepared for a multi-day, physically demanding circuit including a genuine trek/altitude leg.',
    bestTimeToVisit: 'The Char Dham shrines are open only within their own official yatra season (typically around late April/May to early November, weather-dependent) and are closed for winter — exact opening and closing dates are announced by the respective temple boards each year and must be confirmed before booking, not assumed from a prior year.',
    importantNotes: [
      'Kedarnath access is via a trek (or helicopter, subject to weather and availability) — this is not a guaranteed, road-accessible leg like Badrinath or Gangotri.',
      'Road conditions in this region can be affected by landslides, especially around monsoon; the yatra season itself is set to avoid the worst of this, but delays remain possible.',
      'Physical fitness and, for some travellers, medical advice are relevant given the altitude and trek involved at Kedarnath.',
      'Road transport covers the motorable route only, up to each shrine\'s roadhead — the Kedarnath leg itself is not a road-vehicle service and is not guaranteed on every date.',
      'Accommodation shown here is a category, not a specific named property — the final hotel/guesthouse at each stop is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kedarnath-badrinath-yatra',
    status: 'draft',
    image: images.destinations.badrinath,
    name: 'Kedarnath Badrinath Yatra',
    destination: 'Kedarnath & Badrinath, Uttarakhand',
    destinationSlugs: ['kedarnath', 'badrinath'],
    duration: '6 Nights / 7 Days',
    category: 'Spiritual',
    price: 14999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Standard/Deluxe hotels/guesthouses or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel/guesthouse for each of the 6 nights on this itinerary; not implied for any meal taken during the Kedarnath trek day itself unless specifically arranged as part of a confirmed trek-stay.',
    transportType: 'Package-dependent road transport; this covers the motorable route only — it does not extend to the Kedarnath shrine itself, which is trek- or helicopter-access only (see this package\'s important notes).',
    pickupInfo: 'Pickup from Haridwar (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Haridwar (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A shorter pilgrimage covering only Kedarnath and Badrinath, for travellers who want these two shrines without the full four-shrine Char Dham circuit.',
    highlights: ['Kedarnath temple (trek or helicopter access)', 'Badrinath temple, road-accessible', 'Mandakini and Alaknanda valley scenery'],
    itinerary: [
      { day: 1, title: 'Arrival in Haridwar/Dehradun', description: 'Arrive and begin travel toward the Kedarnath access base.' },
      { day: 2, title: 'To Guptkashi/Sonprayag', description: 'Travel toward Guptkashi or Sonprayag, the usual overnight bases for Kedarnath.' },
      { day: 3, title: 'Kedarnath Darshan', description: 'Visit Kedarnath via the trek from Gaurikund/Sonprayag, or by helicopter where booked and weather permits; genuinely access-gated, not guaranteed on every date.' },
      { day: 4, title: 'Return to Guptkashi/Sonprayag', description: 'Return from Kedarnath.' },
      { day: 5, title: 'To Badrinath', description: 'Travel to Badrinath, which is directly road-accessible.' },
      { day: 6, title: 'Badrinath Darshan', description: 'Visit the Badrinath temple.' },
      { day: 7, title: 'Departure', description: 'Return journey and departure.' }
    ],
    inclusions: [
      'Accommodation for 6 nights on a double-sharing basis (Standard/Deluxe hotels/guesthouses or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Haridwar pickup/drop',
      'Scheduled road transport between bases as per the itinerary, up to each shrine\'s own roadhead'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Helicopter tickets',
      'Pony/palki/doli charges',
      'VIP/special darshan',
      'Porter charges',
      'Personal pilgrimage services',
      'Entry/aarti-seating charges where applicable',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Haridwar',
    endingCity: 'Haridwar',
    idealTraveller: 'Pilgrims wanting Kedarnath and Badrinath specifically, on a shorter schedule than the full Char Dham circuit.',
    bestTimeToVisit: 'Open only within the official yatra season (typically around late April/May to early November, weather-dependent) — confirm exact dates for the current year before booking.',
    importantNotes: [
      'Kedarnath access is via a trek (or helicopter, subject to weather and availability) — not a guaranteed, road-accessible leg like Badrinath.',
      'This package deliberately overlaps with two of the four stops in the Char Dham Yatra package — choose this one if Yamunotri and Gangotri are not needed.',
      'Road transport covers the motorable route only, up to Guptkashi/Sonprayag — the Kedarnath leg itself is not a road-vehicle service and is not guaranteed on every date.',
      'Accommodation shown here is a category, not a specific named property — the final hotel/guesthouse is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'nainital-corbett-mussoorie-tour',
    status: 'draft',
    image: images.destinations.nainital,
    name: 'Nainital Corbett Mussoorie Tour',
    destination: 'Nainital, Jim Corbett & Mussoorie, Uttarakhand',
    destinationSlugs: ['nainital', 'ramnagar-corbett', 'mussoorie'],
    duration: '5 Nights / 6 Days',
    category: 'Family',
    price: 15999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Deluxe hotel/equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 5 nights on this itinerary.',
    transportType: 'Private cab throughout, for all pickup/drop transfers and itinerary sightseeing.',
    pickupInfo: 'Pickup from Kathgodam (exact point and time confirmed at the time of booking) — this is the approved, geographically coherent one-way itinerary\'s starting point.',
    dropInfo: 'Drop at Dehradun (exact point and time confirmed at the time of booking) — this is the approved, geographically coherent one-way itinerary\'s end point; see this package\'s important notes.',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A family-friendly Kumaon-and-Garhwal circuit pairing Nainital\'s lake town, a Corbett wildlife stop, and Mussoorie\'s hill-station views.',
    highlights: ['Naini Lake boating', 'Jim Corbett wildlife safari (subject to permit/availability)', 'Mussoorie\'s Mall Road and viewpoints'],
    itinerary: [
      { day: 1, title: 'Arrival in Nainital', description: 'Arrive in Nainital; evening at Naini Lake.' },
      { day: 2, title: 'Nainital Sightseeing', description: 'Boating on Naini Lake and local viewpoint visits.' },
      { day: 3, title: 'Nainital to Corbett (Ramnagar)', description: 'Travel to the Ramnagar/Corbett area.' },
      { day: 4, title: 'Corbett Safari', description: 'A wildlife safari, subject to park permit availability and season — Corbett\'s core zones can close seasonally and permits are limited, so this is confirmed at time of booking, not guaranteed.' },
      { day: 5, title: 'Corbett to Mussoorie', description: 'Travel to Mussoorie; evening on Mall Road.' },
      { day: 6, title: 'Departure', description: 'Mussoorie sightseeing and departure.' }
    ],
    inclusions: [
      'Accommodation for 5 nights on a double-sharing basis (Deluxe hotel/equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Kathgodam pickup, Dehradun drop',
      'Itinerary transport and sightseeing by private cab as per the itinerary'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry tickets',
      'Jim Corbett safari/jeep and park permit charges (not automatically included — permits are limited and allocated separately; availability is never guaranteed)',
      'Any Delhi transfer at either end (not part of this itinerary)',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Kathgodam',
    endingCity: 'Dehradun',
    idealTraveller: 'Families and couples wanting a lake-town, wildlife and hill-station combination rather than a single-destination trip.',
    bestTimeToVisit: 'Broadly March–June and September–November; Corbett\'s core safari zones typically close during the monsoon months (mid-June to mid-November varies by zone) — confirm current park status when booking.',
    importantNotes: [
      'Corbett safari permits are limited and allocated in advance — availability on specific dates is not guaranteed and should be confirmed before the trip is finalized.',
      'Accommodation shown here is a category, not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
      'OWNER-APPROVED (Phase 4B): this itinerary is a deliberate one-way route — pickup from Kathgodam, drop at Dehradun — kept as the geographically coherent configuration this ₹15,999 starting price is based on, rather than restructured to a Delhi round trip. A Delhi transfer at either end is not included.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'auli-chopta-tungnath-tour',
    status: 'draft',
    image: images.destinations.auli,
    name: 'Auli Chopta Tungnath Tour',
    destination: 'Auli & Chopta, Uttarakhand',
    destinationSlugs: ['joshimath', 'auli', 'chopta'],
    duration: '5 Nights / 6 Days',
    category: 'Adventure',
    price: 16999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    // Verified 2026-09-30 (Phase 4B): /cancellation-policy is live (200), not disallowed
    // by robots.txt, and its content explicitly covers "journeys" — see
    // docs/phase-4b-final-commercial-approval.md. This is a statement of that verified
    // fact, never a bypass — see models/Journey.ts's own doc comment on this field.
    usesGeneralCancellationPolicy: true,
    hotelCategoryDescription: 'Standard/Deluxe hotel/guesthouse or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel/guesthouse for each of the 5 nights on this itinerary; not implied for any meal taken during the Tungnath trek day itself unless specifically arranged as part of a confirmed trek-stay.',
    transportType: 'Private cab for motorable itinerary sectors (Joshimath/Auli, Chopta); the Tungnath trek itself is on foot, not by vehicle.',
    pickupInfo: 'Pickup from Haridwar (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Haridwar (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A nature-and-adventure pairing of Auli\'s high meadows above Joshimath with Chopta\'s meadow base for the Tungnath trek — for couples and travellers wanting mountain scenery over a pilgrimage-paced itinerary.',
    highlights: ['Auli\'s ropeway and high-altitude meadows', 'Chopta\'s "mini Switzerland" meadow', 'Tungnath trek, one of the highest Shiva temples'],
    itinerary: [
      { day: 1, title: 'Arrival in Joshimath', description: 'Arrive in Joshimath, the usual base for Auli.' },
      { day: 2, title: 'Auli Excursion', description: 'Day trip to Auli — ropeway ride and meadow views, snow-dependent in winter and green in summer.' },
      { day: 3, title: 'Joshimath to Chopta', description: 'Travel to Chopta.' },
      { day: 4, title: 'Tungnath Trek', description: 'Trek toward Tungnath temple; trail conditions and weather affect pace and, at times, accessibility.' },
      { day: 5, title: 'Chopta Local Time', description: 'A more relaxed day around Chopta\'s meadow.' },
      { day: 6, title: 'Departure', description: 'Return travel and departure.' }
    ],
    inclusions: [
      'Accommodation for 5 nights on a double-sharing basis (Standard/Deluxe hotel/guesthouse or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Haridwar pickup/drop',
      'Itinerary transport by private cab for motorable sectors as per the itinerary'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Auli ropeway tickets',
      'Tungnath trek guide/porter charges',
      'Adventure activities',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    // Updated from 'Rishikesh' to 'Haridwar' (Phase 4A) to match the owner-specified
    // pickup/drop gateway — both are adjacent, commonly interchangeable gateway towns for
    // this route (Haridwar is already this catalogue's gateway for the Char Dham and
    // Kedarnath Badrinath packages), a low-materiality substitution unlike the other
    // flagged pickup/drop conflicts in this file (see Kinnaur Spiti, Kasol Kheerganga
    // Tosh, Jibhi Tirthan Valley, Nainital Corbett Mussoorie).
    startingCity: 'Haridwar',
    endingCity: 'Haridwar',
    idealTraveller: 'Couples and nature/adventure travellers wanting meadow and trek scenery rather than a pilgrimage-focused itinerary.',
    bestTimeToVisit: 'Auli suits both a winter snow visit and a summer/autumn green-meadow visit depending on what a traveller wants to see; the Tungnath trail is best avoided in heavy monsoon rain and can be snow-affected in winter — confirm current trail conditions before departure.',
    importantNotes: [
      'The Tungnath trek\'s difficulty and duration can vary with weather and trail condition on the day — it should not be assumed uniformly easy for every traveller.',
      'Snowfall, ropeway operation and Tungnath trek accessibility are not guaranteed on any specific date — each is weather/season dependent, confirmed closer to travel.',
      'Accommodation shown here is a category, not a specific named property — the final hotel/guesthouse is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },

  // ============================================================
  // PHASE 3 — high-intent catalogue expansion (2026-09). Every entry below is a NEW
  // draft; no price is set on any of them (Part 6 of the Phase 3 brief: owner-approved
  // prices exist only for the 10 Phase 2 drafts above, never inferred onto a new
  // package). See docs/phase-3-high-intent-catalogue.md for the full duplicate-first
  // analysis behind which of the brief's ~60 proposed concepts became these 18 and
  // which were rejected/deferred as duplicates or insufficiently differentiated.
  // ============================================================

  // --- Himachal Pradesh (9 new) ---
  {
    slug: 'shimla-short-escape',
    status: 'draft',
    name: 'Shimla Short Escape',
    destination: 'Shimla, Himachal Pradesh',
    destinationSlugs: ['shimla'],
    duration: '2 Nights / 3 Days',
    category: 'Sightseeing',
    price: 7999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    usesGeneralCancellationPolicy: true,
    image: images.destinations.shimla,
    hotelCategoryDescription: 'Standard/Deluxe hotel or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 2 nights on this itinerary.',
    transportType: 'Private cab for itinerary-approved road transfers and sightseeing. Restricted-area transport, local-union vehicles and paid activities are excluded unless specifically listed.',
    pickupInfo: 'Pickup from Chandigarh (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Chandigarh (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A short, single-destination Shimla weekend — for travellers with limited time who want the hill-station experience without a longer multi-stop circuit.',
    highlights: ['Mall Road and The Ridge', 'Jakhoo Temple viewpoint', 'A relaxed, single-base weekend pace'],
    itinerary: [
      { day: 1, title: 'Arrival in Shimla', description: 'Arrive and settle in; evening on Mall Road and The Ridge.' },
      { day: 2, title: 'Shimla Sightseeing', description: 'Jakhoo Temple viewpoint and central Shimla at a relaxed pace; a Kufri excursion can be added where time/road conditions allow.' },
      { day: 3, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [
      'Accommodation for 2 nights on a double-sharing basis (Standard/Deluxe hotel or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Chandigarh pickup/drop',
      'Private cab for itinerary-approved road transfers and sightseeing'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry tickets',
      'Kufri excursion (mentioned in the itinerary as an optional add-on, time/road conditions permitting — not included in the starting price, available on request)',
      'Local-union/restricted-area transport where separately required',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Chandigarh',
    endingCity: 'Chandigarh',
    idealTraveller: 'Weekend travellers wanting a short, single-destination hill-station break rather than a longer circuit.',
    bestTimeToVisit: 'Broadly year-round; expect snow access at higher points in winter and monsoon rain in July–August — check conditions before travel.',
    importantNotes: [
      'This is a short, single-destination itinerary by design — travellers wanting Manali too should consider the Shimla Manali Tour Package instead.',
      'Accommodation shown here is a category, not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'manali-short-escape',
    status: 'draft',
    name: 'Manali Short Escape',
    destination: 'Manali, Himachal Pradesh',
    destinationSlugs: ['manali'],
    duration: '3 Nights / 4 Days',
    category: 'Sightseeing',
    price: 8999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    usesGeneralCancellationPolicy: true,
    image: images.destinations.manali,
    hotelCategoryDescription: 'Standard/Deluxe hotel or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 3 nights on this itinerary.',
    transportType: 'Private cab for itinerary-approved road transfers and sightseeing. Restricted-area transport, local-union vehicles and paid activities are excluded unless specifically listed.',
    pickupInfo: 'Pickup from Chandigarh (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Chandigarh (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A short, single-destination Manali weekend-length trip — a shorter alternative to the existing 5-day Manali Premium Escape for travellers with less time.',
    highlights: ['Old Manali cafes', 'Hadimba Temple', 'Solang Valley (seasonal activities)'],
    itinerary: [
      { day: 1, title: 'Arrival in Manali', description: 'Arrive and settle in; evening at leisure.' },
      { day: 2, title: 'Manali Sightseeing', description: 'Hadimba Temple, Old Manali lanes and cafes.' },
      { day: 3, title: 'Solang Valley Excursion', description: 'Day trip to Solang Valley; activities available there are seasonal.' },
      { day: 4, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [
      'Accommodation for 3 nights on a double-sharing basis (Standard/Deluxe hotel or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Chandigarh pickup/drop',
      'Private cab for itinerary-approved road transfers and sightseeing',
      'Solang Valley excursion transport (Day 3, as described in the itinerary)'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry tickets',
      'Any Atal Tunnel/Rohtang Pass excursion beyond Solang Valley, local union/RTO vehicle charges, or other restricted-area transport where separately required',
      'Solang Valley adventure/snow activities (seasonal, weather/operator dependent — never guaranteed, and not included)',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Chandigarh',
    endingCity: 'Chandigarh',
    idealTraveller: 'Weekend travellers wanting a short, single-destination Manali trip.',
    bestTimeToVisit: 'Broadly year-round; higher-altitude excursions are snow/road-condition dependent in winter.',
    importantNotes: [
      'This is a shorter alternative to the existing Manali Premium Escape, not a replacement for it — both remain available for different trip lengths.',
      'Accommodation shown here is a category, not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kinnaur-valley-tour',
    status: 'draft',
    name: 'Kinnaur Valley Tour',
    destination: 'Kinnaur, Himachal Pradesh',
    destinationSlugs: ['shimla', 'narkanda', 'sarahan', 'sangla-valley', 'chitkul', 'kinnaur'],
    duration: '6 Nights / 7 Days',
    category: 'Offbeat',
    shortDescription: 'A Kinnaur-only circuit via Narkanda and Sarahan into the Baspa valley — a lower-altitude, permit-free alternative to the existing Kinnaur Spiti Circuit for travellers who don\'t want to continue into Spiti.',
    highlights: ['Sarahan\'s Bhimakali Temple', 'Sangla and Chitkul in the Baspa valley', 'Kalpa\'s Kinner Kailash views'],
    itinerary: [
      { day: 1, title: 'Shimla to Narkanda', description: 'Drive to Narkanda, a highway hill town.' },
      { day: 2, title: 'Narkanda to Sarahan', description: 'Continue to Sarahan to see the Bhimakali Temple.' },
      { day: 3, title: 'Sarahan to Sangla', description: 'Drive into the Baspa valley to Sangla.' },
      { day: 4, title: 'Chitkul Day Trip', description: 'Day trip to Chitkul and back to the Sangla/Kalpa area.' },
      { day: 5, title: 'Kalpa', description: 'Kalpa sightseeing, with views toward the Kinner Kailash range where weather allows.' },
      { day: 6, title: 'Return Toward Shimla', description: 'Begin the return journey.' },
      { day: 7, title: 'Departure', description: 'Onward departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Shimla',
    endingCity: 'Shimla',
    idealTraveller: 'Offbeat travellers wanting the Kinnaur/Baspa valley experience without continuing into Spiti\'s higher-altitude, permit-requiring territory.',
    bestTimeToVisit: 'Broadly March–June and September–November; winter brings snow at higher points and some road sections may be affected.',
    importantNotes: ['This package deliberately does not continue into Spiti Valley — travellers wanting that should consider the existing Kinnaur Spiti Circuit instead.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'spiti-winter-expedition',
    status: 'draft',
    name: 'Spiti Winter Expedition',
    destination: 'Spiti Valley, Himachal Pradesh',
    destinationSlugs: ['shimla', 'kinnaur', 'tabo', 'spiti-valley'],
    duration: '6 Nights / 7 Days',
    category: 'Offbeat',
    shortDescription: 'A winter-specific Spiti itinerary, genuinely different from the existing summer/monsoon-season Spiti packages: the Manali-side route (Kunzum Pass) is closed in winter, so this enters and exits via Shimla and Kinnaur only, and is built around the valley\'s snow-season character rather than the same warm-season loop.',
    highlights: ['Frozen winter landscapes in the Spiti cold desert', 'Key Monastery and Kaza in winter', 'A genuinely different season/route from the valley\'s summer circuits'],
    itinerary: [
      { day: 1, title: 'Shimla to Kalpa', description: 'Drive along the Sutlej river to Kalpa.' },
      { day: 2, title: 'Kalpa to Tabo', description: 'Cross into the cold desert via Nako to Tabo, continuing to its centuries-old monastery.' },
      { day: 3, title: 'Tabo to Kaza', description: 'Drive on to Kaza.' },
      { day: 4, title: 'Kaza Local Time', description: 'Key Monastery and nearby villages, at a winter pace — some higher-altitude side trips may not be accessible.' },
      { day: 5, title: 'Kaza Area', description: 'A further day around Kaza\'s accessible villages, weather permitting.' },
      { day: 6, title: 'Return Toward Kalpa', description: 'Begin the return journey — the Manali-side exit is not used in winter.' },
      { day: 7, title: 'Departure', description: 'Onward departure via Shimla.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Shimla',
    endingCity: 'Shimla',
    idealTraveller: 'Offbeat/adventure travellers specifically wanting the winter Spiti experience, comfortable with cold-weather travel and a genuinely more limited/weather-dependent itinerary than the summer circuits.',
    bestTimeToVisit: 'December–February specifically — this is a winter-season product; outside this window, see the existing summer-season Spiti packages instead. Road conditions, accommodation availability and reachable villages all vary significantly day to day in winter and must be confirmed close to departure.',
    importantNotes: [
      'The Manali-side exit (Kunzum Pass) is not used on this itinerary — it is closed in winter. Entry and exit are both via Shimla/Kinnaur.',
      'Some accommodation in Spiti closes for winter — availability must be confirmed for the specific travel dates before this can be priced or booked.',
      'This is a genuinely more physically demanding, cold-weather itinerary than the valley\'s summer packages — not positioned as an easier or shorter alternative.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kasol-manikaran-weekend',
    status: 'draft',
    name: 'Kasol Manikaran Weekend',
    destination: 'Kasol & Manikaran, Himachal Pradesh',
    destinationSlugs: ['kasol', 'manikaran'],
    duration: '2 Nights / 3 Days',
    category: 'Offbeat',
    price: 6999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    usesGeneralCancellationPolicy: true,
    image: images.destinations.kasol,
    hotelCategoryDescription: 'Standard hotel/guesthouse or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 2 nights on this itinerary.',
    transportType: 'Shared/package-dependent road transport for the Bhuntar–Kasol sector and the Kasol–Manikaran day trip — private cab is not claimed at this starting price.',
    pickupInfo: 'Pickup from Bhuntar (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Bhuntar (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A short, non-trekking Parvati Valley weekend pairing Kasol\'s cafe culture with Manikaran\'s hot springs — distinct from the existing Kasol Kheerganga Tosh package, which is trek-focused and longer.',
    highlights: ['Kasol\'s riverside cafes', 'Manikaran hot springs and gurdwara', 'A relaxed, non-trekking weekend pace'],
    itinerary: [
      { day: 1, title: 'Arrival in Kasol', description: 'Arrive in Kasol; evening at leisure by the river.' },
      { day: 2, title: 'Manikaran Day Trip', description: 'Visit Manikaran\'s hot springs and gurdwara, returning to Kasol.' },
      { day: 3, title: 'Departure', description: 'Onward departure from Kasol.' }
    ],
    inclusions: [
      'Accommodation for 2 nights on a double-sharing basis (Standard hotel/guesthouse or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Bhuntar pickup/drop',
      'Scheduled Kasol–Manikaran day-trip transfer'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry/gurdwara donation charges where applicable',
      'Adventure activities',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Bhuntar',
    endingCity: 'Bhuntar',
    idealTraveller: 'Weekend travellers wanting the Parvati Valley experience without a trek — distinct from the existing Kasol Kheerganga Tosh package.',
    bestTimeToVisit: 'Broadly March–June and September–November; monsoon and heavy winter snow can affect road conditions.',
    importantNotes: [
      'This package includes no trek — travellers wanting the Kheerganga hot-springs trek should consider the existing Kasol Kheerganga Tosh package instead.',
      'Accommodation shown here is a category, not a specific named property — the final hotel/guesthouse is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'dharamshala-mcleodganj-short-escape',
    status: 'draft',
    name: 'Dharamshala McLeodganj Short Escape',
    destination: 'Dharamshala & McLeod Ganj, Himachal Pradesh',
    destinationSlugs: ['dharamshala', 'mcleod-ganj'],
    duration: '3 Nights / 4 Days',
    category: 'Sightseeing',
    shortDescription: 'A short, focused Dharamshala/McLeod Ganj trip with no Dalhousie or Khajjiar leg — genuinely distinct from the existing Himachal Family Escape (which includes those) and shorter than the on-hold 7-day extended circuit.',
    highlights: ['Dalai Lama Temple', 'McLeod Ganj\'s Tibetan quarter', 'Bhagsu Waterfall'],
    itinerary: [
      { day: 1, title: 'Arrival in Dharamshala', description: 'Arrive and settle in; evening at leisure.' },
      { day: 2, title: 'McLeod Ganj', description: 'A full day in McLeod Ganj — the Dalai Lama Temple, the Tibetan quarter and Bhagsu Waterfall.' },
      { day: 3, title: 'Dharamshala Local Time', description: 'A relaxed day around Dharamshala itself.' },
      { day: 4, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Pathankot',
    endingCity: 'Dharamshala',
    idealTraveller: 'Short-trip travellers wanting Dharamshala/McLeod Ganj specifically, without Dalhousie or Khajjiar.',
    bestTimeToVisit: 'Broadly March–June and September–November; winter can bring snow and monsoon brings heavier rain.',
    importantNotes: ['This package deliberately excludes Dalhousie and Khajjiar — travellers wanting those should consider the existing Himachal Family Escape package.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'dalhousie-khajjiar-chamba',
    status: 'draft',
    name: 'Dalhousie Khajjiar Chamba',
    destination: 'Dalhousie, Khajjiar & Chamba, Himachal Pradesh',
    destinationSlugs: ['dalhousie', 'khajjiar', 'chamba'],
    duration: '4 Nights / 5 Days',
    category: 'Family',
    price: 10999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    usesGeneralCancellationPolicy: true,
    image: images.destinations.dalhousie,
    hotelCategoryDescription: 'Standard/Deluxe hotel or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 4 nights on this itinerary.',
    transportType: 'Private cab for itinerary-approved road transfers and sightseeing. Restricted-area transport, local-union vehicles and paid activities are excluded unless specifically listed.',
    pickupInfo: 'Pickup from Pathankot (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Chamba (exact point and time confirmed at the time of booking) — this itinerary is a one-way route ending in Chamba, not a round-trip to Pathankot; see this package\'s important notes.',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A Dalhousie-anchored circuit adding Chamba town — genuinely distinct from the existing Himachal Family Escape, which starts from Dharamshala and does not include Chamba at all.',
    highlights: ['Dalhousie\'s colonial-era Mall Road', 'Khajjiar meadow and Chamera Lake', 'Chamba\'s historic town and temples'],
    itinerary: [
      { day: 1, title: 'Arrival in Dalhousie', description: 'Arrive and settle in; evening walk on Mall Road.' },
      { day: 2, title: 'Dalhousie Sightseeing', description: 'A full day around Dalhousie\'s colonial-era streets and viewpoints.' },
      { day: 3, title: 'Khajjiar Day Trip', description: 'Visit Khajjiar\'s meadow and Chamera Lake.' },
      { day: 4, title: 'Dalhousie to Chamba', description: 'Travel to Chamba to see its historic town and temples.' },
      { day: 5, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [
      'Accommodation for 4 nights on a double-sharing basis (Standard/Deluxe hotel or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Pathankot pickup, Chamba drop',
      'Private cab for itinerary-approved road transfers and sightseeing'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry tickets',
      'Any onward transfer from Chamba after package completion, including return to Pathankot, unless separately quoted',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Pathankot',
    endingCity: 'Chamba',
    idealTraveller: 'Families and couples wanting a Dalhousie-Chamba circuit distinct from the existing Dharamshala-anchored package.',
    bestTimeToVisit: 'Broadly March–June and September–November; winter can bring snow and monsoon brings heavier rain to these hill roads.',
    importantNotes: [
      'This package does not include Dharamshala or McLeod Ganj — travellers wanting those should consider the existing Himachal Family Escape or the Dharamshala McLeodganj Short Escape.',
      'This itinerary is a one-way route — pickup from Pathankot, drop at Chamba — and does not include a return transfer to Pathankot. Confirm with our travel team if a Pathankot drop is required instead; this would be quoted separately.',
      'Accommodation shown here is a category, not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'bir-billing-palampur',
    status: 'draft',
    name: 'Bir Billing Palampur',
    destination: 'Bir Billing & Palampur, Himachal Pradesh',
    destinationSlugs: ['bir-billing', 'palampur'],
    duration: '3 Nights / 4 Days',
    category: 'Adventure',
    price: 9999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    usesGeneralCancellationPolicy: true,
    image: images.destinations.birBilling,
    hotelCategoryDescription: 'Standard/Deluxe hotel or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 3 nights on this itinerary.',
    transportType: 'Private cab for itinerary-approved road transfers and sightseeing. Restricted-area transport, local-union vehicles and paid activities are excluded unless specifically listed.',
    pickupInfo: 'Pickup from Dharamshala (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Palampur (exact point and time confirmed at the time of booking) — this itinerary is a one-way route ending in Palampur, not a round-trip to Dharamshala; see this package\'s important notes.',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A zero-existing-coverage pairing of Bir Billing (India\'s best-known paragliding hub) with Palampur\'s tea gardens — no other package on this site covers either destination.',
    highlights: ['Paragliding at Bir Billing (subject to weather and licensed operator availability)', 'Palampur\'s tea gardens', 'A relaxed, low-crowd pace'],
    itinerary: [
      { day: 1, title: 'Arrival in Bir', description: 'Arrive and settle in; evening at leisure in Bir\'s Chowgan village.' },
      { day: 2, title: 'Bir Billing Paragliding', description: 'Paragliding at Billing, weather and licensed-operator availability permitting; not guaranteed on every date.' },
      { day: 3, title: 'Bir to Palampur', description: 'Travel to Palampur to walk through its tea gardens.' },
      { day: 4, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [
      'Accommodation for 3 nights on a double-sharing basis (Standard/Deluxe hotel or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Dharamshala pickup, Palampur drop',
      'Private cab for itinerary-approved road transfers and sightseeing'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry tickets',
      'Paragliding charges at Bir Billing (not included — weather and licensed-operator dependent; quoted and booked separately)',
      'Any Dharamshala return transfer from Palampur (not part of this itinerary — available on request at additional cost)',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Dharamshala',
    endingCity: 'Palampur',
    idealTraveller: 'Adventure travellers and paragliding enthusiasts, plus anyone wanting a quieter, less-visited Himachal pairing.',
    bestTimeToVisit: 'Paragliding at Bir Billing runs broadly October–June, weather dependent; specific date availability with a licensed operator must be confirmed separately, not assumed.',
    importantNotes: [
      'Paragliding is a real, weather- and operator-dependent activity — never guaranteed on a specific date, and its cost is excluded from this starting price (see Exclusions).',
      'This itinerary is a one-way route — pickup from Dharamshala, drop at Palampur — and does not include a return transfer to Dharamshala. Confirm with our travel team if that is required; it would be quoted separately.',
      'Accommodation shown here is a category, not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'grand-himachal-circuit',
    status: 'draft',
    name: 'Grand Himachal Circuit',
    destination: 'Shimla, Manali, Dharamshala, Dalhousie & Khajjiar, Himachal Pradesh',
    destinationSlugs: ['shimla', 'manali', 'dharamshala', 'dalhousie', 'khajjiar'],
    duration: '9 Nights / 10 Days',
    category: 'Sightseeing',
    shortDescription: 'A comprehensive, zero-existing-coverage "see all of Himachal" circuit combining the existing Shimla-Manali route with the Dharamshala-Dalhousie-Khajjiar route into one longer, single booking — genuinely distinct from either shorter package by scope, not just duration.',
    highlights: ['Shimla\'s Mall Road and Manali\'s valley base', 'McLeod Ganj\'s Tibetan quarter', 'Dalhousie\'s colonial streets and Khajjiar\'s meadow'],
    itinerary: [
      { day: 1, title: 'Chandigarh to Shimla', description: 'Drive from Chandigarh to Shimla; evening at leisure.' },
      { day: 2, title: 'Shimla Sightseeing', description: 'Local sightseeing around Shimla.' },
      { day: 3, title: 'Shimla to Manali', description: 'Scenic drive via the Kullu valley.' },
      { day: 4, title: 'Manali Sightseeing', description: 'Hadimba Temple, Old Manali and Mall Road.' },
      { day: 5, title: 'Solang Valley Excursion', description: 'Day trip to Solang Valley, seasonal activities permitting.' },
      { day: 6, title: 'Manali to Dharamshala', description: 'A longer drive back southwest toward Dharamshala.' },
      { day: 7, title: 'McLeod Ganj', description: 'Dalai Lama Temple, the Tibetan quarter and Bhagsu Waterfall.' },
      { day: 8, title: 'Dharamshala to Dalhousie', description: 'Travel to Dalhousie; evening on Mall Road.' },
      { day: 9, title: 'Khajjiar Day Trip', description: 'Visit Khajjiar\'s meadow and Chamera Lake.' },
      { day: 10, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Chandigarh',
    endingCity: 'Dalhousie',
    idealTraveller: 'Travellers with a longer trip planned who want to see multiple distinct Himachal regions (Shimla-Manali corridor and the Dharamshala-Dalhousie corridor) in one booking, rather than choosing between the two shorter packages.',
    bestTimeToVisit: 'Broadly March–June and September–November for the most reliable road conditions across this longer route; monsoon and heavy winter snow can affect specific legs.',
    importantNotes: ['The Manali-to-Dharamshala leg (Day 6) is a genuinely long drive — this itinerary is built for travellers comfortable with a demanding travel day, not positioned as an easy/relaxed pace throughout.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },

  // --- Jammu & Kashmir (2 new) ---
  {
    slug: 'kashmir-winter-snow-tour',
    status: 'draft',
    name: 'Kashmir Winter Snow Tour',
    destination: 'Srinagar, Gulmarg & Pahalgam, Jammu & Kashmir',
    destinationSlugs: ['srinagar', 'gulmarg', 'pahalgam'],
    duration: '4 Nights / 5 Days',
    category: 'Sightseeing',
    shortDescription: 'A winter-specific Kashmir itinerary built around the region\'s snow season — genuinely different framing and pacing from the existing summer/general-season Kashmir packages, though snow itself is never guaranteed on any specific date.',
    highlights: ['Gulmarg\'s winter Gondola and snow slopes', 'Srinagar\'s houseboats in winter', 'Pahalgam\'s snow-season valley views'],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar', description: 'Arrive in Srinagar; evening at leisure, houseboat stay where available.' },
      { day: 2, title: 'Srinagar to Gulmarg', description: 'Travel to Gulmarg for its winter Gondola and snow scenery, conditions permitting.' },
      { day: 3, title: 'Gulmarg Winter Activities', description: 'A further day in Gulmarg; skiing/snow activities are subject to season, snowfall and operator availability, not guaranteed.' },
      { day: 4, title: 'Gulmarg to Pahalgam', description: 'Travel to Pahalgam for its winter valley views.' },
      { day: 5, title: 'Departure via Srinagar', description: 'Return to Srinagar for departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Srinagar',
    endingCity: 'Srinagar',
    idealTraveller: 'Travellers specifically wanting the winter/snow Kashmir experience, understanding that actual snowfall and road access vary year to year.',
    bestTimeToVisit: 'December–February specifically — this is a winter-season product. Snowfall amount and timing vary year to year and are never guaranteed; some access roads can be temporarily affected by heavy snow.',
    importantNotes: ['Snow itself is a real, weather-dependent phenomenon — this itinerary is never sold on a guaranteed-snow basis, and skiing/snow-activity costs are not yet approved for this draft.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'gulmarg-winter-escape',
    status: 'draft',
    name: 'Gulmarg Winter Escape',
    destination: 'Gulmarg, Jammu & Kashmir',
    destinationSlugs: ['srinagar', 'gulmarg'],
    duration: '3 Nights / 4 Days',
    category: 'Adventure',
    shortDescription: 'A short, Gulmarg-focused winter/skiing trip — distinct from the broader Kashmir Winter Snow Tour by being single-destination and shorter, for travellers who specifically want Gulmarg\'s slopes rather than a multi-town circuit.',
    highlights: ['Gulmarg\'s Gondola', 'Skiing and snow activities (season/operator dependent)', 'A focused, single-base winter trip'],
    itinerary: [
      { day: 1, title: 'Arrival via Srinagar', description: 'Arrive in Srinagar and transfer to Gulmarg.' },
      { day: 2, title: 'Gulmarg Gondola & Slopes', description: 'Gondola ride and snow-slope time, conditions permitting.' },
      { day: 3, title: 'Gulmarg Winter Activities', description: 'A further day in Gulmarg; skiing/snow-activity availability is season and operator dependent.' },
      { day: 4, title: 'Departure via Srinagar', description: 'Return to Srinagar for departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Srinagar',
    endingCity: 'Srinagar',
    idealTraveller: 'Skiing/snow-sports travellers wanting a focused Gulmarg trip rather than a multi-town Kashmir circuit.',
    bestTimeToVisit: 'December–February specifically. Snowfall varies year to year and is never guaranteed.',
    importantNotes: ['This package is deliberately single-destination — travellers wanting Srinagar/Pahalgam sightseeing too should consider the Kashmir Winter Snow Tour instead.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },

  // --- Uttarakhand (7 new) ---
  {
    slug: 'kedarnath-yatra',
    status: 'draft',
    name: 'Kedarnath Yatra',
    destination: 'Kedarnath, Uttarakhand',
    destinationSlugs: ['kedarnath'],
    duration: '4 Nights / 5 Days',
    category: 'Spiritual',
    shortDescription: 'A single-shrine Kedarnath yatra — genuinely distinct from the existing 2-shrine and 4-shrine packages, for pilgrims wanting Kedarnath specifically on a shorter schedule.',
    highlights: ['Kedarnath temple', 'The Mandakini valley trek/helicopter route', 'A focused, single-shrine pilgrimage'],
    itinerary: [
      { day: 1, title: 'Arrival in Haridwar/Dehradun', description: 'Arrive and begin travel toward the Kedarnath access base.' },
      { day: 2, title: 'To Guptkashi/Sonprayag', description: 'Travel toward Guptkashi or Sonprayag, the usual overnight bases for Kedarnath.' },
      { day: 3, title: 'Kedarnath Darshan', description: 'Visit Kedarnath via the trek from Gaurikund/Sonprayag, or by helicopter where booked and weather permits; genuinely access-gated, not guaranteed on every date.' },
      { day: 4, title: 'Return to Guptkashi/Sonprayag', description: 'Return from Kedarnath.' },
      { day: 5, title: 'Departure', description: 'Return journey and departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Haridwar',
    endingCity: 'Haridwar',
    idealTraveller: 'Pilgrims wanting Kedarnath specifically, on the shortest reasonable schedule.',
    bestTimeToVisit: 'Open only within the official yatra season (typically around late April/May to early November, weather-dependent) — confirm exact dates for the current year before booking.',
    importantNotes: ['Kedarnath access is via a trek (or helicopter, subject to weather and availability) — not a guaranteed, road-accessible leg. This package overlaps with the existing Kedarnath Badrinath Yatra and Char Dham Yatra by covering only the Kedarnath leg on its own — choose this one if Badrinath is not needed.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'badrinath-yatra',
    status: 'draft',
    name: 'Badrinath Yatra',
    destination: 'Badrinath, Uttarakhand',
    destinationSlugs: ['badrinath'],
    duration: '3 Nights / 4 Days',
    category: 'Spiritual',
    shortDescription: 'A single-shrine Badrinath yatra — road-accessible throughout, genuinely easier and shorter than the trek/helicopter-gated Kedarnath packages, for pilgrims who specifically want Badrinath without the Kedarnath trek.',
    highlights: ['Badrinath temple', 'The Alaknanda valley drive', 'A fully road-accessible pilgrimage, no trek required'],
    itinerary: [
      { day: 1, title: 'Arrival in Haridwar/Dehradun', description: 'Arrive and begin travel toward Badrinath.' },
      { day: 2, title: 'To Joshimath', description: 'Travel toward Joshimath, the usual overnight base en route to Badrinath.' },
      { day: 3, title: 'Badrinath Darshan', description: 'Visit the Badrinath temple, directly road-accessible.' },
      { day: 4, title: 'Departure', description: 'Return journey and departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Haridwar',
    endingCity: 'Haridwar',
    idealTraveller: 'Pilgrims wanting Badrinath specifically, including travellers preferring a fully road-accessible route without the Kedarnath trek.',
    bestTimeToVisit: 'Open only within the official yatra season (typically around late April/May to early November, weather-dependent) — confirm exact dates for the current year before booking.',
    importantNotes: ['This package deliberately does not include Kedarnath — travellers wanting both should consider the existing Kedarnath Badrinath Yatra or Char Dham Yatra.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'mussoorie-weekend',
    status: 'draft',
    name: 'Mussoorie Weekend',
    destination: 'Mussoorie, Uttarakhand',
    destinationSlugs: ['mussoorie'],
    duration: '2 Nights / 3 Days',
    category: 'Sightseeing',
    price: 7999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    usesGeneralCancellationPolicy: true,
    image: images.destinations.mussoorie,
    hotelCategoryDescription: 'Standard/Deluxe hotel or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 2 nights on this itinerary.',
    transportType: 'Private cab for itinerary-approved road transfers and sightseeing. Restricted-area transport, local-union vehicles and paid activities are excluded unless specifically listed.',
    pickupInfo: 'Pickup from Dehradun (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Dehradun (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A short, single-destination Mussoorie weekend — no existing package is Mussoorie-only; both current Uttarakhand drafts/packages bundle it with other towns.',
    highlights: ['Mall Road and Camel\'s Back Road', 'Kempty Falls', 'A relaxed, single-base weekend pace'],
    itinerary: [
      { day: 1, title: 'Arrival in Mussoorie', description: 'Arrive and settle in; evening on Mall Road.' },
      { day: 2, title: 'Mussoorie Sightseeing', description: 'Camel\'s Back Road and Kempty Falls.' },
      { day: 3, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [
      'Accommodation for 2 nights on a double-sharing basis (Standard/Deluxe hotel or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Dehradun pickup/drop',
      'Private cab for itinerary-approved road transfers and sightseeing'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Entry tickets (e.g. Kempty Falls)',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Dehradun',
    endingCity: 'Dehradun',
    idealTraveller: 'Weekend travellers wanting a short, single-destination hill-station break.',
    bestTimeToVisit: 'Broadly year-round; monsoon brings heavier rain and winter can bring snow at higher points.',
    importantNotes: [
      'This is a short, single-destination itinerary by design — travellers wanting Rishikesh/Haridwar or Nainital/Corbett too should consider the existing Uttarakhand Explorer or Nainital Corbett Mussoorie packages.',
      'Accommodation shown here is a category, not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'auli-tour',
    status: 'draft',
    name: 'Auli Tour',
    destination: 'Auli, Uttarakhand',
    destinationSlugs: ['joshimath', 'auli'],
    duration: '3 Nights / 4 Days',
    category: 'Adventure',
    shortDescription: 'A short, Auli-focused trip without the Chopta/Tungnath trek leg — distinct from the existing Auli Chopta Tungnath Tour by being shorter and single-destination.',
    highlights: ['Auli\'s ropeway', 'High-altitude meadow views', 'A focused, single-destination trip'],
    itinerary: [
      { day: 1, title: 'Arrival in Joshimath', description: 'Arrive in Joshimath, the usual base for Auli.' },
      { day: 2, title: 'Auli Excursion', description: 'Ropeway ride and meadow views, snow-dependent in winter and green in summer.' },
      { day: 3, title: 'Auli Local Time', description: 'A further, more relaxed day around Auli/Joshimath.' },
      { day: 4, title: 'Departure', description: 'Return journey and departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Rishikesh',
    endingCity: 'Rishikesh',
    idealTraveller: 'Travellers wanting Auli specifically, without the Chopta/Tungnath trek leg.',
    bestTimeToVisit: 'Suits both a winter snow visit and a summer/autumn green-meadow visit depending on what a traveller wants to see.',
    importantNotes: ['This package deliberately excludes Chopta/Tungnath — travellers wanting that trek should consider the existing Auli Chopta Tungnath Tour instead.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'valley-of-flowers-hemkund-sahib-trek',
    status: 'draft',
    name: 'Valley of Flowers Hemkund Sahib Trek',
    destination: 'Valley of Flowers & Hemkund Sahib, Uttarakhand',
    destinationSlugs: ['hemkund-sahib'],
    duration: '5 Nights / 6 Days',
    category: 'Adventure',
    price: 12999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    usesGeneralCancellationPolicy: true,
    image: images.destinations.hemkundSahib,
    // Owner-confirmed gateway: Joshimath, matching the existing itinerary.
    hotelCategoryDescription: 'Standard hotel/guesthouse or equivalent in Joshimath; basic trek-lodge/guesthouse accommodation in Ghangaria for the trek nights — genuinely basic, operationally appropriate trek-base lodging, never described as "Deluxe". The specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel/guesthouse for each night on this itinerary; meals during the Valley of Flowers and Hemkund Sahib trek days themselves are not implied as part of this package unless specifically arranged.',
    transportType: 'Road transport covers the Joshimath–Govindghat sector only; the Govindghat–Ghangaria–Valley of Flowers/Hemkund Sahib legs are entirely on foot (trek sectors), not by vehicle.',
    pickupInfo: 'Pickup from Joshimath (exact point and time confirmed at booking). Transfers to Joshimath from any other city are optional and charged separately unless specifically quoted.',
    dropInfo: 'Drop at Joshimath (exact point and time confirmed at booking). Onward transport to any other city is optional and charged separately unless specifically quoted.',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A dedicated trek package to the Valley of Flowers and Hemkund Sahib, both reached from Govindghat/Ghangaria — zero existing coverage on this site. Valley of Flowers has no separate curated destination page of its own; this itinerary anchors to the Hemkund Sahib destination, whose own access base (Ghangaria) is the real, shared starting point for both treks.',
    highlights: ['The Valley of Flowers National Park', 'Hemkund Sahib gurdwara at altitude', 'Ghangaria as the shared trek base'],
    itinerary: [
      { day: 1, title: 'Arrival in Joshimath', description: 'Arrive and settle in.' },
      { day: 2, title: 'Joshimath to Govindghat to Ghangaria', description: 'Travel to Govindghat, then trek to Ghangaria, the base for both onward treks.' },
      { day: 3, title: 'Valley of Flowers Trek', description: 'Day trek into the Valley of Flowers National Park; what\'s in bloom depends entirely on the visit dates and season.' },
      { day: 4, title: 'Hemkund Sahib Trek', description: 'Day trek up to Hemkund Sahib; a genuinely demanding high-altitude trek, weather dependent.' },
      { day: 5, title: 'Ghangaria to Joshimath', description: 'Trek back down to Govindghat and return to Joshimath.' },
      { day: 6, title: 'Departure', description: 'Onward departure.' }
    ],
    inclusions: [
      'Accommodation for 5 nights on a double-sharing basis (Joshimath hotel/guesthouse + Ghangaria trek-lodge nights, per the itinerary)',
      'Daily breakfast and dinner (MAP) at the hotel/guesthouse, per the itinerary',
      'Joshimath pickup/drop',
      'Scheduled Joshimath–Govindghat road transfer'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'Transport to or from Joshimath from any other city, including Rishikesh, Haridwar and Dehradun, unless separately quoted',
      'Valley of Flowers National Park entry/permit charges',
      'Trek guide/porter/pony/palki charges for the Valley of Flowers and Hemkund Sahib treks',
      'Helicopter services (not part of this itinerary at all)',
      'Personal trekking equipment',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Joshimath',
    endingCity: 'Joshimath',
    idealTraveller: 'Trekkers specifically wanting the Valley of Flowers and Hemkund Sahib, comfortable with two genuinely demanding consecutive trek days.',
    bestTimeToVisit: 'The Valley of Flowers is typically open only around July–September (flowering season and park opening dates vary year to year and must be confirmed, not assumed); Hemkund Sahib\'s own season is similar. Outside this window neither is accessible.',
    importantNotes: [
      'Both treks are genuinely demanding, high-altitude day treks — not positioned as an easy add-on.',
      'What is actually in bloom in the Valley of Flowers varies by exact visit date and year — never promised as a specific guaranteed sight.',
      'Park entry/permit requirements for the Valley of Flowers should be confirmed at time of booking, as rules can change.',
      'Neither trail opening, weather, nor physical access to the Valley of Flowers or Hemkund Sahib is guaranteed on any specific date. Pony/porter services are not included (see Exclusions) and no helicopter service is part of this itinerary. Genuine medical fitness for two consecutive demanding high-altitude trek days is the traveller\'s own responsibility and should be assessed with appropriate medical advice before booking.',
      'OWNER-APPROVED: this itinerary starts and ends in Joshimath. Transfers to or from any other city are optional additional services and are excluded unless specifically quoted.',
      'Accommodation shown here is a category, not a specific named property — the final hotel/guesthouse/trek-lodge is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'rishikesh-adventure-package',
    status: 'draft',
    name: 'Rishikesh Adventure Package',
    destination: 'Rishikesh, Uttarakhand',
    destinationSlugs: ['rishikesh'],
    duration: '3 Nights / 4 Days',
    category: 'Adventure',
    price: 8999,
    priceBasis: 'per person (starting price, indicative, double sharing)',
    usesGeneralCancellationPolicy: true,
    image: images.destinations.rishikesh,
    hotelCategoryDescription: 'Standard/Deluxe hotel or equivalent — the specific property is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.',
    mealPlan: 'Daily breakfast and dinner (MAP) at the hotel for each of the 3 nights on this itinerary.',
    transportType: 'Private/package road transfers for itinerary-approved motorable sectors. Rafting, bungee jumping, camping and other paid adventure activities are excluded unless expressly included in the final quotation.',
    pickupInfo: 'Pickup from Dehradun (exact point and time confirmed at the time of booking).',
    dropInfo: 'Drop at Dehradun (exact point and time confirmed at the time of booking).',
    minTravellers: 2,
    roomsIncluded: 1,
    shortDescription: 'A dedicated adventure-sports-focused Rishikesh package — genuinely distinct in category and framing from the existing spiritual-positioned Uttarakhand Explorer, which also includes Rishikesh but as one stop in a multi-city pilgrimage-style circuit.',
    highlights: ['White-water rafting on the Ganges (seasonal)', 'Riverside camping', 'A single-destination, activity-focused trip'],
    itinerary: [
      { day: 1, title: 'Arrival in Rishikesh', description: 'Arrive and settle in; evening Ganga aarti.' },
      { day: 2, title: 'White-Water Rafting', description: 'Rafting on the Ganges, seasonal and water-level dependent, subject to a licensed operator\'s availability and safety assessment on the day.' },
      { day: 3, title: 'Riverside Camping & Activities', description: 'A day around riverside camping and other adventure activities, availability dependent.' },
      { day: 4, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [
      'Accommodation for 3 nights on a double-sharing basis (Standard/Deluxe hotel or equivalent)',
      'Daily breakfast and dinner (MAP)',
      'Dehradun pickup/drop',
      'Private/package road transfers for itinerary-approved pickup/drop sectors'
    ],
    exclusions: [
      'Airfare/train fare',
      'Personal expenses',
      'White-water rafting charges (not included — seasonal, water-level and licensed-operator dependent; quoted and booked separately)',
      'Bungee jumping, riverside camping and other adventure-activity charges (not included, availability dependent)',
      'Entry tickets',
      'Anything not specifically mentioned in Inclusions'
    ],
    stayOptions: [],
    addOns: [],
    startingCity: 'Dehradun',
    endingCity: 'Dehradun',
    idealTraveller: 'Adventure-sports travellers wanting a Rishikesh-focused activity trip, distinct from the spiritual/multi-city framing of the existing Uttarakhand Explorer package.',
    bestTimeToVisit: 'White-water rafting typically runs September–June, water-level and season dependent; not available/safe during peak monsoon high-water periods.',
    importantNotes: [
      'Rafting and other adventure activities are real, weather/water-level/operator-dependent activities — never guaranteed on a specific date, and their cost is excluded from this starting price (see Exclusions).',
      'No safety guarantee is made or implied for rafting or any other adventure activity — all such activities are conducted subject to the licensed operator\'s own safety assessment and conditions on the day.',
      'Accommodation shown here is a category, not a specific named property — the final hotel is confirmed at the time of booking, subject to availability; any material change to this category will be disclosed to you before your booking is confirmed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'uttarakhand-honeymoon-circuit',
    status: 'draft',
    name: 'Uttarakhand Honeymoon Circuit',
    destination: 'Mussoorie & Nainital, Uttarakhand',
    destinationSlugs: ['mussoorie', 'nainital'],
    duration: '4 Nights / 5 Days',
    category: 'Honeymoon',
    shortDescription: 'A couple-framed Mussoorie-Nainital circuit — genuinely distinct from the existing spiritual-positioned Uttarakhand Explorer and the family-positioned Nainital Corbett Mussoorie package; Uttarakhand currently has no honeymoon-specific product.',
    highlights: ['Mussoorie\'s Mall Road and viewpoints', 'Naini Lake boating in Nainital', 'A relaxed, couple-paced two-destination circuit'],
    itinerary: [
      { day: 1, title: 'Arrival in Mussoorie', description: 'Arrive and settle in; evening on Mall Road.' },
      { day: 2, title: 'Mussoorie Sightseeing', description: 'Camel\'s Back Road and viewpoints, at a relaxed couple pace.' },
      { day: 3, title: 'Mussoorie to Nainital', description: 'Travel to Nainital.' },
      { day: 4, title: 'Nainital Sightseeing', description: 'Boating on Naini Lake and local viewpoints.' },
      { day: 5, title: 'Departure', description: 'Check out and depart.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Dehradun',
    endingCity: 'Kathgodam',
    idealTraveller: 'Couples and honeymooners wanting a relaxed two-destination Uttarakhand circuit, distinct from the existing family- and spiritual-positioned packages.',
    bestTimeToVisit: 'Broadly March–June and September–November; monsoon brings heavier rain and winter can bring snow at higher points.',
    importantNotes: ['This package deliberately excludes Corbett and Rishikesh/Haridwar — travellers wanting a wildlife stop or a pilgrimage-style circuit should consider the existing Nainital Corbett Mussoorie or Uttarakhand Explorer packages instead.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },

  // ============================================================
  // PHASE 3C — Ladakh Journey drafts (2026-09). All 5 destinationSlugs verified against
  // the live database before writing (see docs/phase-3c-ladakh-journeys.md) — every one
  // resolves to a real, already-seeded Ladakh Destination (or, for the overland route,
  // an existing Kashmir/Himachal destination). Khardung La is mentioned only as a route
  // highlight, never as a destinationSlug. No permit/access/snowfall guarantee anywhere
  // below — every border-adjacent leg carries the same conservative "requirements can
  // change, confirm before travel" language already established in
  // config/ladakhFoundation.config.ts. Every itinerary opens with a genuine
  // acclimatisation day (or, for the overland route, the gradual road ascent itself)
  // before any higher-altitude leg — never Pangong/Nubra/Hanle/Tso Moriri on arrival day.
  // ============================================================
  {
    slug: 'leh-nubra-pangong-tour',
    status: 'draft',
    name: 'Leh Nubra Pangong Tour',
    destination: 'Leh, Nubra Valley & Pangong Lake, Ladakh',
    destinationSlugs: ['leh', 'nubra-valley', 'pangong-lake'],
    duration: '5 Nights / 6 Days',
    category: 'Adventure',
    shortDescription: 'The core, canonical Ladakh circuit — Leh, Nubra Valley and Pangong Lake — with a genuine acclimatisation day built in before any higher-altitude crossing.',
    highlights: [
      'Diskit Monastery and Hunder\'s sand dunes in Nubra Valley',
      'Pangong Lake\'s changing colours through the day',
      'Khardung La crossing en route to Nubra (a route highlight, not an overnight stop)',
      'A full Leh acclimatisation day before any higher crossing'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Leh', description: 'Arrive in Leh by air; the rest of the day is kept deliberately light — check-in and rest, with no sightseeing scheduled, to allow initial acclimatisation to the altitude.' },
      { day: 2, title: 'Leh Acclimatisation & Local Time', description: 'A further, still-gentle day around Leh itself — Leh Palace, Shanti Stupa and the town\'s monasteries — before any higher-altitude travel begins.' },
      { day: 3, title: 'Leh to Nubra Valley', description: 'Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.' },
      { day: 4, title: 'Nubra Valley', description: 'Diskit Monastery and Hunder\'s sand dunes.' },
      { day: 5, title: 'Nubra Valley to Pangong Lake', description: 'Travel to Pangong Lake; overnight lakeside, where accommodation availability allows.' },
      { day: 6, title: 'Pangong Lake to Leh, Departure', description: 'Return to Leh for onward departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Leh',
    endingCity: 'Leh',
    idealTraveller: 'Travellers wanting the essential, best-known Ladakh circuit on a standard 6-day schedule.',
    bestTimeToVisit: 'Broadly May–September, matching Khardung La\'s and the region\'s typical open season — exact dates vary year to year with snowfall and are not fixed here.',
    importantNotes: [
      'Travellers should allow appropriate time to acclimatise to high altitude and follow current local/medical guidance where applicable — Day 1 and Day 2 are deliberately kept light for this reason.',
      'Nubra Valley and Pangong Lake are both permit-gated, border-adjacent areas — an Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals) is required, arranged through Leh. Requirements and the approval process can change and should be confirmed at time of booking; a permit is not treated as included or guaranteed at this stage.',
      'Access to Pangong Lake can, at times, be affected by the security situation in this border-adjacent area — never assumed unchanged from a prior trip.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: [
      { question: 'Do I need a permit for this trip?', answer: 'Yes — both Nubra Valley and Pangong Lake require an Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals), arranged through Leh. Exact requirements and processing can change, so this is confirmed closer to your travel dates rather than assumed.' },
      { question: 'How much time do I get to acclimatise before going higher?', answer: 'This itinerary keeps Day 1 and Day 2 in Leh itself, with no higher-altitude travel until Day 3 — travellers should still allow appropriate time to acclimatise and follow current local/medical guidance.' },
      { question: 'Is Khardung La a separate stop on this trip?', answer: 'Khardung La is crossed en route to Nubra Valley as a scenic highlight of the drive — it is not an overnight destination on this itinerary.' }
    ]
  },
  {
    slug: 'leh-nubra-pangong-turtuk-tour',
    status: 'draft',
    name: 'Leh Nubra Pangong Turtuk Tour',
    destination: 'Leh, Nubra Valley, Turtuk & Pangong Lake, Ladakh',
    destinationSlugs: ['leh', 'nubra-valley', 'turtuk', 'pangong-lake'],
    duration: '6 Nights / 7 Days',
    category: 'Offbeat',
    shortDescription: 'Extends the core Leh-Nubra-Pangong circuit with Turtuk, a genuinely distinct Balti village — honestly routed with a transit day back through Leh between Turtuk and Pangong, rather than an unrealistic direct crossing.',
    highlights: [
      'Turtuk\'s Balti culture, genuinely different from the rest of Ladakh',
      'Diskit Monastery and Hunder\'s sand dunes in Nubra Valley',
      'Pangong Lake\'s changing colours through the day',
      'A full Leh acclimatisation day before any higher-altitude crossing'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Leh', description: 'Arrive in Leh by air; the rest of the day is kept deliberately light for initial acclimatisation, with no sightseeing scheduled.' },
      { day: 2, title: 'Leh Acclimatisation & Local Time', description: 'A further, still-gentle day around Leh itself before any higher-altitude travel begins.' },
      { day: 3, title: 'Leh to Nubra Valley', description: 'Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.' },
      { day: 4, title: 'Nubra Valley to Turtuk', description: 'Continue further into the valley to Turtuk, a Balti village genuinely different in culture from the rest of Ladakh.' },
      { day: 5, title: 'Turtuk back toward Leh', description: 'Turtuk does not connect directly to Pangong Lake by road in a single realistic day — this itinerary honestly routes back toward Leh as a transit day rather than presenting an unrealistic direct crossing.' },
      { day: 6, title: 'Leh to Pangong Lake', description: 'Travel on to Pangong Lake; overnight lakeside, where accommodation availability allows.' },
      { day: 7, title: 'Pangong Lake to Leh, Departure', description: 'Return to Leh for onward departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Leh',
    endingCity: 'Leh',
    idealTraveller: 'Travellers wanting a genuinely different cultural stop (Turtuk) added to the core Ladakh circuit, comfortable with the extra transit day this honestly requires.',
    bestTimeToVisit: 'Broadly May–September; exact pass and road-opening dates vary year to year with snowfall.',
    importantNotes: [
      'Travellers should allow appropriate time to acclimatise to high altitude and follow current local/medical guidance where applicable — Day 1 and Day 2 are deliberately kept light for this reason.',
      'Nubra Valley, Turtuk and Pangong Lake are all permit-gated, border-adjacent areas — an Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals) is required, arranged through Leh. Requirements can change and are confirmed at time of booking, never treated as included or guaranteed at this stage.',
      'Day 5\'s transit back through Leh exists because Turtuk and Pangong Lake are not honestly connected by a single realistic day\'s drive — this itinerary does not compress that transition.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: [
      { question: 'Why does the itinerary go back through Leh between Turtuk and Pangong?', answer: 'Turtuk and Pangong Lake are not connected by a realistic single day\'s drive — routing back through Leh is the honest way to sequence this trip rather than compressing an unrealistic direct crossing.' },
      { question: 'What makes Turtuk different from the rest of the Nubra Valley leg?', answer: 'Turtuk is a Balti Muslim village that was part of Pakistan-administered territory until 1971 and only opened to tourism in 2010 — its culture, language and architecture are genuinely distinct from the Buddhist-majority towns elsewhere in this itinerary.' }
    ]
  },
  {
    slug: 'leh-nubra-pangong-hanle-tour',
    status: 'draft',
    name: 'Leh Nubra Pangong Hanle Tour',
    destination: 'Leh, Nubra Valley, Pangong Lake & Hanle, Ladakh',
    destinationSlugs: ['leh', 'nubra-valley', 'pangong-lake', 'hanle'],
    duration: '6 Nights / 7 Days',
    category: 'Offbeat',
    shortDescription: 'Extends the core circuit into the remote Changthang plateau to reach Hanle, home to India\'s first Dark Sky Reserve — for travellers wanting genuine remoteness and stargazing, not just the standard Nubra-Pangong loop.',
    highlights: [
      'Diskit Monastery and Hunder\'s sand dunes in Nubra Valley',
      'Pangong Lake\'s changing colours through the day',
      'Hanle\'s dark-sky stargazing, weather and moon-phase permitting',
      'A full Leh acclimatisation day before any higher-altitude crossing'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Leh', description: 'Arrive in Leh by air; the rest of the day is kept deliberately light for initial acclimatisation, with no sightseeing scheduled.' },
      { day: 2, title: 'Leh Acclimatisation & Local Time', description: 'A further, still-gentle day around Leh itself before any higher-altitude travel begins.' },
      { day: 3, title: 'Leh to Nubra Valley', description: 'Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.' },
      { day: 4, title: 'Nubra Valley to Pangong Lake', description: 'Travel to Pangong Lake via the Shyok valley route; overnight lakeside, where accommodation availability allows.' },
      { day: 5, title: 'Pangong Lake to Hanle', description: 'Travel on to Hanle via the Chushul-Nyoma route, a genuinely remote leg — road conditions on this stretch should be confirmed closer to travel.' },
      { day: 6, title: 'Hanle to Leh', description: 'Time in Hanle (stargazing conditions are weather and moon-phase dependent, never guaranteed on a specific date) before the return drive to Leh.' },
      { day: 7, title: 'Departure', description: 'Onward departure from Leh.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Leh',
    endingCity: 'Leh',
    idealTraveller: 'Travellers specifically wanting the remote Changthang/Hanle stargazing experience added to the core circuit, comfortable with genuinely long driving days.',
    bestTimeToVisit: 'Broadly May–September; clear-sky stargazing conditions at Hanle vary night to night and are never guaranteed on a specific date.',
    importantNotes: [
      'Travellers should allow appropriate time to acclimatise to high altitude and follow current local/medical guidance where applicable — Day 1 and Day 2 are deliberately kept light for this reason.',
      'Nubra Valley, Pangong Lake and Hanle are all permit-gated, border-adjacent/remote areas — an Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals) is required, arranged through Leh. Requirements can change and are confirmed at time of booking, never treated as included or guaranteed at this stage.',
      'Hanle is genuinely remote with long driving days either side — this is not positioned as a casual add-on.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: [
      { question: 'Is clear-sky stargazing guaranteed at Hanle?', answer: 'No — stargazing conditions depend on weather and moon phase on the specific night, and are never guaranteed. Hanle\'s Dark Sky Reserve status reflects genuinely low light pollution, not a guaranteed clear-sky outcome.' },
      { question: 'How remote is the Pangong-to-Hanle leg?', answer: 'Genuinely remote — this is real Changthang plateau driving, on a route with far less infrastructure than the standard Leh-Nubra-Pangong loop. It should be booked by travellers comfortable with long, remote driving days.' }
    ]
  },
  {
    slug: 'ladakh-hanle-tso-moriri-tour',
    status: 'draft',
    name: 'Ladakh Hanle Tso Moriri Tour',
    destination: 'Leh, Nubra Valley, Pangong Lake, Hanle & Tso Moriri, Ladakh',
    destinationSlugs: ['leh', 'nubra-valley', 'pangong-lake', 'hanle', 'tso-moriri'],
    duration: '7 Nights / 8 Days',
    category: 'Offbeat',
    shortDescription: 'The fullest Changthang circuit this catalogue offers — Nubra Valley, Pangong Lake, Hanle and Tso Moriri in one trip — for travellers with enough time to see the region\'s full range of high-altitude lakes and remote plateau in a single booking.',
    highlights: [
      'Diskit Monastery and Hunder\'s sand dunes in Nubra Valley',
      'Pangong Lake and the quieter, more remote Tso Moriri, both in one trip',
      'Hanle\'s dark-sky stargazing, weather and moon-phase permitting',
      'A full Leh acclimatisation day before any higher-altitude crossing'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Leh', description: 'Arrive in Leh by air; the rest of the day is kept deliberately light for initial acclimatisation, with no sightseeing scheduled.' },
      { day: 2, title: 'Leh Acclimatisation & Local Time', description: 'A further, still-gentle day around Leh itself before any higher-altitude travel begins.' },
      { day: 3, title: 'Leh to Nubra Valley', description: 'Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.' },
      { day: 4, title: 'Nubra Valley to Pangong Lake', description: 'Travel to Pangong Lake via the Shyok valley route.' },
      { day: 5, title: 'Pangong Lake to Hanle', description: 'Travel to Hanle via the Chushul-Nyoma route, a genuinely remote leg.' },
      { day: 6, title: 'Hanle to Tso Moriri', description: 'Travel on to Tso Moriri, in the same southeastern Changthang region as Hanle — a real connecting route, though genuinely remote.' },
      { day: 7, title: 'Tso Moriri to Leh', description: 'Return drive to Leh.' },
      { day: 8, title: 'Departure', description: 'Onward departure from Leh.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Leh',
    endingCity: 'Leh',
    idealTraveller: 'Travellers with 8 days available who want the region\'s full range of high-altitude lakes and remote plateau, rather than choosing between Pangong-only and Hanle-only options.',
    bestTimeToVisit: 'Broadly May–September; clear-sky stargazing at Hanle and road conditions across the Changthang plateau both vary year to year and night to night.',
    importantNotes: [
      'Travellers should allow appropriate time to acclimatise to high altitude and follow current local/medical guidance where applicable — Day 1 and Day 2 are deliberately kept light for this reason.',
      'Every border-adjacent/remote area on this route (Nubra Valley, Pangong Lake, Hanle, Tso Moriri) requires an Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals), arranged through Leh. Requirements can change and are confirmed at time of booking, never treated as included or guaranteed at this stage.',
      'This is the longest and most physically demanding of this catalogue\'s Ladakh circuits — several consecutive days of genuinely remote, high-altitude driving.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: [
      { question: 'How is this different from the Leh Nubra Pangong Hanle Tour?', answer: 'This itinerary adds Tso Moriri, a quieter and more remote lake in the same southeastern Changthang region as Hanle, over one additional night — for travellers who have the extra day and want the fuller circuit rather than stopping at Hanle.' },
      { question: 'Is this itinerary suitable for a first-time Ladakh visitor?', answer: 'It is a genuinely demanding, remote circuit best suited to travellers comfortable with several consecutive long driving days at high altitude — the shorter Leh Nubra Pangong Tour may suit a first-time visitor better.' }
    ]
  },
  {
    slug: 'srinagar-leh-ladakh-tour',
    status: 'draft',
    name: 'Srinagar Leh Ladakh Tour',
    destination: 'Srinagar, Kargil, Leh, Nubra Valley & Pangong Lake',
    destinationSlugs: ['srinagar', 'kargil', 'lamayuru', 'leh', 'nubra-valley', 'pangong-lake'],
    duration: '7 Nights / 8 Days',
    category: 'Adventure',
    shortDescription: 'A fundamentally different entry into Ladakh — overland from Srinagar via Kargil and Lamayuru rather than flying directly into Leh, using the gradual road ascent itself as a natural approach to acclimatisation.',
    highlights: [
      'The Srinagar-Leh highway itself, via Sonamarg, Zoji La and Kargil',
      'Lamayuru\'s "Moonland" landscape and ancient monastery en route',
      'Diskit Monastery and Hunder\'s sand dunes in Nubra Valley',
      'Pangong Lake\'s changing colours through the day'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar', description: 'Arrive in Srinagar; evening at leisure.' },
      { day: 2, title: 'Srinagar to Kargil', description: 'Drive via Sonamarg and Zoji La to Kargil — a genuinely long mountain-road day.' },
      { day: 3, title: 'Kargil to Leh', description: 'Continue via Lamayuru\'s "Moonland" landscape and ancient monastery to Leh — this gradual overland ascent is itself a natural approach to acclimatisation, unlike flying directly into Leh.' },
      { day: 4, title: 'Leh Local Time', description: 'A still-gentle day around Leh itself before any higher-altitude crossing, even though the overland route has already helped with gradual acclimatisation.' },
      { day: 5, title: 'Leh to Nubra Valley', description: 'Travel to Nubra Valley via Khardung La; overnight in the Diskit/Hunder area.' },
      { day: 6, title: 'Nubra Valley', description: 'Diskit Monastery and Hunder\'s sand dunes.' },
      { day: 7, title: 'Nubra Valley to Pangong Lake', description: 'Travel to Pangong Lake; overnight lakeside, where accommodation availability allows.' },
      { day: 8, title: 'Pangong Lake to Leh, Departure', description: 'Return to Leh for onward departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Srinagar',
    endingCity: 'Leh',
    idealTraveller: 'Travellers who want to see the Srinagar-Leh highway itself as part of the trip, and prefer a gradual overland approach to Ladakh over flying directly into Leh.',
    bestTimeToVisit: 'Broadly May/June–September, matching the Srinagar-Leh highway\'s typical open season — exact opening/closing dates (particularly at Zoji La) vary year to year with snowfall and are not fixed here.',
    importantNotes: [
      'The gradual overland ascent (Srinagar → Kargil → Leh) is a genuine, real-world approach to acclimatisation, but travellers should still allow appropriate time to acclimatise at each stage and follow current local/medical guidance where applicable — Day 4 remains a gentle day in Leh before any higher crossing.',
      'Nubra Valley and Pangong Lake are permit-gated, border-adjacent areas — an Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals) is required, arranged through Leh. Requirements can change and are confirmed at time of booking, never treated as included or guaranteed at this stage.',
      'The Zoji La crossing (Day 2) is itself a seasonal, weather-dependent mountain pass — this route is not available outside its typical open season.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: [
      { question: 'Is the overland route safer for acclimatisation than flying into Leh?', answer: 'The gradual ascent over the Srinagar-Leh highway is a genuine, commonly-used approach to acclimatisation, but travellers should still allow appropriate time to acclimatise and follow current local/medical guidance — this itinerary keeps Day 4 in Leh gentle even after the overland approach.' },
      { question: 'Is Lamayuru a separate overnight stop?', answer: 'Lamayuru is visited as a real stop on the Kargil-to-Leh drive (Day 3) for its landscape and monastery, not as a separate overnight destination on this itinerary.' },
      { question: 'What happens if Zoji La is closed?', answer: 'Zoji La is a seasonal mountain pass — this overland route is only available within its typical open season, and current conditions should be confirmed before booking.' }
    ]
  }
];
