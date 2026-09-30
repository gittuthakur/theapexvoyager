/**
 * LADAKH FOUNDATION — PREPARED, NOT SEEDED. See docs/phase-3a-ladakh-foundation.md for
 * the full explanation.
 *
 * BLOCKING FINDING (Phase 3A, Part 8): models/Destination.ts has NO publication-status
 * field at all — unlike Journey and Region, every Destination document in the
 * collection is unconditionally public the instant it exists (confirmed:
 * app/sitemap.ts's `Destination.find()` is unfiltered; services/regions/
 * regionHub.service.ts's Destination query is unfiltered except by regionId; proxy.ts's
 * existence check that gates /destinations/[slug] against soft-404s has no status
 * filter to apply, unlike its Region/Journey branches). Inserting any of the content
 * below into the shared production database would make it instantly live — there is no
 * "draft Destination" concept to rely on. Per the Phase 3A brief's own instruction,
 * this session STOPPED short of any such insertion. See the doc above for the exact
 * schema/query changes that would need to land first (mirroring models/Region.ts's
 * `status: 'draft' | 'published'` field and every public Destination query being
 * updated to filter on it, the same way lib/packages.ts/app/sitemap.ts/proxy.ts/
 * services/regions/regionHub.service.ts already do for Journey).
 *
 * This file is NOT imported by scripts/seed.ts or any other script — it exists purely
 * as reviewable, structurally-correct content, matching models/Destination.ts's real
 * field shapes, for whoever implements the Destination publication-status fix next.
 *
 * Real, non-fabricated content only: no hotel counts, ratings, reviews, Google Places
 * data, supplier availability, permit guarantees, or exact road-opening dates. Ladakh is
 * a Union Territory (administratively separate from Jammu & Kashmir since 2019) — not
 * described as a district of J&K anywhere below.
 *
 * Khardung La is deliberately NOT a standalone destination here — per the Phase 3A
 * brief's own steer, it's a high mountain pass en route to Nubra Valley (not an
 * overnight base with its own accommodation/town), so it appears only as a highlight of
 * the Leh entry and a route note on Nubra Valley — the same pattern this app already
 * uses for e.g. Kunzum Pass (a highlight/route note within Spiti Valley content, never
 * its own destination page).
 */

// GENERIC_HERO_IMAGE — the same sitewide fallback hero (images.hero,
// '/images/img-hero-hero.jpg') already used for a package with no dedicated photography
// yet (see config/images.config.ts's own comment: "the same honest generic fallback used
// for Uttarakhand elsewhere"). Reusing this real, already-live asset is not the same as
// fabricating new visual content — no specific Ladakh photo is claimed or invented.
const GENERIC_HERO_IMAGE = '/images/img-hero-hero.jpg';

