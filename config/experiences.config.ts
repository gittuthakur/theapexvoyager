import {
  Camera,
  Compass,
  Heart,
  Landmark,
  Leaf,
  Sparkles,
  UtensilsCrossed,
  Users,
  type LucideIcon
} from 'lucide-react';
import { images } from './images.config';
import type {
  Experience,
  ExperienceBestFor,
  ExperienceDifficulty,
  ExperienceDurationBand,
  ExperienceMood,
  ExperienceRegion,
  ExperienceSeason,
  ExperienceType
} from '@/types/experience';

/** The 8 canonical activity types — fixed display order for every "Experience Type" control site-wide. */
export const experienceTypes: ExperienceType[] = ['Adventure', 'Culture', 'Food', 'Nature', 'Wellness', 'Romance', 'Family', 'Offbeat'];

export const bestForOptions: ExperienceBestFor[] = ['Couples', 'Families', 'Friends & Groups', 'Solo Travellers'];

export const seasonOptions: ExperienceSeason[] = ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter'];

export const difficultyOptions: ExperienceDifficulty[] = ['Easy', 'Moderate', 'Challenging'];

export interface DurationBandMeta {
  id: ExperienceDurationBand;
  label: string;
}

export const durationBands: DurationBandMeta[] = [
  { id: 'under-3-hours', label: 'Under 3 Hours' },
  { id: 'half-day', label: 'Half Day' },
  { id: 'full-day', label: 'Full Day' },
  { id: 'multi-day', label: 'Multi Day' }
];

