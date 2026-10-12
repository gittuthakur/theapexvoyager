import { describe, expect, it } from 'vitest';
import { matchesStayType, paginate, parsePageParam, scoreStayText, searchStayCandidates, type StayCandidate, type StaySearchDestination } from '@/lib/search/staySearch';

// Test-only records shaped like the live cache (names/localities from the read-only audit). The matcher has
// no per-property configuration, so everything below is found purely from these fields.
function stay(placeId: string, name: string, tags: Array<[string, string]>, extra: Partial<StayCandidate> = {}): StayCandidate {
  return { placeId, name, tags: tags.map(([destinationSlug, searchLocation]) => ({ destinationSlug, searchLocation })), types: ['hotel'], ...extra };
}

const destinations: StaySearchDestination[] = [
  { slug: 'manali', title: 'Manali', state: 'Himachal Pradesh' },
  { slug: 'spiti-valley', title: 'Spiti Valley', state: 'Himachal Pradesh' },
  { slug: 'bir-billing', title: 'Bir Billing', state: 'Himachal Pradesh' },
  { slug: 'sangla-valley', title: 'Sangla Valley', state: 'Himachal Pradesh' },
  { slug: 'kinnaur', title: 'Kinnaur', state: 'Himachal Pradesh' },
  { slug: 'kedarnath', title: 'Kedarnath', state: 'Uttarakhand' },
  { slug: 'dharamshala', title: 'Dharamshala', state: 'Himachal Pradesh' },
  { slug: 'mcleod-ganj', title: 'McLeod Ganj', state: 'Himachal Pradesh' },
  { slug: 'kasol-hp', title: 'Kasol Retreat', state: 'Himachal Pradesh' },
  { slug: 'kasol-uk', title: 'Kasol Ridge', state: 'Uttarakhand' }
];

const heritage = stay('p-heritage', 'Hotel Spiti Heritage', [['spiti-valley', 'Kaza']], { rating: 4.4, userRatingCount: 80 });
const vajra = stay('p-vajra', 'The Vajra', [['spiti-valley', 'Kaza']], { rating: 4.8, userRatingCount: 200 });
const yellow = stay('p-yellow', 'Yellow Hotels & Cottages Kaza', [['spiti-valley', 'Kaza']], { rating: 4.1, userRatingCount: 40 });
const birStay = stay('p-bir', 'Zostel Bir', [['bir-billing', 'Bir']], { types: ['hostel', 'lodging'] });
const sanglaStay = stay('p-sangla', 'Baspa Riverside Camp', [['sangla-valley', 'Sangla'], ['kinnaur', 'Sangla']], { types: ['campground'] });
const guptkashiStay = stay('p-gupt', 'Shri Kedar Lodge', [['kedarnath', 'Guptkashi']], { types: ['lodge', 'lodging'] });
const dharamStay = stay('p-dharam', 'Hotel Dhauladhar View', [['dharamshala', 'Dharamshala']]);
const mcleodStay = stay('p-mcleod', 'Tibetan Valley Homestay', [['mcleod-ganj', 'McLeod Ganj']], { types: ['guest_house'] });
const manaliStay = stay('p-manali', 'Old Manali Homestay', [['manali', 'Manali']], { types: ['private_guest_room'] });
const treehouse = stay('p-tree', 'Jibhi Tree House Retreat', [['manali', 'Manali']], { types: ['hotel'] });
const all = [heritage, vajra, yellow, birStay, sanglaStay, guptkashiStay, dharamStay, mcleodStay, manaliStay, treehouse];

const ids = (query: Parameters<typeof searchStayCandidates>[1], pool = all, dests = destinations) => {
  const result = searchStayCandidates(pool, query, dests);
  if (result.status !== 'ok') throw new Error('ambiguous');
  return result.hits.map((hit) => hit.candidate.placeId);
};

