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
      { title: 'Dhankar', description: 'A cliffside monastery village on the circuit — now its own destination page.' }
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
    description: 'The Kangra Valley gateway town below the Dhauladhar range — the arrival point for this corner of Himachal, with McLeod Ganj as a separate destination further up the hill.',
    toursCount: 15,
    image: images.destinations.dharamshala,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Dharamshala is the Kangra Valley town most journeys into this corner of Himachal actually begin from — rail and bus links, valley-floor views of the Dhauladhar range, and a quieter, more local pace than the upper town. McLeod Ganj, the Tibetan-culture hub most travelers associate with "Dharamshala," sits about 9 km and a real climb above it and is treated here as its own destination.',
    bestTime: 'March – June, September – November',
    idealDuration: '2–3 Days',
    travelStyles: ['Wellness', 'Nature', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Couples'],
    highlights: [
      { title: 'Dhauladhar backdrop', description: 'Forest trails and ridgelines sit moments from town.' },
      { title: 'Kangra Valley gateway', description: 'The practical arrival point for this stretch of Himachal — rail, bus and road links converge here.' },
      { title: 'Kangra Art Museum', description: 'Centuries of Kangra valley and Tibetan craft, at Kotwali Bazaar.' }
    ],
    places: [
      { title: 'HPCA Cricket Stadium', description: 'A high-altitude cricket ground in the Kotwali Bazaar area, home ground of the Himachal Pradesh Ranji team, at around 1,457 m.' },
      { title: 'Kangra Art Museum', description: 'Miniature paintings, sculptures and Kangra valley and Tibetan craft, at Kotwali Bazaar.' },
      { title: 'HP State War Memorial', description: 'A pine-forest memorial to Himachal soldiers, near the town entrance.' },
      { title: 'Kotwali Bazaar', description: 'The lower town’s own market — Kangra tea, woolens and local crafts.' }
    ],
    experiences: ['Museum visit (Kangra Art Museum)', 'War Memorial walk', 'Kotwali Bazaar shopping', 'Cricket-stadium visit (match days seasonal)'],
    relatedSlugs: ['mcleod-ganj', 'bir-billing', 'chamba'],
    seo: { title: 'Dharamshala Travel Guide | Kangra Valley Gateway | The Apex Voyager', description: 'Plan a Dharamshala stop — the Kangra Valley’s Dhauladhar-backed gateway town, Kangra Art Museum, and the road up to McLeod Ganj.' },
    travelTips: [
      'If you’re after the Tibetan-culture experience — cafes, monasteries, the Dalai Lama’s temple complex — that’s McLeod Ganj, a separate destination a real drive above this one.'
    ],
    matchScores: { adventure: 40, nature: 60, luxury: 35, crowds: 40, slowTravel: 55 },
    seasonalNotes: {
      Spring: 'March–May is clear and comfortable.',
      Summer: 'June is warm in the valley.',
      Autumn: 'September–November has clear Dhauladhar views.'
    }
  },
  {
    slug: 'mcleod-ganj',
    title: 'McLeod Ganj',
    category: 'Culture',
    description: 'The hillside Tibetan-culture hub above Dharamshala — home to the Dalai Lama’s temple complex and the Tibetan government-in-exile since 1960.',
    toursCount: 0,
    image: images.destinations.mcleodGanj,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'McLeod Ganj sits about 9 km and a genuine climb above Dharamshala, and it’s where most travelers who say they’re "going to Dharamshala" actually spend their time. The Tibetan government-in-exile has been based here since 1960, and the Tsuglagkhang temple complex — the Dalai Lama’s residence and monastery — sits at the town’s centre. Narrow lanes, Tibetan cafes and the Triund trailhead give it a different pace from the valley town below.',
    bestTime: 'March – June, September – November',
    idealDuration: '2–3 Days',
    travelStyles: ['Culture', 'Wellness', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Couples'],
    highlights: [
      { title: 'Tsuglagkhang Complex', description: 'The Dalai Lama’s temple and residence complex, the town’s centre.' },
      { title: 'Tibetan government-in-exile', description: 'Based here since 1960, shaping the town’s monasteries, cafes and daily rhythm.' },
      { title: 'Triund trailhead', description: 'A well-known ridge hike starting directly from the upper town.' }
    ],
    places: [
      { title: 'Tsuglagkhang Complex', description: 'The Dalai Lama’s temple and residence complex.' },
      { title: 'Bhagsu Nag', description: 'A village just beyond McLeod Ganj with a waterfall and temple.' },
      { title: 'Dharamkot', description: 'A quieter hillside hamlet above the main town.' }
    ],
    experiences: ['Monastery visits', 'Triund day hike', 'Tibetan cooking and culture', 'Café culture'],
    relatedSlugs: ['dharamshala', 'bir-billing'],
    seo: { title: 'McLeod Ganj Travel Guide | Tibetan Culture, Kangra Valley | The Apex Voyager', description: 'Plan a McLeod Ganj trip — the Dalai Lama’s temple complex, Tibetan culture, cafes and the Triund trailhead.' },
    apexPicks: {
      stay: { title: 'McLeod Ganj hillside guesthouse', description: 'Simple rooms with valley or mountain views, a short walk from the main square.' },
      experience: { title: 'Morning at the Tsuglagkhang Complex', description: 'The Dalai Lama’s temple complex before the day’s crowds arrive.' },
      taste: { title: 'Tibetan momos and thukpa', description: 'The town’s café strip is built around this exact meal.' },
      moment: { title: 'Prayer flags over the valley', description: 'The view from the upper lanes on a clear morning.' }
    },
    hiddenGems: [
      { title: 'Dharamkot', description: 'A quieter hillside hamlet, popular with longer-staying travelers.' }
    ],
    travelTips: [
      'Evenings are cool even in summer — the elevation here is noticeably higher than lower Dharamshala.',
      'Confirm your booking is actually in McLeod Ganj, not lower Dharamshala — they are a real drive apart.',
      'Confirm current trekking/access requirements for Triund locally before setting out.'
    ],
    matchScores: { adventure: 55, nature: 70, luxury: 35, crowds: 70, slowTravel: 55 },
    seasonalNotes: {
      Spring: 'March–May is clear and comfortable.',
      Summer: 'June is warm in the valley but cooler here.',
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
      { title: 'Mashobra', description: 'A peaceful cedar retreat beyond the bustle — now its own destination page.' }
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
    // Sonprayag, not Gaurikund: this is where a normal private vehicle/taxi (the kind our
    // Transport search arranges) actually stops — the Sonprayag→Gaurikund stretch is a
    // regulated shuttle-only transfer, not open road transport. See editorialDescription
    // above ("staying a night at Guptkashi or Sonprayag before the final push") for why
    // these two towns are the Stays search target instead of the shrine itself.
    roadHead: 'Sonprayag',
    stayBaseLocations: ['Guptkashi', 'Sonprayag'],
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
    // Janki Chatti is where the motorable road itself ends (unlike Kedarnath, there's no
    // separate shuttle-only stretch beyond it — a private vehicle can drive here directly).
    // Barkot is the gateway town's own hotel base — see editorialDescription above.
    roadHead: 'Janki Chatti',
    stayBaseLocations: ['Barkot'],
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
  },
  {
    slug: 'hemkund-sahib',
    title: 'Hemkund Sahib',
    category: 'Pilgrimage',
    description: 'The world\'s highest Gurudwara, on a glacial lake at 4,329 m, reached by trek from the shared Ghangaria base.',
    toursCount: 5,
    image: images.destinations.hemkundSahib,
    region: 'Chamoli District',
    state: 'Uttarakhand',
    accessType: 'trek-gated',
    editorialDescription: 'Hemkund Sahib is the world\'s highest Gurudwara, set on the shore of a glacial lake at 4,329 metres and ringed by seven Himalayan peaks. The pilgrimage shares its access route with the Valley of Flowers: both are reached via Govindghat, the road head on the Joshimath–Badrinath highway, and Ghangaria, the shared overnight base where no accommodation exists at either destination itself. From Ghangaria, Hemkund Sahib is a steep, roughly 6 km climb — a same-day round trip, since no stay is possible at the shrine. Many travelers combine a visit here with the separate Valley of Flowers trek, based from the same village.',
    bestTime: 'June – October',
    idealDuration: '1 Day',
    altitude: '4,329 m',
    travelStyles: ['Pilgrimage', 'Adventure'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'Hemkund Sahib', description: 'The world\'s highest Gurudwara, on the shore of Hemkund Lake at roughly 4,329 metres.' },
      { title: 'The Ghangaria trek', description: 'A steep ~6 km, ~1,100 m climb from Ghangaria — the final and defining stretch of the journey.' },
      { title: 'Hemkund Lake', description: 'A glacial lake ringed by seven Himalayan peaks, the setting for the Gurudwara.' }
    ],
    places: [
      { title: 'Govindghat', description: 'The road head, where the motorable road from Joshimath ends and the trek toward Ghangaria begins.' },
      { title: 'Ghangaria', description: 'The shared overnight base for both Hemkund Sahib and the Valley of Flowers — no accommodation exists at Hemkund itself, so this is where you stay before and after the climb.' },
      { title: 'Hemkund Sahib', description: 'Reached by a steep ~6 km trek from Ghangaria — a same-day round trip, since no overnight stay is possible at the shrine.' }
    ],
    experiences: ['Hemkund Sahib darshan', 'Ghangaria–Hemkund trek'],
    relatedSlugs: ['joshimath', 'badrinath', 'rishikesh'],
    // Govindghat is where the motorable road from Joshimath ends. Ghangaria is the only
    // overnight base — no accommodation exists at Hemkund Sahib itself (see places above).
    roadHead: 'Govindghat',
    stayBaseLocations: ['Ghangaria'],
    seo: {
      title: 'Hemkund Sahib Travel Guide | Uttarakhand Pilgrimage | The Apex Voyager',
      description: 'Plan a Hemkund Sahib trip — the trek-gated Gurudwara beyond Ghangaria, the shared Valley of Flowers base, and honest trip planning.'
    },
    travelTips: [
      'There\'s no overnight stay at Hemkund itself — plan a same-day round trip from Ghangaria, and start early enough to be back down before dark.',
      'The trek from Ghangaria is a steep, high-altitude climb — pace yourself, carry warm layers even in summer, and build in a buffer day in case of weather.',
      'The Gurudwara is only open for part of the year and closed under snow the rest — confirm this year\'s opening and closing dates with the official Gurudwara authorities or Uttarakhand Tourism before you travel.',
      'Travelers with health or mobility concerns should speak to a doctor before attempting the high-altitude trek — it is not suitable for everyone.'
    ],
    registrationInfo: {
      required: true,
      url: 'https://registrationandtouristcare.uk.gov.in/',
      note: 'Official Uttarakhand Tourist Care registration portal — also used for Hemkund Sahib Yatra registration; required and free, never collected by The Apex Voyager or any third party.'
    },
    accessJourney: {
      stages: [
        { title: 'Gateway', description: 'Most journeys begin from Rishikesh or Haridwar, continuing via Joshimath.' },
        { title: 'Govindghat — road head', description: 'Where the motorable road from Joshimath ends.', note: 'This is also the trailhead for both Hemkund Sahib and the Valley of Flowers.' },
        { title: 'Ghangaria', description: 'A roughly 13 km trek from Govindghat leads to Ghangaria, the shared overnight base for the final approach.' },
        { title: 'Hemkund Sahib', description: 'A further ~6 km, ~1,100 m climb from Ghangaria reaches the Gurudwara.', note: 'No vehicle reaches Hemkund Sahib directly, and there is no overnight stay at the shrine — it\'s a same-day round trip from Ghangaria.' }
      ]
    },
    matchScores: { adventure: 55, nature: 55, luxury: 10, crowds: 60, slowTravel: 20 },
    seasonalNotes: {
      Summer: 'June–August is the main season, once the snow has cleared enough for the Gurudwara to reopen for the year.',
      Autumn: 'September–early October is generally clearer, before the Gurudwara closes again for winter on a date fixed annually.'
    }
  },
  {
    slug: 'chail',
    title: 'Chail',
    category: 'Colonial Charm',
    description: 'A former royal summer retreat in the Shivalik foothills, with a hillside cricket ground long noted as one of the highest anywhere.',
    toursCount: 0,
    image: images.destinationsHero,
    region: 'Solan District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Chail was Maharaja Bhupinder Singh of Patiala’s summer retreat, about 45 km from Shimla — quieter and lower-key than the colonial capital it was built to rival. The Chail Palace, now a heritage hotel, still anchors the town, and the cricket ground built into the hillside above it, from 1893, remains one of the highest of its kind anywhere.',
    bestTime: 'March – June, September – November',
    idealDuration: '2 Days',
    altitude: '2,250 m',
    travelStyles: ['Culture', 'Nature', 'Slow travel'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'Chail Palace', description: 'The Maharaja’s former summer residence, now a heritage hotel open to day visitors.' },
      { title: 'Chail Cricket Ground', description: 'Built in 1893 at around 2,444 m — long noted as one of the highest cricket grounds anywhere, though no competitive cricket is played there today; it now serves as the Chail Military School’s playground.' },
      { title: 'Deodar-forest quiet', description: 'A noticeably calmer pace than Shimla, an hour or so away.' }
    ],
    places: [
      { title: 'Chail Palace', description: 'Heritage-hotel grounds open for a walk-through even for non-guests.' },
      { title: 'Chail Cricket Ground', description: 'The hillside ground, viewable from just outside; not used for competitive matches.' },
      { title: 'Sadhupul', description: 'A river stop on the way in, a common photo halt.' }
    ],
    experiences: ['Heritage walks', 'Forest walks', 'Photography', 'Day trip to Kufri'],
    relatedSlugs: ['shimla', 'kasauli'],
    seo: { title: 'Chail Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Chail trip — the Maharaja’s summer palace, a historic hillside cricket ground, and quiet Shivalik forest.' },
    travelTips: [
      'Chail Palace’s grounds charge a small entry fee for non-guests — confirm the current amount locally.',
      'The road from Shimla is narrow in places — comfortable for a half-day drive, not a rushed one.'
    ],
    matchScores: { adventure: 20, nature: 65, luxury: 55, crowds: 30, slowTravel: 70 },
    seasonalNotes: {
      Summer: 'April–June is Chail’s clearest, warmest window.',
      Autumn: 'September–November is cool and quiet.'
    }
  },
  {
    slug: 'kasauli',
    title: 'Kasauli',
    category: 'Colonial Charm',
    description: 'A small colonial cantonment town in pine and oak forest, built around 19th-century churches and viewpoints.',
    toursCount: 0,
    image: images.destinations.kasauli,
    region: 'Solan District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Kasauli was laid out by the British in the 1840s as a cantonment town, and it still feels like one — narrow lanes, colonial-era bungalows, a working army cantonment at its centre, and Christ Church watching over the ridge. Close enough to Chandigarh and Shimla to work as a short, easy break.',
    bestTime: 'March – June, September – November',
    idealDuration: '2 Days',
    altitude: '1,900 m',
    travelStyles: ['Culture', 'Slow travel', 'Nature'],
    seasons: ['Summer', 'Autumn', 'Winter'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'Christ Church', description: 'An 1850s colonial-era church at the heart of the town.' },
      { title: 'Cantonment-town walks', description: 'A small, walkable grid of colonial lanes and bungalows.' },
      { title: 'Sunset Point', description: 'A ridge viewpoint over the Shivalik foothills.' }
    ],
    places: [
      { title: 'Christ Church', description: 'The town’s best-known colonial landmark.' },
      { title: 'Monkey Point', description: 'A ridge viewpoint inside the cantonment area — an active military area; confirm current access rules locally.' },
      { title: 'Gilbert Trail', description: 'A forested walking trail along the cantonment boundary.' }
    ],
    experiences: ['Heritage walks', 'Forest trail walks', 'Café mornings', 'Photography'],
    relatedSlugs: ['chail', 'shimla'],
    seo: { title: 'Kasauli Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Kasauli trip — colonial churches, forest trails and an easy Shivalik hill-town break.' },
    travelTips: [
      'Kasauli is a working cantonment town — some areas require ID and have restricted timings; confirm current rules locally.',
      'It’s a popular weekend trip from Chandigarh — weekdays are noticeably quieter.'
    ],
    matchScores: { adventure: 15, nature: 55, luxury: 40, crowds: 45, slowTravel: 70 },
    seasonalNotes: {
      Summer: 'April–June is warm and clear.',
      Winter: 'December–February is cold but rarely snowbound.'
    }
  },
  {
    slug: 'jammu',
    title: 'Jammu',
    category: 'Culture',
    description: 'The "City of Temples" on the Tawi River — Jammu & Kashmir’s winter capital, and a common gateway before Kashmir or the hills beyond.',
    toursCount: 0,
    image: images.destinations.jammu,
    region: 'Jammu District',
    state: 'Jammu & Kashmir',
    editorialDescription: 'Jammu is often treated as a stopover, but it’s a substantial city in its own right, built around the Raghunath Temple complex Maharaja Gulab Singh commissioned in the 1850s and the Bahu Fort overlooking the Tawi River. It also serves periodically as J&K’s winter seat of government, under the long-standing (though not uninterrupted) Darbar Move practice.',
    bestTime: 'October – March',
    idealDuration: '1–2 Days',
    travelStyles: ['Culture', 'Family'],
    seasons: ['Autumn', 'Winter', 'Spring'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Raghunath Temple complex', description: 'A cluster of seven shrines, each with its own shikhara, built in the mid-1800s.' },
      { title: 'Bahu Fort', description: 'A fort above the Tawi River, with the Bagh-e-Bahu gardens beside it.' },
      { title: 'Gateway city', description: 'The practical starting point for Katra, Patnitop, and the road into Kashmir.' }
    ],
    places: [
      { title: 'Raghunath Temple', description: 'The city’s principal temple complex, in continuous use since the 1860s.' },
      { title: 'Bahu Fort', description: 'A riverside fort with garden grounds.' },
      { title: 'Tawi riverfront', description: 'The river the old city is built around.' }
    ],
    experiences: ['Temple visits', 'Fort and garden walks', 'Old-city bazaar walks'],
    relatedSlugs: ['katra', 'patnitop'],
    seo: { title: 'Jammu Travel Guide | Jammu & Kashmir | The Apex Voyager', description: 'Plan a Jammu stop — the Raghunath Temple complex, Bahu Fort, and the gateway to Katra and Kashmir.' },
    travelTips: [
      'Most itineraries treat Jammu as a 1-night stop before Katra or Srinagar — it works well as a deliberate day too.',
      'The Raghunath Temple is a working shrine — dress modestly.'
    ],
    matchScores: { adventure: 10, nature: 25, luxury: 35, crowds: 50, slowTravel: 40 },
    seasonalNotes: {
      Winter: 'December–February is Jammu’s mild season and its periodic role as J&K’s winter seat of government.',
      Autumn: 'October–November is clear and comfortably warm.'
    }
  },
  {
    slug: 'katra',
    title: 'Katra',
    category: 'Pilgrimage',
    accessType: 'road',
    description: 'The base town for the Vaishno Devi pilgrimage — where travelers register, stay, and begin the route to the Bhawan.',
    toursCount: 0,
    image: images.destinations.katra,
    region: 'Reasi District',
    state: 'Jammu & Kashmir',
    editorialDescription: 'Katra exists almost entirely because of Vaishno Devi — the road- and rail-connected base town where pilgrims register and stay before the route up to the Bhawan shrine (on foot, pony, palki, or helicopter). Katra is the main practical stay base for most trips; the Shrine Board itself also runs dormitory accommodation further up the route and at Bhawan for pilgrims who choose to stay overnight there.',
    bestTime: 'March – June, September – November',
    idealDuration: '2 Days',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Vaishno Devi Bhawan', description: 'The shrine, reached by a multi-stage route from Katra — on foot, pony, palki, or helicopter.' },
      { title: 'Banganga to Sanjichhat route', description: 'The staged pilgrim route, with checkpoints along the way.' },
      { title: 'A dedicated pilgrimage town', description: 'Katra’s infrastructure — registration counters, accommodation, food — is built around the yatra.' }
    ],
    places: [
      { title: 'Yatra Registration Counter, Katra bus stand', description: 'Where every pilgrim registers and collects the RFID Yatra Access Card before starting.' },
      { title: 'Banganga', description: 'The official start of the trek route.' },
      { title: 'Ardhkuwari', description: 'A midpoint shrine and rest stop on the route.' }
    ],
    experiences: ['Vaishno Devi pilgrimage route', 'Helicopter service (subject to booking/weather)', 'Pony/palki hire'],
    relatedSlugs: ['jammu', 'patnitop'],
    seo: { title: 'Katra Travel Guide | Vaishno Devi Base | The Apex Voyager', description: 'Plan a Vaishno Devi yatra from Katra — registration, the route to the Bhawan, and honest trip planning.' },
    registrationInfo: { required: true, url: 'https://www.maavaishnodevi.org', note: 'Official Shri Mata Vaishno Devi Shrine Board site — the sole statutory registration authority; free, with an RFID Yatra Access Card issued at Katra bus stand.' },
    accessJourney: { stages: [
      { title: 'Katra — road head and main stay base', description: 'Reached by road or rail; most accommodation and all registration is here.' },
      { title: 'The route to Bhawan', description: 'A multi-stage route on foot, pony, palki, or helicopter.', note: 'Route length is commonly cited at around 13 km one-way — treat this as a widely reported approximation; confirm current route details via the Shrine Board’s own site.' },
      { title: 'Vaishno Devi Bhawan', description: 'The shrine itself.', note: 'The Shrine Board also operates its own paid dormitory accommodation along the route and at Bhawan for pilgrims who choose to stay overnight there.' }
    ] },
    travelTips: [
      'Register before starting — either online at the Shrine Board’s own site or at the Katra counter — the RFID card is checked at route checkpoints.',
      'Both Katra and the Shrine Board’s own dormitories along the route offer accommodation — check the Board’s site directly for options closer to Bhawan.',
      'Helicopter, pony and palki services exist but current fares change — check the Shrine Board’s own site.'
    ],
    matchScores: { adventure: 40, nature: 45, luxury: 25, crowds: 75, slowTravel: 20 }
  },
  {
    slug: 'patnitop',
    title: 'Patnitop',
    category: 'Adventure',
    description: 'A forested hill station on the Jammu–Srinagar highway, known for winter skiing at nearby Madha Top and summer meadow walks.',
    toursCount: 0,
    image: images.destinationsHero,
    region: 'Udhampur District',
    state: 'Jammu & Kashmir',
    editorialDescription: 'Patnitop sits directly on the Jammu–Srinagar highway between Udhampur and Ramban, which makes it both an easy stop for travelers passing through and a genuine short-break destination — skiing at nearby Madha Top in winter, forest walks the rest of the year.',
    bestTime: 'January – February (skiing), April – June (meadows)',
    idealDuration: '2 Days',
    altitude: '2,024 m',
    travelStyles: ['Adventure', 'Nature'],
    seasons: ['Winter', 'Summer'],
    bestFor: ['Families', 'Friends & Groups'],
    highlights: [
      { title: 'Winter skiing at Madha Top', description: 'Gentle, beginner-friendly slopes about 5-6 km from Patnitop on the Sanasar road.' },
      { title: 'Deodar forest walks', description: 'Pine and deodar cover much of the plateau around the town.' },
      { title: 'A highway-side base', description: 'Easy to fold into a Jammu–Srinagar road trip.' }
    ],
    places: [
      { title: 'Patnitop meadow', description: 'The open plateau at the centre of the town.' },
      { title: 'Madha Top', description: 'The nearby ski slope, on the road toward Sanasar.' }
    ],
    experiences: ['Skiing at Madha Top (winter)', 'Forest walks', 'Photography'],
    relatedSlugs: ['jammu', 'bhaderwah'],
    seo: { title: 'Patnitop Travel Guide | Jammu & Kashmir | The Apex Voyager', description: 'Plan a Patnitop stop on the Jammu–Srinagar highway — winter skiing at Madha Top, deodar forests, and easy mountain air.' },
    travelTips: [
      'Patnitop is a working highway-side hill station — expect through-traffic.',
      'Ski-season snow conditions vary year to year — confirm current conditions with a local operator before planning specific dates.'
    ],
    matchScores: { adventure: 55, nature: 60, luxury: 30, crowds: 35, slowTravel: 45 },
    seasonalNotes: {
      Winter: 'December–February brings snow and the skiing season at Madha Top.',
      Summer: 'April–June is green and mild.'
    }
  },
  {
    slug: 'bhaderwah',
    title: 'Bhaderwah',
    category: 'Offbeat',
    description: 'A bowl-shaped valley town known regionally as "Mini Kashmir" for meadows, orchards and springs, with lighter tourism infrastructure than the Kashmir Valley.',
    toursCount: 0,
    image: images.destinationsHero,
    region: 'Doda District',
    state: 'Jammu & Kashmir',
    editorialDescription: 'Bhaderwah sits in a valley ringed by snow-capped peaks, pine forest and apple orchards. The J&K Directorate of Tourism itself describes it as topographically and culturally similar to the Kashmir Valley — which is where the long-standing "Mini Kashmir" name comes from — though tourism infrastructure here remains lighter than in Kashmir itself.',
    bestTime: 'April – June, September – October',
    idealDuration: '2–3 Days',
    altitude: '1,613 m',
    travelStyles: ['Nature', 'Offbeat', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'A bowl-shaped valley setting', description: 'Snow-capped peaks ring the town on most sides.' },
      { title: 'Orchards and springs', description: 'Apple and walnut orchards, and several natural springs, dot the valley floor.' },
      { title: 'Known regionally as "Mini Kashmir"', description: 'A description used by the J&K Directorate of Tourism itself for the valley’s Kashmir-like setting.' }
    ],
    places: [
      { title: 'Jamia Masjid, Bhaderwah', description: 'A well-known mosque in the town centre.' },
      { title: 'Chinta Valley', description: 'A meadow valley a short distance from the town.' },
      { title: 'Padri Pass', description: 'A high pass toward Chamba, HP — seasonal; confirm current road status before planning it as a route.' }
    ],
    experiences: ['Meadow walks', 'Orchard-season visits', 'Photography'],
    relatedSlugs: ['patnitop', 'jammu'],
    seo: { title: 'Bhaderwah Travel Guide | Jammu & Kashmir | The Apex Voyager', description: 'Plan a Bhaderwah trip — the valley known regionally as "Mini Kashmir," orchards, springs, and quiet Himalayan scenery.' },
    travelTips: [
      'Padri Pass toward Chamba is a seasonal, high-altitude road — confirm current status before planning it as a route, not just a viewpoint.',
      'Book accommodation ahead in peak season — infrastructure here is lighter than in more visited J&K hill stations.'
    ],
    matchScores: { adventure: 35, nature: 85, luxury: 20, crowds: 10, slowTravel: 80 },
    seasonalNotes: {
      Spring: 'April–May brings orchard blossom.',
      Autumn: 'September–October is clear and cool.'
    }
  },
  {
    slug: 'ramnagar-corbett',
    title: 'Ramnagar',
    category: 'Wildlife',
    accessType: 'road',
    description: 'The gateway town to Corbett Tiger Reserve, India’s oldest national park.',
    toursCount: 0,
    image: images.destinations.ramnagarCorbett,
    region: 'Nainital District',
    state: 'Uttarakhand',
    editorialDescription: 'Ramnagar itself is a workaday market town, but it’s also the gateway to Corbett Tiger Reserve — established in 1936 as Hailey National Park, India’s first national park, and the site where Project Tiger was launched in 1973. Most of what travelers come for happens through the reserve’s own gates and permit system, with Ramnagar as the town where you actually stay, eat and arrange a visit.',
    bestTime: 'November – June (individual zones have their own seasonal access — confirm current status through the forest authorities)',
    idealDuration: '2–3 Days',
    travelStyles: ['Wildlife', 'Nature', 'Family'],
    seasons: ['Winter', 'Spring', 'Summer'],
    bestFor: ['Families', 'Friends & Groups'],
    highlights: [
      { title: 'Corbett Tiger Reserve', description: 'India’s first national park (established 1936), and the birthplace of Project Tiger (1973).' },
      { title: 'Forest-department-regulated safari access', description: 'Entry is through specific gates and zones, controlled by the Uttarakhand Forest Department.' },
      { title: 'A genuine gateway town', description: 'Ramnagar’s own identity is built around servicing the reserve.' }
    ],
    places: [
      { title: 'Corbett Tiger Reserve entry gates', description: 'Several forest-department-controlled gates provide access to different zones; specific gates and their seasonal status vary and should be confirmed before travel.' }
    ],
    experiences: ['Jeep safari (permit required, arranged through the forest authorities)', 'Birdwatching', 'Forest rest-house stays (where available, booked through the forest department)'],
    relatedSlugs: ['nainital', 'mukteshwar'],
    seo: { title: 'Ramnagar & Corbett Travel Guide | Uttarakhand | The Apex Voyager', description: 'Plan a Corbett trip from Ramnagar — forest-regulated safaris and India’s oldest tiger reserve.' },
    travelTips: [
      'Safari access is regulated by the forest authorities; confirm current zones, permits and seasonal access through the official authority before travel.',
      'Wildlife sightings, including tiger sightings, are never guaranteed on any safari — treat a visit as a forest and habitat experience, not a guaranteed encounter.'
    ],
    matchScores: { adventure: 60, nature: 90, luxury: 35, crowds: 45, slowTravel: 30 }
  },
  {
    slug: 'kufri',
    title: 'Kufri',
    category: 'Adventure',
    description: 'A Shimla-area hill stop built around a high-altitude nature park and family activity ground.',
    toursCount: 0,
    image: images.destinations.kufri,
    region: 'Shimla District',
    state: 'Himachal Pradesh',
    altitude: '2,289 m',
    editorialDescription: 'Kufri sits about 12 km from Shimla and is where the Shimla trip most families actually spend an afternoon — the Himalayan Nature Park, a high-altitude enclosure for regional wildlife at around 2,600 m, and the go-karting and rides at Kufri Fun World. It has its own hotels for travelers who’d rather base here than in Shimla itself.',
    bestTime: 'March – June, October – February',
    idealDuration: '1–2 Days',
    travelStyles: ['Adventure', 'Family', 'Nature'],
    seasons: ['Summer', 'Winter'],
    bestFor: ['Families', 'Friends & Groups'],
    highlights: [
      { title: 'Himalayan Nature Park', description: 'A high-altitude wildlife enclosure at around 2,600 m, home to regional species like musk deer and snow leopard.' },
      { title: 'Kufri Fun World', description: 'Go-karting and family rides, one of the area’s better-known activity stops.' },
      { title: 'Mahasu Peak views', description: 'A nearby viewpoint reached on foot or pony, popular for winter snow.' }
    ],
    places: [
      { title: 'Himalayan Nature Park', description: 'A forest-department wildlife enclosure with regional Himalayan species.' },
      { title: 'Kufri Fun World', description: 'Go-karting and rides for families.' },
      { title: 'Mahasu Peak', description: 'A short pony or walking route above the main village.' }
    ],
    experiences: ['Wildlife park visit', 'Go-karting', 'Pony rides (seasonal)', 'Winter snow activities'],
    relatedSlugs: ['shimla', 'chail'],
    seo: { title: 'Kufri Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Kufri trip — the Himalayan Nature Park, Kufri Fun World, and an easy Shimla-area base.' },
    travelTips: [
      'Kufri gets crowded with Shimla day-trippers on weekends — a weekday visit is quieter.',
      'The nature park and Mahasu Peak both involve some walking or pony riding — wear comfortable shoes.'
    ],
    matchScores: { adventure: 45, nature: 60, luxury: 30, crowds: 55, slowTravel: 35 },
    seasonalNotes: {
      Summer: 'April–June is mild and clear.',
      Winter: 'December–February often brings snow, popular for winter activities.'
    }
  },
  {
    slug: 'narkanda',
    title: 'Narkanda',
    category: 'Nature',
    description: 'An apple-country hill town on the old Hindustan-Tibet road, and the base for Hatu Peak.',
    toursCount: 0,
    image: images.destinations.narkanda,
    region: 'Shimla District',
    state: 'Himachal Pradesh',
    altitude: '2,708 m',
    editorialDescription: 'Narkanda sits about 65 km beyond Shimla on the old Hindustan-Tibet road, in the heart of Himachal’s apple country. Samuel Evans Stokes introduced apple cultivation to the surrounding orchards in the 1910s, and that legacy still shapes the area. Hatu Peak, the region’s high point, rises just above the town.',
    bestTime: 'March – June, September – November',
    idealDuration: '1–2 Days',
    travelStyles: ['Nature', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'Hatu Peak', description: 'The area’s high point at around 3,400 m, about 8 km from town, with wide Himalayan views.' },
      { title: 'Apple orchards', description: 'Orchards around Narkanda and Kotgarh mark one of Himachal’s oldest apple-growing belts.' },
      { title: 'Tani Jubbar Lake', description: 'A small forest lake a short walk from the main road.' }
    ],
    places: [
      { title: 'Hatu Peak', description: 'A small temple and viewpoint at the summit, reachable by a walkable trail.' },
      { title: 'Tani Jubbar Lake', description: 'A quiet forest lake near the highway.' },
      { title: 'Stokes Farm, Kotgarh', description: 'The orchard associated with Samuel Evans Stokes, who introduced apple cultivation to the region in the 1910s.' }
    ],
    experiences: ['Hatu Peak hike', 'Orchard-season visits', 'Winter skiing (Dhumri slopes, conditions vary)', 'Photography'],
    relatedSlugs: ['shimla', 'kufri'],
    seo: { title: 'Narkanda Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Narkanda trip — Hatu Peak, apple orchards, and the old Hindustan-Tibet road.' },
    travelTips: [
      'Roads can be snowbound in peak winter — check conditions before a December–February trip.',
      'Orchard-season visits (September–October) coincide with the apple harvest.'
    ],
    matchScores: { adventure: 40, nature: 80, luxury: 25, crowds: 25, slowTravel: 70 },
    seasonalNotes: {
      Autumn: 'September–October is apple harvest season.',
      Winter: 'December–February brings snow and occasional skiing at Dhumri.'
    }
  },
  {
    slug: 'sarahan',
    title: 'Sarahan',
    category: 'Pilgrimage',
    accessType: 'road',
    description: 'A temple town on the old Hindustan-Tibet road, built around the Bhimakali Temple and known as the gateway to Kinnaur.',
    toursCount: 0,
    image: images.destinations.sarahan,
    region: 'Shimla District',
    state: 'Himachal Pradesh',
    altitude: '2,313 m',
    editorialDescription: 'Sarahan sits above the Sutlej River, about 180 km from Shimla, and is built almost entirely around the Bhimakali Temple — one of the 51 Shaktipeethas of Hindu tradition. Most travelers heading into Kinnaur pass through or stay a night here, which has earned it the label "gateway to Kinnaur."',
    bestTime: 'March – June, September – November',
    idealDuration: '1–2 Days',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Families'],
    highlights: [
      { title: 'Bhimakali Temple', description: 'A twin-towered temple complex, one of the 51 Shaktipeethas, combining Hindu and Buddhist architectural styles.' },
      { title: 'Gateway to Kinnaur', description: 'The last major stop most travelers make before the road continues into Kinnaur proper.' },
      { title: 'Sutlej Valley views', description: 'Wide valley views from the temple grounds and surrounding ridge.' }
    ],
    places: [
      { title: 'Bhimakali Temple', description: 'The town’s central temple complex, an active place of worship.' },
      { title: 'Sarahan bazaar', description: 'The small town market below the temple.' }
    ],
    experiences: ['Temple visit', 'Valley viewpoint walks', 'Photography'],
    relatedSlugs: ['kinnaur', 'sangla-valley'],
    seo: { title: 'Sarahan Travel Guide | Bhimakali Temple | The Apex Voyager', description: 'Plan a Sarahan stop — the Bhimakali Temple and the gateway to Kinnaur.' },
    travelTips: [
      'The temple is a working shrine — dress modestly and expect to remove footwear.',
      'Roads beyond Sarahan into Kinnaur can be affected by monsoon landslides — check conditions before continuing.'
    ],
    matchScores: { adventure: 20, nature: 55, luxury: 20, crowds: 25, slowTravel: 65 },
    seasonalNotes: {
      Summer: 'June–August is accessible, though monsoon rain can affect the onward Kinnaur road.',
      Autumn: 'September–October is clear and stable.'
    }
  },
  {
    slug: 'kullu',
    title: 'Kullu',
    category: 'Culture',
    description: 'The valley’s administrative and religious center, home to the Raghunath Temple and the internationally recognized Kullu Dussehra festival.',
    toursCount: 0,
    image: images.destinationsHero,
    region: 'Kullu District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Kullu town sits at the confluence of the Beas and Sarvari rivers and functions as the valley’s practical and religious center — a role Manali, further up the valley, doesn’t play. The Raghunath Temple, established in the 17th century by Maharaja Jagat Singh, houses the deity considered presiding over the whole valley, and each October the town hosts the week-long Kullu Dussehra, recognized as an international-level fair.',
    bestTime: 'March – June, October',
    idealDuration: '2 Days',
    travelStyles: ['Culture', 'Family'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Raghunath Temple', description: 'The valley’s presiding-deity temple, established in the 17th century.' },
      { title: 'Kullu Dussehra', description: 'A week-long international-level fair each October, when Lord Raghunath’s chariot is drawn through Dhalpur ground.' },
      { title: 'Beas–Sarvari confluence', description: 'The riverside setting the town is built around.' }
    ],
    places: [
      { title: 'Raghunath Temple', description: 'The valley’s central temple, inside the old Kullu palace complex.' },
      { title: 'Dhalpur Maidan', description: 'The open ground where Kullu Dussehra is held each October.' },
      { title: 'Sarvari riverfront', description: 'The confluence area where the Sarvari meets the Beas.' }
    ],
    experiences: ['Temple visit', 'Dussehra festival (October)', 'Riverside walks', 'Local market browsing'],
    relatedSlugs: ['manali', 'naggar'],
    seo: { title: 'Kullu Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Kullu trip — the Raghunath Temple, Kullu Dussehra, and the valley’s practical center.' },
    travelTips: [
      'Kullu Dussehra (October) brings large crowds — book accommodation well ahead if visiting for the festival.',
      'The Raghunath Temple is a working shrine — dress modestly.'
    ],
    matchScores: { adventure: 20, nature: 45, luxury: 30, crowds: 55, slowTravel: 45 },
    seasonalNotes: {
      Autumn: 'October is Kullu Dussehra season — the valley’s biggest annual event.',
      Summer: 'April–June is warm and clear.'
    }
  },
  {
    slug: 'naggar',
    title: 'Naggar',
    category: 'Colonial Charm',
    description: 'The former capital of the Kullu kingdom, home to a 15th-century castle and the Nicholas Roerich estate.',
    toursCount: 0,
    image: images.destinations.naggar,
    region: 'Kullu District',
    state: 'Himachal Pradesh',
    altitude: '1,800 m',
    editorialDescription: 'Naggar was the capital of the Kullu kingdom for centuries before the seat moved to Kullu and later Sultanpur. The castle built here around 1460 CE by Raja Sidh Singh survived the 1905 earthquake through its earthquake-resistant Kath-Kuni construction, and now runs as a heritage hotel. Above it, the Russian painter Nicholas Roerich lived from 1928 until his death in 1947; his estate is now an art museum.',
    bestTime: 'March – June, September – November',
    idealDuration: '1–2 Days',
    travelStyles: ['Culture', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Solo Travelers'],
    highlights: [
      { title: 'Naggar Castle', description: 'A ~1460 CE fort built in earthquake-resistant Kath-Kuni style, now a heritage hotel.' },
      { title: 'Nicholas Roerich Art Gallery', description: 'The former home and studio of the Russian painter, who lived here 1928–1947.' },
      { title: 'Former royal capital', description: 'Naggar was the seat of the Kullu kingdom for centuries before Kullu town.' }
    ],
    places: [
      { title: 'Naggar Castle', description: 'The former royal fort, open to visitors and run as a heritage hotel.' },
      { title: 'Nicholas Roerich Art Gallery', description: 'The painter’s estate, about 1 km above the castle, now a museum.' }
    ],
    experiences: ['Castle visit', 'Art gallery visit', 'Village walks'],
    relatedSlugs: ['manali', 'kullu'],
    seo: { title: 'Naggar Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Naggar trip — the 15th-century castle, the Nicholas Roerich estate, and the former Kullu capital.' },
    travelTips: [
      'The castle and art gallery are a short walk apart — plan a half-day for both.',
      'Naggar makes a quieter overnight base than Manali if you want valley views without the crowds.'
    ],
    matchScores: { adventure: 15, nature: 60, luxury: 45, crowds: 20, slowTravel: 75 },
    seasonalNotes: {
      Summer: 'April–June is clear and mild.',
      Autumn: 'September–November is quiet, with good visibility.'
    }
  },
  {
    slug: 'palampur',
    title: 'Palampur',
    category: 'Nature',
    description: 'Himachal’s tea-growing town, built around plantations and the Neugal Khad gorge.',
    toursCount: 0,
    image: images.destinations.palampur,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    altitude: '1,219 m',
    editorialDescription: 'Palampur is Himachal’s tea country — cultivation here dates to 1849–1852, when the British botanist Dr. Jameson introduced Chinese Camellia sinensis plants, and working estates still shape the town’s identity today. On its edge, the Neugal Khad — a roughly 305 m wide, 100-metre-plus gorge — cuts across the plateau, with a café overlooking the drop.',
    bestTime: 'March – June, September – November',
    idealDuration: '2 Days',
    travelStyles: ['Nature', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'Tea estates', description: 'Working tea gardens dating to the 1850s, walkable from town.' },
      { title: 'Neugal Khad', description: 'A wide, deep gorge with a viewpoint café on its edge.' },
      { title: 'Dhauladhar backdrop', description: 'The tea plateau sits directly below the Dhauladhar range.' }
    ],
    places: [
      { title: 'Palampur tea gardens', description: 'Working estates open for walks, some offering tastings.' },
      { title: 'Neugal Khad', description: 'The town’s landmark gorge, with a Himachal Tourism café on the rim.' }
    ],
    experiences: ['Tea estate walks', 'Neugal Khad viewpoint', 'Photography'],
    relatedSlugs: ['dharamshala', 'pragpur'],
    seo: { title: 'Palampur Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Palampur trip — tea estates, the Neugal Khad gorge, and Dhauladhar views.' },
    travelTips: [
      'Estate visits are best in the early morning when plantation workers are out picking.',
      'Neugal Khad gets busy with day-trippers on weekends.'
    ],
    matchScores: { adventure: 15, nature: 75, luxury: 35, crowds: 35, slowTravel: 70 },
    seasonalNotes: {
      Summer: 'April–June is warm with clear Dhauladhar views.',
      Autumn: 'September–November is cool and quiet.'
    }
  },
  {
    slug: 'pragpur',
    title: 'Pragpur',
    category: 'Colonial Charm',
    description: 'India’s first officially declared Heritage Village, built by the Kuthiala Sud clan in the 17th century.',
    toursCount: 0,
    image: images.destinationsHero,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Pragpur was declared India’s first Heritage Village by the Himachal Pradesh government in December 1997, and it earns the label — cobbled streets, a village pond (the Taal), and houses built in a genuine mix of Kangra, Rajput, British, Portuguese and Italian styles, laid out by the Kuthiala Sud clan from the 17th century onward. The Judge’s Court, a 1918 ancestral home turned heritage stay, anchors the village.',
    bestTime: 'March – June, September – November',
    idealDuration: '1 Day',
    travelStyles: ['Culture', 'Slow travel'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'India’s first Heritage Village', description: 'Officially declared by the Himachal Pradesh government in December 1997.' },
      { title: 'Mixed architectural styles', description: 'Kangra, Rajput, British, Portuguese and Italian influences sit side by side.' },
      { title: 'The Judge’s Court', description: 'A 1918 ancestral home, now a heritage hotel, a short walk from the village core.' }
    ],
    places: [
      { title: 'The Taal', description: 'The village’s traditional pond, at the heart of the old core.' },
      { title: 'The Judge’s Court', description: 'A restored 1918 heritage home open as a hotel.' },
      { title: 'Village core streets', description: 'Cobbled lanes lined with the village’s mixed-style architecture.' }
    ],
    experiences: ['Heritage walking tour', 'Architecture photography', 'Village-core stroll'],
    relatedSlugs: ['palampur', 'dharamshala'],
    seo: { title: 'Pragpur Travel Guide | India’s First Heritage Village | The Apex Voyager', description: 'Plan a Pragpur visit — India’s first officially declared Heritage Village, in Himachal’s Kangra Valley.' },
    travelTips: [
      'The village core is small — a couple of hours on foot covers it well.',
      'Combine with nearby Garli, part of the same Heritage Zone, for a fuller day.'
    ],
    matchScores: { adventure: 10, nature: 40, luxury: 40, crowds: 20, slowTravel: 80 },
    seasonalNotes: {
      Summer: 'April–June is warm and clear.',
      Autumn: 'September–November is cool, good for walking.'
    }
  },
  {
    slug: 'kangra',
    title: 'Kangra',
    category: 'Pilgrimage',
    accessType: 'road',
    description: 'A historic fort-and-temple town, home to the largest fort in the Indian Himalayas and the Brajeshwari Devi Temple.',
    toursCount: 0,
    image: images.destinations.kangra,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Kangra town, about 20 km from Dharamshala, is built around two genuinely major landmarks: Kangra Fort — the largest fort in the Indian Himalayas, held by the Katoch dynasty and with historical references stretching back millennia — and the Brajeshwari Devi Temple, a major pilgrimage site dedicated to Durga as Vajreshwari. It’s a distinct heritage stop from Dharamshala’s own gateway-town identity.',
    bestTime: 'March – June, September – November',
    idealDuration: '1–2 Days',
    travelStyles: ['Culture', 'Pilgrimage'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Kangra Fort', description: 'The largest fort in the Indian Himalayas, built by the Katoch dynasty.' },
      { title: 'Brajeshwari Devi Temple', description: 'A major temple dedicated to Durga as Vajreshwari, near the fort.' },
      { title: 'A historic Kangra Valley town', description: 'Distinct from Dharamshala, about 20 km away.' }
    ],
    places: [
      { title: 'Kangra Fort', description: 'A massive hilltop fortification with centuries of history.' },
      { title: 'Brajeshwari Devi Temple', description: 'The town’s principal temple, a working pilgrimage site.' }
    ],
    experiences: ['Fort visit', 'Temple visit', 'Local market walk'],
    relatedSlugs: ['dharamshala', 'jawalamukhi'],
    seo: { title: 'Kangra Travel Guide | Fort & Temple Town | The Apex Voyager', description: 'Plan a Kangra trip — the largest fort in the Himalayas and the Brajeshwari Devi Temple.' },
    travelTips: [
      'The fort involves some climbing on uneven stone — comfortable footwear helps.',
      'The temple is a working shrine — dress modestly.'
    ],
    matchScores: { adventure: 25, nature: 35, luxury: 25, crowds: 35, slowTravel: 55 },
    seasonalNotes: {
      Summer: 'April–June is warm and clear.',
      Autumn: 'September–November is cool and comfortable.'
    }
  },
  {
    slug: 'jawalamukhi',
    title: 'Jawalamukhi',
    category: 'Pilgrimage',
    accessType: 'road',
    description: 'A Shakti Peeth pilgrimage town built around the Jwalamukhi Temple and its natural flame.',
    toursCount: 0,
    image: images.destinations.jawalamukhi,
    region: 'Kangra Valley',
    state: 'Himachal Pradesh',
    editorialDescription: 'Jawalamukhi is a pilgrimage town in the Shivalik foothills of Kangra district, built around the Jwalamukhi Temple — one of the 51 Shakti Peethas of Hindu tradition. Inside the sanctum, natural flames burn continuously from crevices in the rock rather than from a conventional idol; geologists attribute this to natural gas seeping from deposits beneath the site, while for pilgrims the flames are the goddess’s own manifestation. The town’s market and accommodation are built entirely around the temple.',
    bestTime: 'March – June, September – November',
    idealDuration: '1 Day',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Jwalamukhi Temple', description: 'A Shakti Peeth where natural flames burn from rock crevices in the sanctum.' },
      { title: 'A dedicated pilgrimage town', description: 'The town’s market and stays are built around the temple.' }
    ],
    places: [
      { title: 'Jwalamukhi Temple', description: 'The town’s central shrine, with continuously burning natural flames.' },
      { title: 'Temple bazaar', description: 'The market street leading to the temple entrance.' }
    ],
    experiences: ['Temple visit', 'Bazaar walk'],
    relatedSlugs: ['kangra', 'dharamshala'],
    seo: { title: 'Jawalamukhi Travel Guide | Shakti Peeth Temple | The Apex Voyager', description: 'Plan a Jawalamukhi visit — the Jwalamukhi Temple, one of the 51 Shakti Peethas, in Himachal’s Kangra Valley.' },
    travelTips: [
      'The temple is a working shrine with continuous pilgrim flow — dress modestly and expect queues on festival days.',
      'The town is compact and walkable from most accommodation.'
    ],
    matchScores: { adventure: 5, nature: 25, luxury: 15, crowds: 50, slowTravel: 40 },
    seasonalNotes: {
      Spring: 'The Navratri festival periods bring the largest pilgrim crowds.',
      Summer: 'April–June is warm; the temple itself is indoors.'
    }
  },
  {
    slug: 'bharmour',
    title: 'Bharmour',
    category: 'Pilgrimage',
    description: 'A Budhil-valley temple town and the traditional base for the Manimahesh Kailash pilgrimage.',
    toursCount: 0,
    image: images.destinations.bharmour,
    region: 'Chamba District',
    state: 'Himachal Pradesh',
    altitude: '2,100 m',
    editorialDescription: 'Bharmour sits at around 2,100 m in the Budhil valley, between the Pir Panjal and Dhauladhar ranges. Its Chaurasi Temple complex — a cluster of shrines whose name refers to eighty-four — has been a centre of Gaddi community life for centuries, and the town is the traditional starting base for the Manimahesh Kailash pilgrimage each year.',
    bestTime: 'May – October',
    idealDuration: '1–2 Days',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Families'],
    highlights: [
      { title: 'Chaurasi Temple complex', description: 'A cluster of shrines including the Dharamraj (Dharmeshvar Mahadev) temple, a centre of Gaddi community worship.' },
      { title: 'Manimahesh Yatra base', description: 'The traditional starting town for the pilgrimage to Manimahesh Lake.' },
      { title: 'Gaddi community town', description: 'A Budhil-valley town shaped by generations of Gaddi shepherd culture.' }
    ],
    places: [
      { title: 'Chaurasi Temple complex', description: 'The town’s central shrine cluster, including the Dharamraj temple.' },
      { title: 'Bharmani Mata temple pool', description: 'A bathing pool about 4 km from town, part of the pilgrimage route.' }
    ],
    experiences: ['Temple complex visit', 'Manimahesh Yatra (seasonal)', 'Gaddi culture and crafts'],
    relatedSlugs: ['chamba', 'dalhousie'],
    seo: { title: 'Bharmour Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Bharmour trip — the Chaurasi Temple complex and the base for the Manimahesh Kailash pilgrimage.' },
    travelTips: [
      'The Manimahesh Yatra itself is seasonal and physically demanding — confirm current dates and conditions before planning around it.',
      'The Chaurasi complex is an active place of worship — dress modestly.'
    ],
    matchScores: { adventure: 30, nature: 55, luxury: 15, crowds: 30, slowTravel: 60 },
    seasonalNotes: {
      Summer: 'June–August is the main pilgrimage season.',
      Autumn: 'September–October is quieter and clear.'
    }
  },
  {
    slug: 'tabo',
    title: 'Tabo',
    category: 'Culture',
    description: 'A thousand-year-old monastery town in Spiti, known for murals often compared to the Ajanta Caves.',
    toursCount: 0,
    image: images.destinations.tabo,
    region: 'Lahaul and Spiti',
    state: 'Himachal Pradesh',
    altitude: '~3,050 m',
    editorialDescription: 'Tabo Monastery was founded in 996 CE under the patronage of King Yeshe-Ö of Guge, and its murals and stucco sculptures have earned it the description "the Ajanta of the Himalayas." The monastery is still an active place of worship, set in the stark high-altitude landscape of the Spiti Valley.',
    bestTime: 'May – October',
    idealDuration: '1–2 Days',
    travelStyles: ['Culture', 'Pilgrimage'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Couples'],
    highlights: [
      { title: 'Tabo Monastery', description: 'Founded in 996 CE, known for murals and stucco work compared to the Ajanta Caves.' },
      { title: 'Ancient manuscripts and murals', description: 'Centuries-old wall paintings and manuscripts housed within the monastery.' },
      { title: 'A living monastery', description: 'Still an active centre of worship, not only a heritage site.' }
    ],
    places: [
      { title: 'Tabo Monastery', description: 'The town’s central monastery complex, founded 996 CE.' },
      { title: 'Monastery caves', description: 'Meditation caves in the cliffs above the monastery.' }
    ],
    experiences: ['Monastery visit', 'Photography', 'Village walks'],
    relatedSlugs: ['spiti-valley', 'dhankar'],
    seo: { title: 'Tabo Travel Guide | Ajanta of the Himalayas | The Apex Voyager', description: 'Plan a Tabo trip — a thousand-year-old monastery in Spiti Valley, known for its murals.' },
    travelTips: [
      'Photography inside the mural halls is often restricted — check current rules on arrival.',
      'Nights are cold even in summer at this altitude — pack accordingly.'
    ],
    matchScores: { adventure: 25, nature: 60, luxury: 15, crowds: 20, slowTravel: 70 },
    seasonalNotes: {
      Summer: 'June–August is the most accessible window.',
      Autumn: 'September–October is clear with fewer visitors.'
    }
  },
  {
    slug: 'dhankar',
    title: 'Dhankar',
    category: 'Adventure',
    description: 'A cliffside monastery and village above the Spiti–Pin confluence, and the starting point for the Dhankar Lake trek.',
    toursCount: 0,
    image: images.destinations.dhankar,
    region: 'Lahaul and Spiti',
    state: 'Himachal Pradesh',
    altitude: '3,894 m',
    editorialDescription: 'Dhankar perches dramatically on a cliff above the confluence of the Spiti and Pin rivers — the name itself is said to combine "dhang" (cliff) and "kar" (fort). The monastery here is reckoned among the oldest in the valley, and a trek from the village climbs to Dhankar Lake, a high alpine lake above the settlement.',
    bestTime: 'May – October',
    idealDuration: '1–2 Days',
    travelStyles: ['Adventure', 'Culture'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'Dhankar Monastery', description: 'A cliffside monastery counted among the oldest in Spiti, with dramatic confluence views.' },
      { title: 'Dhankar Lake trek', description: 'A moderate trek from the village to a high alpine lake above the monastery.' },
      { title: 'Spiti–Pin confluence views', description: 'The village overlooks where the Pin river meets the Spiti river.' }
    ],
    places: [
      { title: 'Dhankar Monastery', description: 'The cliffside monastery at the heart of the village.' },
      { title: 'Dhankar Lake', description: 'A high alpine lake reached by a trek of roughly 45 minutes to a few hours from the monastery.' }
    ],
    experiences: ['Monastery visit', 'Dhankar Lake trek', 'Photography'],
    relatedSlugs: ['spiti-valley', 'tabo'],
    seo: { title: 'Dhankar Travel Guide | Spiti Valley | The Apex Voyager', description: 'Plan a Dhankar trip — a cliffside monastery above the Spiti–Pin confluence, and the Dhankar Lake trek.' },
    travelTips: [
      'The lake trek gains real altitude quickly — pace yourself and carry water.',
      'Basic homestays exist in the village — book ahead in peak season.'
    ],
    matchScores: { adventure: 55, nature: 70, luxury: 10, crowds: 20, slowTravel: 55 },
    seasonalNotes: {
      Summer: 'June–August is the most reliable trekking window.',
      Autumn: 'September–October is clear and cool.'
    }
  },
  {
    slug: 'kibber',
    title: 'Kibber',
    category: 'Wildlife',
    description: 'One of the highest permanently inhabited villages in India, and the base for the Kibber Wildlife Sanctuary.',
    toursCount: 0,
    image: images.destinations.kibber,
    region: 'Lahaul and Spiti',
    state: 'Himachal Pradesh',
    altitude: '4,270 m',
    editorialDescription: 'Kibber sits at around 4,270 m, among the highest permanently inhabited villages in India, and is the base for the Kibber Wildlife Sanctuary — a cold-desert protected area established in 1999 and known as snow leopard habitat. Sightings are never guaranteed; winter (when the cats move to lower ground) offers the best chance.',
    bestTime: 'May – October (general visits), November – February (snow leopard season)',
    idealDuration: '1–2 Days',
    travelStyles: ['Wildlife', 'Adventure'],
    seasons: ['Summer', 'Winter'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'Kibber Wildlife Sanctuary', description: 'A cold-desert protected area established in 1999, known snow leopard habitat.' },
      { title: 'One of India’s highest villages', description: 'A permanently inhabited settlement at around 4,270 m.' },
      { title: 'Village monastery', description: 'A small monastery within the village itself.' }
    ],
    places: [
      { title: 'Kibber Wildlife Sanctuary', description: 'The protected cold-desert habitat surrounding the village.' },
      { title: 'Kibber village', description: 'Flat-roofed stone houses typical of high-Spiti architecture.' }
    ],
    experiences: ['Wildlife sanctuary visit', 'Winter snow leopard tracking (never guaranteed)', 'Village walks'],
    relatedSlugs: ['spiti-valley', 'tabo'],
    seo: { title: 'Kibber Travel Guide | Spiti Valley | The Apex Voyager', description: 'Plan a Kibber trip — one of India’s highest villages, and the Kibber Wildlife Sanctuary.' },
    travelTips: [
      'Snow leopard sightings are never guaranteed on any visit — treat it as a habitat experience, not a promised sighting.',
      'The altitude here is serious — acclimatize in Kaza first rather than arriving directly.'
    ],
    matchScores: { adventure: 60, nature: 85, luxury: 10, crowds: 15, slowTravel: 55 },
    seasonalNotes: {
      Summer: 'June–August is the most accessible window for general visits.',
      Winter: 'December–February is when snow leopards move to lower ground, improving sighting odds without guaranteeing one.'
    }
  },
  {
    slug: 'keylong',
    title: 'Keylong',
    category: 'Nature',
    description: 'The district headquarters of Lahaul and Spiti, and a base for exploring the Lahaul valley.',
    toursCount: 0,
    image: images.destinations.keylong,
    region: 'Lahaul and Spiti',
    state: 'Himachal Pradesh',
    altitude: '~3,080 m',
    editorialDescription: 'Keylong is the administrative headquarters of the Lahaul and Spiti district, about 71 km from Manali via the Atal Tunnel. It has its own monasteries and a genuine town identity distinct from both Manali and the Spiti side of the district, and increasingly serves as a base for travelers exploring Lahaul specifically.',
    bestTime: 'May – October',
    idealDuration: '1–2 Days',
    travelStyles: ['Nature', 'Culture'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Couples'],
    highlights: [
      { title: 'Lahaul district headquarters', description: 'The administrative and practical base town for the Lahaul valley.' },
      { title: 'Local monasteries', description: 'Several monasteries reflecting the valley’s Buddhist heritage.' },
      { title: 'Atal Tunnel gateway', description: 'Reached from Manali in a fraction of the old over-the-pass driving time.' }
    ],
    places: [
      { title: 'Keylong town', description: 'The district headquarters, with its own bazaar and administrative buildings.' },
      { title: 'Khardong Monastery', description: 'A monastery in the hills above town.' }
    ],
    experiences: ['Monastery visits', 'Lahaul valley day trips', 'Local market walk'],
    relatedSlugs: ['manali', 'spiti-valley'],
    seo: { title: 'Keylong Travel Guide | Lahaul Valley | The Apex Voyager', description: 'Plan a Keylong trip — the Lahaul district headquarters and a base for exploring the valley.' },
    travelTips: [
      'The Atal Tunnel has made Keylong far more accessible year-round than the old Rohtang Pass route, though winter conditions still vary — check current status before travel.'
    ],
    matchScores: { adventure: 30, nature: 70, luxury: 20, crowds: 20, slowTravel: 65 },
    seasonalNotes: {
      Summer: 'June–August is the main travel season.',
      Autumn: 'September is clear and quiet.'
    }
  },
  {
    slug: 'mandi',
    title: 'Mandi',
    category: 'Pilgrimage',
    description: 'Known as "Chhoti Kashi" for its many temples, set at the confluence of the Suketi and Beas rivers.',
    toursCount: 0,
    image: images.destinations.mandi,
    region: 'Mandi District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Mandi has long been called "Chhoti Kashi" — the local claim is that where Kashi (Varanasi) has eighty temples, Mandi has eighty-one. The Panchvaktra Temple, at the confluence of the Suketi and Beas rivers, is a recognized heritage monument, and temples like Triloknath and Bhootnath are woven into the town’s everyday streets rather than set apart from them.',
    bestTime: 'March – June, September – November',
    idealDuration: '1–2 Days',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Couples'],
    highlights: [
      { title: 'Panchvaktra Temple', description: 'A heritage-listed temple at the Suketi–Beas confluence, dedicated to five forms of Shiva.' },
      { title: '"Chhoti Kashi"', description: 'A town known for its dense concentration of temples woven through its streets.' },
      { title: 'Bhootnath and Triloknath temples', description: 'Among the town’s other well-known shrines.' }
    ],
    places: [
      { title: 'Panchvaktra Temple', description: 'At the confluence of the Suketi and Beas, a recognized heritage monument.' },
      { title: 'Bhootnath Temple', description: 'A well-known shrine in the Chouhata Bazaar area.' },
      { title: 'Triloknath Temple', description: 'A temple in the Purani Mandi area of town.' }
    ],
    experiences: ['Temple walks', 'Old-town bazaar walk', 'Riverside evenings'],
    relatedSlugs: ['rewalsar', 'kullu'],
    seo: { title: 'Mandi Travel Guide | Chhoti Kashi | The Apex Voyager', description: 'Plan a Mandi trip — the town known as Chhoti Kashi for its many temples, at the Suketi–Beas confluence.' },
    travelTips: [
      'Rewalsar Lake is a well-known day trip from Mandi, about 24 km away.',
      'The temples are working shrines — dress modestly.'
    ],
    matchScores: { adventure: 15, nature: 40, luxury: 30, crowds: 40, slowTravel: 55 },
    seasonalNotes: {
      Summer: 'April–June is warm; riverside areas offer some relief.',
      Autumn: 'September–November is cool and comfortable.'
    }
  },
  {
    slug: 'rewalsar',
    title: 'Rewalsar',
    category: 'Pilgrimage',
    description: 'A small lake revered by Hindus, Buddhists and Sikhs alike, known to Tibetan Buddhists as Tso Pema.',
    toursCount: 0,
    image: images.destinations.rewalsar,
    region: 'Mandi District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Rewalsar Lake — known as Tso Pema, the "Lotus Lake," to Tibetan Buddhists — is ringed by temples, monasteries and a gurdwara belonging to three different faiths. Buddhist tradition holds that Guru Padmasambhava meditated here before travelling to Tibet; the Gurdwara Rewalsar Sahib honours a visit by Guru Gobind Singh; and Hindu tradition associates the site with the sage Lomas.',
    bestTime: 'March – June, September – November',
    idealDuration: '1 Day',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Solo Travelers', 'Families'],
    highlights: [
      { title: 'A three-faith pilgrimage lake', description: 'Hindu, Buddhist and Sikh shrines share the lake’s periphery.' },
      { title: 'Padmasambhava association', description: 'Tibetan Buddhist tradition holds Guru Rinpoche meditated here before travelling to Tibet.' },
      { title: 'Gurdwara Rewalsar Sahib', description: 'A gurdwara associated with a visit by Guru Gobind Singh.' }
    ],
    places: [
      { title: 'Rewalsar Lake', description: 'The small lake at the heart of the town, ringed by shrines of three faiths.' },
      { title: 'Gurdwara Rewalsar Sahib', description: 'The town’s gurdwara, on the lake’s edge.' }
    ],
    experiences: ['Lake circumambulation', 'Multi-faith temple and monastery visits', 'Photography'],
    relatedSlugs: ['mandi', 'kullu'],
    seo: { title: 'Rewalsar Travel Guide | Tso Pema | The Apex Voyager', description: 'Plan a Rewalsar trip — the multi-faith lake known to Tibetan Buddhists as Tso Pema.' },
    travelTips: [
      'This is an active pilgrimage site for three faiths — dress modestly and be respectful around all the shrines, not only one.',
      'Easily done as a day trip from Mandi, about 24 km away.'
    ],
    matchScores: { adventure: 10, nature: 50, luxury: 15, crowds: 30, slowTravel: 65 },
    seasonalNotes: {
      Summer: 'April–June is warm and clear.',
      Autumn: 'September–November is cool and quiet.'
    }
  },
  {
    slug: 'renuka-ji',
    title: 'Renuka Ji',
    category: 'Pilgrimage',
    description: 'Himachal’s largest natural lake, revered as the embodiment of the goddess Renuka, ringed by a wildlife sanctuary.',
    toursCount: 0,
    image: images.destinations.renukaJi,
    region: 'Sirmaur District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Renuka Lake, a Ramsar-listed wetland and Himachal’s largest natural lake, is held to be the embodiment of the goddess Renuka, mother of Lord Parshuram. Temples to both deities stand on its banks, and the surrounding Renuka Wildlife Sanctuary adds a forest and wildlife dimension to what is primarily a pilgrimage destination.',
    bestTime: 'October – March (including the Renuka Ji Fair)',
    idealDuration: '1–2 Days',
    travelStyles: ['Pilgrimage', 'Nature'],
    seasons: ['Autumn', 'Winter'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Renuka Lake', description: 'A Ramsar-listed wetland and Himachal’s largest natural lake.' },
      { title: 'Renuka and Parshuram temples', description: 'Shrines on the lake bank dedicated to the goddess and her son.' },
      { title: 'International Renuka Ji Fair', description: 'A five-day fair held after Diwali each November, with processions of local deities.' }
    ],
    places: [
      { title: 'Renuka Lake', description: 'The lake at the centre of the site, with a circumference of roughly 2.5 km.' },
      { title: 'Renuka Wildlife Sanctuary', description: 'The forest sanctuary surrounding the lake.' }
    ],
    experiences: ['Lake walk', 'Temple visits', 'Renuka Ji Fair (seasonal, November)', 'Wildlife sanctuary visit'],
    relatedSlugs: ['paonta-sahib', 'kasauli'],
    seo: { title: 'Renuka Ji Travel Guide | Himachal’s Largest Lake | The Apex Voyager', description: 'Plan a Renuka Ji trip — Himachal’s largest natural lake, its temples, and the surrounding wildlife sanctuary.' },
    travelTips: [
      'The International Renuka Ji Fair (a five-day event after Diwali, typically early-to-mid November) brings large crowds — book ahead if visiting then.',
      'The temples are active shrines — dress modestly.'
    ],
    matchScores: { adventure: 15, nature: 65, luxury: 20, crowds: 35, slowTravel: 60 },
    seasonalNotes: {
      Autumn: 'Late October–November includes the Renuka Ji Fair.',
      Winter: 'December–February is cool and clear.'
    }
  },
  {
    slug: 'paonta-sahib',
    title: 'Paonta Sahib',
    category: 'Pilgrimage',
    accessType: 'road',
    description: 'A Yamuna-riverside town founded by Guru Gobind Singh, and a significant Sikh pilgrimage site.',
    toursCount: 0,
    image: images.destinations.paontaSahib,
    region: 'Sirmaur District',
    state: 'Himachal Pradesh',
    altitude: '397 m',
    editorialDescription: 'Paonta Sahib was founded by Guru Gobind Singh in 1685, on land offered by the Raja of Nahan, and the Tenth Guru spent over four years here on the banks of the Yamuna. It was at Paonta that the Dasam Granth was composed, and the Gurdwara Paonta Sahib, along with a museum of weapons and manuscripts associated with the Guru, remains the town’s central identity.',
    bestTime: 'October – March',
    idealDuration: '1 Day',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Autumn', 'Winter', 'Spring'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Gurdwara Paonta Sahib', description: 'Built in memory of Guru Gobind Singh’s residence here from 1685.' },
      { title: 'Dasam Granth composition site', description: 'The Tenth Guru composed this text during his years at Paonta.' },
      { title: 'Yamuna riverside setting', description: 'The town sits directly on the river’s bank.' }
    ],
    places: [
      { title: 'Gurdwara Paonta Sahib', description: 'The town’s central gurdwara, with an associated museum of the Guru’s weapons and manuscripts.' },
      { title: 'Yamuna riverfront', description: 'The riverbank the town and gurdwara are built along.' }
    ],
    experiences: ['Gurdwara visit', 'Museum visit', 'Riverside walk'],
    relatedSlugs: ['renuka-ji', 'kasauli'],
    seo: { title: 'Paonta Sahib Travel Guide | Sikh Heritage on the Yamuna | The Apex Voyager', description: 'Plan a Paonta Sahib trip — the Gurdwara founded by Guru Gobind Singh, on the banks of the Yamuna.' },
    travelTips: [
      'The gurdwara’s langar serves free meals to all visitors — dress modestly and cover your head as is customary.',
      'The weapons/manuscripts museum is compact — an hour is usually enough.'
    ],
    matchScores: { adventure: 10, nature: 30, luxury: 20, crowds: 35, slowTravel: 50 },
    seasonalNotes: {
      Winter: 'November–February is mild and comfortable.',
      Autumn: 'October is clear and pleasant.'
    }
  },
  {
    slug: 'chintpurni',
    title: 'Chintpurni',
    category: 'Pilgrimage',
    accessType: 'road',
    description: 'A Shakti Peeth pilgrimage town in Una district, built around the Mata Chintpurni Temple.',
    toursCount: 0,
    image: images.destinations.chintpurni,
    region: 'Una District',
    state: 'Himachal Pradesh',
    altitude: '~980 m',
    editorialDescription: 'Chintpurni is a pilgrimage town in Una district built entirely around the Mata Chintpurni Temple, dedicated to Chhinnamasta — one of the ten Mahavidyas and, by tradition, one of the 51 Shakti Peethas of Hindu belief. The site was known by the goddess\'s own name, Chhinnamastika, before the popular name "Chintpurni" (she who removes worry) took hold. Dharamshalas, guesthouses and a market built for pilgrim flow line the approach to the temple, and the town\'s two biggest Navratri fairs each year bring its largest crowds.',
    bestTime: 'March – June, September – November',
    idealDuration: '1 Day',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Mata Chintpurni Temple', description: 'The Chhinnamasta shrine at the heart of the town, traditionally counted among the 51 Shakti Peethas.' },
      { title: 'Navratri fairs', description: 'Chaitra and Ashwin Navratri bring the town\'s largest pilgrim gatherings.' },
      { title: 'A dedicated pilgrimage town', description: 'Dharamshalas, guesthouses and the market are all built around the temple.' }
    ],
    places: [
      { title: 'Mata Chintpurni Temple', description: 'The town\'s central shrine, dedicated to the goddess Chhinnamasta.' },
      { title: 'Temple bazaar', description: 'The market street leading to the temple entrance.' }
    ],
    experiences: ['Temple visit', 'Bazaar walk'],
    relatedSlugs: ['jawalamukhi', 'naina-devi'],
    seo: { title: 'Chintpurni Travel Guide | Shakti Peeth Temple | The Apex Voyager', description: 'Plan a Chintpurni visit — the Mata Chintpurni Temple, traditionally one of the 51 Shakti Peethas, in Himachal\'s Una district.' },
    travelTips: [
      'The temple is a working shrine with continuous pilgrim flow — dress modestly and expect queues on festival days.',
      'Navratri periods bring the largest crowds; visit on an ordinary weekday for a quieter darshan.'
    ],
    matchScores: { adventure: 5, nature: 20, luxury: 15, crowds: 55, slowTravel: 35 },
    seasonalNotes: {
      Spring: 'Chaitra Navratri brings the year\'s first major pilgrim surge.',
      Autumn: 'Ashwin Navratri is the second big fair period.'
    }
  },
  {
    slug: 'naina-devi',
    title: 'Naina Devi',
    category: 'Pilgrimage',
    accessType: 'road',
    description: 'A hilltop Shakti Peeth temple in Bilaspur district overlooking Gobind Sagar Lake — distinct from the Naina Devi Temple at Nainital, Uttarakhand.',
    toursCount: 0,
    image: images.destinations.nainaDevi,
    region: 'Bilaspur District',
    state: 'Himachal Pradesh',
    editorialDescription: 'Shri Naina Devi Ji sits on a hilltop in Bilaspur district, high above the Gobind Sagar reservoir formed by the Bhakra Dam. By tradition it is one of the 51 Shakti Peethas of Hindu belief, reached either on foot up a stepped path or by a ropeway to the temple platform. It is often confused with the Naina Devi Temple beside Naini Lake in Nainital, Uttarakhand — a separate shrine with its own, distinct local legend. The Bilaspur temple is the one conventionally counted among the Shakti Peethas.',
    bestTime: 'March – June, September – November',
    idealDuration: '1 Day',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Shri Naina Devi Ji Temple', description: 'A hilltop shrine above Gobind Sagar Lake, traditionally one of the 51 Shakti Peethas.' },
      { title: 'Ropeway to the temple', description: 'A cable car alternative to the stepped climb up the hill.' },
      { title: 'Views over Gobind Sagar', description: 'The temple approach overlooks the Bhakra Dam reservoir.' }
    ],
    places: [
      { title: 'Shri Naina Devi Ji Temple', description: 'The hilltop shrine at the centre of the town.' },
      { title: 'Gobind Sagar viewpoint', description: 'Views over the reservoir from the temple hill.' }
    ],
    experiences: ['Temple visit', 'Ropeway ride'],
    relatedSlugs: ['chintpurni', 'jawalamukhi'],
    seo: { title: 'Naina Devi Travel Guide | Shakti Peeth Temple, Himachal Pradesh | The Apex Voyager', description: 'Plan a visit to Shri Naina Devi Ji — a hilltop Shakti Peeth temple in Bilaspur, Himachal Pradesh, distinct from the Naina Devi Temple at Nainital.' },
    travelTips: [
      'This is the Naina Devi in Himachal Pradesh\'s Bilaspur district — not the Naina Devi Temple at Nainital, Uttarakhand.',
      'The temple sees very large crowds during Sawan and Navratri fairs — follow local crowd-management guidance during peak fair days.',
      'The ropeway is a faster alternative to the stepped path if you\'d rather skip the climb.'
    ],
    matchScores: { adventure: 10, nature: 25, luxury: 10, crowds: 55, slowTravel: 30 },
    seasonalNotes: {
      Spring: 'Chaitra Navratri draws large crowds.',
      Summer: 'The Sawan pilgrimage season (July–August) is one of the busiest times of year.'
    }
  },
  {
    slug: 'naldehra',
    title: 'Naldehra',
    category: 'Nature',
    description: 'A forested meadow around one of North India\'s earliest hill-station golf courses, about 22 km from Shimla.',
    toursCount: 0,
    image: images.destinations.naldehra,
    region: 'Shimla District',
    state: 'Himachal Pradesh',
    altitude: '~2,200 m',
    editorialDescription: 'Naldehra centres on a wide, largely treeless meadow ringed by deodar forest, about 22 km from Shimla. Viceroy Lord Curzon is widely credited with laying out its golf course in 1905 after visiting the site — one of the earliest hill-station golf courses in North India, though not India\'s oldest overall (that distinction belongs to Kolkata\'s Royal Calcutta Golf Club, founded in 1829). Local folklore, recorded by the district\'s own tourism office, attributes the meadow\'s treeless character to a mythical battle between two local deities. Most visits are still a half-day or day trip from Shimla, though a resort at Naldehra itself now offers a genuine overnight base.',
    bestTime: 'March – June, September – November',
    idealDuration: '1–2 Days',
    travelStyles: ['Nature', 'Family'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'Naldehra Golf Course', description: 'A meadow golf course laid out in 1905, credited to Viceroy Lord Curzon.' },
      { title: 'Deodar forest walks', description: 'Pine and deodar trails ring the open meadow.' },
      { title: 'A quieter Shimla-area base', description: 'A resort at Naldehra itself offers an alternative to basing in Shimla.' }
    ],
    places: [
      { title: 'Naldehra Golf Course', description: 'The meadow golf course at the heart of Naldehra.' },
      { title: 'Mahunag Temple', description: 'A wooden hill temple on the Shimla–Mandi road, commonly visited as part of a Naldehra day trip.' }
    ],
    experiences: ['Golf', 'Forest walks', 'Horse riding'],
    relatedSlugs: ['shimla', 'mashobra'],
    seo: { title: 'Naldehra Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Naldehra trip — a meadow golf course and deodar forest walks a short drive from Shimla.' },
    travelTips: [
      'Most visitors day-trip from Shimla; book ahead if you want to stay overnight at Naldehra itself.',
      'The golf course is playable rather than just a viewpoint — carry appropriate footwear if you plan to play.'
    ],
    matchScores: { adventure: 15, nature: 65, luxury: 40, crowds: 30, slowTravel: 55 },
    seasonalNotes: {
      Summer: 'April–June is the clearest, most reliable golfing weather.',
      Autumn: 'September–November brings cool, clear days after the monsoon.'
    }
  },
  {
    slug: 'mashobra',
    title: 'Mashobra',
    category: 'Nature',
    description: 'A cedar-forested hill town beyond Shimla\'s bustle, home to the Rashtrapati Niwas presidential retreat.',
    toursCount: 0,
    image: images.destinations.mashobra,
    region: 'Shimla District',
    state: 'Himachal Pradesh',
    altitude: '~2,150 m',
    editorialDescription: 'Mashobra is a genuine hill town in its own right, not just a resort marketing tag — it grew into a favoured weekend retreat for colonial-era Shimla by the late 19th century, and today mixes cedar forest, apple orchards and quiet village lanes about 11–13 km from Shimla. "The Retreat," the Rashtrapati Niwas presidential retreat, has stood here since 1850, though its estate spills toward the neighbouring hamlet of Chharabra — the same locality where the Oberoi\'s Wildflower Hall is officially sited, despite being widely marketed as "Mashobra." Genuine village-level guesthouses sit alongside a handful of higher-end resort properties in the wider area.',
    bestTime: 'April – June, September – November',
    idealDuration: '1–2 Days',
    travelStyles: ['Nature', 'Slow travel'],
    seasons: ['Summer', 'Autumn'],
    bestFor: ['Couples', 'Families'],
    highlights: [
      { title: 'Cedar forest trails', description: 'Quiet deodar and pine walks minutes from the village.' },
      { title: 'Rashtrapati Niwas (The Retreat)', description: 'A 19th-century estate used as a presidential retreat, on the Mashobra–Chharabra estate.' },
      { title: 'Apple-country village life', description: 'Orchards and village lanes far quieter than central Shimla.' }
    ],
    places: [
      { title: 'Mashobra village', description: 'The forested village centre, once a colonial-era weekend retreat.' },
      { title: 'Sipur', description: 'A forest-trail hamlet below Mashobra with an old wooden Shiva temple.' }
    ],
    experiences: ['Forest walks', 'Orchard walks', 'Village life'],
    relatedSlugs: ['shimla', 'naldehra'],
    seo: { title: 'Mashobra Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Mashobra trip — cedar forest trails, orchard villages and a quieter alternative to central Shimla.' },
    travelTips: [
      'Wildflower Hall and other resorts marketed as "Mashobra" are technically sited in neighbouring Chharabra — confirm the exact property location before booking.',
      'Forest trails to Sipur are a good half-day option if you\'d rather walk than drive.'
    ],
    matchScores: { adventure: 15, nature: 70, luxury: 55, crowds: 25, slowTravel: 65 },
    seasonalNotes: {
      Summer: 'April–June is mild and clear, the most popular season.',
      Autumn: 'September–November is quiet and cool, good for forest walks.'
    }
  },
  {
    slug: 'manikaran',
    title: 'Manikaran',
    category: 'Pilgrimage',
    accessType: 'road',
    description: 'A Sikh–Hindu pilgrimage town in the Parvati Valley, built around hot springs and the Gurdwara Sri Manikaran Sahib.',
    toursCount: 0,
    image: images.destinations.manikaran,
    region: 'Parvati Valley',
    state: 'Himachal Pradesh',
    altitude: '~1,760 m',
    editorialDescription: 'Manikaran sits about 4 km from Kasol in the Parvati Valley, but its identity is entirely its own: a joint Sikh and Hindu pilgrimage town built around natural hot springs, the Gurdwara Sri Manikaran Sahib — commemorating a visit by Guru Nanak — and a cluster of temples to Rama, Krishna, Vishnu and Shiva. Pilgrims cook rice and langar meals in the spring water itself, a practice that continues around the clock. Local legend attributes the springs to Shiva and Parvati, and to the earth surfacing precious stones ("mani") to give the town its name — recounted here as legend, not history. Its own hotels, guesthouses and free gurdwara lodging make it a genuinely independent base from Kasol\'s backpacker-café scene, even as many Kasol-based travellers visit on a day trip.',
    bestTime: 'March – June, September – November',
    idealDuration: '1 Day',
    travelStyles: ['Pilgrimage', 'Culture'],
    seasons: ['Spring', 'Summer', 'Autumn'],
    bestFor: ['Families', 'Solo Travelers'],
    highlights: [
      { title: 'Gurdwara Sri Manikaran Sahib', description: 'A major Sikh shrine commemorating a visit by Guru Nanak, with free pilgrim lodging.' },
      { title: 'Natural hot springs', description: 'Springs hot enough that pilgrims cook rice and langar meals directly in the water.' },
      { title: 'Rama and Shiva temples', description: 'A cluster of Hindu temples alongside the gurdwara, built into the same pilgrimage complex.' }
    ],
    places: [
      { title: 'Gurdwara Sri Manikaran Sahib', description: 'The town\'s central Sikh shrine and langar.' },
      { title: 'Hot spring bathing tanks', description: 'Public bathing tanks fed by the natural hot springs.' },
      { title: 'Rama Temple', description: 'A Hindu temple beside the springs, traditionally linked to the Kullu ruler Raja Jagat Singh.' }
    ],
    experiences: ['Gurdwara visit', 'Hot spring bathing', 'Temple visit'],
    relatedSlugs: ['kasol', 'tirthan-valley'],
    seo: { title: 'Manikaran Travel Guide | Parvati Valley Pilgrimage | The Apex Voyager', description: 'Plan a Manikaran trip — the Gurdwara Sri Manikaran Sahib, natural hot springs and Parvati Valley pilgrimage town.' },
    travelTips: [
      'Cover your head at the gurdwara, and expect to remove shoes before entering temple/gurdwara areas.',
      'The hot springs are genuinely hot — don\'t touch the water directly near the cooking areas.',
      'Free langar and gurdwara lodging are open to all visitors, not only Sikh pilgrims.'
    ],
    matchScores: { adventure: 10, nature: 40, luxury: 15, crowds: 45, slowTravel: 45 },
    seasonalNotes: {
      Spring: 'March–April is quiet, before the main travel season picks up.',
      Summer: 'May–June sees the heaviest pilgrim and day-tripper traffic.',
      Autumn: 'September–November is clear and comfortable.'
    }
  },
  {
    slug: 'pangi-valley',
    title: 'Pangi Valley',
    category: 'Offbeat',
    description: 'A remote, tribal Chenab-gorge valley in Chamba district, cut off from the world for much of the year.',
    toursCount: 0,
    image: images.destinationsHero,
    region: 'Chamba District',
    state: 'Himachal Pradesh',
    altitude: '~2,500 m',
    editorialDescription: 'Pangi is a remote sub-division of Chamba district on the far side of the Pir Panjal, cut off from the rest of the district for roughly six to eight months of the year once winter closes its access roads. It is home to the Pangwal tribal community and their own language, folk music and dance, in a landscape of stark Chenab-gorge terrain historically nicknamed "Kala Pani" for its isolation. Killar, the sub-divisional headquarters on the Chenab gorge, has basic guesthouses, a bank, a post office and a small hospital; smaller villages further into the valley rely on simple homestays and forest rest houses. Since the pandemic, Pangi has drawn a small but growing wave of offbeat and adventure travellers — this is genuine basic-infrastructure travel, not comfort tourism.',
    bestTime: 'May – September',
    idealDuration: '3–5 Days',
    travelStyles: ['Adventure', 'Offbeat', 'Culture'],
    seasons: ['Summer'],
    bestFor: ['Solo Travelers', 'Friends & Groups'],
    highlights: [
      { title: 'Pangwal tribal culture', description: 'A distinct tribal community, language, and folk tradition shaped by generations of isolation.' },
      { title: 'The Chenab gorge', description: 'Dramatic river-gorge terrain running the length of the valley.' },
      { title: 'Killar', description: 'The valley\'s small headquarters town, with the region\'s only real infrastructure.' }
    ],
    places: [
      { title: 'Killar', description: 'Pangi\'s sub-divisional headquarters, on the Chenab gorge.' },
      { title: 'Sach Pass', description: 'The seasonal high pass connecting Pangi to Chamba town, closed roughly mid-October to late spring.' },
      { title: 'Dharwas and Sural Bhatori', description: 'Smaller villages further into the valley, with basic homestays.' }
    ],
    experiences: ['Village homestays', 'Scenic drives', 'Cultural immersion'],
    relatedSlugs: ['chamba', 'bharmour'],
    seo: { title: 'Pangi Valley Travel Guide | Himachal Pradesh | The Apex Voyager', description: 'Plan a Pangi Valley trip — a remote, tribal Chenab-gorge valley in Chamba district for offbeat travellers.' },
    travelTips: [
      'Sach Pass typically closes for winter around mid-October and reopens sometime in spring depending on snow clearance — exact dates vary year to year, so confirm current road status before travelling.',
      'Infrastructure is basic throughout the valley — carry cash, and don\'t expect reliable mobile network beyond Killar.',
      'The alternate route via Kishtwar is a genuinely difficult mountain road — only attempt it in good conditions and season.'
    ],
    matchScores: { adventure: 80, nature: 85, luxury: 5, crowds: 5, slowTravel: 50 },
    seasonalNotes: {
      Summer: 'May–September is the only realistic visiting window, once Sach Pass is open.'
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