// Matches models/Region.ts's full required shape exactly — every `required: true` field
// on that schema is populated here with real, conservative, non-fabricated copy so this
// can be seeded without any schema validation failure. `status: 'draft'` is the whole
// point: this Region must never resolve to `status: 'published'` in this phase.
export const ladakhRegionDraft = {
  name: 'Ladakh',
  slug: 'ladakh',
  shortDescription:
    'A high-altitude cold-desert Union Territory in the trans-Himalaya — dramatically different terrain, culture and travel logistics from Himachal Pradesh, Jammu & Kashmir or Uttarakhand.',
  cardImage: GENERIC_HERO_IMAGE,
  showOnHomeHero: false,
  hero: {
    eyebrow: 'Trans-Himalayan Union Territory',
    title: 'Ladakh',
    subtitle: 'High-altitude lakes, ancient monasteries and a cold-desert landscape unlike anywhere else this business operates.',
    image: GENERIC_HERO_IMAGE
  },
  overview: {
    description:
      'Ladakh is a Union Territory (administratively separate from Jammu & Kashmir since 2019), centred on Leh — the practical entry point and acclimatisation base for the whole region. Its cold-desert terrain, at consistently high altitude, calls for genuinely different trip planning than the rest of this business\'s catalogue: acclimatisation days, permit awareness for border-adjacent areas, and realistic expectations about remoteness.',
    bestSeason: 'Broadly May–September; exact pass-opening dates vary year to year with snowfall and are not fixed here.',
    idealDuration: '6-8 Days for a core circuit',
    startingPoint: 'Leh (by air) or an overland route via Manali or Srinagar',
    climate: 'High-altitude cold desert — intense sun, thin air, and cold nights even in summer.',
    whyVisit: ['Genuinely distinct high-altitude landscape', 'Ancient Buddhist monasteries', 'Pangong and Tso Moriri\'s high-altitude lakes'],
    bestFor: ['Travellers comfortable with high-altitude acclimatisation planning', 'Photography and landscape travellers']
  },
  travelGuide: {
    bestTime: 'Broadly May–September for road access; winter travel is a genuinely different, more specialised trip.',
    howToReach: 'By air directly into Leh, or overland via Manali (Himachal Pradesh) or Srinagar (Jammu & Kashmir) — both overland routes cross high passes with their own seasonal opening windows.',
    weather: 'Cold desert climate — strong daytime sun, thin air, and cold nights even in the summer travel season.',
    localTransport: 'Private vehicle hire is the norm for reaching Nubra Valley, Pangong Lake and the more remote Changthang destinations.',
    permits: 'Several border-adjacent areas (Nubra Valley, Pangong Lake, Turtuk, Hanle, Tso Moriri) require an Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals), arranged through Leh — exact process and validity should be confirmed at time of booking, never assumed unchanged from a prior trip.',
    responsibleTravel: 'Acclimatisation in Leh before any higher-altitude or more remote leg is a genuine safety consideration, not an optional add-on.'
  },
  seo: {
    title: 'Ladakh Travel Guide | The Apex Voyager India',
    description: 'Plan a Ladakh trip — Leh, Nubra Valley, Pangong Lake and the region\'s high-altitude lakes and monasteries.'
  },
  sortOrder: 4,
  status: 'draft' as const
};

export interface LadakhDestinationDraft {
  slug: string;
  title: string;
  category: string;
  description: string;
  /** Required by models/Destination.ts's schema — every entry below reuses the same
   *  real, already-live generic hero fallback (GENERIC_HERO_IMAGE) pending dedicated
   *  Ladakh photography, never a fabricated/invented image path. */
  image: string;
  /** Required by models/Destination.ts's schema — genuinely 0 for every entry: no
   *  PUBLISHED Journey references any Ladakh destination (the 5 Phase 3C Ladakh Journey
   *  drafts remain unpublished, so this count stays honestly 0 until they publish). */
  toursCount: number;
  /** Matches the existing convention of calling Jammu & Kashmir (also a Union
   *  Territory) a "state" elsewhere in config/destinations.config.ts, for consistency —
   *  Ladakh is administratively a Union Territory, not a state, but this app's
   *  Destination.state field is used as a general region label throughout. */
  state: string;
  editorialDescription: string;
  bestTime: string;
  idealDuration: string;
  altitude: string;
  accessType?: 'road' | 'trek-gated' | 'trek-and-helicopter';
  highlights: Array<{ title: string; description: string }>;
  places: Array<{ title: string; description: string }>;
  experiences: string[];
  bestFor: string[];
  registrationInfo?: { required: boolean; url: string; note?: string };
  relatedSlugs: string[];
  // Not a models/Destination.ts field — a Phase 3A-specific flag surfaced in this prep
  // file's own docs/report, never written to the database, reminding whoever seeds this
  // that the acclimatisation note in `editorialDescription`/`highlights` is load-bearing
  // content, not decorative.
  requiresPriorAcclimatisation: boolean;
}