describe('property-name search', () => {
  it('finds existing properties by exact, normalized, whole-word and word-start names', () => {
    expect(ids({ q: 'Hotel Spiti Heritage' })).toEqual(['p-heritage']);
    expect(ids({ q: '  hotel   SPITI heritage ' })).toEqual(['p-heritage']);
    expect(ids({ q: 'The Vajra' })).toEqual(['p-vajra']);
    expect(ids({ q: 'vajra' })).toEqual(['p-vajra']);
    expect(ids({ q: 'Heritage' })).toEqual(['p-heritage']);
    expect(ids({ q: 'herit' })).toEqual(['p-heritage']);
    expect(ids({ q: 'Yellow Hotels and Cottages' })).toEqual(['p-yellow']);
    expect(ids({ q: 'tree house' })).toEqual(['p-tree']);
  });

  it('nonsense and arbitrary fragments return nothing, and q is never silently ignored', () => {
    for (const q of ['zzzqqq', 'xqjv', 'ritage', 'ajra', 'he', '[', '(.*)', '<script>']) expect(ids({ q }), q).toEqual([]);
    expect(ids({ q: 'zzzqqq' })).not.toHaveLength(all.length);
  });

  it('an empty q is no text filter', () => {
    expect(ids({ q: '   ' })).toHaveLength(all.length);
    expect(ids({})).toHaveLength(all.length);
  });

  it('an exact property name ranks above a weaker locality match', () => {
    const named = stay('p-named-kaza', 'Kaza', [['spiti-valley', 'Kaza']], { rating: 1 });
    const result = ids({ q: 'Kaza' }, [vajra, yellow, named]);
    expect(result[0]).toBe('p-named-kaza');
    expect(result).toEqual(['p-named-kaza', 'p-yellow', 'p-vajra']);
  });

  it('is deterministic: relevance, then rating, review count, then placeId', () => {
    const a = stay('a', 'Alpine Stay', [['manali', 'Manali']], { rating: 4, userRatingCount: 10 });
    const b = stay('b', 'Alpine Stay', [['manali', 'Manali']], { rating: 4, userRatingCount: 10 });
    const c = stay('c', 'Alpine Stay', [['manali', 'Manali']], { rating: 4.5, userRatingCount: 1 });
    expect(ids({ q: 'alpine stay' }, [b, a, c])).toEqual(['c', 'a', 'b']);
    expect(ids({ q: 'alpine stay' }, [c, a, b])).toEqual(['c', 'a', 'b']);
  });

  it('a multi-word query that is not one phrase needs every word', () => {
    expect(ids({ q: 'Spiti Kaza' })).toEqual(expect.arrayContaining(['p-heritage']));
    expect(ids({ q: 'heritage zzzqqq' })).toEqual([]);
  });
});

describe('destination and locality resolution', () => {
  it('resolves Kaza (a stay-base locality, not a destination) through the stored locality', () => {
    expect(ids({ destination: 'Kaza' }).sort()).toEqual(['p-heritage', 'p-vajra', 'p-yellow']);
    expect(ids({ destination: 'kaza' })).toEqual(ids({ destination: 'KAZA' }));
  });

  it('Bir and Bir Billing, Sangla and Sangla Valley, Guptkashi and Kedarnath find the same real stays', () => {
    expect(ids({ destination: 'Bir' })).toEqual(['p-bir']);
    expect(ids({ destination: 'Bir Billing' })).toEqual(['p-bir']);
    expect(ids({ destination: 'Sangla' })).toEqual(['p-sangla']);
    expect(ids({ destination: 'Sangla Valley' })).toEqual(['p-sangla']);
    expect(ids({ destination: 'Guptkashi' })).toEqual(['p-gupt']);
    expect(ids({ destination: 'Kedarnath' })).toEqual(['p-gupt']);
  });

  it('verified spellings: Dharamsala/Dharamshala and McLeodganj/McLeod Ganj', () => {
    expect(ids({ destination: 'Dharamsala' })).toEqual(['p-dharam']);
    expect(ids({ destination: 'Dharamshala' })).toEqual(['p-dharam']);
    expect(ids({ destination: 'McLeodganj' })).toEqual(['p-mcleod']);
    expect(ids({ destination: 'McLeod Ganj' })).toEqual(['p-mcleod']);
    expect(ids({ q: 'McLeodganj' })).toContain('p-mcleod');
  });

  it('Kinnaur and Sangla Valley are separate destinations that share a real place; it appears once per result set', () => {
    expect(ids({ destination: 'Kinnaur' })).toEqual(['p-sangla']);
    expect(ids({ destination: 'Kinnaur' }).length).toBe(1);
    expect(ids({ destination: 'Sangla Valley' }).length).toBe(1);
  });

  it('unknown or unsupported text matches nothing and never falls back to the whole catalog', () => {
    for (const destination of ['Atlantis', 'Chandigarh Airport', 'gushaini', 'spiti-valley-verify2', 'Man']) expect(ids({ destination }), destination).toEqual([]);
  });

  it('never picks the first of several: a locality stored in two regions is ambiguous', () => {
    const hp = stay('k1', 'Kasol Camp', [['kasol-hp', 'Kasol']]);
    const uk = stay('k2', 'Kasol Lodge', [['kasol-uk', 'Kasol']]);
    const result = searchStayCandidates([hp, uk], { destination: 'Kasol' }, destinations);
    expect(result.status).toBe('ambiguous');
    if (result.status === 'ambiguous') expect(result.destinations.map((d) => d.slug).sort()).toEqual(['kasol-hp', 'kasol-uk']);
  });

  it('combines a name query with a destination filter, keeping region isolation', () => {
    expect(ids({ q: 'homestay', destination: 'Manali' })).toEqual(['p-manali']);
    expect(ids({ q: 'homestay', destination: 'McLeod Ganj' })).toEqual(['p-mcleod']);
    expect(ids({ q: 'Zostel', destination: 'Manali' })).toEqual([]);
    expect(ids({ q: 'Lodge', destination: 'Kedarnath' })).toEqual(['p-gupt']);
    expect(ids({ q: 'Lodge', destination: 'Spiti Valley' })).toEqual([]);
  });
});

