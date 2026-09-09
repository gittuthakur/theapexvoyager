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
    description: 'Ancient villages, apple orchards and dramatic valleys along the historic Hindustan–Tibet Road.',
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
    description: 'A Kangra Valley hill town below the Dhauladhar range, and gateway to McLeod Ganj above it.',
    toursCount: 15,
    image: images.destinations.dharamshala,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Dharamshala and McLeod Ganj are often treated as one place, but they sit about 9 km and a real climb apart. Dharamshala itself is the lower Kangra Valley town — quieter, more local, with sweeping Dhauladhar views. McLeod Ganj, higher up, is where the Tibetan government-in-exile has been based since 1960 and where most travelers actually spend their time — monasteries, cafes and the Dalai Lama’s temple complex. Most trips use Dharamshala as the arrival point and McLeod Ganj as the base.',
    bestTime: 'March – June, September – November',
    idealDuration: '3–4 Days',
    travelStyles: ['Wellness', 'Nature', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Couples'],
    highlights: [
      { title: 'McLeod Ganj and the Dalai Lama complex', description: 'The Tibetan government-in-exile’s base since 1960, with the Tsuglagkhang temple complex as its centre.' },
      { title: 'Dhauladhar backdrop', description: 'The range’s peaks, including Hanuman Ka Tibba, rise directly behind the town.' },
      { title: 'Triund day hike', description: 'A well-known ridge hike above McLeod Ganj, popular but genuinely rewarding on a clear day.' }
    ],
    places: [
      { title: 'McLeod Ganj', description: 'The upper town, roughly 9 km and a steep climb above Dharamshala, and where most stays and cafes are.' },
      { title: 'Tsuglagkhang Complex', description: 'The Dalai Lama’s temple and residence complex in McLeod Ganj.' },
      { title: 'Bhagsu Nag', description: 'A village just beyond McLeod Ganj with a waterfall and temple.' },
      { title: 'Norbulingka Institute', description: 'A Tibetan arts and culture institute in the valley below, quieter than McLeod Ganj itself.' }
    ],
    experiences: ['Monastery visits', 'Triund day hike', 'Tibetan cooking and culture', 'Café culture in McLeod Ganj'],
    relatedSlugs: ['bir-billing', 'chamba'],
    seo: { title: 'Dharamshala Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Dharamshala trip — McLeod Ganj’s Tibetan culture, Dhauladhar views, and the Triund day hike.' },
    apexPicks: {
      view: { title: 'Triund ridge at sunset', description: 'Dhauladhar peaks catching the last light, above the treeline.' },
      stay: { title: 'McLeod Ganj hillside guesthouse', description: 'Simple rooms with valley or mountain views, a short walk from the main square.' },
      experience: { title: 'Morning at the Tsuglagkhang Complex', description: 'The Dalai Lama’s temple complex before the day’s crowds arrive.' },
      taste: { title: 'Tibetan momos and thukpa', description: 'McLeod Ganj’s café strip is built around this exact meal.' },
      moment: { title: 'Prayer flags over the valley', description: 'The view from McLeod Ganj’s upper lanes on a clear morning.' }
    },
    hiddenGems: [
      { title: 'Dharamkot', description: 'A quieter hillside hamlet above McLeod Ganj, popular with longer-staying travelers.' },
      { title: 'Norbulingka Institute', description: 'A calm Tibetan arts campus in the valley, easy to miss if you never leave McLeod Ganj.' }
    ],
    travelTips: [
      'Confirm whether your stay is in Dharamshala or McLeod Ganj — they are a real drive apart, not the same address.',
      'The Triund trail can be crowded on weekends — a weekday or early start is quieter.',
      'Pack layers even in summer — McLeod Ganj’s elevation keeps evenings cool.'
    ],
    matchScores: { adventure: 55, nature: 75, luxury: 40, crowds: 65, slowTravel: 55 },
    seasonalNotes: {
      Spring: 'March–May is clear and comfortable, good for the Triund hike before summer haze builds.',
      Summer: 'June is warm in the valley but cooler in McLeod Ganj — a popular season to escape the plains’ heat.',
      Autumn: 'September–November has the clearest Dhauladhar views of the year.'
    }
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
    ],
    apexPicks: {
      view: { title: 'Serolsar Lake from Jalori Pass', description: 'A forest walk from the pass to a quiet lake framed by cedar and oak.' },
      stay: { title: 'Gushaini riverside cottage', description: 'Wooden rooms with the Tirthan running past the window.' },
      experience: { title: 'Trout fishing on the Tirthan', description: 'A slow-paced riverside activity the valley is known for.' },
      taste: { title: 'Home-cooked Himachali meals', description: 'Simple, seasonal food in family-run guesthouses.' },
      moment: { title: 'Morning mist over the river', description: 'Gushaini at first light, before the valley wakes up.' }
    },
    travelTips: [
      'Jalori Pass is only reliably open outside the winter months — check current road status before planning a day trip.',
      'Mobile signal is patchy through the valley — let your stay know your arrival window in advance.',
      'Riverside paths can be uneven — sturdy footwear helps more than sandals.'
    ],
    matchScores: { adventure: 45, nature: 88, luxury: 35, crowds: 20, slowTravel: 85 },
    seasonalNotes: {
      Spring: 'March–May brings clearer trails and fewer crowds before the summer season picks up.',
      Summer: 'June is warm and green in the valley, with Jalori Pass fully open above.',
      Autumn: 'September–November has cool, settled weather — a good window for riverside walks and Serolsar Lake.'
    }
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
    editorialDescription: 'Jibhi is a scatter of wooden guesthouses along a stream in the Banjar Valley, small enough to walk end to end in twenty minutes. It sits below Jalori Pass rather than on it, which keeps it quieter than the pass-road villages further up — most days here are built around a waterfall walk, a slow breakfast and not much else.',
    bestTime: 'April – June, September – November',
    idealDuration: '2–3 Days',
    altitude: '2,250 m',
    travelStyles: ['Offbeat', 'Nature', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'Walkable village scale', description: 'Cafes, cottages and the stream are all within a short stroll of each other.' },
      { title: 'Kath Kuni architecture', description: 'Chehni Kothi’s timber-and-stone tower is a short, well-marked hike above the village.' },
      { title: 'A base below Jalori Pass', description: 'Thirteen kilometres from the pass road, without being on it.' }
    ],
    places: [
      { title: 'Jibhi Waterfall', description: 'A short, easy walk from the village lanes to a forest waterfall.' },
      { title: 'Chehni Kothi', description: 'A centuries-old timber-and-stone watchtower in Chehni village, reached via a roughly hour-long walk from Bagi.' },
      { title: 'Jalori Pass', description: 'A high pass around 3,120 m, about 13 km up the road — a nearby excursion, not a Jibhi sight in itself.' }
    ],
    experiences: ['Waterfall walks', 'Café mornings', 'Village photography', 'Day trip to Jalori Pass'],
    relatedSlugs: ['tirthan-valley', 'sainj-valley'],
    seo: { title: 'Jibhi Travel Guide & Experiences | The Apex Voyager', description: 'Discover Jibhi: a quiet Banjar Valley hamlet of wooden cottages, waterfall walks and easy access to Jalori Pass.' },
    hiddenGems: [
      { title: 'Jibhi Waterfall', description: 'A short, easy walk from the village lanes to a forest waterfall.' },
      { title: 'Chehni Kothi', description: 'A centuries-old timber-and-stone watchtower above the valley, rarely crowded.' }
    ],
    travelTips: [
      'Jalori Pass is a day trip from Jibhi, not a walk — plan a taxi or your own vehicle.',
      'The pass road is unreliable in winter — confirm it’s open before building a day around it.',
      'Most of the village has no house numbers — save your stay’s exact location before you arrive.'
    ],
    matchScores: { adventure: 30, nature: 82, luxury: 30, crowds: 20, slowTravel: 90 },
    seasonalNotes: {
      Spring: 'April brings clear skies and easy access to Jalori Pass as the winter snow clears.',
      Summer: 'June is warm and green, with the pass road fully open for day trips.',
      Autumn: 'September–November is cool and quiet, with good visibility for the walk to Chehni Kothi.'
    }
  },
  {
    slug: 'chitkul',
    title: 'Chitkul',
    category: 'Adventure',
    description: 'The last inhabited village on the old Hindustan-Tibet trade route, deep in the Baspa Valley.',
    toursCount: 6,
    image: images.destinations.chitkul,
    region: 'Kinnaur Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Chitkul sits at the road’s end in the Baspa Valley, past Sangla and past most itineraries. At close to 3,450 m it’s noticeably colder and starker than the valley below — fewer trees, wider skies, and a village that still runs on its own slow rhythm rather than a tourist one. It rewards travelers looking for the quiet, high end of a Kinnaur trip rather than a full itinerary in itself.',
    bestTime: 'May – October',
    idealDuration: '1–2 Days (as an extension of Sangla)',
    altitude: '3,450 m',
    travelStyles: ['Adventure', 'Nature', 'Offbeat'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'End-of-the-road village', description: 'Chitkul is the furthest point most travelers can reach on this stretch of the Baspa Valley.' },
      { title: 'High-altitude Baspa views', description: 'Wide, treeless valley views the lower villages don’t have.' },
      { title: 'A genuinely different pace', description: 'A small, working Kinnauri village rather than a built-up viewpoint.' }
    ],
    places: [
      { title: 'Baspa riverbank', description: 'A short walk from the village to the river, with the valley opening out around it.' },
      { title: 'Batseri village', description: 'A quieter orchard village on the way in from Sangla, often skipped entirely.' },
      { title: 'Sangla', description: 'The larger town 24–25 km back down the valley — most Chitkul trips are based there.' }
    ],
    experiences: ['Riverside walks', 'Village photography', 'Baspa Valley road trip', 'Orchard-season visits'],
    relatedSlugs: ['sangla-valley', 'kinnaur'],
    seo: { title: 'Chitkul Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Chitkul trip — the Baspa Valley’s furthest village, best reached as an extension of Sangla.' },
    hiddenGems: [
      { title: 'Last Dhaba of India', description: 'A tin-roofed roadside dhaba at the literal end of the road — a rite of passage for Kinnaur travelers.' },
      { title: 'Batseri village', description: 'A quieter orchard village a short drive before Chitkul, often skipped entirely.' }
    ],
    travelTips: [
      'The road from Sangla can be rough in places — build in extra time, especially after rain.',
      'Evenings turn cold fast even in summer — pack a proper layer, not just a light jacket.',
      'Stay options are limited — book ahead in peak season rather than arriving without a plan.'
    ],
    matchScores: { adventure: 55, nature: 90, luxury: 15, crowds: 30, slowTravel: 75 },
    seasonalNotes: {
      Summer: 'June–August is the most reliable window for road access, though July–August can bring monsoon disruption.',
      Autumn: 'September–October is clear and cool, generally the most stable time to visit before winter closes the road.'
    }
  },
  {
    slug: 'sainj-valley',
    title: 'Sainj Valley',
    category: 'Riverside',
    description: 'A quiet valley on the Great Himalayan National Park buffer, built around meadow villages like Shangarh.',
    toursCount: 5,
    image: images.destinations.kasol,
    region: 'Kullu District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Sainj Valley runs into the buffer zone of the Great Himalayan National Park, and it shows — this is one of the quietest corners of the Kullu district, with far less infrastructure than Tirthan or Jibhi next door. Shangarh, its best-known village, is a wide meadow with a centuries-old temple rather than a tourist strip, reached by a narrow road that keeps the numbers down.',
    bestTime: 'March – June, September – November',
    idealDuration: '2–3 Days',
    altitude: '2,100 m (Shangarh)',
    travelStyles: ['Slow travel', 'Nature', 'Offbeat'],
    seasons: ['Spring', 'Summer', 'Monsoon'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'Shangarh meadow', description: 'An open meadow village inside the GHNP buffer zone, with a historic temple at its edge.' },
      { title: 'National park buffer setting', description: 'Forested, undeveloped surroundings rather than a built-up hill-station feel.' },
      { title: 'A quieter alternative to Tirthan', description: 'Fewer stays and visitors than the neighbouring valleys, by design more than by accident.' }
    ],
    places: [
      { title: 'Shangarh village', description: 'The valley’s meadow hub, with traditional wooden homes and a temple.' },
      { title: 'Sainj village', description: 'The lower gateway village on the way in from Aut.' }
    ],
    experiences: ['Meadow walks', 'Village stays', 'Birdwatching', 'Forest walks'],
    relatedSlugs: ['tirthan-valley', 'jibhi'],
    seo: { title: 'Sainj Valley Travel Guide & Experiences | The Apex Voyager', description: 'Discover Sainj Valley and Shangarh — a quiet meadow village on the Great Himalayan National Park buffer.' },
    hiddenGems: [
      { title: 'Shangarh meadow temple', description: 'A centuries-old wooden temple at the edge of the meadow, easy to miss without a local pointing it out.' }
    ],
    travelTips: [
      'The final stretch to Shangarh is a narrow, high-clearance road — a suitable vehicle matters more than speed.',
      'Very few shops or ATMs in the valley — carry cash and any essentials in from Aut or Sainj village.',
      'This is genuinely quiet country — confirm your stay is open and reachable before setting out.'
    ],
    matchScores: { adventure: 40, nature: 92, luxury: 15, crowds: 10, slowTravel: 90 },
    seasonalNotes: {
      Spring: 'March–May brings clearer roads and fresh green meadows before the summer crowds elsewhere in Kullu build up.',
      Summer: 'June is warm and accessible; July–August monsoon rain can make the final approach road difficult.'
    }
  },
  {
    slug: 'bir-billing',
    title: 'Bir Billing',
    category: 'Adventure',
    description: "India's best-known paragliding site, paired with a slow-paced Tibetan settlement village.",
    toursCount: 9,
    image: images.destinations.birBilling,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Bir and Billing are really two places. Bir, at around 1,525 m, is a Tibetan settlement village founded in the early 1960s — cafes, monasteries and landing-strip meadows at a gentle pace. Billing, 14 km up and over 800 m higher, is the actual paragliding takeoff point, with expansive Kangra Valley views on a clear day. Most visitors base themselves in Bir and treat Billing as a day trip up and back.',
    bestTime: 'October – June',
    idealDuration: '2–3 Days',
    altitude: '1,525 m (Bir), 2,400 m (Billing takeoff)',
    travelStyles: ['Adventure', 'Nature'],
    seasons: ['Autumn', 'Winter', 'Spring'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'Paragliding at Billing', description: 'One of India’s best-regarded paragliding sites, weather and operator conditions permitting.' },
      { title: 'Bir Tibetan Colony', description: 'Monasteries, prayer flags and a Tibetan-refugee settlement dating to the early 1960s.' },
      { title: 'Café and slow-travel culture', description: 'A relaxed village pace between flights, built around small cafes rather than a busy bazaar.' }
    ],
    places: [
      { title: 'Chowgan village', description: 'The paragliding landing site and hub for most stays, on the southern edge of Bir.' },
      { title: 'Billing meadow', description: 'The takeoff point 14 km above Bir, reached by road.' },
      { title: 'Bir Tibetan monasteries', description: 'Several monasteries within walking distance of the village centre.' }
    ],
    experiences: ['Paragliding (weather permitting)', 'Monastery visits', 'Café culture', 'Cycling routes'],
    relatedSlugs: ['dharamshala'],
    seo: { title: 'Bir Billing Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Bir Billing trip — paragliding at Billing, Tibetan culture in Bir, and a relaxed Kangra Valley base.' },
    hiddenGems: [
      { title: 'Bir Road Tea Estate', description: 'Working tea gardens on the approach to Bir, a quiet stop most travelers drive straight past.' },
      { title: 'Chowgan back lanes', description: 'Quieter cafe lanes a short walk from the main landing field.' }
    ],
    travelTips: [
      'Paragliding depends entirely on weather and operator judgment on the day — build in a buffer day rather than a fixed slot.',
      'Book with a licensed, insured operator, and confirm safety equipment before booking.',
      'Billing is noticeably colder and windier than Bir — carry a layer even on a clear day.'
    ],
    matchScores: { adventure: 90, nature: 60, luxury: 30, crowds: 40, slowTravel: 55 },
    seasonalNotes: {
      Autumn: 'October–November has some of the most reliable flying conditions of the year.',
      Winter: 'December–February is cooler with fewer crowds; flying still runs on suitable-weather days.',
      Spring: 'March–April brings clearer skies again as winter fog clears, ahead of the pre-monsoon haze.'
    }
  },
  {
    slug: 'sangla-valley',
    title: 'Sangla Valley',
    category: 'Adventure',
    description: 'Apple orchards and apricot groves along the Baspa river, deep in the Kinnaur Himalayas.',
    toursCount: 7,
    image: images.destinations.sanglaValley,
    region: 'Kinnaur Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Sangla is the Baspa Valley’s main town — the practical base for the whole valley, rather than a quiet extension of it. Orchards run down to the river on both sides, and Kamru Fort watches over the town from a hill just above it. Kinnaur itself is the wider district; Sangla is where most travelers actually stay, using it as the launch point for Chitkul further up the valley.',
    bestTime: 'May – October',
    idealDuration: '2–3 Days',
    altitude: '2,700 m',
    travelStyles: ['Adventure', 'Nature', 'Slow travel'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Couples', 'Friends & Groups'],
    highlights: [
      { title: 'Kamru Fort', description: 'A 15th-century fortified temple complex on a hilltop above the town, with sweeping Baspa Valley views.' },
      { title: 'Orchard-lined riverbanks', description: 'Apple and apricot orchards running along both sides of the Baspa.' },
      { title: 'Base for the upper Baspa Valley', description: 'The practical stop before continuing on to Chitkul.' }
    ],
    places: [
      { title: 'Kamru Fort', description: 'A short hike or drive above Sangla town, including the Badri Vishal temple complex.' },
      { title: 'Sangla Bazaar', description: 'The town’s small main market, the valley’s only real shopping stop.' },
      { title: 'Chitkul', description: 'A further, higher village around 25 km up the valley — an onward excursion rather than part of Sangla itself.' }
    ],
    experiences: ['Orchard walks', 'Kamru Fort visit', 'Baspa Valley road trip', 'Local market browsing'],
    relatedSlugs: ['chitkul', 'kinnaur'],
    seo: { title: 'Sangla Valley Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Sangla Valley trip — Kamru Fort, Baspa river orchards, and the gateway to Chitkul.' },
    hiddenGems: [
      { title: 'Kamru village lanes', description: 'The old village below the fort, quieter than the main bazaar.' },
      { title: 'Rakcham village', description: 'A smaller orchard hamlet on the road between Sangla and Chitkul.' }
    ],
    travelTips: [
      'Kamru Fort involves a short, steep climb — comfortable footwear helps.',
      'Sangla is the last reliable place to withdraw cash before Chitkul — plan accordingly.',
      'Roads beyond Sangla can close after heavy rain — check conditions before continuing up-valley.'
    ],
    matchScores: { adventure: 50, nature: 85, luxury: 30, crowds: 40, slowTravel: 65 },
    seasonalNotes: {
      Summer: 'June–August is green and accessible, though July–August monsoon rain can affect the roads.',
      Autumn: 'September–October is the clearest, most stable window, coinciding with the apple harvest.'
    }
  },
  {
    slug: 'chamba',
    title: 'Chamba',
    category: 'Colonial Charm',
    description: 'A former Himalayan princely capital on the Ravi River, built around temples and a historic town square.',
    toursCount: 10,
    image: images.destinations.chamba,
    region: 'Chamba District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Chamba has been a town in its own right since around 920 CE, when Raja Sahil Varman moved his capital here and named it after his daughter. That history is still legible today: the Chaugan — the open ground at the town’s centre — the 10th-century Lakshmi Narayan temple complex, and a museum built specifically to hold the kingdom’s art. It sits low and warm on the Ravi River, a different register entirely from the cooler colonial hill stations further along this district.',
    bestTime: 'March – June, September – November',
    idealDuration: '2–3 Days',
    altitude: '1,006 m',
    travelStyles: ['Culture', 'Family'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Lakshmi Narayan Temple complex', description: 'A cluster of 10th-century Shikhara-style temples in the town centre, still in active use.' },
      { title: 'The Chaugan', description: 'A wide public ground that has been Chamba’s civic heart for centuries.' },
      { title: 'Bhuri Singh Museum', description: 'A museum built in 1908 around the former royal court’s art, miniature paintings and manuscripts.' }
    ],
    places: [
      { title: 'Lakshmi Narayan Temple', description: 'The town’s principal temple complex, dating to the 10th century.' },
      { title: 'Bhuri Singh Museum', description: 'Housed a short walk from the Chaugan, covering Chamba’s painting and craft traditions.' },
      { title: 'The Chaugan', description: 'The town’s central open ground, framed by the Ravi River on one side.' }
    ],
    experiences: ['Temple visits', 'Museum visit', 'Old-town walks', 'Riverside evenings on the Chaugan'],
    relatedSlugs: ['dalhousie', 'khajjiar'],
    seo: { title: 'Chamba Travel Guide & Experiences | The Apex Voyager', description: 'Discover Chamba — a 1,000-year-old Himalayan princely town of temples, museums and the Ravi River.' },
    hiddenGems: [
      { title: 'Rang Mahal', description: 'A former royal palace with distinctive Pahari-style painted interiors, quieter than the main temple complex.' }
    ],
    travelTips: [
      'The Lakshmi Narayan complex is a working temple — dress modestly and expect to remove footwear.',
      'The Bhuri Singh Museum is compact — an hour is usually enough to see it properly.',
      'Chamba sits lower and warmer than Dalhousie — pack for milder weather than the hill stations above it.'
    ],
    matchScores: { adventure: 20, nature: 45, luxury: 30, crowds: 45, slowTravel: 60 },
    seasonalNotes: {
      Summer: 'April–June is comfortably warm and clear, before the monsoon arrives.',
      Autumn: 'September–November is cool and dry, a good season for walking the old town.'
    }
  },
  {
    slug: 'dalhousie',
    title: 'Dalhousie',
    category: 'Colonial Charm',
    description: 'A colonial-era hill station spread across five hills, built by the British as a summer retreat in 1850.',
    toursCount: 11,
    image: images.destinations.dalhousie,
    region: 'Chamba District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Dalhousie was laid out by the British in 1850 across five hills — Kathlog, Potreyn, Terah, Bakrota and Bhangora — as a cooler alternative to the plains, and its ridge roads, colonial churches and pine forest still carry that character. At around 1,970 m it’s noticeably cooler than Chamba below it, and its walking routes between the hills make it a good slower base rather than a single-sight stop.',
    bestTime: 'March – June, September – November',
    idealDuration: '2–3 Days',
    altitude: '1,970 m',
    travelStyles: ['Culture', 'Family', 'Slow travel'],
    seasons: ['Summer', 'Monsoon', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Five interconnected hills', description: 'Ridge roads link Kathlog, Potreyn, Terah, Bakrota and Bhangora — good ground for unhurried walks.' },
      { title: 'Colonial-era churches', description: 'St. Francis and St. John’s churches remain from Dalhousie’s time as a British summer station.' },
      { title: 'Forest and viewpoint walks', description: 'Pine and deodar forest trails between the hills, with wide valley views.' }
    ],
    places: [
      { title: 'Subhash Baoli', description: 'A forested viewpoint and spring on Bakrota Hill.' },
      { title: 'St. John’s Church', description: 'A colonial-era church in the town centre, one of the oldest in Dalhousie.' },
      { title: 'Khajjiar', description: 'A meadow and lake around 22 km away — a popular day trip, not part of Dalhousie itself.' }
    ],
    experiences: ['Ridge walks between hills', 'Colonial church visits', 'Forest photography', 'Day trip to Khajjiar'],
    relatedSlugs: ['khajjiar', 'chamba'],
    seo: { title: 'Dalhousie Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Dalhousie trip — colonial-era churches, five interconnected hills, and easy access to Khajjiar.' },
    hiddenGems: [
      { title: 'Panchpula', description: 'A quiet forest stream and memorial spot, a short walk from the main bazaar.' },
      { title: 'Bakrota Hill walking loop', description: 'A circular forest walk with valley views, far less busy than the main mall road.' }
    ],
    travelTips: [
      'Distances between the five hills are longer on foot than they look on a map — plan a full morning or afternoon, not a quick loop.',
      'Evenings are cool even in summer — bring a proper layer.',
      'Khajjiar is an easy half-day trip from here — no need to change base to see it.'
    ],
    matchScores: { adventure: 25, nature: 65, luxury: 45, crowds: 65, slowTravel: 55 },
    seasonalNotes: {
      Summer: 'April–June is Dalhousie’s classic season — cool relief from the plains’ heat.',
      Autumn: 'September–November is clear and quiet, with good visibility on the ridge walks.'
    }
  },
  {
    slug: 'khajjiar',
    title: 'Khajjiar',
    category: 'Offbeat',
    description: 'A small meadow and lake ringed by deodar forest, roughly midway between Dalhousie and Chamba.',
    toursCount: 6,
    image: images.destinations.khajjiar,
    region: 'Chamba District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Khajjiar is a stop, not a stay-a-week destination — a saucer-shaped meadow with a small lake at its centre, ringed by deodar forest at around 1,950 m. The 12th-century Khajji Nag temple sits at the meadow’s edge, and a short walk or pony ride covers most of what’s here. It works best as a half-day break between Dalhousie and Chamba rather than a base of its own.',
    bestTime: 'March – June, September – November',
    idealDuration: 'Half Day – 1 Day',
    altitude: '1,950 m',
    travelStyles: ['Offbeat', 'Nature', 'Romantic'],
    seasons: ['Summer', 'Monsoon'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'Meadow and lake', description: 'An open grassy plateau with a small lake at its centre, framed by forest.' },
      { title: 'Khajji Nag Temple', description: 'A 12th-century wooden temple at the edge of the meadow.' }
    ],
    places: [
      { title: 'Khajjiar Lake', description: 'The small lake at the centre of the meadow.' },
      { title: 'Khajji Nag Temple', description: 'A centuries-old wooden temple dedicated to the local serpent deity.' }
    ],
    experiences: ['Meadow walks', 'Temple visit', 'Photography stop'],
    relatedSlugs: ['dalhousie', 'chamba'],
    seo: { title: 'Khajjiar Travel Guide | The Apex Voyager', description: 'Plan a Khajjiar stop — meadow, lake and forest between Dalhousie and Chamba.' },
    hiddenGems: [
      { title: 'Khajjiar’s small golf course', description: 'A modest putting course beside the lake that most day-trippers walk straight past.' }
    ],
    travelTips: [
      'An hour or two comfortably covers the meadow and temple — no need to add extra time.',
      'It gets busy with day-trippers in peak season — an early visit is quieter.'
    ]
  },
  {
    slug: 'gulmarg',
    title: 'Gulmarg',
    category: 'Scenic',
    description: 'Alpine meadows and snow-capped peaks in Kashmir, home to one of the world’s highest gondola rides.',
    toursCount: 9,
    image: images.destinations.gulmarg,
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
    relatedSlugs: ['srinagar', 'pahalgam', 'sonamarg'],
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
    image: images.destinations.rishikesh,
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
    relatedSlugs: ['haridwar', 'dehradun', 'mussoorie'],
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
    image: images.destinations.haridwar,
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
    relatedSlugs: ['rishikesh', 'dehradun', 'lansdowne'],
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
    image: images.destinations.munsiyari,
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
      { title: 'Johar Valley trailheads', description: 'A launch point for remote Kumaon treks most travelers never reach.' },
      { title: 'Gateway to Milam Glacier', description: 'The usual base camp town for the multi-day trek to Milam Glacier, for prepared trekkers.' }
    ],
    places: [
      { title: 'Khaliya Top', description: 'A high meadow above town with a 360-degree Panchachuli view.' },
      { title: 'Birthi Falls', description: 'A roadside waterfall on the drive in from Munsiyari’s approach road.' },
      { title: 'Nanda Devi Temple', description: 'A small local temple in the town itself.' }
    ],
    experiences: ['Panchachuli viewpoints', 'Khaliya Top day hike', 'Milam Glacier trek (multi-day, guided)', 'Local Kumaoni village visits'],
    hiddenGems: [
      { title: 'Khaliya Top', description: 'A high meadow trek with a 360-degree Panchachuli view, quiet even in season.' },
      { title: 'Birthi Falls', description: 'A roadside waterfall on the way in, most through-travelers just drive past.' }
    ],
    travelTips: [
      'The road in from Kathgodam is long — plan for a full day of travel, not a quick add-on.',
      'The Milam Glacier trek needs a permit and a guide — this is not a casual day trek.',
      'Panchachuli visibility is best at sunrise and sunset — plan viewpoint time around those windows.'
    ],
    matchScores: { adventure: 65, nature: 90, luxury: 25, crowds: 10, slowTravel: 65 },
    seasonalNotes: {
      Spring: 'April–June gives the clearest Panchachuli views before the monsoon haze sets in.',
      Autumn: 'September–November is the other reliable window, with cool, settled weather for the Khaliya Top hike.'
    },
    relatedSlugs: ['rishikesh', 'almora'],
    seo: { title: 'Munsiyari Travel Guide & Experiences | The Apex Voyager', description: 'Discover Munsiyari — Panchachuli views and Uttarakhand’s quietest Himalayan valley.' }
  },
  {
    slug: 'srinagar',
    title: 'Srinagar',
    category: 'Scenic',
    description: 'Kashmir’s valley capital — Dal Lake, Mughal gardens and centuries of houseboat life.',
    toursCount: 12,
    image: images.destinations.srinagar,
    region: 'Srinagar District',
    state: 'Jammu & Kashmir',
    editorialDescription: 'Srinagar is where the Kashmir Valley does its living — houseboats and shikaras along Dal Lake, terraced Mughal gardens climbing the hillsides above it, and an old city of wooden shopfronts and shrines that rewards a slow wander. It’s also the valley’s working hub: its airport and highways are how most Kashmir trips begin, so plan two or three days here rather than treating it as a stopover.',
    bestTime: 'March – October',
    idealDuration: '2–3 Days',
    altitude: '1,600 m',
    travelStyles: ['Nature', 'Family', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Dal Lake by shikara', description: 'Houseboats, floating gardens and quiet backwaters, best seen from a hand-paddled shikara at dawn.' },
      { title: 'Mughal garden terraces', description: 'Shalimar Bagh and Nishat Bagh climb the hillside above the lake in formal, fountain-fed terraces.' },
      { title: 'The old city', description: 'Wooden shopfronts, shrines and the Jhelum riverfront, away from the lake-facing tourist strip.' }
    ],
    places: [
      { title: 'Dal Lake', description: 'The city’s defining lake, ringed by houseboats, floating gardens and the Mughal gardens above it.' },
      { title: 'Shalimar Bagh', description: 'A terraced Mughal garden built for Emperor Jahangir in 1619, with fountains and chinar trees.' },
      { title: 'Nishat Bagh', description: 'A larger, twelve-terraced garden looking across the lake toward the Zabarwan hills.' },
      { title: 'Jama Masjid', description: 'A 14th-century mosque in the old city, rebuilt in Kashmiri wooden architecture after repeated fires.' }
    ],
    experiences: ['Shikara rides on Dal Lake', 'Mughal garden walks', 'Old city heritage walks', 'Kashmiri cuisine', 'Houseboat stays'],
    relatedSlugs: ['gulmarg', 'pahalgam', 'sonamarg'],
    seo: { title: 'Srinagar Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Srinagar trip — Dal Lake, Mughal gardens and the valley’s old city, Kashmir’s travel hub.' },
    apexPicks: {
      view: { title: 'Shalimar Bagh at golden hour', description: 'Terraced fountains and chinar trees catching the evening light.' },
      stay: { title: 'A houseboat on Dal Lake', description: 'Carved-walnut interiors and a private deck a few oar-strokes from the shore.' },
      experience: { title: 'A dawn shikara ride', description: 'The lake at its stillest, before the floating vegetable market gets busy.' },
      taste: { title: 'Kahwa and a Wazwan feast', description: 'Saffron tea and Kashmir’s traditional multi-course meal.' },
      moment: { title: 'Sunset over the Zabarwan hills', description: 'The lake turning gold as houseboats light their lamps.' }
    },
    hiddenGems: [
      { title: 'Chashme Shahi', description: 'A small, spring-fed Mughal garden, quieter than Shalimar and Nishat.' },
      { title: 'Downtown Srinagar', description: 'The old city’s lanes and shrines, a short walk from the lake but rarely visited.' }
    ],
    travelTips: [
      'Agree a shikara/houseboat rate before boarding — most are unmetered.',
      'Garden entry can involve a queue in peak season (April–June); an early visit is quieter.',
      'Pack layers — evenings by the lake are cool even in summer.'
    ],
    matchScores: { adventure: 35, nature: 70, luxury: 65, crowds: 70, slowTravel: 55 },
    seasonalNotes: {
      Spring: 'March–May brings tulip season and the gardens at their fullest bloom.',
      Summer: 'June–August is peak season — warm days, cool evenings by the lake.',
      Autumn: 'September–October turns the chinar trees gold, with fewer crowds than summer.'
    }
  },
  {
    slug: 'pahalgam',
    title: 'Pahalgam',
    category: 'Adventure',
    description: 'A Lidder Valley mountain base, and the Kashmir Valley’s classic multi-day retreat.',
    toursCount: 10,
    image: images.destinations.pahalgam,
    region: 'Anantnag District',
    state: 'Jammu & Kashmir',
    editorialDescription: 'Pahalgam sits where the Lidder River opens into a wide, pine-lined valley — the kind of base that rewards staying a few nights rather than passing through. The town itself is unhurried; its real draw is the valley around it, from riverside meadows a short walk from your hotel to Aru and Betaab further up the road.',
    bestTime: 'April – October',
    idealDuration: '3–4 Days',
    altitude: '2,200 m',
    travelStyles: ['Nature', 'Family', 'Adventure'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'The Lidder Valley', description: 'Pine forest, riverside meadows and the Lidder River running through the middle of town.' },
      { title: 'A trekking gateway', description: 'The traditional start of the Amarnath Yatra route, and trailheads for Kolahoi Glacier and Tarsar-Marsar.' },
      { title: 'Nearby valleys', description: 'Aru and Betaab Valley are both a short drive away, each with a distinct character from Pahalgam itself.' }
    ],
    places: [
      { title: 'Pahalgam town', description: 'The valley base — hotels, the Lidder riverfront and the main market.' },
      { title: 'Betaab Valley', description: 'A ticketed sightseeing stop about 15 km up the valley, named after the 1983 film shot there.' },
      { title: 'Aru Valley', description: 'A quieter village 12 km on, and the trailhead for Kolahoi Glacier and Tarsar-Marsar treks.' },
      { title: 'Chandanwari', description: 'A viewpoint further up the valley and the traditional starting point of the Amarnath Yatra.' }
    ],
    experiences: ['Riverside pony treks', 'Valley sightseeing (Aru, Betaab, Chandanwari)', 'Trekking toward Kolahoi Glacier', 'Fishing on the Lidder River'],
    relatedSlugs: ['srinagar', 'gulmarg', 'sonamarg'],
    seo: { title: 'Pahalgam Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Pahalgam trip — the Lidder Valley, Aru and Betaab, and Kashmir’s classic mountain base.' },
    apexPicks: {
      view: { title: 'The Lidder River valley at dawn', description: 'Mist over the pine forest before the day’s traffic reaches the valley road.' },
      stay: { title: 'A riverside hotel on the Lidder', description: 'Rooms with a private view of the river, a short walk from town.' },
      experience: { title: 'A pony trek through the meadows', description: 'An easy, guided ride along the riverside trail.' },
      taste: { title: 'Kahwa by the river', description: 'Saffron tea at a riverside dhaba, valley views included.' },
      moment: { title: 'Evening light over Betaab Valley', description: 'The valley empties out as day-trippers head back to Srinagar.' }
    },
    hiddenGems: [
      { title: 'Baisaran meadow', description: 'A forested meadow above town, reached on foot or horseback, quieter than the main valley road.' },
      { title: 'Aru Valley beyond the village', description: 'Most visitors turn back at the village; the trail onward toward Tarsar-Marsar sees far fewer people.' }
    ],
    travelTips: [
      'Check current official travel advisories before finalizing your Pahalgam itinerary — conditions in the region can change, and local authorities are the best source for up-to-date guidance.',
      'Agree on sightseeing-taxi and pony rates in advance — both are typically negotiated, not metered.',
      'Aru, Betaab and Chandanwari are all half-day add-ons, not separate overnight stops — plan one valley-sightseeing day for all three.'
    ],
    matchScores: { adventure: 55, nature: 80, luxury: 55, crowds: 55, slowTravel: 60 },
    seasonalNotes: {
      Spring: 'April–May is quieter, with the valley turning green as the snow retreats.',
      Summer: 'June–August is peak season for valley sightseeing and pony treks.',
      Autumn: 'September–October brings clear skies and fewer crowds before the valley cools.'
    }
  },
  {
    slug: 'sonamarg',
    title: 'Sonamarg',
    category: 'Scenic',
    description: 'A high-altitude valley on the Srinagar–Leh road, and gateway to Kashmir’s glacier and lake treks.',
    toursCount: 7,
    image: images.destinations.sonamarg,
    region: 'Ganderbal District',
    state: 'Jammu & Kashmir',
    editorialDescription: 'Sonamarg — the “Meadow of Gold” — sits higher and wilder than Srinagar’s other valley towns, where the Sindh River braids across an open valley floor before the road climbs on toward Zojila Pass. It’s less a place to linger in town and more a base: for the walk toward Thajiwas, for high-altitude lakes reached on longer treks, and for travelers continuing on the Srinagar–Leh road.',
    bestTime: 'May – September',
    idealDuration: '1–2 Days',
    altitude: '2,730 m',
    travelStyles: ['Adventure', 'Nature'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Friends & Groups', 'Solo Travelers'],
    highlights: [
      { title: 'The Sindh Valley', description: 'A wide, high-altitude valley where the Sindh River threads through pine forest and open meadow.' },
      { title: 'Thajiwas', description: 'A well-known walk or pony ride toward glacial terrain above the town, a common first taste of the high mountains.' },
      { title: 'Gateway to the high lakes', description: 'Vishansar, Krishansar, Gangabal and Gadsar lakes lie beyond Sonamarg, reached on multi-day treks.' }
    ],
    places: [
      { title: 'Sonamarg town', description: 'The valley base, mainly hotels and dhabas strung along the Srinagar–Leh road.' },
      { title: 'Thajiwas', description: 'A meadow and glacial area above the town, reached on foot or pony.' },
      { title: 'Baltal', description: 'A further staging point up the valley, used seasonally for the Amarnath Yatra.' }
    ],
    experiences: ['Trekking toward Thajiwas', 'Pony rides', 'High-altitude lake treks (multi-day)', 'Valley photography'],
    relatedSlugs: ['srinagar', 'gulmarg', 'pahalgam'],
    seo: { title: 'Sonamarg Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Sonamarg trip — the Sindh Valley, Thajiwas, and Kashmir’s gateway to the high mountains.' },
    apexPicks: {
      view: { title: 'The Sindh Valley floor', description: 'Braided river channels against a backdrop of pine and high ridgelines.' },
      stay: { title: 'A valley-facing hotel on the Srinagar–Leh road', description: 'Simple, mountain-facing rooms a short walk from the river.' },
      experience: { title: 'The walk toward Thajiwas', description: 'A half-day out toward the glacial terrain above town, conditions permitting.' },
      taste: { title: 'A hot meal at a roadside dhaba', description: 'Simple, warming food built for travelers heading further into the mountains.' },
      moment: { title: 'Morning mist over the Sindh River', description: 'The valley at its quietest, before the day’s traffic on the Leh road picks up.' }
    },
    hiddenGems: [
      { title: 'Baltal', description: 'Quieter than Sonamarg itself, and the practical start point for Amarnath Yatra pilgrims in season.' },
      { title: 'The upper Sindh Valley viewpoints', description: 'A short way beyond town, with far fewer visitors than the main Thajiwas walk.' }
    ],
    travelTips: [
      'Road and trail conditions are genuinely seasonal here — confirm current access before you plan around Thajiwas or points further up the valley.',
      'Don’t plan on glacier or high-lake access without checking conditions first — routes beyond Thajiwas require a guide and can close without notice.',
      'Carry warm layers even in summer — evenings drop sharply at this altitude.'
    ],
    matchScores: { adventure: 65, nature: 80, luxury: 35, crowds: 45, slowTravel: 40 },
    seasonalNotes: {
      Spring: 'May–June opens the valley as snow retreats, though upper trails can still be closed.',
      Summer: 'July–August is the most reliable season for the Thajiwas walk and valley access.',
      Autumn: 'September brings clear, cool days before winter closes the road toward Zojila.'
    }
  },
  {
    slug: 'dehradun',
    title: 'Dehradun',
    category: 'Scenic',
    description: 'The Doon Valley capital and Garhwal\'s main gateway, with a quieter identity of its own.',
    toursCount: 8,
    image: images.destinations.dehradun,
    region: 'Dehradun District',
    state: 'Uttarakhand',
    editorialDescription: 'Dehradun sits low in the Doon Valley between the Shivaliks and the Himalayan foothills — Uttarakhand\'s capital, its main airport and rail link, and the practical start of most Garhwal itineraries. It\'s worth more than a night in transit: the Forest Research Institute\'s century-old campus, quiet cantonment-era lanes and a milder climate than the hills above make it a real, if understated, city stop before you climb toward Mussoorie or Rishikesh.',
    bestTime: 'October – March',
    idealDuration: '1–2 Days',
    altitude: '450 m',
    travelStyles: ['Family', 'Nature', 'Culture'],
    seasons: ['Autumn', 'Winter', 'Spring'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Garhwal\'s main gateway', description: 'Jolly Grant Airport and Dehradun railway station make this the entry point for most of the region.' },
      { title: 'Forest Research Institute', description: 'A century-old colonial campus and one of Asia\'s largest forestry research institutions.' },
      { title: 'A milder valley climate', description: 'Lower and warmer than Mussoorie above it, useful either end of a hill trip.' }
    ],
    places: [
      { title: 'Forest Research Institute', description: 'A grand 1920s building set in wide lawns, with a museum on forestry and conservation.' },
      { title: 'Robber\'s Cave (Guchhupani)', description: 'A narrow stream-carved gorge you wade through, a popular half-day outing.' },
      { title: 'Sahastradhara', description: 'Sulphur springs and a cave waterfall on the city\'s outskirts.' },
      { title: 'Paltan Bazaar', description: 'The old city\'s central market street, for a sense of everyday Dehradun.' }
    ],
    experiences: ['Forest Research Institute visit', 'Robber\'s Cave wade', 'City heritage walk', 'Sahastradhara day trip'],
    relatedSlugs: ['mussoorie', 'rishikesh', 'haridwar'],
    seo: { title: 'Dehradun Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Dehradun stop — the Forest Research Institute, Robber\'s Cave, and Garhwal\'s main gateway city.' },
    hiddenGems: [
      { title: 'Tapkeshwar Temple', description: 'A cave temple on the Tons riverbed, quieter than the city\'s better-known sights.' }
    ],
    travelTips: [
      'Use Dehradun to break a long Delhi–Mussoorie or Delhi–Rishikesh drive rather than rushing through.',
      'Book onward hill transport a day ahead in peak season — taxis fill up fast from the airport and station.',
      'Robber\'s Cave involves wading through shallow water — bring a change of footwear.'
    ],
    matchScores: { adventure: 30, nature: 55, luxury: 45, crowds: 60, slowTravel: 35 },
    seasonalNotes: {
      Autumn: 'October–November is clear and comfortable, good for city sightseeing.',
      Winter: 'December–February stays mild in the valley even when the hills above turn cold.',
      Spring: 'March brings warming days before the pre-monsoon heat builds.'
    }
  },
  {
    slug: 'mussoorie',
    title: 'Mussoorie',
    category: 'Colonial Charm',
    description: 'A ridge-top hill station above the Doon Valley, built around Mall Road and its viewpoints.',
    toursCount: 14,
    image: images.destinations.mussoorie,
    region: 'Dehradun District',
    state: 'Uttarakhand',
    editorialDescription: 'Mussoorie runs along a ridge above the Doon Valley, its Mall Road strip of shops, cafes and old hotel facades still the town\'s center of gravity. Landour, the quieter cantonment area just above it, is where the pace slows down — worth the extra walk if Mall Road feels busy. On a clear day the views reach toward the Himalayan foothills, though cloud and haze are common enough that it\'s a bonus, not a promise.',
    bestTime: 'March – June, September – November',
    idealDuration: '2–3 Days',
    altitude: '2,000 m',
    travelStyles: ['Nature', 'Family', 'Romantic'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'Mall Road', description: 'The ridge-top strip of shops, cafes and colonial-era facades that anchors the town.' },
      { title: 'Landour', description: 'A quieter cantonment area just above Mall Road, with its own slower rhythm.' },
      { title: 'Doon Valley views', description: 'Gun Hill and other viewpoints look down over Dehradun and, on a clear day, the hills beyond.' }
    ],
    places: [
      { title: 'Mall Road', description: 'The main pedestrian strip, busiest in the evenings.' },
      { title: 'Gun Hill', description: 'A ropeway-accessed viewpoint above Mall Road.' },
      { title: 'Landour', description: 'A quieter hillside area with old bakeries and walking lanes, a short walk above the main town.' },
      { title: 'Kempty Falls', description: 'A popular waterfall stop around 15 km from town.' }
    ],
    experiences: ['Mall Road evening walk', 'Gun Hill ropeway ride', 'Landour heritage walk', 'Kempty Falls day trip'],
    relatedSlugs: ['dehradun', 'rishikesh'],
    seo: { title: 'Mussoorie Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Mussoorie trip — Mall Road, Landour\'s quieter lanes, and Doon Valley viewpoints.' },
    hiddenGems: [
      { title: 'Camel\'s Back Road', description: 'A quiet walking and horse-riding road looping past Landour, far less crowded than Mall Road.' }
    ],
    travelTips: [
      'Weekend and holiday traffic on the Dehradun–Mussoorie road can be slow — build in buffer time.',
      'Monsoon months (July–September) bring landslide risk on the approach road; check conditions before travel.',
      'Pack layers — Mall Road evenings turn cool even in peak summer.'
    ],
    matchScores: { adventure: 30, nature: 65, luxury: 55, crowds: 75, slowTravel: 45 },
    seasonalNotes: {
      Spring: 'March–May is a comfortable, popular window before the summer crowds peak.',
      Summer: 'June is Mussoorie\'s busiest season — a plains-heat escape for many travelers.',
      Autumn: 'September–November is quieter with clearer air, once the monsoon clears.'
    }
  },
  {
    slug: 'joshimath',
    title: 'Joshimath (Jyotirmath)',
    category: 'Offbeat',
    description: 'Upper Garhwal\'s practical mountain base, and the gateway town beneath Auli.',
    toursCount: 6,
    image: images.destinations.joshimath,
    region: 'Chamoli District',
    state: 'Uttarakhand',
    editorialDescription: 'Joshimath — also recorded in official use as Jyotirmath — clings to a steep mountainside where the roads toward Auli and the upper Alaknanda valley meet. It\'s a working town first, not a resort: hotels, market stalls and transport stands built for travelers passing through rather than lingering. The Narsingh Temple and the town\'s association with Adi Shankaracharya give it a real historical layer, but its main job today is as the base from which you reach Auli\'s slopes or continue further into the mountains.',
    bestTime: 'April – June, September – November',
    idealDuration: '1–2 Days',
    altitude: '1,875 m',
    travelStyles: ['Adventure', 'Nature'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Friends & Groups', 'Solo Travelers'],
    highlights: [
      { title: 'Base for Auli', description: 'The town from which Auli\'s ropeway and road access begin.' },
      { title: 'Narsingh Temple', description: 'A historic temple tied to the town\'s Jyotirmath identity and Adi Shankaracharya.' },
      { title: 'Mountainside setting', description: 'Terraced buildings stacked against the slope, with bare Himalayan ridgelines behind.' }
    ],
    places: [
      { title: 'Narsingh Temple', description: 'The town\'s principal historic temple, set against the mountain backdrop.' },
      { title: 'Auli ropeway base station', description: 'The lower terminus of the ropeway climbing toward Auli.' },
      { title: 'Vishnuprayag', description: 'A river confluence a short drive from town, on the road toward the upper valley.' }
    ],
    experiences: ['Auli ropeway access', 'Narsingh Temple visit', 'Regional trekking base'],
    relatedSlugs: ['auli', 'rishikesh', 'badrinath'],
    seo: { title: 'Joshimath Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Joshimath stop — the base for Auli, Narsingh Temple, and upper Garhwal\'s mountain roads.' },
    travelTips: [
      'Joshimath has had documented land-subsidence concerns in recent years — check current official advisories before booking accommodation, and avoid assuming every hotel listed is unaffected.',
      'Roads beyond Joshimath toward the upper valley are seasonal and weather-dependent — do not assume year-round or same-day access.',
      'Book a base here rather than assuming same-day travel further up the valley in one stretch.'
    ],
    matchScores: { adventure: 55, nature: 60, luxury: 30, crowds: 40, slowTravel: 30 },
    seasonalNotes: {
      Spring: 'April–June is a comfortable window before monsoon travel disruption.',
      Summer: 'July–August brings monsoon rain and a higher chance of road disruption on approach routes.',
      Autumn: 'September–November is generally clear, ahead of winter cold.'
    }
  },
  {
    slug: 'auli',
    title: 'Auli',
    category: 'Adventure',
    description: 'A high-altitude slope above Joshimath, India\'s best-known ski destination in winter.',
    toursCount: 7,
    image: images.destinations.auli,
    region: 'Chamoli District',
    state: 'Uttarakhand',
    editorialDescription: 'Auli is a ridge of open slopes and meadow above Joshimath, reached by road or by a long ropeway ride — one of Asia\'s longer cable-car runs. In winter it\'s India\'s most established ski slope, with views toward Nanda Devi and the surrounding peaks on a clear day. Come summer, the snow gives way to Auli Bugyal\'s meadow and a quieter, greener character. Most travelers base themselves in Joshimath and treat Auli as a day up and back rather than an overnight stay.',
    bestTime: 'December – March (skiing), April – June (meadows)',
    idealDuration: '1 Day',
    altitude: '2,800 m',
    travelStyles: ['Adventure', 'Nature'],
    seasons: ['Winter', 'Summer'],
    bestFor: ['Friends & Groups', 'Couples'],
    highlights: [
      { title: 'The Joshimath–Auli ropeway', description: 'A long cable-car ride up from the valley floor, a highlight in its own right.' },
      { title: 'Winter skiing', description: 'India\'s best-known ski slope, when snow and operations allow.' },
      { title: 'Auli Bugyal in summer', description: 'The slopes turn to open meadow once the snow retreats.' }
    ],
    places: [
      { title: 'Auli ropeway upper station', description: 'The top of the cable-car run, with the main slope and viewpoints around it.' },
      { title: 'Auli Bugyal', description: 'The meadow that the ski slope becomes outside winter.' },
      { title: 'Gorson Bugyal', description: 'A further meadow beyond the main slope, reached on foot.' }
    ],
    experiences: ['Skiing & snowboarding (seasonal)', 'Ropeway ride', 'Meadow walks (summer)'],
    relatedSlugs: ['joshimath'],
    seo: { title: 'Auli Travel Guide & Experiences | The Apex Voyager', description: 'Plan an Auli trip — the Joshimath ropeway, seasonal skiing, and summer meadow views.' },
    travelTips: [
      'Skiing and ropeway operation depend on current snow and weather conditions — confirm before building a trip around them.',
      'Base your stay in Joshimath if Auli\'s limited on-slope lodging is full.',
      'Carry warm layers even in summer — the altitude keeps evenings cold year-round.'
    ],
    matchScores: { adventure: 75, nature: 65, luxury: 40, crowds: 45, slowTravel: 25 },
    seasonalNotes: {
      Winter: 'December–March is ski season, when snow and conditions allow — confirm current status before you go.',
      Summer: 'April–June turns the slope into open meadow, with walking replacing the snow sports.'
    }
  },
  {
    slug: 'chopta',
    title: 'Chopta',
    category: 'Adventure',
    description: 'A small meadow base in Rudraprayag district, and the trailhead for Tungnath and Chandrashila.',
    toursCount: 6,
    image: images.destinations.chopta,
    region: 'Rudraprayag District',
    state: 'Uttarakhand',
    editorialDescription: 'Chopta is barely a settlement — a scatter of dhabas and simple stays around an open meadow ringed by rhododendron and fir forest. Its real role is as a base: Tungnath, one of the Panch Kedar temples and among the highest Shiva temples in the Himalaya, sits a trek above the meadow, with Chandrashila\'s summit further still. Deoriatal, a forest lake, is a separate day-trek from a different trailhead nearby. Most travelers pass a night or two here specifically to stage one of these walks, not to sightsee the meadow alone.',
    bestTime: 'April – June, September – November',
    idealDuration: '1–2 Days',
    altitude: '2,700 m',
    travelStyles: ['Adventure', 'Nature'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Friends & Groups', 'Solo Travelers'],
    highlights: [
      { title: 'A meadow base for the trek', description: 'Open grassland ringed by rhododendron and fir, with simple dhaba-style stays.' },
      { title: 'Tungnath & Chandrashila', description: 'A trek from Chopta reaches the Tungnath temple and, further on, the Chandrashila summit.' },
      { title: 'Deoriatal', description: 'A separate forest-lake day-trek nearby, for travelers with an extra day.' }
    ],
    places: [
      { title: 'Chopta meadow', description: 'The open grassland where most stays and dhabas cluster.' },
      { title: 'Tungnath', description: 'One of the Panch Kedar temples, reached by trek from Chopta.' },
      { title: 'Deoriatal', description: 'A forest lake reached by a separate trek, roughly an hour\'s drive from Chopta.' }
    ],
    experiences: ['Tungnath & Chandrashila trek', 'Deoriatal day trek', 'Meadow camping'],
    relatedSlugs: ['rishikesh', 'joshimath'],
    seo: { title: 'Chopta Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Chopta trip — the trek base for Tungnath, Chandrashila, and Deoriatal.' },
    travelTips: [
      'The Tungnath trail and temple access depend on season and weather — confirm current trail conditions before you commit to the trek.',
      'Snow can close the upper trail outside the main April–November window; do not assume year-round access.',
      'Accommodation in Chopta is simple and limited — book ahead in peak trekking season.'
    ],
    matchScores: { adventure: 70, nature: 75, luxury: 20, crowds: 40, slowTravel: 35 },
    seasonalNotes: {
      Spring: 'April–June is a reliable trekking window before monsoon rain sets in.',
      Summer: 'July–August brings monsoon rain and slippery trail conditions.',
      Autumn: 'September–November is generally clear, though snow can arrive early at altitude.'
    }
  },
  {
    slug: 'lansdowne',
    title: 'Lansdowne',
    category: 'Offbeat',
    description: 'A quiet cantonment hill town in Pauri Garhwal, built for a short, unhurried break.',
    toursCount: 5,
    image: images.destinations.lansdowne,
    region: 'Pauri Garhwal District',
    state: 'Uttarakhand',
    editorialDescription: 'Lansdowne stays quiet by design — a Garhwal Rifles cantonment town wrapped in oak and pine forest, without the market-strip energy of Mussoorie further west. There\'s no single headline sight; the appeal is walking trails, a small lake, the regimental war memorial, and long stretches where the loudest thing around is the forest. It works best as a short, deliberate break rather than a multi-day itinerary — a couple of unhurried days are usually enough.',
    bestTime: 'March – June, September – November',
    idealDuration: '2 Days',
    altitude: '1,700 m',
    travelStyles: ['Nature', 'Family'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'Cantonment quiet', description: 'A working Garhwal Rifles cantonment town, deliberately low-key and uncrowded.' },
      { title: 'Forest walking trails', description: 'Oak and pine forest paths connect the town\'s main viewpoints.' },
      { title: 'A short, complete break', description: 'Compact enough to see properly in two days without feeling rushed.' }
    ],
    places: [
      { title: 'Tip n Top', description: 'A forest viewpoint on the edge of town, popular at sunset.' },
      { title: 'War Memorial', description: 'The Garhwal Rifles regimental war memorial and museum.' },
      { title: 'Bhulla Tal', description: 'A small artificial lake with boating, near the town center.' }
    ],
    experiences: ['Forest walking trails', 'War Memorial museum visit', 'Boating at Bhulla Tal'],
    relatedSlugs: ['dehradun', 'haridwar'],
    seo: { title: 'Lansdowne Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Lansdowne trip — forest walks, the Garhwal Rifles War Memorial, and a quiet short break.' },
    travelTips: [
      'Some cantonment areas are restricted to civilians — stick to the marked public viewpoints and roads.',
      'Carry cash — card acceptance is patchy in the smaller shops and dhabas.',
      'Two days is usually enough — Lansdowne rewards an unhurried pace rather than a packed itinerary.'
    ],
    matchScores: { adventure: 25, nature: 60, luxury: 30, crowds: 20, slowTravel: 60 },
    seasonalNotes: {
      Spring: 'March–May is comfortable and green, before the summer weekend crowds from Delhi-NCR arrive.',
      Summer: 'June brings a wave of weekend visitors escaping the plains heat.',
      Autumn: 'September–November is quiet and clear, once the monsoon clears.'
    }
  },
  {
    slug: 'nainital',
    title: 'Nainital',
    category: 'Scenic',
    description: 'Kumaon\'s best-known lake town, built in tiers around the crescent-shaped Naini Lake.',
    toursCount: 12,
    image: images.destinations.nainital,
    region: 'Nainital District',
    state: 'Uttarakhand',
    editorialDescription: 'Nainital is built around Naini Lake the way few Indian hill towns are built around anything — Mall Road runs along one shore, boats cross the water below it, and the hillsides climb steeply on both sides. It\'s Kumaon\'s busiest and most complete base: a real town with markets and old churches, not just a viewpoint, though the viewpoints above it (reached by ropeway or a stiff walk) are worth the climb.',
    bestTime: 'March – June, September – November',
    idealDuration: '2–3 Days',
    altitude: '1,938 m',
    travelStyles: ['Nature', 'Family', 'Romantic'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Naini Lake', description: 'The crescent lake at the town\'s centre, with boating and Mall Road along one shore.' },
      { title: 'Ropeway viewpoints', description: 'Snow View and other points above town, reached by cable car or a steep walk.' },
      { title: 'A complete hill-town base', description: 'Markets, churches and old colonial buildings alongside the lake, not just scenery.' }
    ],
    places: [
      { title: 'Naini Lake', description: 'The heart of the town, ringed by Mall Road and the hillside above it.' },
      { title: 'Snow View Point', description: 'A ropeway-accessed viewpoint above town, looking toward the Himalayan skyline on a clear day.' },
      { title: 'Naina Devi Temple', description: 'A lakeside temple at the northern end of Naini Lake.' },
      { title: 'Bhimtal', description: 'A quieter lake town about 22 km away, often visited as a half-day trip from Nainital.' }
    ],
    experiences: ['Boating on Naini Lake', 'Mall Road walk', 'Snow View ropeway ride', 'Naina Devi Temple visit'],
    relatedSlugs: ['mukteshwar', 'almora'],
    seo: { title: 'Nainital Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Nainital trip — Naini Lake, Mall Road and Kumaon\'s best-known hill-town base.' },
    hiddenGems: [
      { title: 'Naina Peak (China Peak)', description: 'The highest point above town, a genuine trek beyond the Snow View crowds.' }
    ],
    travelTips: [
      'Weekends and holiday season bring heavy traffic and parking congestion — arrive early or use a hotel that arranges parking.',
      'Agree a boating rate at the official counters rather than with touts along the lake.',
      'Pack layers — the lake keeps evenings cool even in summer.'
    ],
    matchScores: { adventure: 30, nature: 65, luxury: 55, crowds: 80, slowTravel: 35 },
    seasonalNotes: {
      Spring: 'March–May is comfortable and popular, before the summer peak.',
      Summer: 'June is Nainital\'s busiest season — expect crowds on Mall Road and the lake.',
      Autumn: 'September–November is quieter with clearer air, once the monsoon clears.'
    }
  },
  {
    slug: 'mukteshwar',
    title: 'Mukteshwar',
    category: 'Offbeat',
    description: 'A quiet ridge village above the Kumaon orchards, built around a cliff viewpoint and an old temple.',
    toursCount: 6,
    image: images.destinations.mukteshwar,
    region: 'Nainital District',
    state: 'Uttarakhand',
    editorialDescription: 'Mukteshwar sits on a forested ridge above the Kumaon fruit belt, far enough from Nainital to feel like its own place rather than an extension of it. The Mukteshwar Mahadev Temple gives the town its name, and Chauli ki Jali — a sheer cliff a short walk from the village — is the reason most people come. It\'s a slow, small-scale destination: orchards, a handful of stays, and views that depend entirely on the weather.',
    bestTime: 'March – June, September – November',
    idealDuration: '1–2 Days',
    altitude: '2,171 m',
    travelStyles: ['Nature', 'Romantic'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Friends & Groups'],
    highlights: [
      { title: 'Chauli ki Jali', description: 'A dramatic cliff-edge viewpoint a short walk from the village.' },
      { title: 'Mukteshwar Mahadev Temple', description: 'The old Shiva temple the town is named for, set on the ridge.' },
      { title: 'Orchard country', description: 'Apple and apricot orchards spread across the surrounding slopes.' }
    ],
    places: [
      { title: 'Chauli ki Jali', description: 'The village\'s main viewpoint, a rock face with a long drop and wide views.' },
      { title: 'Mukteshwar Mahadev Temple', description: 'A modest, old temple at the highest point of the village.' },
      { title: 'Orchards around the ridge', description: 'Working fruit orchards that give the area its quiet, rural character.' }
    ],
    experiences: ['Chauli ki Jali viewpoint visit', 'Temple visit', 'Orchard walks'],
    relatedSlugs: ['nainital'],
    seo: { title: 'Mukteshwar Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Mukteshwar trip — Chauli ki Jali, orchard country, and a quiet Kumaon ridge village.' },
    travelTips: [
      'Himalayan visibility from Chauli ki Jali depends on the weather — clear mornings are the best bet, not guaranteed.',
      'Stays are limited and small-scale — book ahead in peak season.',
      'There\'s little nightlife or late dining here by design — come for the quiet, not the options.'
    ],
    matchScores: { adventure: 35, nature: 65, luxury: 45, crowds: 30, slowTravel: 55 },
    seasonalNotes: {
      Spring: 'March–May brings orchard blossom and clear pre-monsoon skies.',
      Summer: 'June is warm and green, a cooler escape from the plains.',
      Autumn: 'September–November has the clearest air of the year.'
    }
  },
  {
    slug: 'almora',
    title: 'Almora',
    category: 'Offbeat',
    description: 'A former Chand-dynasty hill capital, and Kumaon\'s cultural and market town.',
    toursCount: 9,
    image: images.destinations.almora,
    region: 'Almora District',
    state: 'Uttarakhand',
    editorialDescription: 'Almora has been a hill town in its own right since the Chand kings made it their capital in the 16th century — a working market town on a horseshoe ridge, not a resort. Its bazaar still deals in copper craft and Kumaoni sweets, and the town serves as the practical base for exploring the wider region — Kausani and Ranikhet are both under an hour away, and Binsar\'s forest sanctuary a bit further. Almora\'s own identity is the town itself: steep lanes, old temples and a slower pace than the lake towns nearby.',
    bestTime: 'March – June, September – November',
    idealDuration: '2 Days',
    altitude: '1,638 m',
    travelStyles: ['Culture', 'Nature'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'A former hill capital', description: 'Chand-dynasty capital since the 16th century, with the historic character to match.' },
      { title: 'Bright End Corner', description: 'A ridge-edge viewpoint at the town\'s western end, known for sunset.' },
      { title: 'A Kumaon base', description: 'Kausani, Ranikhet and Binsar are all within about an hour, making Almora a practical hub.' }
    ],
    places: [
      { title: 'Bright End Corner', description: 'A quiet viewpoint at the edge of town, popular at sunset.' },
      { title: 'Nanda Devi Temple', description: 'Almora\'s own historic temple, distinct from the Naina Devi shrine at Nainital.' },
      { title: 'Almora Bazaar', description: 'The old market street, known for copper craft and local sweets.' },
      { title: 'Binsar Wildlife Sanctuary', description: 'A protected oak-and-rhododendron forest sanctuary about an hour away, with basic forest-rest-house stays and no guaranteed wildlife sightings.' }
    ],
    experiences: ['Heritage bazaar walk', 'Bright End Corner sunset', 'Nanda Devi Temple visit'],
    relatedSlugs: ['kausani', 'ranikhet', 'munsiyari'],
    seo: { title: 'Almora Travel Guide & Experiences | The Apex Voyager', description: 'Plan an Almora trip — Kumaon\'s historic hill capital, its bazaar, and the base for Kausani and Binsar.' },
    hiddenGems: [
      { title: 'Kasar Devi Temple', description: 'A hilltop temple a short drive from town, known for sweeping views and a long history as a quiet retreat.' }
    ],
    travelTips: [
      'Almora\'s lanes are steep and largely pedestrian — expect to park at the edge of town and walk in.',
      'Binsar Wildlife Sanctuary charges a separate entry fee and has no guaranteed wildlife sightings — treat it as a forest excursion, not a safari.',
      'Almora works well as a base for a wider Kumaon loop rather than a single-stop visit.'
    ],
    matchScores: { adventure: 30, nature: 60, luxury: 35, crowds: 40, slowTravel: 55 },
    seasonalNotes: {
      Spring: 'March–May is clear and comfortable for walking the bazaar and viewpoints.',
      Summer: 'June stays cooler than the plains, though it can be hazy.',
      Autumn: 'September–November brings the clearest skies of the year.'
    }
  },
  {
    slug: 'kausani',
    title: 'Kausani',
    category: 'Scenic',
    description: 'A small ridge settlement in Bageshwar district, built almost entirely around its Himalayan panorama.',
    toursCount: 5,
    image: images.destinations.kausani,
    region: 'Bageshwar District',
    state: 'Uttarakhand',
    editorialDescription: 'Kausani is small by design — a ridge settlement with a handful of hotels lined up to face the Himalayan skyline. On a clear day, Trishul, Nanda Devi and the Panchachuli peaks run across the horizon in one continuous panorama, which is the entire reason the town exists as a destination. Mahatma Gandhi stayed here in 1929, at what\'s now the Anasakti Ashram; beyond that and a working tea estate, there isn\'t much to the town itself — it\'s a place to sit still and look at mountains, not to fill an itinerary.',
    bestTime: 'October – March',
    idealDuration: '1–2 Days',
    altitude: '1,890 m',
    travelStyles: ['Nature', 'Romantic'],
    seasons: ['Autumn', 'Winter', 'Spring'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'The Himalayan panorama', description: 'Trishul, Nanda Devi and the Panchachuli range, visible in one sweep on a clear day.' },
      { title: 'Anasakti Ashram', description: 'Where Gandhi stayed in 1929, now a small museum and library.' },
      { title: 'A working tea estate', description: 'One of the few tea-growing operations in this part of Uttarakhand.' }
    ],
    places: [
      { title: 'Anasakti Ashram', description: 'A quiet ashram and museum tied to Gandhi\'s 1929 stay.' },
      { title: 'Kausani Tea Estate', description: 'A working estate on the edge of town, open for walks and tastings.' },
      { title: 'Rudradhari Falls', description: 'A forest waterfall a short drive away, for travelers with an extra half-day.' }
    ],
    experiences: ['Himalayan viewpoint walk', 'Anasakti Ashram visit', 'Tea estate visit'],
    relatedSlugs: ['almora', 'ranikhet'],
    seo: { title: 'Kausani Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Kausani trip — the Himalayan panorama, Anasakti Ashram, and Kumaon\'s quietest viewpoint town.' },
    travelTips: [
      'The Himalayan view depends on the weather and season — October–March gives the clearest odds, but it\'s never guaranteed.',
      'Kausani is genuinely small — a day covers the town itself, with Rudradhari Falls as an easy add-on.',
      'Book ahead in the October–March viewing season, when the handful of view-facing rooms sell out first.'
    ],
    matchScores: { adventure: 20, nature: 70, luxury: 40, crowds: 25, slowTravel: 65 },
    seasonalNotes: {
      Autumn: 'October–November typically gives the clearest post-monsoon Himalayan views.',
      Winter: 'December–February is cold but often clear, with the best odds of a full panorama.',
      Spring: 'March–April warms up while visibility is still generally good.'
    }
  },
  {
    slug: 'ranikhet',
    title: 'Ranikhet',
    category: 'Colonial Charm',
    description: 'A quiet cantonment town in Almora district, home to the Kumaon Regiment and its orchard gardens.',
    toursCount: 7,
    image: images.destinations.ranikhet,
    region: 'Almora District',
    state: 'Uttarakhand',
    editorialDescription: 'Ranikhet has been an army cantonment since the British established it in 1869, and it still runs at that pace — wide roads, forest edges kept deliberately undeveloped, and none of the market-town bustle of Almora nearby. It\'s the headquarters of the Kumaon Regiment, one of the Indian Army\'s most decorated, and the Chaubatia orchards just outside town are as close as the destination gets to a single headline sight. Come for the quiet rather than a checklist of attractions.',
    bestTime: 'March – June, September – November',
    idealDuration: '2 Days',
    altitude: '1,869 m',
    travelStyles: ['Nature', 'Family'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Chaubatia orchards', description: 'Apple and apricot orchards and a garden, just outside the main town.' },
      { title: 'Kumaon Regiment Centre', description: 'Headquarters of one of the Indian Army\'s most decorated regiments since 1948.' },
      { title: 'Deliberate quiet', description: 'Cantonment planning has kept development and crowds well below nearby Nainital or Almora.' }
    ],
    places: [
      { title: 'Chaubatia Garden', description: 'Terraced orchards and a horticultural garden on the edge of town.' },
      { title: 'Kumaon Regimental Centre Museum', description: 'A regimental museum covering the Kumaon Regiment\'s history, open to visitors.' },
      { title: 'Jhula Devi Temple', description: 'A forest temple near Chaubatia, known for the bells left by visitors.' }
    ],
    experiences: ['Chaubatia orchard walk', 'Regimental museum visit', 'Jhula Devi Temple visit'],
    relatedSlugs: ['almora', 'kausani'],
    seo: { title: 'Ranikhet Travel Guide & Experiences | The Apex Voyager', description: 'Plan a Ranikhet trip — Chaubatia orchards, the Kumaon Regiment Centre, and Uttarakhand\'s quietest cantonment town.' },
    travelTips: [
      'Ranikhet is a working cantonment — some areas are restricted to civilians, so stick to the marked public roads and gardens.',
      'There\'s no single must-see sight here — plan a relaxed two days rather than a packed itinerary.',
      'Combine with Almora and Kausani for a fuller Kumaon loop rather than visiting Ranikhet alone.'
    ],
    matchScores: { adventure: 20, nature: 55, luxury: 35, crowds: 25, slowTravel: 55 },
    seasonalNotes: {
      Spring: 'March–May is comfortable, with the orchards in blossom.',
      Summer: 'June stays cooler than the plains, a quiet season here.',
      Autumn: 'September–November is clear and quiet, after the monsoon.'
    }
  },
  {
    slug: 'badrinath',
    title: 'Badrinath',
    category: 'Pilgrimage',
    description: 'A seasonal Char Dham temple town on the Alaknanda, reached by road beyond Joshimath.',
    toursCount: 5,
    image: images.destinations.badrinath,
    region: 'Chamoli District',
    state: 'Uttarakhand',
    accessType: 'road',
    editorialDescription: 'Badrinath sits at the head of the Alaknanda valley, its temple\'s brightly painted facade set against bare mountain slopes at over 3,000 metres. Dedicated to Lord Vishnu and traditionally linked to Adi Shankaracharya, it is one of the four Uttarakhand Char Dham and, unlike Kedarnath or Yamunotri, reached entirely by road — the drive beyond Joshimath is the destination\'s main physical challenge, not a trek. The temple opens for only about half the year; the rest of the time the valley sits under snow. Mana, a short drive further on and often described as the last village on this route, adds a second, quieter layer to a visit here.',
    bestTime: 'May – October',
    idealDuration: '1–2 Days',
    altitude: '3,100 m',
    travelStyles: ['Pilgrimage', 'Nature'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Badrinath Temple', description: 'The Char Dham shrine itself, its carved and painted facade set against the Nar-Narayan ridgeline.' },
      { title: 'Mana village', description: 'A short drive beyond the temple, popularly described as the last village on this route, with its own quieter character.' },
      { title: 'Tapt Kund', description: 'A natural hot spring beside the temple, part of the traditional approach to a visit here.' }
    ],
    places: [
      { title: 'Badrinath Temple', description: 'The main shrine, open only for around six months of the year — check the official portal for this year\'s dates before you travel.' },
      { title: 'Mana Village', description: 'A short drive from the temple, known locally for its Vyas Gufa cave and Bhim Pul stone bridge.' },
      { title: 'Tapt Kund', description: 'A hot-spring pool at the base of the temple steps, traditionally visited before entering.' }
    ],
    experiences: ['Badrinath Temple darshan', 'Mana village visit', 'Tapt Kund hot spring'],
    relatedSlugs: ['joshimath', 'auli', 'rishikesh'],
    seo: {
      title: 'Badrinath Travel Guide | Uttarakhand Char Dham | The Apex Voyager',
      description: 'Plan a Badrinath trip — the road-accessible Char Dham temple beyond Joshimath, Mana village, and seasonal travel planning.'
    },
    travelTips: [
      'The temple is open only for part of the year and the exact opening and closing dates change annually — confirm this year\'s dates on the official Char Dham portal before booking travel.',
      'Registration for Char Dham Yatra is required and is free through the official Uttarakhand Tourism portal — no third party is authorized to charge a fee for it.',
      'The Joshimath–Badrinath road is scenic but can be affected by landslides in the monsoon shoulder months — build in buffer time rather than a tight same-day plan.'
    ],
    registrationInfo: {
      required: true,
      url: 'https://registrationandtouristcare.uk.gov.in/',
      note: 'Official Uttarakhand Char Dham Yatra registration portal — registration is required and free; it is never collected by The Apex Voyager or any third party.'
    },
    matchScores: { adventure: 20, nature: 45, luxury: 25, crowds: 65, slowTravel: 30 },
    seasonalNotes: {
      Spring: 'Late April/May sees the temple reopen for the season, on a date fixed annually — check the official portal rather than assuming a fixed calendar day.',
      Summer: 'June–August is the main yatra season and the busiest period; monsoon rain can also affect the approach road.',
      Autumn: 'September–October is generally clearer before the temple closes for winter, again on a date fixed annually.'
    }
  },
  {
    slug: 'gangotri',
    title: 'Gangotri',
    category: 'Pilgrimage',
    description: 'A road-accessible Char Dham temple town on the Bhagirathi, and the gateway to the separate Gaumukh trek.',
    toursCount: 5,
    image: images.destinations.gangotri,
    region: 'Uttarkashi District',
    state: 'Uttarakhand',
    accessType: 'road',
    editorialDescription: 'Gangotri is where the Bhagirathi — the headstream that becomes the Ganges — is worshipped at its traditional source, in a small temple town reached entirely by road via Uttarkashi and Harsil. Like Badrinath, there is no trek involved in visiting the temple itself; the drive through the Bhagirathi valley is the journey. Gaumukh, the actual glacier snout a further trek beyond the town, is a separate, regulated undertaking with its own permit requirements — it is not a casual extension of a temple visit, and this page treats it as a distinct decision, not a given. Harsil, a quieter village short of Gangotri, makes a pleasant stop or overnight base on the way in.',
    bestTime: 'May – October',
    idealDuration: '1–2 Days',
    altitude: '3,200 m',
    travelStyles: ['Pilgrimage', 'Nature'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Gangotri Temple', description: 'The temple marking the traditional source of the Ganges, on the bank of the Bhagirathi.' },
      { title: 'Harsil', description: 'A quieter valley village on the approach road, known for its apple orchards and pine forest setting.' },
      { title: 'Gaumukh — a separate trek', description: 'The glacier snout beyond Gangotri is a distinct, permitted trek, not part of an ordinary temple visit.' }
    ],
    places: [
      { title: 'Gangotri Temple', description: 'The main shrine on the Bhagirathi, open only for around six months of the year — check the official portal for this year\'s dates.' },
      { title: 'Harsil', description: 'An apple-orchard valley village on the road in, worth a stop or an overnight stay.' },
      { title: 'Gaumukh (separate trek)', description: 'An approximately 18 km trek beyond Gangotri to the glacier itself, requiring a Forest Department permit and its own planning — not a same-day add-on to a temple visit.' }
    ],
    experiences: ['Gangotri Temple darshan', 'Harsil valley stop'],
    relatedSlugs: ['rishikesh', 'dehradun', 'mussoorie'],
    seo: {
      title: 'Gangotri Travel Guide | Uttarakhand Char Dham | The Apex Voyager',
      description: 'Plan a Gangotri trip — the road-accessible Char Dham temple, Harsil, and the separately permitted Gaumukh trek.'
    },
    travelTips: [
      'The temple is open only for part of the year and the exact opening and closing dates change annually — confirm this year\'s dates on the official Char Dham portal before booking travel.',
      'Registration for Char Dham Yatra is required and is free through the official Uttarakhand Tourism portal — no third party is authorized to charge a fee for it.',
      'If you want to trek to Gaumukh, treat it as a separate trip decision — current permit rules, guide requirements and daily limits are set by the Forest Department and change; confirm directly with the Uttarkashi forest office before planning it.'
    ],
    registrationInfo: {
      required: true,
      url: 'https://registrationandtouristcare.uk.gov.in/',
      note: 'Official Uttarakhand Char Dham Yatra registration portal — registration is required and free; it is never collected by The Apex Voyager or any third party.'
    },
    matchScores: { adventure: 25, nature: 55, luxury: 20, crowds: 55, slowTravel: 35 },
    seasonalNotes: {
      Spring: 'Late April/May sees the temple reopen for the season, on a date fixed annually — check the official portal rather than assuming a fixed calendar day.',
      Summer: 'June–August is the main yatra season; monsoon rain can affect the Uttarkashi–Gangotri road.',
      Autumn: 'September–October is generally clearer before the temple closes for winter, again on a date fixed annually.'
    }
  },
  {
    slug: 'kedarnath',
    title: 'Kedarnath',
    category: 'Pilgrimage',
    description: 'A trek-gated Char Dham shrine at 3,583 m — the road ends at Gaurikund, and the final distance is on foot or by seasonal helicopter.',
    toursCount: 5,
    image: images.destinations.kedarnath,
    region: 'Rudraprayag District',
    state: 'Uttarakhand',
    accessType: 'trek-and-helicopter',
    editorialDescription: 'Kedarnath sits at 3,583 metres at the head of the Mandakini valley, one of the twelve Jyotirlingas and the most physically demanding of the Uttarakhand Char Dham. No road reaches the shrine: the drive ends at Gaurikund, reached via a short regulated local transfer from Sonprayag, and from there the temple is a further trek of around 16 km on foot — or, seasonally, a helicopter transfer from one of three helipads in Rudraprayag district. Most travelers treat the journey itself, not just the darshan, as the point of the trip, staying a night at Guptkashi or Sonprayag before the final push.',
    bestTime: 'May – October',
    idealDuration: '2–3 Days',
    altitude: '3,583 m',
    travelStyles: ['Pilgrimage', 'Adventure'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Families'],
    highlights: [
      { title: 'Kedarnath Temple', description: 'One of the twelve Jyotirlingas, at the head of the Mandakini valley — the highest of the Char Dham shrines.' },
      { title: 'The Gaurikund trek', description: 'An approximately 16 km trek from the road head, the defining final stretch of the journey.' },
      { title: 'A seasonal helicopter option', description: 'IRCTC\'s official HeliYatra service connects district helipads to Kedarnath in season, as an alternative to trekking.' }
    ],
    places: [
      { title: 'Sonprayag', description: 'The last point most private vehicles can drive to; a short, regulated local shuttle continues to Gaurikund.' },
      { title: 'Gaurikund', description: 'The actual road head, where the motorable road ends and the trek to the shrine begins.' },
      { title: 'Kedarnath Temple', description: 'Reached only by the ~16 km trek from Gaurikund, or a seasonal helicopter transfer — no vehicle reaches it directly.' }
    ],
    experiences: ['Kedarnath Temple darshan', 'Gaurikund–Kedarnath trek'],
    relatedSlugs: ['rishikesh', 'badrinath', 'yamunotri'],
    seo: {
      title: 'Kedarnath Travel Guide | Uttarakhand Char Dham | The Apex Voyager',
      description: 'Plan a Kedarnath trip — the trek-gated Char Dham shrine beyond Gaurikund, the seasonal helicopter option, and honest trip planning.'
    },
    travelTips: [
      'The trek from Gaurikund is a genuine multi-hour, high-altitude walk — pace yourself, carry warm layers, and build in buffer days rather than a tight same-day plan.',
      'If you\'re considering the seasonal helicopter option, book only through IRCTC\'s official HeliYatra portal — no other site or agent can sell or guarantee a seat.',
      'Registration for Char Dham Yatra is required and free through the official Uttarakhand Tourism portal — never pay a third party for it.',
      'Travelers with health or mobility concerns should speak to a doctor before attempting the high-altitude trek — it is not suitable for everyone, and no operator can guarantee a safe outcome regardless of arrangements made.'
    ],
    registrationInfo: {
      required: true,
      url: 'https://registrationandtouristcare.uk.gov.in/',
      note: 'Official Uttarakhand Char Dham Yatra registration portal — registration is required and free; it is never collected by The Apex Voyager or any third party.'
    },
    accessJourney: {
      stages: [
        { title: 'Gateway', description: 'Most journeys begin from Rishikesh or Haridwar, the last major cities before the mountain roads.' },
        { title: 'Regional base — Rudraprayag / Guptkashi', description: 'The road continues through Rudraprayag district toward Guptkashi, a common overnight base before the final approach.' },
        { title: 'Sonprayag', description: 'The last point most private vehicles can drive to.', note: 'A short, regulated local shuttle covers the remaining distance to Gaurikund.' },
        { title: 'Gaurikund — road head', description: 'Where the motorable road actually ends and the trek to the shrine begins.' },
        { title: 'Kedarnath Temple', description: 'Reached by an approximately 16 km trek from Gaurikund — or, seasonally, by helicopter from a district helipad.', note: 'No vehicle reaches the shrine directly; the final distance is on foot, by pony/palki, or by seasonal helicopter, subject to official availability and conditions.' }
      ]
    },
    matchScores: { adventure: 55, nature: 50, luxury: 15, crowds: 70, slowTravel: 20 },
    seasonalNotes: {
      Spring: 'Late April/May sees the temple reopen for the season, on a date fixed annually — check the official portal rather than assuming a fixed calendar day.',
      Summer: 'June–August is the main yatra season; monsoon rain can also disrupt the Rudraprayag–Sonprayag road, a corridor with a documented history of landslide risk — build buffer days into any monsoon-season plan.',
      Autumn: 'September–October is generally clearer before the temple closes for winter, again on a date fixed annually.'
    }
  },
  {
    slug: 'yamunotri',
    title: 'Yamunotri',
    category: 'Pilgrimage',
    description: 'A trek-gated Char Dham shrine above Janki Chatti, the source of the Yamuna in a narrow Himalayan gorge.',
    toursCount: 5,
    image: images.destinations.yamunotri,
    region: 'Uttarkashi District',
    state: 'Uttarakhand',
    accessType: 'trek-gated',
    editorialDescription: 'Yamunotri sits at 3,293 metres in a narrow gorge at the head of the Yamuna valley, the westernmost of the Uttarakhand Char Dham and, for most travelers, the shortest final trek of the four. The road climbs from Barkot to Janki Chatti, where the motorable road ends; from there the temple is a further trek of around 6 km on foot, pony, palki or doli. There is no helicopter service here — the trek, however you cover it, is the only way in. Kharsali, a quieter village near Janki Chatti and the winter seat of the goddess Yamuna, makes a good base or a stop on the way up.',
    bestTime: 'May – October',
    idealDuration: '1–2 Days',
    altitude: '3,293 m',
    travelStyles: ['Pilgrimage', 'Adventure'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Families'],
    highlights: [
      { title: 'Yamunotri Temple', description: 'The shrine dedicated to the goddess Yamuna, at the source of the Yamuna river in a narrow Himalayan gorge.' },
      { title: 'The Janki Chatti trek', description: 'The final ~6 km stretch beyond the road head, covered on foot, pony, palki or doli.' },
      { title: 'Kharsali', description: 'A quieter village near Janki Chatti and the winter seat of the goddess, with its own historic Shani temple.' }
    ],
    places: [
      { title: 'Barkot', description: 'The gateway town on the highway, where the branch road into the Yamuna valley begins.' },
      { title: 'Janki Chatti', description: 'The actual road head — motorable road ends here, and the final trek begins.' },
      { title: 'Yamunotri Temple', description: 'Reached by an approximately 6 km trek, pony, palki or doli from Janki Chatti — no vehicle reaches it directly.' }
    ],
    experiences: ['Yamunotri Temple darshan', 'Janki Chatti–Yamunotri trek'],
    relatedSlugs: ['rishikesh', 'gangotri', 'kedarnath'],
    seo: {
      title: 'Yamunotri Travel Guide | Uttarakhand Char Dham | The Apex Voyager',
      description: 'Plan a Yamunotri trip — the trek-gated Char Dham shrine beyond Janki Chatti, Kharsali, and honest trip planning.'
    },
    travelTips: [
      'Janki Chatti is the end of the motorable road — the final ~6 km to the temple is on foot, pony, palki or doli, arranged locally; rates change by season, so confirm current pricing on arrival.',
      'Registration for Char Dham Yatra is required and free through the official Uttarakhand Tourism portal — never pay a third party for it.',
      'The temple is open only for part of the year and the exact opening and closing dates change annually — confirm this year\'s dates on the official portal before booking travel.',
      'Travelers with health or mobility concerns should speak to a doctor before attempting the trek or a pony/palki ascent — it is not suitable for everyone.'
    ],
    registrationInfo: {
      required: true,
      url: 'https://registrationandtouristcare.uk.gov.in/',
      note: 'Official Uttarakhand Char Dham Yatra registration portal — registration is required and free; it is never collected by The Apex Voyager or any third party.'
    },
    accessJourney: {
      stages: [
        { title: 'Gateway', description: 'Most journeys begin from Rishikesh or Dehradun.' },
        { title: 'Barkot', description: 'The gateway town on the highway where the branch road into the Yamuna valley begins.' },
        { title: 'Janki Chatti — road head', description: 'Where the motorable road ends; private vehicles go no further.' },
        { title: 'Yamunotri Temple', description: 'Reached by an approximately 6 km trek from Janki Chatti, on foot or by pony, palki or doli.', note: 'No vehicle reaches the shrine directly, and there is no helicopter service on this route.' }
      ]
    },
    matchScores: { adventure: 35, nature: 45, luxury: 15, crowds: 55, slowTravel: 25 },
    seasonalNotes: {
      Spring: 'Late April/May sees the temple reopen for the season, on a date fixed annually — check the official portal rather than assuming a fixed calendar day.',
      Summer: 'June–August is the main yatra season; monsoon rain can affect the Barkot–Janki Chatti road.',
      Autumn: 'September–October is generally clearer before the temple closes for winter, again on a date fixed annually.'
    }
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
