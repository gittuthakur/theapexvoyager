export type StayMode = 'destination' | 'nearby' | 'access-base';

export interface StayLocationRule {
  /** Destination slug this rule applies to — see config/destinations.config.ts. */
  slug: string;
  stayMode: StayMode;
  /** The real town/village to search and display as the accommodation location. */
  primaryStayLocation: string;
  /** Additional real localities worth including as search candidates (e.g. a roadHead
   *  or a second nearby town) — never shown as the primary label. */
  nearbyStayLocations?: string[];
  /** Audit note only — not rendered in the UI. Explains why this destination got this
   *  stayMode/primaryStayLocation, grounded in the destination's own config/copy. */
  reason: string;
}

// Every one of the 38 public destinations (config/destinations.config.ts) gets an
// explicit row here — see AGENTS.md Phase B, section 4: "Do NOT leave behavior
// implicit." Built from each destination's own accessType/stayBaseLocations/roadHead
// fields and editorialDescription/apexPicks copy already in destinations.config.ts,
// not from outside assumption. Read via lib/stayLocation.ts's getStayLocationContext(),
// the single source both the Destination detail page and /stays/[...segments] use.
export const STAY_LOCATION_RULES: StayLocationRule[] = [
  { slug: 'manali', stayMode: 'destination', primaryStayLocation: 'Manali', reason: 'Large hill town with accommodation directly in Old Manali/town centre.' },
  {
    slug: 'kinnaur',
    stayMode: 'nearby',
    primaryStayLocation: 'Sangla',
    nearbyStayLocations: ['Kalpa', 'Chitkul'],
    reason: 'Kinnaur is a district-level destination, not a single accommodation town — the site\'s own apexPicks.stay pick for Kinnaur is a "Sangla orchard homestay."'
  },
  { slug: 'spiti-valley', stayMode: 'destination', primaryStayLocation: 'Kaza', reason: 'editorialDescription names Kaza "the valley\'s lively high-altitude hub" — the real accommodation hub within the named destination; existing curated hotel locations ("Kaza, Spiti Valley", "Kibber, Spiti Valley") already match.' },
  {
    slug: 'dharamshala',
    stayMode: 'nearby',
    primaryStayLocation: 'McLeod Ganj',
    nearbyStayLocations: ['Bhagsu'],
    reason: 'editorialDescription states explicitly: "Most trips use Dharamshala as the arrival point and McLeod Ganj as the base."'
  },
  { slug: 'shimla', stayMode: 'destination', primaryStayLocation: 'Shimla', reason: 'Accommodation directly on/near Mall Road in town.' },
  { slug: 'tirthan-valley', stayMode: 'destination', primaryStayLocation: 'Gushaini', reason: 'apexPicks.stay: "Gushaini riverside cottage"; places[0] describes Gushaini as "a relaxed riverside base for the valley."' },
  { slug: 'jibhi', stayMode: 'destination', primaryStayLocation: 'Jibhi', reason: 'editorialDescription: "a scatter of wooden guesthouses along a stream" directly in the village.' },
  {
    slug: 'chitkul',
    stayMode: 'nearby',
    primaryStayLocation: 'Sangla',
    reason: 'idealDuration: "1-2 Days (as an extension of Sangla)"; Sangla Valley\'s own copy: "The practical stop before continuing on to Chitkul." travelTips also flags limited stay options in Chitkul itself.'
  },
  { slug: 'sainj-valley', stayMode: 'destination', primaryStayLocation: 'Shangarh', reason: 'Shangarh is Sainj Valley\'s own named village/hub (places[0]), not a different destination — same pattern as Manali/Old Manali.' },
  { slug: 'bir-billing', stayMode: 'destination', primaryStayLocation: 'Bir', nearbyStayLocations: ['Billing'], reason: 'editorialDescription: most visitors base themselves in Bir (Chowgan village); Billing is the takeoff point, not an overnight base.' },
  { slug: 'sangla-valley', stayMode: 'destination', primaryStayLocation: 'Sangla', reason: 'editorialDescription: "the practical base for the whole valley."' },
  { slug: 'chamba', stayMode: 'destination', primaryStayLocation: 'Chamba', reason: 'Historic town with its own accommodation.' },
  { slug: 'dalhousie', stayMode: 'destination', primaryStayLocation: 'Dalhousie', reason: 'Hill station with accommodation across its five hills.' },
  {
    slug: 'khajjiar',
    stayMode: 'nearby',
    primaryStayLocation: 'Dalhousie',
    nearbyStayLocations: ['Chamba'],
    reason: 'editorialDescription: "Khajjiar is a stop, not a stay-a-week destination... It works best as a half-day break between Dalhousie and Chamba rather than a base of its own." Dalhousie\'s own travelTips: "no need to change base to see it."'
  },
  { slug: 'gulmarg', stayMode: 'destination', primaryStayLocation: 'Gulmarg', reason: 'Resort village with accommodation at the base of the Gondola.' },
  { slug: 'rishikesh', stayMode: 'destination', primaryStayLocation: 'Rishikesh', reason: 'Large town with extensive accommodation.' },
  { slug: 'kasol', stayMode: 'destination', primaryStayLocation: 'Kasol', reason: 'Village with extensive homestay/guesthouse accommodation (3 curated listings already reference "Kasol, Parvati Valley").' },
  { slug: 'haridwar', stayMode: 'destination', primaryStayLocation: 'Haridwar', reason: 'Large pilgrimage/transit town, road-accessible, extensive accommodation.' },
  { slug: 'munsiyari', stayMode: 'destination', primaryStayLocation: 'Munsiyari', reason: 'editorialDescription describes it as "a small town" (not a shrine/access-gated site); accommodation exists in the town itself.' },
  { slug: 'srinagar', stayMode: 'destination', primaryStayLocation: 'Srinagar', reason: 'City with extensive accommodation (houseboats, hotels).' },
  { slug: 'pahalgam', stayMode: 'destination', primaryStayLocation: 'Pahalgam', reason: 'Resort town with accommodation directly on site.' },
  { slug: 'sonamarg', stayMode: 'destination', primaryStayLocation: 'Sonamarg', reason: 'Camps/guesthouses exist directly at Sonamarg even though editorialDescription frames it as "less a place to linger" — no other single named base town is given.' },
  { slug: 'dehradun', stayMode: 'destination', primaryStayLocation: 'Dehradun', reason: 'City with extensive accommodation.' },
  { slug: 'mussoorie', stayMode: 'destination', primaryStayLocation: 'Mussoorie', reason: 'Hill station with accommodation along the Mall.' },
  {
    slug: 'joshimath',
    stayMode: 'destination',
    primaryStayLocation: 'Joshimath',
    reason: 'Road-accessible town with its own accommodation (base for Auli/Badrinath/Valley of Flowers). Normalization fix: primaryStayLocation uses the stripped title ("Joshimath"), never the literal config title "Joshimath (Jyotirmath)" — see AGENTS.md Phase B section 6.'
  },
  {
    slug: 'auli',
    stayMode: 'nearby',
    primaryStayLocation: 'Joshimath',
    reason: 'editorialDescription: "Most travelers base themselves in Joshimath and treat Auli as a day up and back rather than an overnight stay."'
  },
  { slug: 'chopta', stayMode: 'destination', primaryStayLocation: 'Chopta', reason: 'editorialDescription: "a scatter of dhabas and simple stays around an open meadow" directly at the site.' },
  { slug: 'lansdowne', stayMode: 'destination', primaryStayLocation: 'Lansdowne', reason: 'Cantonment town with its own accommodation.' },
  { slug: 'nainital', stayMode: 'destination', primaryStayLocation: 'Nainital', reason: 'Lake town with extensive accommodation.' },
  { slug: 'mukteshwar', stayMode: 'destination', primaryStayLocation: 'Mukteshwar', reason: 'editorialDescription: "orchards, a handful of stays" directly in the village.' },
  { slug: 'almora', stayMode: 'destination', primaryStayLocation: 'Almora', reason: 'Town with its own accommodation.' },
  { slug: 'kausani', stayMode: 'destination', primaryStayLocation: 'Kausani', reason: 'Hill town with accommodation on the viewpoint ridge.' },
  { slug: 'ranikhet', stayMode: 'destination', primaryStayLocation: 'Ranikhet', reason: 'Cantonment town with its own accommodation.' },
  { slug: 'badrinath', stayMode: 'destination', primaryStayLocation: 'Badrinath', reason: 'accessType: "road" — road-accessible shrine town with its own guesthouses, unlike the trek-gated Kedarnath/Yamunotri/Hemkund Sahib group.' },
  { slug: 'gangotri', stayMode: 'destination', primaryStayLocation: 'Gangotri', reason: 'accessType: "road" — road-accessible shrine town with its own guesthouses, same distinction as Badrinath.' },
  {
    slug: 'kedarnath',
    stayMode: 'access-base',
    primaryStayLocation: 'Guptkashi',
    nearbyStayLocations: ['Sonprayag'],
    reason: 'accessType: "trek-and-helicopter"; destination.stayBaseLocations = ["Guptkashi", "Sonprayag"], roadHead = "Sonprayag" — preserved exactly from existing pilgrimage architecture.'
  },
  {
    slug: 'yamunotri',
    stayMode: 'access-base',
    primaryStayLocation: 'Barkot',
    nearbyStayLocations: ['Janki Chatti'],
    reason: 'accessType: "trek-gated"; destination.stayBaseLocations = ["Barkot"], roadHead = "Janki Chatti" — preserved exactly from existing pilgrimage architecture.'
  },
  {
    slug: 'hemkund-sahib',
    stayMode: 'access-base',
    primaryStayLocation: 'Ghangaria',
    nearbyStayLocations: ['Govindghat'],
    reason: 'accessType: "trek-gated"; destination.stayBaseLocations = ["Ghangaria"], roadHead = "Govindghat" — preserved exactly from existing pilgrimage architecture.'
  }
];
