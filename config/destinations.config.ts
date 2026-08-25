import { images } from '@/config/images.config';
import type { Destination } from '@/types';

// The curated directory of named Himachal Pradesh destinations — powers the homepage
// grid, the /destinations search page, and slug lookups for /destinations/[slug].
// Distinct from lib/destinations.ts's Google Places aggregation, which returns
// individual tourist-attraction POIs rather than these top-level hill-station listings.
export const destinations: Destination[] = [
  {
    id: 'dest_manali',
    slug: 'manali',
    title: 'Manali',
    category: 'Most Popular',
    description: 'Snow peaks, river valleys, and adventure sports.',
    toursCount: 24,
    image: images.destinations.manali,
    region: 'Kullu Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Manali is where cedar forests, rushing rivers and snow-lined ridges meet an easygoing mountain rhythm. Come for the adrenaline, linger for Old Manali cafes, village walks and long views into the Pir Panjal.',
    bestTime: 'March – June, October – February',
    idealDuration: '4–6 Days',
    altitude: '2,050 m',
    travelStyles: ['Adventure', 'Nature', 'Road trips'],
    seasons: ['Summer', 'Winter'],
    bestFor: ['Friends & Groups', 'Solo Travelers', 'Couples'],
    highlights: [
      { title: 'Alpine adventure', description: 'From Solang Valley to high passes, every day can be as active as you want.' },
      { title: 'Old Manali rhythm', description: 'Slow mornings, riverside cafes and lanes made for wandering.' },
      { title: 'Gateway to the high Himalaya', description: 'A classic base for Lahaul, Spiti and Himalayan road journeys.' }
    ],
    places: [
      { title: 'Solang Valley', description: 'A wide alpine playground for snow and adventure sports.' },
      { title: 'Old Manali', description: 'Cafes, craft shops and forested riverside lanes.' },
      { title: 'Rohtang Pass', description: 'A dramatic seasonal crossing into Lahaul.' },
      { title: 'Sissu', description: 'Waterfalls and broad Himalayan valley views beyond the pass.' },
      { title: 'Vashisht', description: 'A hillside village known for hot springs and temple walks.' }
    ],
    experiences: ['Snow adventures', 'River rafting', 'Trekking', 'Café culture', 'Local sightseeing'],
    relatedSlugs: ['tirthan-valley', 'shimla', 'spiti-valley'],
    seo: { title: 'Manali Travel Guide & Experiences | The Apex Voyager', description: 'Discover Manali: alpine adventure, Old Manali culture, mountain stays and curated Himalayan journeys.' },
    isPopular: true,
    priority: 1,
    personality: 'ADVENTUROUS • SOCIAL • ACCESSIBLE',
    badge: 'MOST LOVED',
    popularityScore: 96,
    apexScore: 92,
    apexPicks: {
      view: { title: 'Rohtang snowline', description: 'The seasonal crossing into Lahaul, framed by the Pir Panjal.' },
      stay: { title: 'Old Manali riverside cottage', description: 'Wooden cottages a few steps from the Beas, cafes on the doorstep.' },
      experience: { title: 'Solang Valley adventure', description: 'Paragliding, zorbing and cable cars over the alpine bowl.' },
      taste: { title: 'Himachali dham on a river deck', description: 'A traditional feast overlooking the water in Old Manali.' },
      moment: { title: 'Sunset over the Beas', description: 'Old Manali’s lanes glow gold as the valley cools.' }
    },
    hiddenGems: [
      { title: 'Burua village', description: 'A short walk past Vashisht into quiet apple orchards.' },
      { title: 'Rumsu village', description: 'A traditional Himachali village above the valley floor, rarely visited.' }
    ],
    travelTips: [
      'Pack layers — evenings stay cool even in peak summer.',
      'Book Rohtang Pass permits a few days ahead in season.',
      'Avoid the Mall Road stretch on weekend afternoons if you’re driving through.'
    ],
    matchScores: { adventure: 85, nature: 75, luxury: 55, crowds: 80, slowTravel: 40 },
    seasonalNotes: {
      Summer: 'June–July brings warm days for Solang adventure sports and high-pass road trips.',
      Winter: 'December–February turns Manali into a snow-sports base — Rohtang closes, but Solang skiing is in full swing.'
    }
  },
  {
    id: 'dest_kinnaur',
    slug: 'kinnaur',
    title: 'Kinnaur',
    category: 'Most Popular',
    description: 'Snow peaks, river valleys, and adventure sports.',
    toursCount: 24,
    image: images.destinations.kinnaur,
    region: 'Kinnaur Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Kinnaur unfolds slowly: apple orchards, cliffside roads, wooden temples and villages that look across the borderlands of the high Himalaya. It is a journey for travellers who prefer depth over hurry.',
    bestTime: 'April – October',
    idealDuration: '5–7 Days',
    altitude: '2,320 m',
    travelStyles: ['Nature', 'Culture', 'Road trips'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'Apple country', description: 'Orchards and mountain villages shape the valley’s gentle rhythm.' },
      { title: 'Himalayan culture', description: 'Ancient temples and Buddhist influences meet in every village.' },
      { title: 'The Baspa valley', description: 'A quieter, wilder side of Himachal with long river views.' }
    ],
    places: [
      { title: 'Kalpa', description: 'A quiet village with unforgettable Kinner Kailash views.' },
      { title: 'Sangla', description: 'An orchard-filled valley beside the Baspa river.' },
      { title: 'Chitkul', description: 'A high Himalayan village at the end of the road.' },
      { title: 'Nako', description: 'A high-altitude lake village on the road to Spiti.' }
    ],
    experiences: ['Orchard walks', 'Village stays', 'Temple trails', 'Scenic drives', 'Photography'],
    relatedSlugs: ['spiti-valley', 'tirthan-valley', 'manali'],
    seo: { title: 'Kinnaur Travel Guide & Experiences | The Apex Voyager', description: 'Explore Kinnaur’s apple valleys, mountain villages and Himalayan culture with The Apex Voyager.' },
    isPopular: true,
    priority: 3,
    personality: 'QUIET • ORCHARD-LINED • UNHURRIED',
    badge: 'HIDDEN GEM',
    popularityScore: 72,
    apexScore: 88,
    apexPicks: {
      view: { title: 'Kinner Kailash from Kalpa', description: 'The sacred peak catching first light over the valley.' },
      stay: { title: 'Sangla orchard homestay', description: 'A family home among apple trees beside the Baspa river.' },
      experience: { title: 'Chitkul village walk', description: 'The last village before the Indo-Tibet border, at the end of the road.' },
      taste: { title: 'Orchard-season Kinnauri thali', description: 'A home-cooked meal timed to apple-picking season.' },
      moment: { title: 'Evening light on the Baspa', description: 'The valley turns amber as the sun drops behind the ridgeline.' }
    },
    hiddenGems: [
      { title: 'Rakcham village', description: 'A wooden-house hamlet beside the Baspa, quieter than Sangla or Chitkul.' },
      { title: 'Nako Lake', description: 'A high-altitude lake village on the road toward Spiti.' }
    ],
    travelTips: [
      'Roads are narrow and cliffside in places — plan daytime driving.',
      'Visit September–October for the apple harvest at its peak.',
      'Network coverage is patchy beyond Reckong Peo.'
    ],
    matchScores: { adventure: 60, nature: 92, luxury: 35, crowds: 15, slowTravel: 85 },
    seasonalNotes: {
      Spring: 'April–May brings apple blossom across the valley and pleasant trekking weather.',
      Summer: 'June–August is warm and green — ideal for the Sangla–Chitkul road trip.',
      Autumn: 'September–October is apple harvest season, the best time for orchard visits.'
    }
  },
  {
    id: 'dest_spiti_valley',
    slug: 'spiti-valley',
    title: 'Spiti Valley',
    category: 'Adventure',
    description: 'Remote high-altitude desert with ancient monasteries and dramatic lunar landscapes.',
    toursCount: 18,
    image: images.destinations.spitiValley,
    region: 'Lahaul and Spiti',
    state: 'Himachal Pradesh',
    editorialDescription: 'Spiti is a world apart: a high-altitude cold desert of ochre ridges, white monasteries and village skies that seem endless. This is the Himalaya at its rawest—remote, humbling and deeply rewarding.',
    bestTime: 'May – October',
    idealDuration: '5–8 Days',
    altitude: '3,800 m',
    travelStyles: ['Adventure', 'Nature', 'Culture'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'Ancient monasteries', description: 'Stillness, murals and centuries of Himalayan Buddhist heritage.' },
      { title: 'High-altitude landscapes', description: 'Lunar valleys, blue skies and roads that feel cinematic.' },
      { title: 'Remote village life', description: 'Meet warm local communities in some of India’s highest villages.' },
      { title: 'Stargazing', description: 'Dark, clear nights make the Milky Way feel close enough to touch.' }
    ],
    places: [
      { title: 'Kaza', description: 'The valley’s lively high-altitude hub.' },
      { title: 'Key Monastery', description: 'A commanding monastery above the Spiti river.' },
      { title: 'Hikkim', description: 'Home to the world’s highest post office.' },
      { title: 'Langza', description: 'A fossil village watched over by a giant Buddha.' },
      { title: 'Chandratal', description: 'A seasonal moon lake beneath stark Himalayan peaks.' },
      { title: 'Dhankar', description: 'A cliffside monastery and village above the confluence.' }
    ],
    experiences: ['Mountain road trips', 'Monastery visits', 'Stargazing', 'Village experiences', 'Trekking'],
    relatedSlugs: ['kinnaur', 'manali', 'tirthan-valley'],
    seo: { title: 'Spiti Valley Travel Guide & Experiences | The Apex Voyager', description: 'Discover Spiti Valley’s monasteries, high-altitude villages and Himalayan adventures with The Apex Voyager.' },
    isPopular: true,
    priority: 2,
    personality: 'RAW • REMOTE • ADVENTUROUS',
    badge: 'OFFBEAT FAVOURITE',
    popularityScore: 90,
    apexScore: 95,
    apexPicks: {
      view: { title: 'Chandratal at dusk', description: 'The moon lake under a sky that shifts from gold to indigo.' },
      stay: { title: 'Langza fossil-village homestay', description: 'A family home beneath the giant Buddha, overlooking the fossil beds.' },
      experience: { title: 'Sunrise at Key Monastery', description: 'The valley wakes up below one of the Himalaya’s oldest monasteries.' },
      taste: { title: 'Thukpa and butter tea in Kaza', description: 'A warm bowl in the valley’s high-altitude hub.' },
      moment: { title: 'The Milky Way over Hikkim', description: 'Some of the darkest, clearest skies in India, above the world’s highest post office.' }
    },
    hiddenGems: [
      { title: 'Demul village', description: 'A snow-leopard-country hamlet well off the main Spiti circuit.' },
      { title: 'Lalung monastery', description: 'A quiet, lesser-visited gompa away from the main monastery trail.' }
    ],
    travelTips: [
      'Spend a day acclimatizing in Kaza before pushing to higher villages.',
      'Carry cash — ATMs are scarce and unreliable through the valley.',
      'Roads typically close by early November for winter.'
    ],
    matchScores: { adventure: 90, nature: 88, luxury: 30, crowds: 25, slowTravel: 70 },
    seasonalNotes: {
      Summer: 'June–August is peak season — roads are open, monasteries in full swing, days are long.',
      Autumn: 'September–October brings golden poplar groves and the clearest stargazing skies before winter closes the roads.'
    }
  },
  {
    slug: 'dharamshala',
    title: 'Dharamshala',
    category: 'Wellness',
    description: 'Pine forests and sweeping Himalayan views, ideal for retreats and trekking.',
    toursCount: 15,
    image: images.destinations.dharamshala,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    travelStyles: ['Wellness', 'Nature', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Couples']
  },
  {
    id: 'dest_shimla',
    slug: 'shimla',
    title: 'Shimla',
    category: 'Colonial Charm',
    description: 'Pine-clad ridgelines and heritage architecture along the historic Mall Road.',
    toursCount: 20,
    image: images.destinations.shimla,
    region: 'Shimla District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Shimla pairs colonial-era character with cool cedar slopes and easy access to quieter mountain corners. It is equal parts heritage promenade, family escape and a graceful beginning to a longer Himalayan journey.',
    bestTime: 'March – June, October – February',
    idealDuration: '3–4 Days',
    altitude: '2,205 m',
    travelStyles: ['Culture', 'Family', 'Nature'],
    seasons: ['Summer', 'Winter'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Heritage on foot', description: 'The Ridge and Mall Road invite unhurried evening walks.' },
      { title: 'Cedar-framed views', description: 'Forest trails and ridgelines sit moments from town.' },
      { title: 'Easy mountain escape', description: 'A welcoming Himalayan first trip for friends and families.' }
    ],
    places: [
      { title: 'Mall Road', description: 'Shimla’s storied promenade of cafés and heritage facades.' },
      { title: 'The Ridge', description: 'An open viewpoint at the heart of the city.' },
      { title: 'Kufri', description: 'A nearby hill escape for wide views and seasonal snow.' },
      { title: 'Jakhoo', description: 'A forested hill crowned by a temple and panoramic outlook.' },
      { title: 'Mashobra', description: 'A peaceful cedar retreat beyond the bustle.' }
    ],
    experiences: ['Heritage walks', 'Scenic rail journeys', 'Café hopping', 'Forest walks', 'Family escapes'],
    relatedSlugs: ['manali', 'tirthan-valley', 'spiti-valley'],
    seo: { title: 'Shimla Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Shimla escape with heritage walks, cedar forests and curated Himalayan journeys.' },
    isPopular: true,
    priority: 4,
    personality: 'HERITAGE • EASY • FAMILY-FRIENDLY',
    badge: 'CLASSIC ESCAPE',
    popularityScore: 88,
    apexScore: 78,
    apexPicks: {
      view: { title: 'Sunset over the Ridge', description: 'The open viewpoint at the heart of town, glowing as evening falls.' },
      stay: { title: 'Heritage stay on Mall Road', description: 'Colonial-era architecture steps from the promenade.' },
      experience: { title: 'The Kalka–Shimla toy train', description: 'A UNESCO-listed narrow-gauge climb through pine-clad hills.' },
      taste: { title: 'Café-hopping on Mall Road', description: 'Cedar-framed cafes and old-world bakeries along the promenade.' },
      moment: { title: 'Evening walk on the Ridge', description: 'Valley lights come on below as the crowd thins out.' }
    },
    hiddenGems: [
      { title: 'Mashobra forest trails', description: 'Cedar walks minutes from town, far quieter than the Ridge.' },
      { title: 'Chadwick Falls', description: 'A forest waterfall walk most visitors skip entirely.' }
    ],
    travelTips: [
      'Mall Road is pedestrian-only — plan parking outside the core.',
      'Book toy-train tickets ahead during peak season.',
      'Kufri gets crowded on weekends — visit on a weekday if you can.'
    ],
    matchScores: { adventure: 35, nature: 55, luxury: 65, crowds: 70, slowTravel: 45 },
    seasonalNotes: {
      Summer: 'April–June is Shimla’s classic hill-station escape from the plains’ heat.',
      Winter: 'December–February can bring snowfall on the Ridge — magical, but pack warm.'
    }
  },
  {
    id: 'dest_tirthan_valley',
    slug: 'tirthan-valley',
    title: 'Tirthan Valley',
    category: 'Riverside',
    description: 'Crystal-clear rivers, lush forests and peaceful stays.',
    toursCount: 8,
    image: images.destinations.kasol,
    region: 'Kullu District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Tirthan Valley is made for exhaling. Clear rivers, wooden homes and the forests of the Great Himalayan National Park create a quiet, restorative mountain escape with plenty of room to roam.',
    bestTime: 'March – June, September – November',
    idealDuration: '3–5 Days',
    altitude: '1,600 m',
    travelStyles: ['Nature', 'Slow travel', 'Adventure'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'Great Himalayan National Park', description: 'A remarkable wilderness on the valley’s doorstep.' },
      { title: 'Riverside living', description: 'Wake up to the Tirthan river and unhurried mountain mornings.' },
      { title: 'Village warmth', description: 'Wooden architecture, home-cooked food and local stories.' }
    ],
    places: [
      { title: 'Gushaini', description: 'A relaxed riverside base for the valley.' },
      { title: 'Jibhi', description: 'A forest hamlet of wooden homes and waterfalls.' },
      { title: 'Jalori Pass', description: 'A high pass opening to wide Himalayan views.' },
      { title: 'Serolsar Lake', description: 'A rewarding forest walk from Jalori Pass.' }
    ],
    experiences: ['Forest walks', 'Trout fishing', 'Riverside stays', 'Trekking', 'Village experiences'],
    relatedSlugs: ['manali', 'shimla', 'kinnaur'],
    seo: { title: 'Tirthan Valley Travel Guide & Experiences | The Apex Voyager', description: 'Discover Tirthan Valley’s forests, riverside stays and quiet Himalayan village life.' },
    hiddenGems: [
      { title: 'Chhoie Waterfall', description: 'A short forest walk to a waterfall just outside Gushaini, easy to miss on a map.' },
      { title: 'Bahu village', description: 'A quiet wooden-house hamlet across the river, rarely visited by day-trippers.' }
    ]
  },
  {
    slug: 'jibhi',
    title: 'Jibhi',
    category: 'Offbeat',
    description: 'A sleepy riverside hamlet of wooden cottages and waterfall trails in the Banjar Valley.',
    toursCount: 5,
    image: images.destinations.kasol,
    region: 'Banjar Valley',
    state: 'Himachal Pradesh',
    travelStyles: ['Offbeat', 'Nature', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Solo Travelers'],
    hiddenGems: [
      { title: 'Jibhi Waterfall', description: 'A short, easy walk from the village lanes to a forest waterfall.' },
      { title: 'Chehni Kothi', description: 'A centuries-old timber-and-stone watchtower above the valley, rarely crowded.' }
    ]
  },
  {
    slug: 'chitkul',
    title: 'Chitkul',
    category: 'Adventure',
    description: 'The last village on the Indo-Tibet border.',
    toursCount: 6,
    image: images.destinations.kinnaur,
    region: 'Kinnaur Valley',
    state: 'Himachal Pradesh',
    travelStyles: ['Adventure', 'Nature', 'Offbeat'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    hiddenGems: [
      { title: 'Last Dhaba of India', description: 'A tin-roofed roadside dhaba at the literal end of the road — a rite of passage for Kinnaur travelers.' },
      { title: 'Batseri village', description: 'A quieter orchard village a short drive before Chitkul, often skipped entirely.' }
    ]
  },
  {
    slug: 'sainj-valley',
    title: 'Sainj Valley',
    category: 'Riverside',
    description: 'Unexplored beauty, waterfalls and wooden homes.',
    toursCount: 5,
    image: images.destinations.kasol,
    region: 'Kullu District',
    state: 'Himachal Pradesh',
    travelStyles: ['Slow travel', 'Nature', 'Offbeat'],
    seasons: ['Spring', 'Summer', 'Monsoon'],
    bestFor: ['Couples', 'Solo Travelers']
  },
  {
    slug: 'bir-billing',
    title: 'Bir Billing',
    category: 'Adventure',
    description: "India's paragliding capital, with wide valley views and a laid-back Tibetan-influenced village.",
    toursCount: 9,
    image: images.destinations.manali,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    travelStyles: ['Adventure', 'Nature'],
    seasons: ['Autumn', 'Winter', 'Spring'],
    bestFor: ['Solo Travelers', 'Friends & Groups']
  },
  {
    slug: 'sangla-valley',
    title: 'Sangla Valley',
    category: 'Adventure',
    description: 'Apple orchards and apricot groves along the Baspa river, deep in the Kinnaur Himalayas.',
    toursCount: 7,
    image: images.destinations.kinnaur,
    region: 'Kinnaur Valley',
    state: 'Himachal Pradesh',
    travelStyles: ['Adventure', 'Nature', 'Slow travel'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Couples', 'Friends & Groups']
  },
  {
    slug: 'chamba',
    title: 'Chamba',
    category: 'Colonial Charm',
    description: 'Ancient temples and hillside palaces in one of Himachal’s oldest princely towns.',
    toursCount: 10,
    image: images.destinations.shimla,
    region: 'Chamba District',
    state: 'Himachal Pradesh',
    travelStyles: ['Culture', 'Family'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Families', 'Couples']
  },
  {
    slug: 'dalhousie',
    title: 'Dalhousie',
    category: 'Colonial Charm',
    description: 'Colonial-era churches and pine-forest views strung across five interconnected hills.',
    toursCount: 11,
    image: images.destinations.shimla,
    region: 'Chamba District',
    state: 'Himachal Pradesh',
    travelStyles: ['Culture', 'Family', 'Slow travel'],
    seasons: ['Summer', 'Monsoon', 'Autumn'],
    bestFor: ['Families', 'Couples']
  },
  {
    slug: 'khajjiar',
    title: 'Khajjiar',
    category: 'Offbeat',
    description: 'A saucer-shaped meadow ringed by deodar forest, often called "Mini Switzerland."',
    toursCount: 6,
    image: images.destinations.dharamshala,
    region: 'Chamba District',
    state: 'Himachal Pradesh',
    travelStyles: ['Offbeat', 'Nature', 'Romantic'],
    seasons: ['Summer', 'Monsoon'],
    bestFor: ['Couples', 'Families']
  },
  {
    slug: 'gulmarg',
    title: 'Gulmarg',
    category: 'Scenic',
    description: 'Alpine meadows and snow-capped peaks in Kashmir, home to one of the world’s highest gondola rides.',
    toursCount: 9,
    // No dedicated Jammu & Kashmir photography exists yet (see config/images.config.ts) —
    // this used to reuse Kinnaur's real Himachal Pradesh photo, mislabeling a specific
    // Himachal place as Gulmarg. Same honest generic fallback the "Jammu & Kashmir"
    // region card already uses in config/experiences.config.ts.
    image: images.experiences.mountainDusk,
    region: 'Baramulla District',
    state: 'Jammu & Kashmir',
    editorialDescription: 'Gulmarg is Kashmir at its most cinematic: a meadow ringed by pine and fir, riding one of the world’s highest cable cars up to Apharwat’s snowline. Come for the skiing in winter, the wildflower meadow in summer — either way, the mountain does the talking.',
    bestTime: 'December – March (snow), April – June (meadows)',
    idealDuration: '2–3 Days',
    altitude: '2,650 m',
    travelStyles: ['Adventure', 'Nature', 'Luxury'],
    seasons: ['Winter', 'Summer'],
    bestFor: ['Couples', 'Friends & Groups'],
    highlights: [
      { title: 'The Gondola', description: 'A two-stage cable car climbing to nearly 4,000 m at Apharwat’s summit.' },
      { title: 'Ski country', description: 'India’s premier winter-sports slope, from beginner runs to backcountry lines.' },
      { title: 'Summer meadow', description: 'Wildflowers and a championship golf course open up once the snow melts.' }
    ],
    places: [
      { title: 'Apharwat Peak', description: 'The Gondola’s Phase 2 summit, with views into Ladakh on a clear day.' },
      { title: 'Ningle Nallah', description: 'A meadow stream walk beyond the main village, far quieter than the slopes.' },
      { title: 'St. Mary’s Church', description: 'A colonial-era church framed by deodar forest.' }
    ],
    experiences: ['Skiing & snowboarding', 'Gondola ride', 'Meadow walks', 'Golf (summer)', 'Photography'],
    relatedSlugs: ['kinnaur', 'manali'],
    seo: { title: 'Gulmarg Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Gulmarg escape — the Gondola, skiing, and Kashmir’s most cinematic alpine meadow.' },
    isPopular: true,
    priority: 5,
    personality: 'ALPINE • CINEMATIC • SNOW-BOUND',
    badge: 'TRENDING',
    popularityScore: 84,
    apexScore: 90,
    apexPicks: {
      view: { title: 'Apharwat summit', description: 'The Gondola’s Phase 2 station, looking out over the Kashmir valley.' },
      stay: { title: 'Pine-view resort by the golf course', description: 'Slope-facing rooms a short walk from the Gondola base.' },
      experience: { title: 'Skiing or the world-record gondola ride', description: 'One of the highest cable cars anywhere, in either season.' },
      taste: { title: 'Kahwa and a wazwan-style dinner', description: 'Saffron tea and a multi-course Kashmiri feast after a day on the mountain.' },
      moment: { title: 'Snowfall over the meadow at dusk', description: 'The village goes quiet as the first flakes settle on the pines.' }
    },
    hiddenGems: [
      { title: 'Ningle Nallah', description: 'A meadow stream walk most day-trippers never reach.' },
      { title: 'Alpather Lake trek', description: 'A glacial lake trek above the ski slopes, open in summer.' }
    ],
    travelTips: [
      'Book Gondola tickets ahead — winter queues run long.',
      'The upper phase closes without notice in bad weather; keep a backup plan.',
      'Rent proper winter layers locally if you’re not carrying your own.'
    ],
    matchScores: { adventure: 80, nature: 85, luxury: 70, crowds: 55, slowTravel: 40 },
    seasonalNotes: {
      Winter: 'December–March is ski season — the Gondola and slopes are at their best.',
      Summer: 'April–June turns the meadow green, with golf and gentler walks replacing the snow sports.'
    }
  },
  {
    slug: 'rishikesh',
    title: 'Rishikesh',
    category: 'Spiritual',
    description: 'Uttarakhand’s yoga capital, with Ganga aartis, ashrams, and Himalayan white-water rafting.',
    toursCount: 14,
    // No dedicated Uttarakhand photography exists yet (see config/images.config.ts) —
    // this used to reuse Dharamshala's real Himachal Pradesh photo, mislabeling a
    // specific Himachal place as Rishikesh. Same honest generic fallback the
    // "Uttarakhand" region card already uses in config/experiences.config.ts.
    image: images.experiences.himalayanVista,
    region: 'Dehradun District',
    state: 'Uttarakhand',
    editorialDescription: 'Rishikesh sits where the Ganges leaves the mountains — ashrams and yoga halls along one bank, white-water rapids the next valley over. It’s a rare mix of stillness and adrenaline, all within a short walk of the riverfront.',
    bestTime: 'September – November, February – April',
    idealDuration: '2–4 Days',
    altitude: '372 m',
    travelStyles: ['Wellness', 'Adventure', 'Culture'],
    seasons: ['Autumn', 'Spring', 'Winter'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'Ganga aarti', description: 'Riverside prayer ceremonies at dusk, lamps drifting downstream.' },
      { title: 'White-water rafting', description: 'Grade II–IV rapids on the Ganges, a short drive upstream.' },
      { title: 'Yoga capital', description: 'Ashrams and teacher-training schools along both riverbanks.' }
    ],
    places: [
      { title: 'Triveni Ghat', description: 'The main aarti ghat and the heart of evening river life.' },
      { title: 'Laxman Jhula & Ram Jhula', description: 'Suspension bridges linking the ashram districts across the Ganges.' },
      { title: 'Neer Garh Waterfall', description: 'A forest walk to a waterfall just outside town.' }
    ],
    experiences: ['White-water rafting', 'Yoga & meditation retreats', 'Ganga aarti', 'Ashram stays', 'Riverside cafes'],
    relatedSlugs: ['haridwar'],
    seo: { title: 'Rishikesh Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Rishikesh trip — Ganga aartis, yoga retreats, and Himalayan white-water rafting.' },
    isPopular: true,
    priority: 6,
    personality: 'SPIRITUAL • ADVENTUROUS • RIVERSIDE',
    badge: 'MOST LOVED',
    popularityScore: 91,
    apexScore: 85,
    apexPicks: {
      view: { title: 'Ganga aarti at Triveni Ghat', description: 'Lamps and chanting drifting along the riverfront at dusk.' },
      stay: { title: 'Riverside ashram-style retreat', description: 'Simple rooms with a Ganges view, steps from the ghats.' },
      experience: { title: 'White-water rafting on the Ganges', description: 'Rapids upstream, with calmer stretches for floating back down.' },
      taste: { title: 'Satvik thali after sunrise yoga', description: 'A simple, vegetarian riverside breakfast to close out a morning session.' },
      moment: { title: 'Aarti lights drifting downriver', description: 'Hundreds of small lamps carried away on the current at dusk.' }
    },
    hiddenGems: [
      { title: 'Kunjapuri Devi temple', description: 'A sunrise viewpoint over the Himalayan foothills, short drive from town.' },
      { title: 'Neer Garh Waterfall', description: 'A quiet forest walk most rafting day-trippers skip.' }
    ],
    travelTips: [
      'Alcohol and meat are restricted within Rishikesh town limits.',
      'Book rafting slots a day ahead in peak season.',
      'Dress modestly near the ghats and ashrams.'
    ],
    matchScores: { adventure: 70, nature: 65, luxury: 40, crowds: 75, slowTravel: 55 },
    seasonalNotes: {
      Autumn: 'September–November brings calm river levels, ideal for rafting and yoga retreats.',
      Spring: 'February–April is pleasant and less crowded than peak pilgrimage season.',
      Winter: 'December–January draws pilgrims for the cooler Ganga aarti season, though rafting pauses in the coldest weeks.'
    }
  },
  {
    id: 'dest_kasol',
    slug: 'kasol',
    title: 'Kasol',
    category: 'Scenic',
    description: 'Riverside cafés, treks and laid-back mountain life.',
    toursCount: 12,
    image: images.destinations.kasol,
    region: 'Parvati Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Kasol is the Parvati Valley’s backpacker heart — riverside cafes, pine ridgelines, and trailheads to some of Himachal’s most-loved treks, all at an easygoing, unhurried pace.',
    bestTime: 'March – June, September – November',
    idealDuration: '3–5 Days',
    altitude: '1,640 m',
    travelStyles: ['Adventure', 'Nature', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Friends & Groups', 'Solo Travelers'],
    highlights: [
      { title: 'Riverside café culture', description: 'Cafes strung along the Parvati, built for long, unhurried mornings.' },
      { title: 'Trailhead to the high valley', description: 'A launch point for Kheerganga, Tosh, and beyond.' },
      { title: 'Backpacker rhythm', description: 'A laid-back pace that rewards staying a few extra days.' }
    ],
    places: [
      { title: 'Chalal', description: 'A short riverside walk to a quieter, forested hamlet.' },
      { title: 'Kheerganga', description: 'A day-long trek ending at hot springs above the treeline.' },
      { title: 'Tosh', description: 'A hillside village with wide valley views, a short drive on.' }
    ],
    experiences: ['River-café culture', 'Trekking', 'Village walks', 'Photography', 'Riverside camping'],
    relatedSlugs: ['tirthan-valley', 'manali'],
    seo: { title: 'Kasol Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Kasol trip — riverside cafes, Parvati Valley treks, and laid-back mountain life.' },
    isPopular: true,
    priority: 7,
    personality: 'LAID-BACK • BACKPACKER • RIVERSIDE',
    badge: 'BACKPACKER FAVOURITE',
    popularityScore: 78,
    apexScore: 80,
    apexPicks: {
      view: { title: 'The Parvati from a café deck', description: 'River views over breakfast, ridgelines rising on both sides.' },
      stay: { title: 'Riverside café-stay', description: 'Simple rooms above a café, river sound instead of an alarm.' },
      experience: { title: 'Day trek to Kheerganga', description: 'Hot springs above the treeline, reached on foot.' },
      taste: { title: 'Riverside all-day breakfast', description: 'Kasol’s café-strip take on a lazy backpacker brunch.' },
      moment: { title: 'Sunset over the ridgelines from Chalal', description: 'Pine-covered slopes catching the day’s last light.' }
    },
    hiddenGems: [
      { title: 'Tosh village', description: 'A quieter hillside village a short drive past Kasol.' },
      { title: 'Malana', description: 'A historic, self-governing village nearby — visit respectfully and follow local customs.' }
    ],
    travelTips: [
      'Mobile network is patchy beyond Kasol itself — download offline maps.',
      'Carry cash into the valley; ATMs are limited.',
      'Respect local customs, especially around Malana.'
    ],
    matchScores: { adventure: 65, nature: 80, luxury: 20, crowds: 60, slowTravel: 75 },
    seasonalNotes: {
      Spring: 'March–April is quiet and green, before the summer backpacker season picks up.',
      Summer: 'May–June is peak season for the Kheerganga trek and riverside cafe life.',
      Autumn: 'September–November brings clear skies and comfortable trekking temperatures.'
    }
  },
  {
    slug: 'haridwar',
    title: 'Haridwar',
    category: 'Spiritual',
    description: 'One of Hinduism’s seven holiest cities in Uttarakhand, anchored by the sacred Har Ki Pauri ghat.',
    toursCount: 10,
    // No dedicated Uttarakhand photography exists yet (see config/images.config.ts) —
    // this used to reuse Shimla's real Himachal Pradesh photo, mislabeling a specific
    // Himachal place as Haridwar. Same honest generic fallback used for Rishikesh above.
    image: images.experiences.valleyGeneric,
    region: 'Haridwar District',
    state: 'Uttarakhand',
    editorialDescription: 'Haridwar is where the Ganges first reaches the plains — one of Hinduism’s seven holiest cities, built around the ghats at Har Ki Pauri. The evening aarti here is one of the great shared rituals of North India.',
    bestTime: 'October – March',
    idealDuration: '1–2 Days',
    altitude: '314 m',
    travelStyles: ['Culture', 'Family'],
    seasons: ['Winter', 'Autumn'],
    bestFor: ['Families'],
    highlights: [
      { title: 'Har Ki Pauri aarti', description: 'A nightly ceremony drawing thousands to the ghats at dusk.' },
      { title: 'Ancient pilgrimage city', description: 'One of the four sites of the Kumbh Mela rotation.' },
      { title: 'Old-bazaar food', description: 'Kachori-sabzi, lassi, and sweets in the lanes around the ghats.' }
    ],
    places: [
      { title: 'Har Ki Pauri', description: 'The main ghat, and the centre of the evening aarti.' },
      { title: 'Chandi Devi Temple', description: 'A hilltop temple reached by cable car, with river views.' },
      { title: 'Mansa Devi Temple', description: 'A second hilltop shrine overlooking the city.' }
    ],
    experiences: ['Ganga aarti', 'Temple visits', 'Old-bazaar food walks', 'Ropeway rides'],
    relatedSlugs: ['rishikesh'],
    seo: { title: 'Haridwar Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Haridwar visit — the Har Ki Pauri aarti and one of Hinduism’s seven holiest cities.' },
    isPopular: true,
    priority: 8,
    personality: 'SACRED • TIMELESS • RIVERSIDE',
    badge: 'SPIRITUAL HIGHLIGHT',
    popularityScore: 82,
    apexScore: 75,
    apexPicks: {
      view: { title: 'Har Ki Pauri at aarti time', description: 'Thousands of lamps and voices along the ghat at dusk.' },
      stay: { title: 'Riverside heritage guesthouse', description: 'A short walk from the ghats, steeped in pilgrimage-town history.' },
      experience: { title: 'The evening Ganga aarti', description: 'Best experienced from the water’s edge, arriving early.' },
      taste: { title: 'Kachori-sabzi and lassi', description: 'Classic old-bazaar breakfast, a short walk from Har Ki Pauri.' },
      moment: { title: 'A thousand diyas adrift at dusk', description: 'Small lamps carried away on the current after the aarti.' }
    },
    hiddenGems: [
      { title: 'Chandi Devi ropeway viewpoint', description: 'A quieter hilltop view over the city and river.' },
      { title: 'Sapt Rishi Ashram', description: 'A calmer riverside stretch away from the main ghats.' }
    ],
    travelTips: [
      'The evening aarti gets crowded — arrive early for a good spot.',
      'Dress modestly, especially near the ghats.',
      'Pair with Rishikesh for a longer trip — they’re a short drive apart.'
    ],
    matchScores: { adventure: 20, nature: 45, luxury: 35, crowds: 85, slowTravel: 50 },
    seasonalNotes: {
      Winter: 'December–February is pleasant for temple visits and the evening aarti.',
      Autumn: 'October–November is festival season, often coinciding with major religious gatherings.'
    }
  },
  {
    slug: 'munsiyari',
    title: 'Munsiyari',
    category: 'Offbeat',
    description: 'A quiet hill town beneath the Panchachuli peaks, gateway to Uttarakhand’s remote Johar Valley.',
    toursCount: 4,
    // No dedicated Uttarakhand photography exists yet (see config/images.config.ts) —
    // this used to reuse Kinnaur's real Himachal Pradesh photo, mislabeling a specific
    // Himachal place as Munsiyari. Same honest generic fallback used for Rishikesh above.
    image: images.experiences.mountainDusk,
    region: 'Johar Valley',
    state: 'Uttarakhand',
    editorialDescription: 'Munsiyari sits far enough off the main Uttarakhand circuit that it barely features on most itineraries — a small town looking straight at the five snow peaks of Panchachuli, with trailheads into some of the Kumaon Himalaya’s quietest valleys.',
    bestTime: 'April – June, September – November',
    idealDuration: '3–5 Days',
    altitude: '2,290 m',
    travelStyles: ['Offbeat', 'Nature', 'Adventure'],
    seasons: ['Spring', 'Autumn'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'Panchachuli views', description: 'Five snow peaks catch the first and last light directly above town.' },
      { title: 'Johar Valley trailheads', description: 'A launch point for remote Kumaon treks most travelers never reach.' }
    ],
    hiddenGems: [
      { title: 'Khaliya Top', description: 'A high meadow trek with a 360-degree Panchachuli view, quiet even in season.' },
      { title: 'Birthi Falls', description: 'A roadside waterfall on the way in, most through-travelers just drive past.' }
    ],
    relatedSlugs: ['rishikesh'],
    seo: { title: 'Munsiyari Travel Guide & Experiences | The Apex Voyager', description: 'Discover Munsiyari — Panchachuli views and Uttarakhand’s quietest Himalayan valley.' }
  }
];

/** Resolves a curated Destination slug to its human-readable title — used where a
 *  caller only has a slug (e.g. a Tour's `destinationSlug`) but needs to build a
 *  `/journeys?destination=` link, since that page's free-text filter matches against
 *  real destination names, not slugs. Returns undefined for a slug with no curated
 *  match (some Tour destinationSlugs — e.g. 'narkanda' — don't correspond to a
 *  curated Destination) rather than guessing a title. */
export function getDestinationTitleBySlug(slug: string): string | undefined {
  return destinations.find((destination) => destination.slug === slug)?.title;
}
