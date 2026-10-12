import { describe, expect, it } from 'vitest';
import { isPublicExpert, searchExperts, type ExpertSearchContext } from '@/lib/search/expertSearch';
import type { TravelExpert } from '@/types/expert';

// Test-only records. Nothing here is catalog data: the matcher has no per-record configuration.
function expert(overrides: Partial<TravelExpert> & Pick<TravelExpert, 'slug' | 'name'>): TravelExpert {
  return {
    role: 'Trip Planner',
    profileImage: '/x.jpg',
    bio: 'Plans journeys.',
    destinationSlugs: [],
    travelStyles: [],
    expertise: [],
    active: true,
    publiclyListed: true,
    ...overrides
  };
}

const context: ExpertSearchContext = {
  destinations: [
    { slug: 'manali', title: 'Manali' },
    { slug: 'dharamshala', title: 'Dharamshala' },
    { slug: 'spiti-valley', title: 'Spiti Valley' },
    { slug: 'srinagar', title: 'Srinagar' }
  ],
  regions: [
    { id: 'r-hp', name: 'Himachal Pradesh', slug: 'himachal-pradesh' },
    { id: 'r-jk', name: 'Jammu & Kashmir', slug: 'kashmir' }
  ]
};

const anita = expert({
  slug: 'anita-rao',
  name: 'Anita Rao',
  role: 'Himalayan Trek Specialist',
  expertise: ['High Altitude Trekking', 'Photography Tours'],
  travelStyles: ['Adventure', 'Group'],
  destinationSlugs: ['manali', 'spiti-valley'],
  regionIds: ['r-hp'],
  bio: 'Has guided groups near Srinagar once.'
});
const bilal = expert({
  slug: 'bilal-mir',
  name: 'Bilal Mir',
  role: 'Kashmir Culture Host',
  expertise: ['Houseboat Stays'],
  travelStyles: ['Couple'],
  destinationSlugs: ['srinagar'],
  regionIds: ['r-jk']
});
const all = [anita, bilal];
const names = (list: TravelExpert[]) => list.map((e) => e.slug);
const find = (q: string, list = all) => names(searchExperts(list, q, context));

describe('expert search: expected vs actual', () => {
  const MATRIX: Array<[string, string, string[]]> = [
    ['full name', 'Anita Rao', ['anita-rao']],
    ['first name, any case', '  aNITA ', ['anita-rao']],
    ['name prefix', 'Bil', ['bilal-mir']],
    ['role word', 'Specialist', ['anita-rao']],
    ['role phrase', 'Culture Host', ['bilal-mir']],
    ['expertise word', 'Photography', ['anita-rao']],
    ['expertise word-start', 'Trek', ['anita-rao']],
    ['travel style', 'Couple', ['bilal-mir']],
    ['linked destination title', 'Manali', ['anita-rao']],
    ['linked destination slug form', 'spiti-valley', ['anita-rao']],
    ['linked multi-word destination', 'Spiti Valley', ['anita-rao']],
    ['alias spelling of a linked destination', 'Dharamsala', []],
    ['region through regionIds', 'Himachal', ['anita-rao']],
    ['region full name', 'Himachal Pradesh', ['anita-rao']],
    ['region short name', 'Kashmir', ['bilal-mir']],
    ['generic region word alone is nothing', 'Pradesh', []],
    ['two facets together', 'Himachal trekking', ['anita-rao']],
    ['place with no linked expert', 'Chandigarh', []],
    ['fragment', 'ilal', []]
  ];
  for (const [label, query, expected] of MATRIX) {
    it(label, () => expect(find(query)).toEqual(expected));
  }

  it('a place named only in a bio is not a destination link: it ranks below every linked expert', () => {
    // Anita's bio mentions Srinagar but she is not linked to it; Bilal is, so he comes first.
    expect(find('Srinagar')).toEqual(['bilal-mir', 'anita-rao']);
    expect(find('Srinagar', [anita])).toEqual(['anita-rao']);
    // With no structured hit at all the bio phrase still finds her.
    expect(find('guided groups')).toEqual(['anita-rao']);
  });

  it('ranks name above role above expertise above destination above style above region above bio', () => {
    const ranked = [
      expert({ slug: 'by-bio', name: 'A', bio: 'loves ladakh' }),
      expert({ slug: 'by-region', name: 'B', regionIds: ['r-hp'] }),
      expert({ slug: 'by-style', name: 'C', travelStyles: ['Himachal Trail'] }),
      expert({ slug: 'by-destination', name: 'D', destinationSlugs: ['manali'] }),
      expert({ slug: 'by-expertise', name: 'E', expertise: ['Manali Treks'] }),
      expert({ slug: 'by-role', name: 'F', role: 'Manali Planner' }),
      expert({ slug: 'by-name', name: 'Manali Joshi' })
    ];
    expect(find('Manali', ranked)).toEqual(['by-name', 'by-role', 'by-expertise', 'by-destination']);
    expect(find('Himachal', ranked)).toEqual(['by-style', 'by-region']);
    expect(find('ladakh', ranked)).toEqual(['by-bio']);
  });

  it('an empty query returns every public expert in catalog order', () => {
    expect(find('')).toEqual(['anita-rao', 'bilal-mir']);
    expect(find('   ')).toEqual(['anita-rao', 'bilal-mir']);
  });
});

