import type { DraftTravelPackageInput } from '@/types/package';

/**
 * PHASE 2 DRAFT CATALOGUE — NOT the live public catalogue (see config/packages.config.ts
 * for that). Every entry here is `status: 'draft'`, deliberately: no price, no
 * inclusions/exclusions, no hotel/transport-supplier claims — see models/Journey.ts's
 * pre-validate hook, which makes it impossible to mark any of these 'published' in this
 * state. `destinationSlugs` are drawn ONLY from real, already-curated destinations in
 * config/destinations.config.ts (verified against config/stayLocations.config.ts's
 * STAY_LOCATION_RULES, which authoritatively lists all 70). Route/itinerary text uses
 * conservative, conditional language for any weather/road/altitude/permit-dependent
 * leg — never a guaranteed claim. Seeded into MongoDB (as drafts only) by
 * scripts/seedDraftJourneys.ts.
 *
 * One proposed package — a second "Spiti Valley Adventure" — was evaluated against the
 * existing spiti-valley-adventure ("Spiti Circuit Expedition") and found substantially
 * duplicative (same core Shimla→Kalpa→Tabo→Kaza→Manali loop, same Offbeat/adventure
 * framing, near-identical duration) — it is deliberately NOT included here. See the
 * Phase 2 owner report for the full comparison.
 */