describe('verified stay types', () => {
  it('filters on Google types, never on the query or the name (except treehouse, which has no structured type)', () => {
    expect(ids({ stayType: 'homestay' }).sort()).toEqual(['p-manali', 'p-mcleod']);
    expect(ids({ stayType: 'camp' })).toEqual(['p-sangla']);
    expect(ids({ stayType: 'treehouse' })).toEqual(['p-tree']);
    expect(matchesStayType(treehouse, 'hotel')).toBe(true);
  });
});

describe('pagination', () => {
  const many = Array.from({ length: 60 }, (_, i) => stay(`m${String(i).padStart(2, '0')}`, `Mountain Lodge ${i}`, [['manali', 'Manali']], { rating: 4 }));

  it('splits an exact total into stable pages with no duplicates and no gaps', () => {
    const ranked = ids({ q: 'mountain lodge' }, many);
    expect(ranked).toHaveLength(60);
    const pages = [1, 2, 3].map((p) => paginate(ranked, p, 24));
    expect(pages.map((p) => p.items.length)).toEqual([24, 24, 12]);
    expect(pages.every((p) => p.totalCount === 60 && p.totalPages === 3)).toBe(true);
    const seen = pages.flatMap((p) => p.items);
    expect(new Set(seen).size).toBe(60);
    expect(seen).toEqual(ranked);
  });

  it('an out-of-range page is flagged and empty, while the total stays accurate', () => {
    const page = paginate(ids({ q: 'mountain lodge' }, many), 9, 24);
    expect(page).toMatchObject({ items: [], outOfRange: true, totalCount: 60, totalPages: 3 });
  });

  it('page 1 of an empty set is not "out of range"; bad page numbers fall back to page 1', () => {
    expect(paginate([], 1, 24)).toMatchObject({ items: [], outOfRange: false, totalCount: 0, totalPages: 1 });
    expect(paginate(['a'], 0, 24).page).toBe(1);
    expect(paginate(['a'], NaN, 24).page).toBe(1);
    expect(paginate(['a'], -3, 24).page).toBe(1);
  });

  it('ordering is independent of the input order', () => {
    expect(ids({ q: 'mountain lodge' }, [...many].reverse())).toEqual(ids({ q: 'mountain lodge' }, many));
  });
});

describe('scoreStayText', () => {
  it('scores name over locality over destination title over address', () => {
    const titles = new Map(destinations.map((d) => [d.slug, d.title]));
    const named = stay('n', 'Manali Inn', [['manali', 'Elsewhere']]);
    const locality = stay('l', 'Pine Inn', [['manali', 'Manali']]);
    const address = stay('a', 'Pine Inn', [['kinnaur', 'Sangla']], { formattedAddress: 'Near Manali Road, 175131' });
    expect(scoreStayText(named, 'Manali', titles)).toBeGreaterThan(scoreStayText(locality, 'Manali', titles));
    expect(scoreStayText(locality, 'Manali', titles)).toBeGreaterThan(scoreStayText(address, 'Manali', titles));
    expect(scoreStayText(address, 'Manali', titles)).toBeGreaterThan(0);
  });
});

describe('parsePageParam', () => {
  it('only a positive finite number is a page; everything else is page 1', () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam('')).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-3')).toBe(1);
    expect(parsePageParam('NaN')).toBe(1);
    expect(parsePageParam('Infinity')).toBe(1);
    expect(parsePageParam('2.9')).toBe(2);
    expect(parsePageParam('7')).toBe(7);
    expect(parsePageParam(['5', '9'])).toBe(5);
  });
});

describe('property name combined with destination and category', () => {
  it('applies all three: name text, destination filter and verified type', () => {
    const extra = [stay('h1', 'Manali Heritage Homestay', [['manali', 'Manali']], { types: ['private_guest_room'] }), stay('h2', 'Manali Heritage Hotel', [['manali', 'Manali']], { types: ['hotel'] })];
    const pool = [...all, ...extra];
    expect(ids({ q: 'heritage', destination: 'Manali' }, pool).sort()).toEqual(['h1', 'h2']);
    expect(ids({ q: 'heritage', destination: 'Manali', stayType: 'homestay' }, pool)).toEqual(['h1']);
    expect(ids({ q: 'heritage', destination: 'Spiti Valley', stayType: 'homestay' }, pool)).toEqual([]);
    expect(ids({ q: 'heritage', destination: 'Spiti Valley' }, pool)).toEqual(['p-heritage']);
  });
});