describe('McLeod Ganj spelling variants find an eligible expert linked to it', () => {
  const mcleod = expert({ slug: 'tenzin-dorje', name: 'Tenzin Dorje', destinationSlugs: ['mcleod-ganj'] });
  const withMcleod: ExpertSearchContext = { ...context, destinations: [...(context.destinations ?? []), { slug: 'mcleod-ganj', title: 'McLeod Ganj' }] };
  const hit = (q: string, pool = [mcleod, anita], ctx = withMcleod) => names(searchExperts(pool, q, ctx));
  for (const q of ['McLeod Ganj', 'Mcleodganj', 'McLeodganj', 'MCLEODGANJ', 'mcleod-ganj', '  mcleod    GANJ  ', 'Mcleod']) {
    it(`"${q}"`, () => expect(hit(q)).toEqual(['tenzin-dorje']));
  }
  it('works from the stored slug alone when destination records are unavailable', () => {
    expect(names(searchExperts([mcleod], 'McLeodganj'))).toEqual(['tenzin-dorje']);
  });
  it('a newly linked destination becomes searchable immediately', () => {
    expect(hit('McLeodganj', [anita])).toEqual([]);
    expect(hit('McLeodganj', [{ ...anita, destinationSlugs: [...anita.destinationSlugs, 'mcleod-ganj'] }])).toEqual(['anita-rao']);
  });
  it('compact spelling never exposes an unlisted or deactivated expert', () => {
    expect(hit('McLeodganj', [{ ...mcleod, publiclyListed: false }])).toEqual([]);
    expect(hit('McLeodganj', [{ ...mcleod, publiclyListed: undefined }])).toEqual([]);
    expect(hit('McLeodganj', [{ ...mcleod, active: false }])).toEqual([]);
  });
  it('does not link an expert to a different or merely nearby place', () => {
    expect(hit('Dharamshala', [mcleod])).toEqual([]);
    expect(hit('Mcleodganjx', [mcleod])).toEqual([]);
    expect(hit('Ganj', [mcleod])).toEqual(['tenzin-dorje']); // a whole word of the stored title, as for routes
  });
});

describe('public visibility is a hard gate', () => {
  it('requires active AND publiclyListed === true', () => {
    expect(isPublicExpert({ active: true, publiclyListed: true })).toBe(true);
    expect(isPublicExpert({ active: true, publiclyListed: false })).toBe(false);
    expect(isPublicExpert({ active: true })).toBe(false);
    expect(isPublicExpert({ active: false, publiclyListed: true })).toBe(false);
  });
  it('an unlisted or deactivated expert never matches anything, even their own name', () => {
    const hidden = expert({ slug: 'hidden-one', name: 'Hidden One', publiclyListed: false, destinationSlugs: ['manali'] });
    const missing = expert({ slug: 'no-flag', name: 'No Flag', publiclyListed: undefined });
    const paused = expert({ slug: 'paused', name: 'Paused Pat', active: false });
    const pool = [anita, hidden, missing, paused];
    expect(find('Hidden One', pool)).toEqual([]);
    expect(find('No Flag', pool)).toEqual([]);
    expect(find('Paused', pool)).toEqual([]);
    expect(find('Manali', pool)).toEqual(['anita-rao']);
    expect(find('', pool)).toEqual(['anita-rao']);
  });
});

describe('future records need no search configuration', () => {
  it('a new active, publicly listed expert is searchable by every supported field', () => {
    const fresh = expert({
      slug: 'zoya-khan',
      name: 'Zoya Khan',
      role: 'Winter Safari Planner',
      expertise: ['Snow Leopard Tracking'],
      travelStyles: ['Wildlife'],
      destinationSlugs: ['spiti-valley'],
      regionIds: ['r-jk']
    });
    const next = [...all, fresh];
    for (const q of ['Zoya', 'Safari', 'Leopard', 'Wildlife', 'Spiti', 'Jammu']) expect(find(q, next)).toContain('zoya-khan');
  });
  it('an unlisted new expert stays hidden until listed; deactivation removes them', () => {
    const draft = expert({ slug: 'draft', name: 'Draft Person', publiclyListed: false });
    expect(find('Draft', [...all, draft])).toEqual([]);
    expect(find('Draft', [...all, { ...draft, publiclyListed: true }])).toEqual(['draft']);
    expect(find('Draft', [...all, { ...draft, publiclyListed: true, active: false }])).toEqual([]);
  });
  it('edits to expertise, styles, destinations and regions become searchable immediately', () => {
    expect(find('Birdwatching')).toEqual([]);
    expect(find('Birdwatching', [{ ...anita, expertise: [...anita.expertise, 'Birdwatching'] }, bilal])).toEqual(['anita-rao']);
    expect(find('Srinagar', [{ ...anita, destinationSlugs: ['srinagar'] }, bilal]).sort()).toEqual(['anita-rao', 'bilal-mir']);
    expect(find('Kashmir', [{ ...anita, regionIds: ['r-jk'] }, bilal]).sort()).toEqual(['anita-rao', 'bilal-mir']);
    expect(find('Himachal', [{ ...anita, regionIds: [] }, bilal])).toEqual([]);
  });
  it('without destination or region context an expert is still searchable by their own fields', () => {
    expect(names(searchExperts(all, 'Trek'))).toEqual(['anita-rao']);
    expect(names(searchExperts(all, 'Kashmir'))).toEqual(['bilal-mir']); // via role text
    expect(names(searchExperts(all, 'Himachal'))).toEqual([]); // needs the region link; never guessed
  });
  it('an empty public catalog yields no results, not an error', () => {
    expect(searchExperts([], 'Manali', context)).toEqual([]);
    expect(searchExperts([{ ...anita, publiclyListed: false }], '', context)).toEqual([]);
  });
});