export const draftJourneys: DraftTravelPackageInput[] = [
  {
    slug: 'shimla-manali-tour-package',
    status: 'draft',
    name: 'Shimla Manali Tour Package',
    destination: 'Shimla & Manali, Himachal Pradesh',
    destinationSlugs: ['shimla', 'manali'],
    duration: '5 Nights / 6 Days',
    category: 'Family',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Chandigarh',
    endingCity: 'Chandigarh',
    idealTraveller: 'Families, couples, friend groups and first-time Himachal visitors wanting one classic circuit rather than a single-destination trip.',
    bestTimeToVisit: 'Broadly a year-round route; conditions differ by season — expect snow access at higher points (e.g. Solang, Atal Tunnel/Rohtang) mainly in winter and early summer, and monsoon-season landslide risk on some stretches. Confirm current road conditions closer to travel.',
    importantNotes: [
      'Any excursion beyond Solang toward Atal Tunnel/Rohtang Pass depends on seasonal road opening, weather and, at times, permits — it is not a guaranteed part of every departure.',
      'Hill roads between Shimla and Manali can be affected by weather or landslides, particularly in the monsoon; the exact drive time can vary accordingly.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kinnaur-spiti-circuit',
    status: 'draft',
    name: 'Kinnaur Spiti Circuit',
    destination: 'Kinnaur & Spiti Valley, Himachal Pradesh',
    destinationSlugs: ['shimla', 'kinnaur', 'sangla-valley', 'chitkul', 'tabo', 'spiti-valley', 'manali'],
    duration: '8 Nights / 9 Days',
    category: 'Offbeat',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Shimla',
    endingCity: 'Manali',
    idealTraveller: 'Offbeat and adventure travellers with time for a longer, higher-altitude circuit rather than a direct Spiti run.',
    bestTimeToVisit: 'Broadly mid-June to early October, when the Kunzum Pass crossing to Manali is typically open — exact opening/closing dates vary by year with snowfall and road-clearing work. Outside this window the Manali-side crossing may not be possible and the route would need to reverse via Shimla instead.',
    importantNotes: [
      'This is a genuinely high-altitude circuit (Kaza and surrounding villages sit above 3,500m) — acclimatization matters, and travellers with relevant health conditions should take medical advice before booking.',
      'Chandratal, Kunzum Pass and some Kaza-area excursions are seasonal and weather/road-condition dependent, not guaranteed on every departure.',
      'Inner-line permit requirements for parts of this route should be confirmed at the time of booking, as rules can change.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kasol-kheerganga-tosh',
    status: 'draft',
    name: 'Kasol Kheerganga Tosh',
    destination: 'Kasol, Parvati Valley, Himachal Pradesh',
    destinationSlugs: ['kasol'],
    duration: '4 Nights / 5 Days',
    category: 'Adventure',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Bhuntar',
    endingCity: 'Bhuntar',
    idealTraveller: 'Friends and young/budget-conscious travellers comfortable with a moderate trek.',
    bestTimeToVisit: 'Broadly March–June and September–November, avoiding heavy monsoon rain and the coldest winter weeks — the Kheerganga trail can be slippery or snow-affected outside these windows; confirm current trail conditions before departure.',
    importantNotes: [
      'The Kheerganga trek requires a reasonable level of fitness and is affected by weather — it should not be treated as guaranteed easy or open on every date.',
      'A local guide is advisable for the Kheerganga trail, particularly outside peak season.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'jibhi-tirthan-valley',
    status: 'draft',
    name: 'Jibhi Tirthan Valley',
    destination: 'Jibhi & Tirthan Valley, Himachal Pradesh',
    destinationSlugs: ['jibhi', 'tirthan-valley'],
    duration: '3 Nights / 4 Days',
    category: 'Offbeat',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Aut',
    endingCity: 'Aut',
    idealTraveller: 'Couples and small groups wanting a short, quiet weekend-length offbeat trip rather than a longer circuit.',
    bestTimeToVisit: 'Broadly March–June and September–November; monsoon months bring heavier rain to this valley and winter can be cold, so check seasonal conditions before booking.',
    importantNotes: ['This is a short, low-key itinerary by design — travellers looking for a longer multi-stop circuit should consider a different package.'],
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
    name: 'Kashmir Family Tour',
    destination: 'Srinagar, Gulmarg & Pahalgam, Jammu & Kashmir',
    destinationSlugs: ['srinagar', 'gulmarg', 'pahalgam'],
    duration: '5 Nights / 6 Days',
    category: 'Family',
    shortDescription: 'A paced, three-stop Kashmir introduction for families — Srinagar, Gulmarg and Pahalgam only, with rest built into the schedule rather than a packed multi-valley circuit.',
    highlights: [
      'Dal Lake houseboat stay and shikara ride',
      'Gulmarg\'s Gondola cable car',
      'Pahalgam\'s Lidder valley',
      'Mughal Gardens in Srinagar'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar', description: 'Arrive in Srinagar; evening shikara ride on Dal Lake.' },
      { day: 2, title: 'Srinagar Sightseeing', description: 'Visit the Mughal Gardens and central Srinagar; overnight on a houseboat or in a hotel.' },
      { day: 3, title: 'Srinagar to Gulmarg', description: 'Day trip or transfer to Gulmarg; Gondola ride where seasonally operating.' },
      { day: 4, title: 'Gulmarg to Pahalgam', description: 'Travel to Pahalgam; evening at leisure by the Lidder river.' },
      { day: 5, title: 'Pahalgam Local Sightseeing', description: 'A relaxed day around Pahalgam\'s valley viewpoints, paced for families.' },
      { day: 6, title: 'Departure via Srinagar', description: 'Return to Srinagar for departure.' }
    ],
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Srinagar',
    endingCity: 'Srinagar',
    idealTraveller: 'Families wanting a paced, three-stop Kashmir trip rather than a fuller multi-valley sightseeing circuit.',
    bestTimeToVisit: 'Broadly April–June and September–October for milder weather; winter brings snow (Gulmarg becomes a ski destination but access can be weather-dependent) and access/road conditions should be checked seasonally.',
    importantNotes: ['The Gulmarg Gondola\'s operation and houseboat availability can vary by season and demand — confirm current status closer to travel.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kashmir-pahalgam-gulmarg-sonamarg-tour',
    status: 'draft',
    name: 'Kashmir Pahalgam Gulmarg Sonamarg Tour',
    destination: 'Srinagar, Pahalgam, Gulmarg & Sonamarg, Jammu & Kashmir',
    destinationSlugs: ['srinagar', 'pahalgam', 'gulmarg', 'sonamarg'],
    duration: '6 Nights / 7 Days',
    category: 'Sightseeing',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Srinagar',
    endingCity: 'Srinagar',
    idealTraveller: 'Couples and families wanting a fuller multi-valley Kashmir circuit rather than the shorter, more paced Kashmir Family Tour.',
    bestTimeToVisit: 'Broadly April–June and September–October; Sonamarg\'s road access and Gulmarg\'s Gondola operation are both seasonal and weather-dependent — confirm current status closer to travel.',
    importantNotes: ['This itinerary deliberately covers more ground than the shorter Kashmir Family Tour package — travellers wanting a slower pace across fewer stops should consider that package instead.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'char-dham-yatra',
    status: 'draft',
    name: 'Char Dham Yatra',
    destination: 'Yamunotri, Gangotri, Kedarnath & Badrinath, Uttarakhand',
    destinationSlugs: ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'],
    duration: '9 Nights / 10 Days',
    category: 'Spiritual',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Haridwar',
    endingCity: 'Haridwar',
    idealTraveller: 'Pilgrims and spiritually-motivated travellers prepared for a multi-day, physically demanding circuit including a genuine trek/altitude leg.',
    bestTimeToVisit: 'The Char Dham shrines are open only within their own official yatra season (typically around late April/May to early November, weather-dependent) and are closed for winter — exact opening and closing dates are announced by the respective temple boards each year and must be confirmed before booking, not assumed from a prior year.',
    importantNotes: [
      'Kedarnath access is via a trek (or helicopter, subject to weather and availability) — this is not a guaranteed, road-accessible leg like Badrinath or Gangotri.',
      'Road conditions in this region can be affected by landslides, especially around monsoon; the yatra season itself is set to avoid the worst of this, but delays remain possible.',
      'Physical fitness and, for some travellers, medical advice are relevant given the altitude and trek involved at Kedarnath.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'kedarnath-badrinath-yatra',
    status: 'draft',
    name: 'Kedarnath Badrinath Yatra',
    destination: 'Kedarnath & Badrinath, Uttarakhand',
    destinationSlugs: ['kedarnath', 'badrinath'],
    duration: '6 Nights / 7 Days',
    category: 'Spiritual',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Haridwar',
    endingCity: 'Haridwar',
    idealTraveller: 'Pilgrims wanting Kedarnath and Badrinath specifically, on a shorter schedule than the full Char Dham circuit.',
    bestTimeToVisit: 'Open only within the official yatra season (typically around late April/May to early November, weather-dependent) — confirm exact dates for the current year before booking.',
    importantNotes: [
      'Kedarnath access is via a trek (or helicopter, subject to weather and availability) — not a guaranteed, road-accessible leg like Badrinath.',
      'This package deliberately overlaps with two of the four stops in the Char Dham Yatra package — choose this one if Yamunotri and Gangotri are not needed.'
    ],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'nainital-corbett-mussoorie-tour',
    status: 'draft',
    name: 'Nainital Corbett Mussoorie Tour',
    destination: 'Nainital, Jim Corbett & Mussoorie, Uttarakhand',
    destinationSlugs: ['nainital', 'ramnagar-corbett', 'mussoorie'],
    duration: '5 Nights / 6 Days',
    category: 'Family',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Kathgodam',
    endingCity: 'Dehradun',
    idealTraveller: 'Families and couples wanting a lake-town, wildlife and hill-station combination rather than a single-destination trip.',
    bestTimeToVisit: 'Broadly March–June and September–November; Corbett\'s core safari zones typically close during the monsoon months (mid-June to mid-November varies by zone) — confirm current park status when booking.',
    importantNotes: ['Corbett safari permits are limited and allocated in advance — availability on specific dates is not guaranteed and should be confirmed before the trip is finalized.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  },
  {
    slug: 'auli-chopta-tungnath-tour',
    status: 'draft',
    name: 'Auli Chopta Tungnath Tour',
    destination: 'Auli & Chopta, Uttarakhand',
    destinationSlugs: ['joshimath', 'auli', 'chopta'],
    duration: '5 Nights / 6 Days',
    category: 'Adventure',
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
    inclusions: [],
    exclusions: [],
    stayOptions: [],
    addOns: [],
    startingCity: 'Rishikesh',
    endingCity: 'Rishikesh',
    idealTraveller: 'Couples and nature/adventure travellers wanting meadow and trek scenery rather than a pilgrimage-focused itinerary.',
    bestTimeToVisit: 'Auli suits both a winter snow visit and a summer/autumn green-meadow visit depending on what a traveller wants to see; the Tungnath trail is best avoided in heavy monsoon rain and can be snow-affected in winter — confirm current trail conditions before departure.',
    importantNotes: ['The Tungnath trek\'s difficulty and duration can vary with weather and trail condition on the day — it should not be assumed uniformly easy for every traveller.'],
    bookingProcess: 'Once this itinerary and its inclusions are finalized and priced, enquire via the booking form or WhatsApp to receive a customized quote for your travel dates and group size before confirming.',
    faqs: []
  }
];