export const ladakhDestinationDrafts: LadakhDestinationDraft[] = [
  {
    slug: 'leh',
    title: 'Leh',
    state: 'Ladakh',
    image: GENERIC_HERO_IMAGE,
    toursCount: 0,
    category: 'Gateway Town',
    description: 'Ladakh\'s main town and the practical entry point for the whole region — by air, or by road via Manali or Srinagar.',
    editorialDescription:
      'Leh sits at roughly 3,500m, and for nearly every visitor arriving by air from sea level, it is genuinely the most important stop in a Ladakh itinerary — not for its own sights alone, but because the first 1-2 days here, spent resting and acclimatising before going any higher, are what make the rest of a trip safe. Leh itself has the old Leh Palace overlooking the town, the Leh Market, Shanti Stupa, and — as a highlight rather than a destination of its own — Khardung La, one of the highest motorable passes in the world, usually visited as a day excursion once a traveller is acclimatised.',
    bestTime: 'Broadly May–September for road access; exact opening/closing of higher passes varies year to year with snowfall.',
    idealDuration: '2-3 Days (including acclimatisation)',
    altitude: '~3,500m',
    accessType: 'road',
    highlights: [
      { title: 'Leh Palace', description: 'A former royal residence overlooking the town, in the style of Lhasa\'s Potala Palace.' },
      { title: 'Khardung La', description: 'One of the highest motorable passes in the world, on the road toward Nubra Valley — visited as a day excursion, never as an overnight base.' },
      { title: 'Shanti Stupa', description: 'A hilltop stupa with wide views over the Leh valley.' }
    ],
    places: [
      { title: 'Leh Market', description: 'The town\'s central market street.' },
      { title: 'Leh Palace', description: 'Overlooking the old town.' }
    ],
    experiences: ['Acclimatisation days', 'Old-town walks', 'Local monastery visits'],
    bestFor: ['First-time Ladakh visitors', 'Acclimatisation base for every itinerary'],
    relatedSlugs: ['nubra-valley', 'pangong-lake'],
    requiresPriorAcclimatisation: false
  },
  {
    slug: 'nubra-valley',
    title: 'Nubra Valley',
    state: 'Ladakh',
    image: GENERIC_HERO_IMAGE,
    toursCount: 0,
    category: 'Valley',
    description: 'A high-altitude valley reached from Leh via Khardung La, known for its cold-desert sand dunes and double-humped Bactrian camels.',
    editorialDescription:
      'Nubra Valley, centred around the towns of Diskit and Hunder, sits lower than Leh in absolute terms but is reached by crossing Khardung La — a genuine high-altitude crossing that should only be attempted after proper acclimatisation in Leh, never on arrival day. Diskit\'s monastery, with its large Buddha statue overlooking the valley, and Hunder\'s sand dunes (home to Bactrian camels, a real and distinctive sight here) are the valley\'s two anchor points.',
    bestTime: 'Broadly May–September, matching Khardung La\'s typical open season — exact dates vary year to year with snowfall and are not fixed here.',
    idealDuration: '2 Days',
    altitude: '~3,000m (valley floor)',
    accessType: 'road',
    highlights: [
      { title: 'Diskit Monastery', description: 'A hillside monastery with a large Buddha statue overlooking the valley.' },
      { title: 'Hunder sand dunes', description: 'Cold-desert dunes, home to Bactrian (double-humped) camels.' }
    ],
    places: [
      { title: 'Diskit', description: 'The valley\'s main town.' },
      { title: 'Hunder', description: 'Known for its sand dunes.' }
    ],
    experiences: ['Monastery visits', 'Sand-dune time', 'Valley drives'],
    bestFor: ['Travellers who have already acclimatised in Leh'],
    registrationInfo: {
      required: true,
      url: '',
      note: 'An Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals) is required for Nubra Valley, arranged through Leh — exact process/validity should be confirmed at time of booking, not assumed from prior years.'
    },
    relatedSlugs: ['leh', 'pangong-lake', 'turtuk'],
    requiresPriorAcclimatisation: true
  },
  {
    slug: 'pangong-lake',
    title: 'Pangong Lake',
    state: 'Ladakh',
    image: GENERIC_HERO_IMAGE,
    toursCount: 0,
    category: 'High-Altitude Lake',
    description: 'A long, high-altitude lake stretching from Ladakh into Tibet, known for its changing blue shades through the day.',
    editorialDescription:
      'Pangong Tso is one of Ladakh\'s best-known sights — a long, narrow lake at high altitude whose colour genuinely shifts through the day with the light. Most of the lake\'s length lies across the international border. This is a sensitive border-adjacent area: permits are required, and tourist access can be affected by the security situation at any given time — this should always be confirmed close to the actual travel dates, never assumed unchanged from a previous trip.',
    bestTime: 'Broadly May–September; the lake partially freezes in winter, when road access is also more difficult.',
    idealDuration: '1-2 Days',
    altitude: '~4,225m',
    accessType: 'road',
    highlights: [{ title: 'The lake\'s changing colours', description: 'A genuine, widely-observed shift in shade through the day, weather and light dependent.' }],
    places: [{ title: 'Pangong shoreline', description: 'The accessible Indian-side shoreline area.' }],
    experiences: ['Lakeside time', 'Photography'],
    bestFor: ['Travellers who have already acclimatised in Leh'],
    registrationInfo: {
      required: true,
      url: '',
      note: 'An Inner Line Permit (Indian nationals) or Protected Area Permit (foreign nationals) is required. This is a border-adjacent area and access can be affected by the security situation at any time — always confirm current status before travel, never assume unchanged access.'
    },
    relatedSlugs: ['leh', 'nubra-valley'],
    requiresPriorAcclimatisation: true
  },
  {
    slug: 'turtuk',
    title: 'Turtuk',
    state: 'Ladakh',
    image: GENERIC_HERO_IMAGE,
    toursCount: 0,
    category: 'Village',
    description: 'A Balti village near the Line of Control, opened to tourism only in 2010, with a genuinely distinct culture from the rest of Ladakh.',
    editorialDescription:
      'Turtuk was part of Pakistan-administered territory until 1971 and only opened to tourists in 2010 — it remains one of the most distinct cultural stops in the region, with a Balti Muslim community, apricot orchards, and an architecture and language genuinely different from Ladakh\'s Buddhist-majority towns. It sits close to the Line of Control, so the same permit and access-sensitivity notes as the rest of this border-adjacent area apply.',
    bestTime: 'Broadly May–September.',
    idealDuration: '1-2 Days',
    altitude: '~3,000m',
    accessType: 'road',
    highlights: [{ title: 'Balti culture', description: 'A distinct language, architecture and community genuinely different from the rest of Ladakh.' }],
    places: [{ title: 'Turtuk village', description: 'Apricot orchards and traditional stone-and-wood houses.' }],
    experiences: ['Village walks', 'Cultural conversation where welcomed'],
    bestFor: ['Travellers wanting a genuinely different cultural stop within a Ladakh itinerary'],
    registrationInfo: {
      required: true,
      url: '',
      note: 'Permit and access rules for this border-adjacent area should be confirmed at time of booking.'
    },
    relatedSlugs: ['nubra-valley', 'leh'],
    requiresPriorAcclimatisation: true
  },
  {
    slug: 'hanle',
    title: 'Hanle',
    state: 'Ladakh',
    image: GENERIC_HERO_IMAGE,
    toursCount: 0,
    category: 'Remote Village',
    description: 'A remote high-altitude village home to India\'s first Dark Sky Reserve and the Indian Astronomical Observatory.',
    editorialDescription:
      'Hanle is genuinely remote — a long drive from Leh into the Changthang plateau — and was designated India\'s first Dark Sky Reserve in 2022, home to the Indian Astronomical Observatory. This is a real, distinctive draw for stargazing, but it should be positioned honestly as a demanding add-on requiring real acclimatisation and travel time, not a casual day trip from Leh.',
    bestTime: 'Broadly May–September; clear-sky stargazing conditions vary night to night and are never guaranteed on a specific date.',
    idealDuration: '1-2 Days',
    altitude: '~4,500m',
    accessType: 'road',
    highlights: [{ title: 'Dark-sky stargazing', description: 'India\'s first Dark Sky Reserve — genuinely dark, high-altitude night skies, weather and moon-phase dependent.' }],
    places: [{ title: 'Hanle village', description: 'Near the Indian Astronomical Observatory.' }],
    experiences: ['Stargazing (weather dependent)', 'High-altitude plateau scenery'],
    bestFor: ['Travellers specifically wanting the dark-sky/astronomy experience, comfortable with a genuinely remote, demanding add-on'],
    registrationInfo: { required: true, url: '', note: 'Permit requirements for this remote, border-adjacent region should be confirmed at time of booking.' },
    relatedSlugs: ['tso-moriri', 'leh'],
    requiresPriorAcclimatisation: true
  },
  {
    slug: 'tso-moriri',
    title: 'Tso Moriri',
    state: 'Ladakh',
    image: GENERIC_HERO_IMAGE,
    toursCount: 0,
    category: 'High-Altitude Lake',
    description: 'A quieter, more remote high-altitude lake than Pangong, in the same southeastern Changthang region as Hanle.',
    editorialDescription:
      'Tso Moriri sits in the same remote Changthang plateau as Hanle, and is genuinely quieter and less visited than Pangong — home to nomadic Changpa herding communities and, seasonally, migratory birds. Its remoteness is real: this is not a casual add-on to a short Leh-based trip.',
    bestTime: 'Broadly May–September.',
    idealDuration: '1-2 Days',
    altitude: '~4,500m',
    accessType: 'road',
    highlights: [{ title: 'A quieter alternative to Pangong', description: 'Fewer visitors, and a genuinely different, more remote atmosphere.' }],
    places: [{ title: 'Tso Moriri shoreline', description: 'The lake\'s accessible shoreline area.' }],
    experiences: ['Lakeside time', 'Wildlife/bird spotting (seasonal)'],
    bestFor: ['Travellers wanting a quieter, more remote lake experience than Pangong'],
    registrationInfo: { required: true, url: '', note: 'Permit requirements for this remote region should be confirmed at time of booking.' },
    relatedSlugs: ['hanle', 'leh'],
    requiresPriorAcclimatisation: true
  },
  {
    slug: 'kargil',
    title: 'Kargil',
    state: 'Ladakh',
    image: GENERIC_HERO_IMAGE,
    toursCount: 0,
    category: 'Town',
    description: 'Ladakh\'s second-largest town, a natural stopover on the Srinagar-Leh highway, with real historical significance.',
    editorialDescription:
      'Kargil is a practical stopover town on the Srinagar-Leh road route, and carries real historical weight from the 1999 Kargil conflict — a nearby war memorial exists for travellers who wish to visit. This is described here factually and without embellishment.',
    bestTime: 'Broadly May–September, matching the Srinagar-Leh highway\'s typical open season.',
    idealDuration: '1 Day (as a stopover)',
    altitude: '~2,700m',
    accessType: 'road',
    highlights: [{ title: 'A practical highway stopover', description: 'Breaks the long Srinagar-Leh drive into manageable stages.' }],
    places: [{ title: 'Kargil town', description: 'The town centre and market.' }],
    experiences: ['A rest stop on the Srinagar-Leh route'],
    bestFor: ['Travellers taking the overland Srinagar-Leh route rather than flying into Leh'],
    relatedSlugs: ['lamayuru', 'leh'],
    requiresPriorAcclimatisation: false
  },
  {
    slug: 'lamayuru',
    title: 'Lamayuru',
    state: 'Ladakh',
    image: GENERIC_HERO_IMAGE,
    toursCount: 0,
    category: 'Monastery Village',
    description: 'Known as "Moonland" for its eroded, lunar-like landscape, home to one of Ladakh\'s oldest monasteries.',
    editorialDescription:
      'Lamayuru sits on the Srinagar-Leh highway and is known for two things: its genuinely striking, eroded "moonland" landscape, and its monastery — among the oldest in Ladakh, with roots said to go back around a thousand years. It works well as a stop on the overland route into Leh rather than a separate trip.',
    bestTime: 'Broadly May–September, matching the Srinagar-Leh highway\'s typical open season.',
    idealDuration: '1 Day (as a stopover)',
    altitude: '~3,400m',
    accessType: 'road',
    highlights: [
      { title: 'The "Moonland" landscape', description: 'Eroded, lunar-like terrain around the village.' },
      { title: 'Lamayuru Monastery', description: 'One of Ladakh\'s oldest monasteries.' }
    ],
    places: [{ title: 'Lamayuru village', description: 'Below the monastery.' }],
    experiences: ['Monastery visit', 'Landscape photography'],
    bestFor: ['Travellers taking the overland Srinagar-Leh route'],
    relatedSlugs: ['kargil', 'leh'],
    requiresPriorAcclimatisation: false
  }
];