export interface BudgetBandMeta {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const budgetBands: BudgetBandMeta[] = [
  { id: 'under-1000', label: 'Under ₹1,000', min: 0, max: 999 },
  { id: '1000-2500', label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { id: '2500-5000', label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { id: '5000-plus', label: '₹5,000+', min: 5000, max: Infinity }
];

export interface ExperienceMoodMeta {
  id: ExperienceMood;
  title: string;
  tagline: string;
  image: string;
  /** Which canonical categories this tile filters the listing to when clicked. */
  categories: ExperienceType[];
}

/** The 7 editorial "mood" tiles — a curated grouping layered on top of `category`, not a copy of it (see types/experience.ts). */
export const experienceMoods: ExperienceMoodMeta[] = [
  { id: 'adventure', title: 'Adventure', tagline: 'Trek higher. Raft harder. Explore further.', image: images.tours.spitiCircuit, categories: ['Adventure'] },
  {
    id: 'romantic-escapes',
    title: 'Romantic Escapes',
    tagline: 'Private moments in the mountains.',
    image: images.packages.himachalHimalayanExplorer,
    categories: ['Romance']
  },
  { id: 'family', title: 'Family', tagline: 'Mountain experiences everyone can enjoy.', image: images.destinations.kinnaur, categories: ['Family'] },
  {
    id: 'slow-soulful',
    title: 'Slow & Soulful',
    tagline: 'Less rushing. More living.',
    image: images.experiences.mountainDusk,
    categories: ['Wellness']
  },
  {
    id: 'local-life',
    title: 'Local Life',
    tagline: 'Meet the people and traditions behind the destination.',
    image: images.tours.dharamshalaRetreat,
    categories: ['Culture']
  },
  {
    id: 'taste-himalayas',
    title: 'Taste the Himalayas',
    tagline: 'Discover the flavours of the mountains.',
    image: images.destinations.manali,
    categories: ['Food']
  },
  {
    id: 'wild-offbeat',
    title: 'Wild & Offbeat',
    tagline: 'Go beyond the usual Himalayan trail.',
    image: images.experiences.kinnaurTrek,
    categories: ['Offbeat', 'Nature']
  }
];

export interface ExperienceRegionMeta {
  id: string;
  name: ExperienceRegion;
  tagline: string;
  image: string;
}

/** Experience-specific region copy for the "Explore Experiences by Region" panels — ids match config/regions.config.ts for site-wide consistency, but the tagline/image here are tuned for this vertical rather than shared with the generic Destinations pages. */
export const experienceRegions: ExperienceRegionMeta[] = [
  {
    id: 'himachal-pradesh',
    name: 'Himachal Pradesh',
    tagline: 'From high-altitude deserts and apple orchards to riverside villages and mountain culture.',
    image: images.destinations.spitiValley
  },
  {
    id: 'jammu-kashmir',
    name: 'Jammu & Kashmir',
    tagline: 'Lakes, meadows, mountains and experiences rooted in Kashmiri life.',
    image: images.experiences.mountainDusk
  },
  {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    tagline: 'Sacred trails, Himalayan villages, forests and slow mountain escapes.',
    image: images.experiences.himalayanVista
  }
];

export interface ExperienceCategoryMeta {
  label: ExperienceType;
  icon: LucideIcon;
}

/** Icon per canonical category — used by the listing's filter panel and any category chip. */
export const experienceCategoryIcons: ExperienceCategoryMeta[] = [
  { label: 'Adventure', icon: Compass },
  { label: 'Culture', icon: Landmark },
  { label: 'Food', icon: UtensilsCrossed },
  { label: 'Nature', icon: Leaf },
  { label: 'Wellness', icon: Sparkles },
  { label: 'Romance', icon: Heart },
  { label: 'Family', icon: Users },
  { label: 'Offbeat', icon: Camera }
];

/**
 * Demo catalog for the /experiences marketplace — 23 static, illustrative bookable
 * activities (not multi-day Journeys/Tour Packages — see types/experience.ts).
 * Prices are illustrative "from" figures for this demo, not live/externally-sourced
 * rates. Every experience links to a real town in Himachal Pradesh, Jammu & Kashmir
 * or Uttarakhand; none of this data represents a live, bookable inventory system.
 */
export const experiences: Experience[] = [
  {
    id: 'exp-001',
    slug: 'spiti-valley-village-homestay',
    title: 'Spiti Valley Village Homestay',
    location: 'Kaza, Spiti Valley, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Culture',
    subCategory: 'Village Homestay',
    mood: 'local-life',
    shortDescription: 'Live like a local, share a meal and discover the slower side of Spiti.',
    description:
      'Spend two nights in a traditional mud-and-stone Spitian home, sharing meals cooked over a wood stove and mornings spent helping with everyday village chores. Your host family walks you through Kaza\'s quiet lanes and introduces you to neighbours who\'ve lived in this cold desert for generations — no itinerary, just village time.',
    image: images.experiences.spitiHomestay,
    gallery: [images.experiences.spitiHomestay, images.tours.spitiCircuit],
    duration: '2 Days',
    durationBand: 'multi-day',
    groupSize: 'Small Group (up to 6)',
    groupSizeMax: 6,
    difficulty: 'Easy',
    price: 2499,
    currency: 'INR',
    bestFor: ['Solo Travellers', 'Friends & Groups'],
    seasons: ['Summer', 'Autumn'],
    highlights: [
      'Two nights in a real Spitian family home',
      'Home-cooked meals, including local thukpa and butter tea',
      'A guided walk through Kaza\'s old town',
      'Time with a host family, not a script'
    ],
    whatYoullExperience: [
      'Arrival and a welcome cup of butter tea with your host family',
      'A walking introduction to the village and its 500-year-old monastery',
      'Hands-on time in the kitchen for at least one home-cooked meal',
      'A quiet, unstructured evening under one of India\'s clearest night skies'
    ],
    inclusions: ['2 nights\' homestay accommodation', 'All meals with the host family', 'Village walking introduction', 'Bedding and hot water on request'],
    exclusions: ['Transport to/from Kaza', 'Personal expenses', 'Travel insurance'],
    meetingPoint: 'Kaza main bus stand — your host or a local coordinator will meet you on arrival.',
    whatToBring: ['Warm layers (nights are cold even in summer)', 'A torch/headlamp', 'Cash (cards rarely work in Spiti)'],
    importantInfo: ['Spiti sits above 3,600m — allow a day to acclimatise before strenuous activity.', 'Network connectivity is limited to BSNL in most of the valley.'],
    availability: 'Seasonal',
    verified: true,
    featured: true,
    badge: 'Best Seller'
  },
  {
    id: 'exp-002',
    slug: 'himachali-cooking-experience-manali',
    title: 'Himachali Cooking Experience with a Local Family',
    location: 'Manali, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Food',
    subCategory: 'Cooking Class',
    mood: 'taste-himalayas',
    shortDescription: 'Cook a full Himachali dham-style spread hands-on, from market run to shared meal.',
    description:
      'Join a Himachali household for a hands-on afternoon of mountain cooking. Start with a short walk to the local market for seasonal ingredients, then learn to prepare siddu, dham and regional curries in a home kitchen before sitting down to share the meal you cooked, family-style.',
    image: images.destinations.manali,
    gallery: [images.destinations.manali, images.experiences.hillCottage],
    duration: '3 Hours',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 8)',
    groupSizeMax: 8,
    price: 1299,
    currency: 'INR',
    bestFor: ['Couples', 'Friends & Groups'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    highlights: ['Hands-on siddu & dham preparation', 'A short market walk for local ingredients', 'A recipe card to take home', 'A shared family-style meal'],
    whatYoullExperience: [
      'A walk to the local market to pick seasonal vegetables and spices',
      'Step-by-step cooking of at least 3 Himachali dishes',
      'A sit-down meal with your host family',
      'Tips on spices and techniques specific to mountain cooking'
    ],
    inclusions: ['All ingredients', 'Cooking session with a local host', 'The meal you prepare', 'A printed recipe card'],
    exclusions: ['Hotel pickup/drop', 'Alcoholic beverages'],
    meetingPoint: 'Old Manali village square — exact address shared after booking.',
    whatToBring: ['Comfortable clothing you don\'t mind getting a little floury', 'An appetite'],
    availability: 'Available',
    verified: true
  },
  {
    id: 'exp-003',
    slug: 'parvati-valley-river-rafting-kasol',
    title: 'Parvati Valley River Rafting',
    location: 'Kasol, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Adventure',
    subCategory: 'White-water Rafting',
    mood: 'adventure',
    shortDescription: 'Run the Parvati\'s rapids with certified river guides and full safety gear.',
    description:
      'A guided white-water rafting run down a graded stretch of the Parvati River, briefed and led by certified river guides. Life jackets, helmets and paddling instruction are all covered before you push off — a short, high-energy way to feel the valley\'s glacial water up close.',
    image: images.tours.kasolBackpacking,
    gallery: [images.tours.kasolBackpacking, images.destinations.kasol],
    duration: '2 Hours',
    durationBand: 'under-3-hours',
    groupSize: 'Group Rafting (up to 8 per raft)',
    groupSizeMax: 8,
    difficulty: 'Moderate',
    price: 1799,
    currency: 'INR',
    bestFor: ['Friends & Groups', 'Solo Travellers'],
    seasons: ['Summer', 'Autumn'],
    highlights: ['Certified river guides on every raft', 'Full safety briefing and gear', 'A graded, beginner-friendly rafting stretch', 'Action photos included on most runs'],
    whatYoullExperience: [
      'A safety briefing and paddling demo on the riverbank',
      'A guided rafting run down a graded section of the Parvati',
      'At least one calm-water stretch to relax and take in the valley',
      'A dry-off and debrief back at the put-in point'
    ],
    inclusions: ['Life jacket, helmet and paddle', 'Certified rafting guide', 'Safety briefing', 'Basic first-aid support on-site'],
    exclusions: ['Transport to the rafting point', 'Change of clothes/towel', 'Action photo/video packages (paid add-on)'],
    meetingPoint: 'Kasol-Barshaini road rafting point — shared exactly after booking.',
    whatToBring: ['A change of clothes', 'Quick-dry shoes or sandals with a back strap', 'A waterproof bag for valuables'],
    importantInfo: ['Not recommended for non-swimmers or travellers with heart/back conditions.', 'Rafting is weather- and water-level dependent and may be rescheduled for safety.'],
    availability: 'Seasonal',
    verified: true,
    badge: 'Popular'
  },
  {
    id: 'exp-004',
    slug: 'kinnaur-apple-orchard-experience',
    title: 'Apple Orchard Experience in Kinnaur',
    location: 'Kinnaur, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Nature',
    subCategory: 'Orchard Visit',
    mood: 'local-life',
    shortDescription: 'Pick apples in a family-run orchard and learn how the harvest reaches the market.',
    description:
      'Spend a half day in a Kinnauri family\'s apple orchard during harvest season — picking, sorting and crating fruit the way local growers have for generations, followed by a simple Kinnauri lunch cooked by the host family.',
    image: images.destinations.kinnaur,
    gallery: [images.destinations.kinnaur, images.experiences.kinnaurTrek],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 8)',
    groupSizeMax: 8,
    difficulty: 'Easy',
    price: 1099,
    currency: 'INR',
    bestFor: ['Families'],
    seasons: ['Autumn'],
    highlights: ['Orchard fruit-picking during harvest season', 'A traditional Kinnauri lunch with the host family', 'Kid-friendly farm activities', 'A local apple-crate craft demo'],
    whatYoullExperience: [
      'A welcome and short orchard walk with your host',
      'Hands-on apple picking and sorting',
      'A demo of how the crop is crated for market',
      'A home-cooked Kinnauri lunch'
    ],
    inclusions: ['Orchard access and guided picking', 'Lunch with the host family', 'As many apples as you can eat on-site'],
    exclusions: ['Apples to carry home (available for purchase separately)', 'Transport to the orchard'],
    meetingPoint: 'Reckong Peo main market — pickup point confirmed after booking.',
    whatToBring: ['Comfortable walking shoes', 'A hat for sun'],
    importantInfo: ['This experience only runs during the September–November apple harvest.'],
    availability: 'Seasonal',
    verified: true
  },
  {
    id: 'exp-005',
    slug: 'tirthan-valley-riverside-camping',
    title: 'Tirthan Valley Riverside Camping',
    location: 'Tirthan Valley, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Nature',
    subCategory: 'Riverside Camping',
    mood: 'wild-offbeat',
    shortDescription: 'Fall asleep to the sound of the Tirthan and wake up beside the river.',
    description:
      'An overnight riverside camp on the banks of the Tirthan, well outside the more crowded Manali circuit. Days are spent fishing, walking forest trails and sitting by the water; evenings mean a bonfire, a home-style dinner and a sky full of stars.',
    image: images.experiences.riversideCamp,
    gallery: [images.experiences.riversideCamp, images.destinations.kasol],
    duration: '2 Days / 1 Night',
    durationBand: 'multi-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Moderate',
    price: 2999,
    currency: 'INR',
    bestFor: ['Friends & Groups', 'Couples'],
    seasons: ['Summer', 'Autumn'],
    highlights: ['A private riverside campsite', 'Bonfire evenings with a home-style dinner', 'Forest and riverbank walking trails', 'Away from the main Manali crowd'],
    whatYoullExperience: [
      'Tent set-up and orientation on arrival',
      'A guided riverside/forest walk',
      'A bonfire evening with dinner by the water',
      'A quiet morning by the river before departure'
    ],
    inclusions: ['Tent and sleeping bag', 'Dinner, breakfast and evening tea', 'Bonfire setup', 'A local camp caretaker on-site'],
    exclusions: ['Transport to the campsite', 'Fishing gear rental', 'Alcoholic beverages'],
    meetingPoint: 'Gushaini village — final campsite directions shared after booking.',
    whatToBring: ['Warm layers for the night', 'A torch/headlamp', 'Insect repellent'],
    availability: 'Seasonal',
    verified: true
  },
  {
    id: 'exp-006',
    slug: 'himachali-craft-workshop-kullu',
    title: 'Traditional Himachali Craft Workshop',
    location: 'Kullu, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Culture',
    subCategory: 'Craft Workshop',
    mood: 'local-life',
    shortDescription: 'Learn the basics of Kullu shawl weaving from artisans who\'ve done it for decades.',
    description:
      'A short, hands-on introduction to traditional Kullu weaving at a family-run loom workshop. Watch artisans work a handloom, learn the basics of the pattern-setting process, and try a few rows yourself under their guidance.',
    image: images.experiences.heritageLane,
    gallery: [images.experiences.heritageLane, images.destinations.manali],
    duration: '2 Hours',
    durationBand: 'under-3-hours',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Easy',
    price: 899,
    currency: 'INR',
    bestFor: ['Families', 'Solo Travellers'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    highlights: ['A visit to a working family loom', 'Hands-on weaving under artisan guidance', 'The story behind Kullu\'s weaving tradition', 'Support for a local craft household'],
    whatYoullExperience: [
      'A short introduction to Kullu weaving history',
      'A close-up look at the handloom process',
      'Guided hands-on time at the loom',
      'An optional visit to the household\'s small shop'
    ],
    inclusions: ['Workshop session with an artisan guide', 'Materials for your hands-on piece'],
    exclusions: ['Finished shawls/textiles (available for purchase separately)', 'Transport'],
    meetingPoint: 'Near Kullu\'s Sultanpur area — exact address shared after booking.',
    whatToBring: ['Nothing specific — just curiosity'],
    availability: 'Available',
    verified: true
  },
  {
    id: 'exp-007',
    slug: 'jibhi-forest-village-walk',
    title: 'Jibhi Forest Village Walk',
    location: 'Jibhi, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Offbeat',
    subCategory: 'Village Walk',
    mood: 'wild-offbeat',
    shortDescription: 'A quiet walk through pine forest and a wooden-house village most visitors skip.',
    description:
      'Jibhi remains one of the quieter valleys off the main Kullu-Manali road. This guided walk moves through deodar forest, past old wooden village homes and a small waterfall, led by a local who can point out what a passing visitor would otherwise miss.',
    image: images.experiences.hillCottage,
    gallery: [images.experiences.hillCottage, images.destinations.kinnaur],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 8)',
    groupSizeMax: 8,
    difficulty: 'Easy',
    price: 999,
    currency: 'INR',
    bestFor: ['Solo Travellers', 'Couples'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    highlights: ['A forest trail most tourists never find', 'A stop at Jibhi\'s small waterfall', 'A walk through a working wooden-house village', 'A local guide, not a fixed script'],
    whatYoullExperience: [
      'A gentle walk through deodar forest',
      'A stop at the Jibhi waterfall',
      'A walk through the village\'s older wooden homes',
      'Tea with a local family, where possible'
    ],
    inclusions: ['Local walking guide', 'Tea/refreshment stop'],
    exclusions: ['Transport to Jibhi', 'Meals'],
    meetingPoint: 'Jibhi bus stand.',
    whatToBring: ['Trekking or sturdy walking shoes', 'A light rain jacket in monsoon-adjacent months'],
    availability: 'Available',
    verified: true,
    badge: 'New'
  },
  {
    id: 'exp-008',
    slug: 'shimla-heritage-walking-experience',
    title: 'Shimla Heritage Walking Experience',
    location: 'Shimla, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Culture',
    subCategory: 'Heritage Walk',
    mood: 'local-life',
    shortDescription: 'A storyteller-led walk through Shimla\'s colonial architecture and toy-train history.',
    description:
      'A local heritage storyteller leads this walk through Shimla\'s colonial past, from The Ridge and Christ Church to viewpoints over the UNESCO-listed toy-train line, stopping at a few architectural landmarks most visitors walk straight past.',
    image: images.destinations.shimla,
    gallery: [images.destinations.shimla, images.experiences.heritageLane],
    duration: '2.5 Hours',
    durationBand: 'under-3-hours',
    groupSize: 'Small Group (up to 12)',
    groupSizeMax: 12,
    difficulty: 'Easy',
    price: 799,
    currency: 'INR',
    bestFor: ['Families', 'Friends & Groups'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    highlights: ['The Ridge & Christ Church history stop', 'A vintage toy-train viewpoint', 'A colonial-era architecture trail', 'A local heritage storyteller guide'],
    whatYoullExperience: [
      'A walk starting at The Ridge and Christ Church',
      'Stories of how Shimla became British India\'s summer capital',
      'A stop overlooking the toy-train line',
      'A wander through the Mall Road architecture'
    ],
    inclusions: ['Heritage guide', 'Entry to any included viewpoints'],
    exclusions: ['Meals', 'Toy-train ride itself (bookable separately)'],
    meetingPoint: 'Scandal Point, The Ridge, Shimla.',
    whatToBring: ['Comfortable shoes — Shimla is hilly and walk-heavy'],
    availability: 'Available',
    verified: true
  },
  {
    id: 'exp-009',
    slug: 'dal-lake-sunrise-shikara-srinagar',
    title: 'Dal Lake Sunrise Shikara Experience',
    location: 'Srinagar, Jammu & Kashmir',
    region: 'Jammu & Kashmir',
    category: 'Romance',
    subCategory: 'Shikara Ride',
    mood: 'romantic-escapes',
    shortDescription: 'Glide across a mist-covered Dal Lake at dawn on a private shikara.',
    description:
      'Start before the city wakes for a serene shikara ride across Dal Lake as the sun rises over the surrounding peaks. Drift past floating gardens, houseboats and quiet backwaters with a local boatman narrating the lake\'s history, a flask of Kashmiri kahwa keeping you warm on the water.',
    image: images.experiences.mountainDusk,
    gallery: [images.experiences.mountainDusk, images.experiences.himalayanVista],
    duration: '2 Hours',
    durationBand: 'under-3-hours',
    groupSize: 'Private, up to 4',
    groupSizeMax: 4,
    difficulty: 'Easy',
    price: 999,
    currency: 'INR',
    bestFor: ['Couples'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    highlights: ['A private shikara with a local boatman', 'Floating vegetable market views (seasonal)', 'A mist-covered Dal Lake sunrise', 'Complimentary Kashmiri kahwa onboard'],
    whatYoullExperience: [
      'A pre-dawn pickup at your houseboat/ghat',
      'A slow shikara glide across Dal Lake at first light',
      'A pass by the floating gardens and old houseboats',
      'Kahwa served on the water'
    ],
    inclusions: ['Private shikara and boatman', 'Kashmiri kahwa'],
    exclusions: ['Hotel/houseboat pickup beyond the lakefront', 'Photography add-ons'],
    meetingPoint: 'Ghat 6, Dal Lake, Srinagar (or your houseboat, if applicable).',
    whatToBring: ['A warm layer — mornings on the lake are cool even in summer'],
    availability: 'Available',
    verified: true,
    featured: true,
    badge: 'Best Seller'
  },
  {
    id: 'exp-010',
    slug: 'gulmarg-snow-experience',
    title: 'Gulmarg Snow Experience',
    location: 'Gulmarg, Jammu & Kashmir',
    region: 'Jammu & Kashmir',
    category: 'Adventure',
    subCategory: 'Gondola & Snow Play',
    mood: 'adventure',
    shortDescription: 'Ride the Gondola into snowfields most visitors only see from the base.',
    description:
      'A half day built around the Gulmarg Gondola — one of the highest cable cars in the world — followed by supervised snow play, sledging and photo stops at altitude. A guide handles the logistics so you can focus on the view.',
    image: images.experiences.himalayanVista,
    gallery: [images.experiences.himalayanVista, images.experiences.mountainDusk],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Moderate',
    price: 2199,
    currency: 'INR',
    bestFor: ['Families', 'Friends & Groups'],
    seasons: ['Winter'],
    highlights: ['Gondola ride toward Kongdoori/Apharwat', 'Supervised snow play and sledging', 'Photo stops at altitude', 'A guide who handles tickets and logistics'],
    whatYoullExperience: [
      'Gondola boarding assistance and queue guidance',
      'Time at the upper station for snow play and views',
      'A sledging session (weather permitting)',
      'A warm-up stop in Gulmarg village before you head back'
    ],
    inclusions: ['Gondola tickets (Phase 1)', 'Local guide', 'Basic snow-play equipment'],
    exclusions: ['Skiing/snowboarding gear and lessons', 'Phase 2 gondola tickets', 'Meals'],
    meetingPoint: 'Gulmarg Gondola base station ticket counter.',
    whatToBring: ['Waterproof snow boots', 'Gloves and a warm jacket', 'Sunglasses (snow glare is intense)'],
    importantInfo: ['Gondola operations can pause in high wind or heavy snowfall — the guide will suggest the best available alternative.'],
    availability: 'Seasonal',
    verified: true,
    badge: 'Popular'
  },
  {
    id: 'exp-011',
    slug: 'pahalgam-meadow-pony-trek',
    title: 'Pahalgam Meadow Pony Trek',
    location: 'Pahalgam, Jammu & Kashmir',
    region: 'Jammu & Kashmir',
    category: 'Family',
    subCategory: 'Pony Trek',
    mood: 'family',
    shortDescription: 'An easy pony ride through Pahalgam\'s riverside meadows — built for first-timers.',
    description:
      'A gentle, guided pony trek along the Lidder River and into Pahalgam\'s open meadows — an easy way for families and first-time riders to take in the valley without a strenuous trek.',
    image: images.experiences.valleyGeneric,
    gallery: [images.experiences.valleyGeneric, images.experiences.himalayanVista],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Easy',
    price: 1499,
    currency: 'INR',
    bestFor: ['Families'],
    seasons: ['Summer', 'Autumn'],
    highlights: ['A gentle, guided pony trail', 'Riverside meadow views', 'Suitable for first-time riders and children', 'A local pony handler throughout'],
    whatYoullExperience: [
      'A safety briefing and pony assignment',
      'A guided ride along the Lidder riverside trail',
      'A stop in the open meadows for photos',
      'A slow return ride to the starting point'
    ],
    inclusions: ['Pony and handler', 'Helmet where required'],
    exclusions: ['Transport to Pahalgam', 'Meals'],
    meetingPoint: 'Pahalgam pony stand, near the bus terminus.',
    whatToBring: ['Closed-toe shoes', 'A hat/cap for sun'],
    availability: 'Available',
    verified: true
  },
  {
    id: 'exp-012',
    slug: 'sonamarg-glacier-valley-trek',
    title: 'Sonamarg Glacier Valley Trek',
    location: 'Sonamarg, Jammu & Kashmir',
    region: 'Jammu & Kashmir',
    category: 'Adventure',
    subCategory: 'Glacier Trek',
    mood: 'adventure',
    shortDescription: 'A full-day trek toward Thajiwas Glacier through pine forest and open valley.',
    description:
      'A full-day guided trek from Sonamarg toward the Thajiwas Glacier, climbing through pine forest before opening onto glacial moraine and views back down the Sindh Valley. A certified trekking guide leads throughout, with a packed lunch on the trail.',
    image: images.experiences.mountainDusk,
    gallery: [images.experiences.mountainDusk, images.experiences.himalayanVista],
    duration: 'Full Day',
    durationBand: 'full-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Challenging',
    price: 2999,
    currency: 'INR',
    bestFor: ['Friends & Groups', 'Solo Travellers'],
    seasons: ['Summer'],
    highlights: ['A trek to the edge of Thajiwas Glacier', 'Pine-forest and open-valley trail sections', 'A certified trekking guide', 'A packed trail lunch included'],
    whatYoullExperience: [
      'A trailhead briefing and gear check',
      'A forested climb toward the glacier edge',
      'Time at the glacier viewpoint for photos and rest',
      'A guided descent back to Sonamarg'
    ],
    inclusions: ['Certified trekking guide', 'Packed lunch', 'Basic first-aid support'],
    exclusions: ['Trekking poles/crampons rental', 'Transport to the trailhead'],
    meetingPoint: 'Sonamarg main market, near the pony/trek stand.',
    whatToBring: ['Sturdy trekking shoes', 'Layered clothing', 'A refillable water bottle'],
    importantInfo: ['This is a physically demanding trail — a reasonable fitness level is expected.'],
    availability: 'Seasonal',
    verified: true
  },
  {
    id: 'exp-013',
    slug: 'doodhpathri-meadow-picnic',
    title: 'Doodhpathri Meadow Picnic & Nature Walk',
    location: 'Doodhpathri, Jammu & Kashmir',
    region: 'Jammu & Kashmir',
    category: 'Wellness',
    subCategory: 'Meadow Picnic',
    mood: 'slow-soulful',
    shortDescription: 'A slow afternoon in one of Kashmir\'s quietest, least-visited meadows.',
    description:
      'Doodhpathri ("valley of milk") stays far quieter than Gulmarg or Pahalgam. This is an unhurried afternoon of a short nature walk followed by a riverside picnic laid out in the open meadow — built around doing very little, deliberately.',
    image: images.experiences.himalayanVista,
    gallery: [images.experiences.himalayanVista, images.experiences.valleyGeneric],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 8)',
    groupSizeMax: 8,
    difficulty: 'Easy',
    price: 1199,
    currency: 'INR',
    bestFor: ['Couples', 'Families'],
    seasons: ['Spring', 'Summer'],
    highlights: ['A quiet, lesser-visited Kashmiri meadow', 'A short guided nature walk', 'A riverside picnic spread', 'Minimal crowds compared to Gulmarg/Pahalgam'],
    whatYoullExperience: [
      'A short walk into the Doodhpathri meadow',
      'A picnic spread laid out by the stream',
      'Free time to simply sit with the view',
      'A relaxed walk back before sundown'
    ],
    inclusions: ['Picnic lunch spread', 'Local guide'],
    exclusions: ['Transport to Doodhpathri'],
    meetingPoint: 'Doodhpathri meadow entrance, near the parking area.',
    whatToBring: ['A light jacket — weather shifts quickly at altitude', 'A camera'],
    availability: 'Available',
    verified: true,
    badge: 'New'
  },
  {
    id: 'exp-014',
    slug: 'gurez-valley-offbeat-village-experience',
    title: 'Gurez Valley Offbeat Village Experience',
    location: 'Gurez Valley, Jammu & Kashmir',
    region: 'Jammu & Kashmir',
    category: 'Offbeat',
    subCategory: 'Village Homestay',
    mood: 'wild-offbeat',
    shortDescription: 'A rare multi-day stay in one of Kashmir\'s most remote, least-visited valleys.',
    description:
      'Gurez sits close to the Line of Control and only opened to regular tourism in recent years — this multi-day village stay is run through a newly onboarded local partner, so expect a genuinely offbeat, still-developing experience rather than a polished tourist trail.',
    image: images.experiences.kinnaurTrek,
    gallery: [images.experiences.kinnaurTrek, images.experiences.mountainDusk],
    duration: '2 Days / 1 Night',
    durationBand: 'multi-day',
    groupSize: 'Small Group (up to 6)',
    groupSizeMax: 6,
    difficulty: 'Moderate',
    price: 3499,
    currency: 'INR',
    bestFor: ['Solo Travellers', 'Friends & Groups'],
    seasons: ['Summer'],
    highlights: ['One of Kashmir\'s most remote inhabited valleys', 'A village homestay with a Dard-Shin family', 'Views of the Habba Khatoon peak', 'A genuinely offbeat itinerary'],
    whatYoullExperience: [
      'A scenic drive in via Bandipora',
      'A homestay with a local family in Dawar village',
      'A guided walk along the Kishanganga riverbank',
      'Local Dard-Shin food and conversation'
    ],
    inclusions: ['1 night homestay', 'Meals with the host family', 'Local village walk'],
    exclusions: ['Permits and travel documentation (advised separately)', 'Transport to Gurez'],
    meetingPoint: 'Bandipora — exact pickup shared after booking and permit confirmation.',
    whatToBring: ['Valid ID for permit checks', 'Warm layers', 'Cash — limited banking access in the valley'],
    importantInfo: ['This route requires an Inner Line Permit for non-locals; our team assists with the process after booking.', 'This experience is run by a newly onboarded local partner and is still being reviewed for consistency — availability is on request.'],
    availability: 'On Request',
    verified: false
  },
  {
    id: 'exp-015',
    slug: 'ganga-aarti-spiritual-evening-rishikesh',
    title: 'Ganga Aarti Spiritual Evening',
    location: 'Rishikesh, Uttarakhand',
    region: 'Uttarakhand',
    category: 'Wellness',
    subCategory: 'Aarti Ceremony',
    mood: 'slow-soulful',
    shortDescription: 'A guided meditation and riverside diya offering ahead of the evening Ganga Aarti.',
    description:
      'As dusk settles over Rishikesh, join a short guided meditation on the riverbank before the ghats fill with lamps, chanting and the rhythmic Ganga Aarti ceremony. Offer a diya on the river, take in the ceremony from a reserved viewing spot, and finish with a brief walk through a nearby ashram.',
    image: images.experiences.valleyGeneric,
    gallery: [images.experiences.valleyGeneric, images.experiences.himalayanVista],
    duration: '2 Hours',
    durationBand: 'under-3-hours',
    groupSize: 'Small Group (up to 15)',
    groupSizeMax: 15,
    difficulty: 'Easy',
    price: 499,
    currency: 'INR',
    bestFor: ['Solo Travellers', 'Couples', 'Families'],
    seasons: ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter'],
    highlights: ['A riverside aarti at a Ganges ghat', 'A guided meditation before the ceremony', 'A diya offering on the Ganges', 'A short ashram walkthrough'],
    whatYoullExperience: [
      'A short guided riverside meditation before dusk',
      'A diya-offering ritual on the Ganges',
      'A reserved viewing spot for the Ganga Aarti',
      'A brief walk through a nearby ashram'
    ],
    inclusions: ['Guided meditation', 'Diya for the offering', 'Local host/guide'],
    exclusions: ['Transport to the ghat', 'Meals'],
    meetingPoint: 'Parmarth Niketan Ghat, Rishikesh.',
    whatToBring: ['Modest clothing (shoulders/knees covered)', 'A light shawl for the evening breeze'],
    availability: 'Available',
    verified: true,
    featured: true,
    badge: 'Popular'
  },
  {
    id: 'exp-016',
    slug: 'chopta-sunrise-trek-tungnath',
    title: 'Chopta Sunrise Trek to Tungnath',
    location: 'Chopta, Uttarakhand',
    region: 'Uttarakhand',
    category: 'Adventure',
    subCategory: 'Sunrise Trek',
    mood: 'adventure',
    shortDescription: 'A pre-dawn climb to the world\'s highest Shiva temple, timed for sunrise over the peaks.',
    description:
      'A guided pre-dawn trek from Chopta to Tungnath — the highest Shiva temple in the world — timed to reach the ridge as the sun rises over the Chaukhamba and Nanda Devi ranges. A steep but short climb, rewarded with one of Uttarakhand\'s best sunrise views.',
    image: images.experiences.himalayanVista,
    gallery: [images.experiences.himalayanVista, images.experiences.mountainDusk],
    duration: 'Full Day',
    durationBand: 'full-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Challenging',
    price: 1999,
    currency: 'INR',
    bestFor: ['Solo Travellers', 'Friends & Groups'],
    seasons: ['Summer', 'Autumn'],
    highlights: ['A pre-dawn climb timed for sunrise', 'Views of Chaukhamba and Nanda Devi', 'A visit to the Tungnath temple', 'An optional extension to Chandrashila summit'],
    whatYoullExperience: [
      'A pre-dawn start from Chopta with headlamps',
      'A steady climb to the Tungnath ridge',
      'Sunrise over the high Himalayan range',
      'A visit to the temple and a slower descent'
    ],
    inclusions: ['Certified trekking guide', 'Hot tea/breakfast at the top'],
    exclusions: ['Transport to Chopta', 'Trekking gear rental'],
    meetingPoint: 'Chopta trailhead, near the forest check-post.',
    whatToBring: ['Trekking shoes', 'A headlamp/torch', 'Warm layers for pre-dawn cold'],
    importantInfo: ['Departure is around 3:30–4:00 AM to reach the ridge in time for sunrise.'],
    availability: 'Seasonal',
    verified: true,
    badge: 'New'
  },
  {
    id: 'exp-017',
    slug: 'mukteshwar-stargazing-bonfire-night',
    title: 'Mukteshwar Stargazing & Bonfire Night',
    location: 'Mukteshwar, Uttarakhand',
    region: 'Uttarakhand',
    category: 'Wellness',
    subCategory: 'Stargazing & Bonfire',
    mood: 'slow-soulful',
    shortDescription: 'A guided stargazing session away from city lights, followed by a bonfire evening.',
    description:
      'Mukteshwar\'s low light pollution makes it one of the better places in the region to actually see the night sky. This evening pairs a guided stargazing session — telescope included — with a bonfire and warm drinks under the open air.',
    image: images.experiences.mountainDusk,
    gallery: [images.experiences.mountainDusk, images.experiences.valleyGeneric],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 12)',
    groupSizeMax: 12,
    difficulty: 'Easy',
    price: 1599,
    currency: 'INR',
    bestFor: ['Couples', 'Friends & Groups'],
    seasons: ['Summer', 'Autumn', 'Winter'],
    highlights: ['A guided stargazing session with telescope', 'Low light pollution, clear mountain skies', 'A bonfire with warm drinks', 'Small-group, unhurried pacing'],
    whatYoullExperience: [
      'A short orientation on what you\'ll be able to see that night',
      'Guided telescope viewing of visible constellations/planets',
      'A bonfire with tea/coffee',
      'Free time to simply sit under the sky'
    ],
    inclusions: ['Telescope and guide', 'Bonfire setup', 'Hot beverages'],
    exclusions: ['Transport to the viewing point', 'Dinner'],
    meetingPoint: 'Mukteshwar main viewpoint, near the Chauli Ki Jali road.',
    whatToBring: ['Warm layers — evenings get cold fast', 'A reclining mat or cushion if you have one'],
    importantInfo: ['Visibility depends on cloud cover and moon phase — the team will advise the best night during your stay.'],
    availability: 'Available',
    verified: true
  },
  {
    id: 'exp-018',
    slug: 'auli-winter-snow-experience',
    title: 'Auli Winter Snow Experience',
    location: 'Auli, Uttarakhand',
    region: 'Uttarakhand',
    category: 'Adventure',
    subCategory: 'Snow Experience',
    mood: 'adventure',
    shortDescription: 'Cable-car views of Nanda Devi followed by guided snow play on Auli\'s slopes.',
    description:
      'A half day combining the Auli ropeway — one of Asia\'s longest cable car rides — with supervised snow play on Auli\'s open slopes, framed by views of Nanda Devi. Ski/snowboard lessons can be added on for an extra cost.',
    image: images.experiences.himalayanVista,
    gallery: [images.experiences.himalayanVista, images.experiences.mountainDusk],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Moderate',
    price: 2499,
    currency: 'INR',
    bestFor: ['Families', 'Friends & Groups'],
    seasons: ['Winter'],
    highlights: ['A ropeway ride with Nanda Devi views', 'Supervised snow play on open slopes', 'Optional ski/snowboard lessons (extra cost)', 'A local guide throughout'],
    whatYoullExperience: [
      'A ropeway ride up to the Auli slopes',
      'Guided snow play and photo stops',
      'Time at the viewpoint for the Nanda Devi range',
      'A ropeway ride back down'
    ],
    inclusions: ['Ropeway tickets', 'Local guide', 'Basic snow-play equipment'],
    exclusions: ['Ski/snowboard rental and lessons', 'Meals'],
    meetingPoint: 'Auli Ropeway base station, Joshimath.',
    whatToBring: ['Waterproof boots and gloves', 'Sunglasses for snow glare'],
    availability: 'Seasonal',
    verified: true
  },
  {
    id: 'exp-019',
    slug: 'valley-of-flowers-guided-nature-walk',
    title: 'Valley of Flowers Guided Nature Walk',
    location: 'Valley of Flowers National Park, Uttarakhand',
    region: 'Uttarakhand',
    category: 'Nature',
    subCategory: 'Nature Trek',
    mood: 'wild-offbeat',
    shortDescription: 'A two-day guided walk through a UNESCO World Heritage alpine meadow in full monsoon bloom.',
    description:
      'A two-day guided trek into the Valley of Flowers National Park during its short monsoon bloom window, when the alpine meadow fills with hundreds of flowering species. A certified naturalist guide leads throughout, with an overnight stay in Ghangaria.',
    image: images.experiences.mountainDusk,
    gallery: [images.experiences.mountainDusk, images.experiences.himalayanVista],
    duration: '2 Days',
    durationBand: 'multi-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Challenging',
    price: 3999,
    currency: 'INR',
    bestFor: ['Solo Travellers', 'Friends & Groups'],
    seasons: ['Monsoon'],
    highlights: ['A UNESCO World Heritage alpine meadow', 'Peak monsoon wildflower bloom', 'A certified naturalist guide', 'An overnight stay in Ghangaria'],
    whatYoullExperience: [
      'A trek from Govindghat to Ghangaria on day one',
      'A full day inside the Valley of Flowers on day two',
      'Naturalist commentary on the park\'s flora',
      'A return trek to Govindghat'
    ],
    inclusions: ['National park entry fees', 'Naturalist guide', '1 night stay in Ghangaria'],
    exclusions: ['Transport to Govindghat', 'Porter/mule hire (available on request)'],
    meetingPoint: 'Govindghat trailhead.',
    whatToBring: ['Waterproof trekking shoes', 'A rain jacket', 'A valid photo ID for park entry'],
    importantInfo: ['The park is only open mid-June to early October, with peak bloom in July–August.'],
    availability: 'Seasonal',
    verified: true,
    featured: true,
    badge: 'Best Seller'
  },
  {
    id: 'exp-020',
    slug: 'nainital-lake-boating-food-walk',
    title: 'Nainital Lake Boating & Mall Road Food Walk',
    location: 'Nainital, Uttarakhand',
    region: 'Uttarakhand',
    category: 'Family',
    subCategory: 'Lake Boating & Food Walk',
    mood: 'family',
    shortDescription: 'A relaxed boat ride on Naini Lake followed by a Mall Road street-food trail.',
    description:
      'An easy-paced afternoon that pairs a rowboat ride on Naini Lake with a short, guided street-food walk along Mall Road — built for families who want a lighter, low-effort day between longer excursions.',
    image: images.experiences.valleyGeneric,
    gallery: [images.experiences.valleyGeneric, images.experiences.himalayanVista],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Easy',
    price: 899,
    currency: 'INR',
    bestFor: ['Families', 'Couples'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    highlights: ['A rowboat ride on Naini Lake', 'A guided Mall Road food trail', 'Easy pacing, ideal for kids and grandparents', 'A local host who knows the best stalls'],
    whatYoullExperience: [
      'A rowboat ride across Naini Lake',
      'A walk along Mall Road with lake views',
      'Tastings at 3–4 local food stops',
      'Free time to browse Mall Road shops'
    ],
    inclusions: ['Boat ride', 'Food tastings on the walk', 'Local host'],
    exclusions: ['Additional food/shopping purchases', 'Transport to Nainital'],
    meetingPoint: 'Naini Lake boat jetty, Mallital.',
    whatToBring: ['Comfortable walking shoes'],
    availability: 'Available',
    verified: true
  },
  {
    id: 'exp-021',
    slug: 'spiti-valley-stargazing-night',
    title: 'Spend a Night Under the Spiti Sky',
    location: 'Kaza, Spiti Valley, Himachal Pradesh',
    region: 'Himachal Pradesh',
    category: 'Offbeat',
    subCategory: 'Stargazing Night',
    mood: 'wild-offbeat',
    shortDescription: 'One of India\'s darkest skies, seen through a telescope from a cold-desert rooftop.',
    description:
      'Spiti\'s high altitude and near-zero light pollution make it one of the best stargazing locations in India. This evening pairs a guided telescope session on a village rooftop with hot local tea and a naturalist\'s commentary on what you\'re actually looking at.',
    image: images.experiences.spitiHomestay,
    gallery: [images.experiences.spitiHomestay, images.experiences.mountainDusk],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 10)',
    groupSizeMax: 10,
    difficulty: 'Easy',
    price: 1399,
    currency: 'INR',
    bestFor: ['Couples', 'Friends & Groups'],
    seasons: ['Summer', 'Autumn'],
    highlights: ['One of India\'s clearest, darkest night skies', 'A guided telescope session', 'Local tea and rooftop seating', 'A naturalist\'s commentary on the stars above Spiti'],
    whatYoullExperience: [
      'A rooftop setup as the sky darkens',
      'Guided telescope viewing of visible planets and constellations',
      'Local tea served through the session',
      'Free time to just lie back and watch the sky'
    ],
    inclusions: ['Telescope and guide', 'Hot local tea'],
    exclusions: ['Accommodation (bookable separately if not already staying in Kaza)'],
    meetingPoint: 'Your homestay/guesthouse in Kaza — guide arrives after dinner.',
    whatToBring: ['Warm layers — Spiti nights are cold even in summer'],
    importantInfo: ['Best enjoyed on a moonless or new-moon night — the team will suggest the best date during your stay.'],
    availability: 'Seasonal',
    verified: true,
    badge: 'New'
  },
  {
    id: 'exp-022',
    slug: 'mussoorie-candlelit-valley-dinner',
    title: 'Mussoorie Candlelit Valley Dinner',
    location: 'Mussoorie, Uttarakhand',
    region: 'Uttarakhand',
    category: 'Romance',
    subCategory: 'Candlelit Dinner',
    mood: 'romantic-escapes',
    shortDescription: 'A private candlelit setup with valley views, a bonfire and a chef-curated dinner for two.',
    description:
      'A private, candlelit picnic set up on a quiet viewpoint overlooking the valley, complete with a bonfire and a chef-curated dinner for two. A photographer can be added on request to take home a few keepsakes of the evening.',
    image: images.experiences.hillCottage,
    gallery: [images.experiences.hillCottage, images.experiences.valleyGeneric],
    duration: '3 Hours',
    durationBand: 'half-day',
    groupSize: 'Private, up to 2',
    groupSizeMax: 2,
    price: 2999,
    currency: 'INR',
    bestFor: ['Couples'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    highlights: ['A private candlelit setup with valley views', 'A bonfire and speaker setup on request', 'A chef-curated dinner for two', 'An optional photographer add-on'],
    whatYoullExperience: [
      'A private table set up at a quiet viewpoint',
      'A bonfire lit as the sun sets',
      'A multi-course dinner served course by course',
      'Uninterrupted time as a couple, with staff on standby only when needed'
    ],
    inclusions: ['Private setup and decor', 'Bonfire', 'Multi-course dinner for two'],
    exclusions: ['Photographer (available as a paid add-on)', 'Transport to the viewpoint'],
    meetingPoint: 'Confirmed privately after booking, based on the chosen viewpoint.',
    whatToBring: ['Warm clothing for the evening'],
    availability: 'On Request',
    verified: true
  },
  {
    id: 'exp-023',
    slug: 'kashmiri-wazwan-cooking-tasting-srinagar',
    title: 'Kashmiri Wazwan Cooking & Tasting Experience',
    location: 'Srinagar, Jammu & Kashmir',
    region: 'Jammu & Kashmir',
    category: 'Food',
    subCategory: 'Wazwan Tasting',
    mood: 'taste-himalayas',
    shortDescription: 'Learn the basics of a Wazwan feast and taste it course by course with a local family.',
    description:
      'Wazwan is Kashmir\'s traditional multi-course feast, usually reserved for weddings and celebrations. This experience brings a scaled-down version into a local home — a short cooking demonstration followed by a proper tasting of rogan josh, yakhni and other signature dishes.',
    image: images.experiences.mountainDusk,
    gallery: [images.experiences.mountainDusk, images.experiences.valleyGeneric],
    duration: 'Half Day',
    durationBand: 'half-day',
    groupSize: 'Small Group (up to 8)',
    groupSizeMax: 8,
    price: 1899,
    currency: 'INR',
    bestFor: ['Couples', 'Friends & Groups'],
    seasons: ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter'],
    highlights: ['A scaled-down Wazwan feast experience', 'A cooking demonstration with a local family', 'Multiple signature dishes to taste', 'The story behind Kashmir\'s feast culture'],
    whatYoullExperience: [
      'A short introduction to Wazwan tradition and etiquette',
      'A live cooking demonstration of 2–3 dishes',
      'A full tasting spread served family-style',
      'Conversation with your host family over the meal'
    ],
    inclusions: ['Cooking demonstration', 'Full tasting meal', 'Local host'],
    exclusions: ['Alcoholic beverages', 'Transport'],
    meetingPoint: 'Rajbagh area, Srinagar — exact address shared after booking.',
    whatToBring: ['An appetite — this is a substantial, multi-course meal'],
    availability: 'Available',
    verified: true,
    badge: 'Popular'
  }
];
