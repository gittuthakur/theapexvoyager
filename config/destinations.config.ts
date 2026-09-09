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
