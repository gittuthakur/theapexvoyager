import { images } from '@/config/images.config';
import type { TravelPackage } from '@/types/package';

/**
 * Demo package catalog for the "Explore Our Signature Journeys" homepage
 * section and the /packages flow. Prices are illustrative starting-from
 * figures for this demo, not live/externally-sourced rates.
 */
export const packages: TravelPackage[] = [
  {
    slug: 'manali-premium-escape',
    name: 'Manali Premium Escape',
    destination: 'Manali, Himachal Pradesh',
    destinationSlugs: ['manali'],
    image: images.packages.manaliPremiumEscape,
    duration: '5 Days / 4 Nights',
    price: 12999,
    category: 'Adventure',
    shortDescription: 'Snow-capped peaks, riverside cafes, and adventure sports in the heart of Himachal.',
    highlights: [
      'Solang Valley adventure sports',
      'Old Manali cafe hopping',
      'Hadimba Temple & Mall Road',
      'Rohtang Pass excursion (seasonal)'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Manali', description: 'Arrive and settle into your homestay, evening at leisure on Mall Road.' },
      { day: 2, title: 'Solang Valley Adventure', description: 'Paragliding, zorbing, and cable car rides in Solang Valley.' },
      { day: 3, title: 'Old Manali & Local Sightseeing', description: 'Explore Hadimba Temple, Manu Temple, and riverside cafes in Old Manali.' },
      { day: 4, title: 'Rohtang Pass / Kasol Day Trip', description: 'Optional excursion to Rohtang Pass or a scenic day trip to Kasol.' },
      { day: 5, title: 'Departure', description: 'Check out and depart with memories of the mountains.' }
    ],
    inclusions: [
      '4 nights hotel/homestay accommodation',
      'Daily breakfast',
      'Airport/bus stand pickup & drop',
      'All sightseeing as per itinerary',
      'Dedicated trip coordinator'
    ],
    exclusions: [
      'Lunch and dinner (unless specified)',
      'Adventure activity charges (paid on-site)',
      'Personal expenses & tips',
      'GST and applicable taxes'
    ],
    stayOptions: [
      { id: 'standard', label: 'Standard — Included', extraPrice: 0 },
      { id: 'deluxe', label: 'Deluxe', extraPrice: 2000 },
      { id: 'premium', label: 'Premium', extraPrice: 5000 },
      { id: 'luxury', label: 'Luxury', extraPrice: 9000 }
    ],
    addOns: [
      { id: 'private-cab', label: 'Private Cab', price: 3000 },
      { id: 'guided-sightseeing', label: 'Guided Sightseeing', price: 2000 },
      { id: 'adventure-activity', label: 'Adventure Activity', price: 1500 },
      { id: 'extra-night', label: 'Extra Night', price: 4000 }
    ],
    seasonalPricing: [
      { label: 'Peak Season', startDate: '2026-05-01', endDate: '2026-06-30', price: 15999 },
      { label: 'Festival Season', startDate: '2026-12-15', endDate: '2027-01-05', price: 18999 }
    ],
    featured: true
  },
  {
    slug: 'kashmir-signature-journey',
    name: 'Kashmir Paradise',
    destination: 'Srinagar & Gulmarg, Kashmir',
    // Gulmarg is the only one of this journey's stops that's also a curated
    // Destination (config/destinations.config.ts) — Srinagar isn't in that catalog —
    // so this is the stable link used to derive the journey's region/season for filtering.
    destinationSlugs: ['gulmarg'],
    image: images.packages.kashmirSignatureJourney,
    duration: '6 Days / 5 Nights',
    price: 24999,
    category: 'Luxury',
    shortDescription: 'Houseboat stays, Mughal gardens, and snow-clad Gulmarg on a signature Kashmir journey.',
    highlights: [
      'Deluxe houseboat stay on Dal Lake',
      'Gulmarg gondola ride',
      'Mughal Gardens tour',
      'Shikara sunset ride'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar', description: 'Transfer to your houseboat on Dal Lake, evening Shikara ride.' },
      { day: 2, title: 'Srinagar Sightseeing', description: 'Visit Mughal Gardens, Shankaracharya Temple, and local markets.' },
      { day: 3, title: 'Gulmarg Excursion', description: 'Day trip to Gulmarg with an optional gondola ride to Apharwat Peak.' },
      { day: 4, title: 'Pahalgam Day Trip', description: 'Scenic drive to Pahalgam, Betaab Valley, and Aru Valley.' },
      { day: 5, title: 'Leisure & Local Experiences', description: 'Free day for shopping, houseboat relaxation, or optional activities.' },
      { day: 6, title: 'Departure', description: 'Transfer to the airport with unforgettable memories.' }
    ],
    inclusions: [
      '5 nights houseboat/hotel stay',
      'Daily breakfast & dinner',
      'Airport pickup & drop',
      'Gulmarg & Pahalgam sightseeing by private cab',
      'Shikara ride on Dal Lake'
    ],
    exclusions: [
      'Gondola/cable car tickets',
      'Lunch',
      'Personal expenses',
      'GST and applicable taxes'
    ],
    stayOptions: [
      { id: 'standard', label: 'Standard — Included', extraPrice: 0 },
      { id: 'deluxe', label: 'Deluxe', extraPrice: 2500 },
      { id: 'premium', label: 'Premium', extraPrice: 6000 },
      { id: 'luxury', label: 'Luxury', extraPrice: 11000 }
    ],
    addOns: [
      { id: 'private-cab', label: 'Private Cab', price: 3000 },
      { id: 'guided-sightseeing', label: 'Guided Sightseeing', price: 2000 },
      { id: 'adventure-activity', label: 'Adventure Activity', price: 1500 },
      { id: 'extra-night', label: 'Extra Night', price: 4500 }
    ],
    seasonalPricing: [
      { label: 'Peak Season', startDate: '2026-04-01', endDate: '2026-06-30', price: 29999 },
      { label: 'Festival Season', startDate: '2026-12-20', endDate: '2027-01-05', price: 34999 }
    ],
    transportOptions: [
      { id: 'shared-sumo', label: 'Shared Sumo — Included', extraPrice: 0 },
      { id: 'private-innova', label: 'Private Innova', extraPrice: 3500 },
      { id: 'premium-suv-guide', label: 'Premium SUV with Driver-Guide', extraPrice: 6500 }
    ],
    pace: [
      { id: 'relaxed', label: 'Relaxed', description: 'Fewer stops, more houseboat downtime.', priceMultiplier: 0.9 },
      { id: 'standard', label: 'Standard', description: 'The itinerary as designed.', priceMultiplier: 1 },
      { id: 'immersive', label: 'Immersive', description: 'Extra village stops and local interactions.', priceMultiplier: 1.2 }
    ],
    signatureMoments: [
      { title: 'Sunset Shikara on Dal Lake', description: 'Gliding past floating gardens as the light turns gold over the water.', time: 'Day 1, Evening' },
      { title: 'Mughal Gardens at golden hour', description: 'Terraced lawns and fountains catching the last sun of the day.', time: 'Day 2' },
      { title: 'Gulmarg gondola into the snowline', description: "Rising above the treeline toward Apharwat Peak's permanent snow.", time: 'Day 3' },
      { title: 'A quiet night on the houseboat', description: 'Dal Lake stilled to glass, the valley silent under the stars.', time: 'Day 5, Night' }
    ],
    apexPicks: {
      view: { title: 'Apharwat Peak from the gondola', description: 'The second stage of the Gulmarg cable car, opening onto snowfields year-round.' },
      stay: { title: 'Deluxe houseboat on Dal Lake', description: 'Walnut-carved interiors, floating just off the shikara ghats.' },
      experience: { title: 'Dawn Shikara through the floating gardens', description: 'The lake at its calmest, before the tourist boats begin.' },
      taste: { title: 'Wazwan feast in Srinagar', description: 'A multi-course Kashmiri feast, traditionally shared from one plate.' },
      moment: { title: 'Sunset over Nigeen Lake', description: 'A quieter neighbour to Dal Lake, glowing amber at dusk.' }
    },
    featured: true
  },
  {
    slug: 'spiti-valley-adventure',
    name: 'Spiti Circuit Expedition',
    destination: 'Spiti Valley, Himachal Pradesh',
    destinationSlugs: ['spiti-valley'],
    image: images.packages.spitiValleyAdventure,
    duration: '7 Days / 6 Nights',
    price: 18999,
    category: 'Offbeat',
    shortDescription: 'Cross high-altitude passes to ancient monasteries and lunar landscapes in remote Spiti.',
    highlights: [
      'Key Monastery & Kaza sightseeing',
      'Chandratal Lake camping (seasonal)',
      "Hikkim — world's highest post office",
      'Langza fossil village'
    ],
    itinerary: [
      { day: 1, title: 'Shimla to Kalpa', description: 'Scenic drive along the Sutlej river to Kalpa.' },
      { day: 2, title: 'Kalpa to Nako', description: 'Cross into the cold desert via Spillow, overnight in Nako.' },
      { day: 3, title: 'Nako to Kaza', description: "Drive through Tabo and its 1,000-year-old monastery to Kaza." },
      { day: 4, title: 'Kaza Local Sightseeing', description: 'Visit Key Monastery, Kibber, and Langza fossil village.' },
      { day: 5, title: 'Hikkim & Komic', description: "Visit the world's highest post office and Komic village." },
      { day: 6, title: 'Chandratal Lake', description: 'Day trip to the moon lake, weather and road conditions permitting.' },
      { day: 7, title: 'Kaza to Manali', description: 'Cross Kunzum Pass and return via Manali, tour concludes.' }
    ],
    inclusions: [
      '6 nights homestay/camp accommodation',
      'All meals (breakfast, lunch, dinner)',
      'Inner-line permits',
      'Oxygen support kit',
      'Private vehicle throughout'
    ],
    exclusions: [
      'Personal high-altitude gear',
      'Any meals not specified',
      'Personal expenses & tips',
      'GST and applicable taxes'
    ],
    stayOptions: [
      { id: 'standard', label: 'Standard — Included', extraPrice: 0 },
      { id: 'deluxe', label: 'Deluxe', extraPrice: 2000 },
      { id: 'premium', label: 'Premium', extraPrice: 4500 },
      { id: 'luxury', label: 'Luxury', extraPrice: 8000 }
    ],
    addOns: [
      { id: 'private-cab', label: 'Private Cab', price: 3000 },
      { id: 'guided-sightseeing', label: 'Guided Sightseeing', price: 2000 },
      { id: 'adventure-activity', label: 'Adventure Activity', price: 1500 },
      { id: 'extra-night', label: 'Extra Night', price: 4000 }
    ],
    seasonalPricing: [{ label: 'Peak Season', startDate: '2026-06-01', endDate: '2026-08-31', price: 22999 }],
    transportOptions: [
      { id: 'shared-tempo-traveller', label: 'Shared Tempo Traveller — Included', extraPrice: 0 },
      { id: 'private-suv', label: 'Private SUV', extraPrice: 4000 },
      { id: 'premium-innova-crysta', label: 'Premium Innova Crysta', extraPrice: 7000 }
    ],
    pace: [
      { id: 'relaxed', label: 'Relaxed', description: 'Extra rest days for high-altitude acclimatization.', priceMultiplier: 0.9 },
      { id: 'standard', label: 'Standard', description: 'The itinerary as designed.', priceMultiplier: 1 },
      { id: 'immersive', label: 'Immersive', description: 'Extra village detours and longer stops at each monastery.', priceMultiplier: 1.15 }
    ],
    signatureMoments: [
      { title: "Tabo's thousand-year-old monastery", description: 'Mud-walled halls holding some of the oldest Buddhist murals in the Himalayas.', time: 'Day 3' },
      { title: 'Sunrise at Key Monastery', description: 'The valley wakes up below one of the Himalaya’s oldest monasteries.', time: 'Day 4, Dawn' },
      { title: "Hikkim's highest post office", description: "Sending a postcard from the world's highest functioning post office.", time: 'Day 5' },
      { title: 'The Milky Way over Chandratal', description: 'Some of the darkest, clearest skies in India, above the moon lake.', time: 'Day 6, Night' }
    ],
    apexPicks: {
      view: { title: 'Chandratal at dusk', description: 'The moon lake under a sky that shifts from gold to indigo.' },
      stay: { title: 'Langza fossil-village homestay', description: 'A family home beneath the giant Buddha, overlooking the fossil beds.' },
      experience: { title: 'Sunrise at Key Monastery', description: 'The valley wakes up below one of the Himalaya’s oldest monasteries.' },
      taste: { title: 'Thukpa and butter tea in Kaza', description: 'A warm bowl in the valley’s high-altitude hub.' },
      moment: { title: 'The Milky Way over Hikkim', description: 'Some of the darkest, clearest skies in India, above the world’s highest post office.' }
    },
    featured: true
  },
  {
    slug: 'himachal-himalayan-explorer',
    name: 'Honeymoon in Hills',
    destination: 'Shimla, Manali & Manikaran, Himachal Pradesh',
    destinationSlugs: ['shimla', 'manali'],
    image: images.packages.himachalHimalayanExplorer,
    duration: '8 Days / 7 Nights',
    price: 22999,
    category: 'Honeymoon',
    shortDescription: 'A romantic Himachal road trip through colonial Shimla, snowy Manali, and serene Manikaran, built for two.',
    highlights: [
      'Candlelight dinner on Shimla’s Mall Road',
      'Private cable car ride in Solang Valley',
      'Couple’s stay upgrade at scenic viewpoints',
      'Manikaran hot springs & riverside walks'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Shimla', description: 'Check in and explore Mall Road & The Ridge.' },
      { day: 2, title: 'Shimla to Kufri', description: 'Day trip to Kufri for snow activities (seasonal) and horse riding.' },
      { day: 3, title: 'Shimla to Manali', description: 'Scenic drive through the Kullu Valley to Manali.' },
      { day: 4, title: 'Solang Valley', description: 'Adventure sports and cable car rides in Solang Valley.' },
      { day: 5, title: 'Manali to Manikaran', description: 'Drive to Manikaran via the Parvati Valley, visit the hot springs.' },
      { day: 6, title: 'Kasol & Parvati Valley', description: "Day trip to Kasol's riverside cafes and Tosh village." },
      { day: 7, title: 'Manikaran to Manali', description: 'Return drive with free time for shopping in Old Manali.' },
      { day: 8, title: 'Departure', description: 'Check out and depart from Manali.' }
    ],
    inclusions: [
      '7 nights hotel accommodation',
      'Daily breakfast',
      'Inter-city private transfers',
      'All sightseeing as per itinerary',
      'Dedicated trip coordinator'
    ],
    exclusions: [
      'Lunch and dinner',
      'Adventure activity charges',
      'Personal expenses & tips',
      'GST and applicable taxes'
    ],
    stayOptions: [
      { id: 'standard', label: 'Standard — Included', extraPrice: 0 },
      { id: 'deluxe', label: 'Deluxe', extraPrice: 2500 },
      { id: 'premium', label: 'Premium', extraPrice: 5500 },
      { id: 'luxury', label: 'Luxury', extraPrice: 10000 }
    ],
    addOns: [
      { id: 'private-cab', label: 'Private Cab', price: 3000 },
      { id: 'guided-sightseeing', label: 'Guided Sightseeing', price: 2000 },
      { id: 'adventure-activity', label: 'Adventure Activity', price: 1500 },
      { id: 'extra-night', label: 'Extra Night', price: 4000 }
    ],
    seasonalPricing: [
      { label: 'Peak Season', startDate: '2026-05-01', endDate: '2026-06-30', price: 27999 },
      { label: 'Festival Season', startDate: '2026-12-15', endDate: '2027-01-05', price: 32999 }
    ],
    transportOptions: [
      { id: 'shared-sedan', label: 'Shared Sedan — Included', extraPrice: 0 },
      { id: 'private-suv', label: 'Private SUV', extraPrice: 4000 },
      { id: 'luxury-sedan-couple', label: 'Luxury Sedan with Couple Amenities', extraPrice: 7000 }
    ],
    pace: [
      { id: 'relaxed', label: 'Relaxed', description: 'More leisure time at each stop, fewer early starts.', priceMultiplier: 0.85 },
      { id: 'standard', label: 'Standard', description: 'The itinerary as designed.', priceMultiplier: 1 },
      { id: 'adventurous', label: 'Adventurous', description: 'Extra activities layered into each day.', priceMultiplier: 1.1 }
    ],
    signatureMoments: [
      { title: 'Candlelight dinner on Mall Road', description: 'A private table overlooking the lit-up Ridge as evening settles over Shimla.', time: 'Day 1, Evening' },
      { title: 'Private cable car over Solang Valley', description: 'A quiet ride above the valley, away from the day-trip crowds.', time: 'Day 4' },
      { title: 'Sunset at the Manikaran hot springs', description: 'Steam rising off the river as the light fades over the Parvati Valley.', time: 'Day 5, Evening' },
      { title: 'An evening in Kasol', description: 'Riverside cafes and fairy lights along the Parvati, just the two of you.', time: 'Day 6, Evening' }
    ],
    apexPicks: {
      view: { title: 'Sunset over the Ridge', description: 'The open viewpoint at the heart of Shimla, glowing as evening falls.' },
      stay: { title: 'Couple’s cottage above Solang', description: 'A private balcony facing the snowline, away from the main resort strip.' },
      experience: { title: 'Manikaran riverside hot springs', description: 'Natural thermal springs beside the Parvati, a quiet ritual for two.' },
      taste: { title: 'Trout dinner by the Beas', description: 'Freshly caught river trout, grilled riverside near Old Manali.' },
      moment: { title: 'Fairy-lit evening in Kasol', description: 'The Parvati Valley’s backpacker town at its most romantic after dark.' }
    },
    featured: true
  },
  {
    slug: 'dharamshala-dalhousie-escape',
    name: 'Himachal Family Escape',
    destination: 'Dharamshala & Dalhousie, Himachal Pradesh',
    destinationSlugs: ['dharamshala', 'dalhousie'],
    image: images.packages.dharamshalaDalhousieEscape,
    duration: '5 Days / 4 Nights',
    price: 15999,
    category: 'Family',
    shortDescription: 'Pine forests, Tibetan culture, and colonial hill towns on a relaxed family-friendly escape.',
    highlights: [
      'McLeod Ganj & Dalai Lama Temple',
      'Dalhousie colonial walk',
      'Khajjiar — Mini Switzerland',
      'Bhagsu Waterfall'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Dharamshala', description: 'Check in, evening at leisure in McLeod Ganj.' },
      { day: 2, title: 'Dharamshala Sightseeing', description: 'Visit the Dalai Lama Temple, Bhagsu Waterfall, and Namgyal Monastery.' },
      { day: 3, title: 'Dharamshala to Dalhousie', description: 'Scenic drive to Dalhousie, evening walk on Mall Road.' },
      { day: 4, title: 'Khajjiar Day Trip', description: "Visit Khajjiar's meadows and Chamera Lake." },
      { day: 5, title: 'Departure', description: 'Check out and depart with a final round of souvenir shopping.' }
    ],
    inclusions: [
      '4 nights hotel accommodation',
      'Daily breakfast',
      'Private transfers throughout',
      'All sightseeing as per itinerary',
      'Dedicated trip coordinator'
    ],
    exclusions: [
      'Lunch and dinner',
      'Monastery/temple donations',
      'Personal expenses & tips',
      'GST and applicable taxes'
    ],
    stayOptions: [
      { id: 'standard', label: 'Standard — Included', extraPrice: 0 },
      { id: 'deluxe', label: 'Deluxe', extraPrice: 2000 },
      { id: 'premium', label: 'Premium', extraPrice: 4500 },
      { id: 'luxury', label: 'Luxury', extraPrice: 8000 }
    ],
    addOns: [
      { id: 'private-cab', label: 'Private Cab', price: 3000 },
      { id: 'guided-sightseeing', label: 'Guided Sightseeing', price: 2000 },
      { id: 'adventure-activity', label: 'Adventure Activity', price: 1500 },
      { id: 'extra-night', label: 'Extra Night', price: 3500 }
    ],
    seasonalPricing: [
      { label: 'Peak Season', startDate: '2026-05-01', endDate: '2026-06-30', price: 19999 },
      { label: 'Festival Season', startDate: '2026-12-15', endDate: '2027-01-05', price: 22999 }
    ],
    featured: true
  },
  {
    slug: 'sikkim-mountain-escape',
    name: 'Uttarakhand Explorer',
    destination: 'Rishikesh, Haridwar & Mussoorie, Uttarakhand',
    destinationSlugs: ['rishikesh', 'haridwar'],
    image: images.packages.sikkimMountainEscape,
    duration: '6 Days / 5 Nights',
    price: 20999,
    category: 'Spiritual',
    shortDescription: 'Ganga aartis, Himalayan foothill views, and white-water rafting across Uttarakhand’s holiest towns.',
    highlights: [
      'Ganga Aarti at Har Ki Pauri, Haridwar',
      'White-water rafting in Rishikesh',
      'Mussoorie hill-station views',
      'Ashram yoga & meditation session'
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Haridwar', description: 'Transfer in, evening Ganga Aarti at Har Ki Pauri.' },
      { day: 2, title: 'Haridwar Local Sightseeing', description: 'Visit Mansa Devi Temple, Chandi Devi Temple, and local markets.' },
      { day: 3, title: 'Haridwar to Rishikesh', description: 'Short drive to Rishikesh, evening at Laxman Jhula and Ram Jhula.' },
      { day: 4, title: 'Rishikesh Adventure Day', description: 'Morning white-water rafting on the Ganges, afternoon ashram visit.' },
      { day: 5, title: 'Mussoorie Day Trip', description: 'Scenic drive up to Mussoorie for Kempty Falls and Mall Road views.' },
      { day: 6, title: 'Departure', description: 'Transfer back to Dehradun/Haridwar for onward journey.' }
    ],
    inclusions: [
      '5 nights hotel accommodation',
      'Daily breakfast & dinner',
      'Rafting permits and safety gear',
      'Private vehicle throughout',
      'Dedicated trip coordinator'
    ],
    exclusions: [
      'Lunch',
      'Optional adventure activities beyond rafting',
      'Personal expenses & tips',
      'GST and applicable taxes'
    ],
    stayOptions: [
      { id: 'standard', label: 'Standard — Included', extraPrice: 0 },
      { id: 'deluxe', label: 'Deluxe', extraPrice: 2200 },
      { id: 'premium', label: 'Premium', extraPrice: 5000 },
      { id: 'luxury', label: 'Luxury', extraPrice: 9000 }
    ],
    addOns: [
      { id: 'private-cab', label: 'Private Cab', price: 3000 },
      { id: 'guided-sightseeing', label: 'Guided Sightseeing', price: 2000 },
      { id: 'adventure-activity', label: 'Adventure Activity', price: 1500 },
      { id: 'extra-night', label: 'Extra Night', price: 4000 }
    ],
    seasonalPricing: [
      { label: 'Peak Season', startDate: '2026-03-15', endDate: '2026-05-31', price: 24999 },
      { label: 'Festival Season', startDate: '2026-10-01', endDate: '2026-10-31', price: 27999 }
    ],
    featured: true
  }
];
