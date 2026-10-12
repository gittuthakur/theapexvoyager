import { beforeEach, describe, expect, it, vi } from 'vitest';

type Doc = Record<string, unknown>;
const { stores, calls } = vi.hoisted(() => ({
  stores: { Region: [] as Doc[], Expert: [] as Doc[], Journey: [] as Doc[], Destination: [] as Doc[], Experience: [] as Doc[] },
  calls: [] as Array<{ model: string; filter: Doc; maxTimeMS?: number; projection?: unknown }>
}));

function fakeModel(name: keyof typeof stores) {
  return {
    find: (filter: Doc = {}, projection?: unknown) => {
      const record: (typeof calls)[number] = { model: name, filter, projection };
      calls.push(record);
      const query = {
        sort: () => query,
        maxTimeMS: (ms: number) => { record.maxTimeMS = ms; return query; },
        lean: async () => stores[name].filter((doc) => Object.entries(filter).every(([key, value]) => doc[key] === value))
      };
      return query;
    }
  };
}

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Region', () => ({ Region: fakeModel('Region') }));
vi.mock('@/models/Expert', () => ({ Expert: fakeModel('Expert') }));
vi.mock('@/models/Journey', () => ({ Journey: fakeModel('Journey') }));
vi.mock('@/models/Destination', () => ({ Destination: fakeModel('Destination') }));
vi.mock('@/models/Experience', () => ({ Experience: fakeModel('Experience') }));

const { getPublishedRegionRefs } = await import('@/lib/publishedRegions');
const { getAllExperts } = await import('@/lib/experts');
const { getAllPackages } = await import('@/lib/packages');
const { getCuratedDestinations } = await import('@/lib/destinations');
const { getAllExperiences } = await import('@/lib/experiences');

beforeEach(() => {
  calls.length = 0;
  for (const key of Object.keys(stores) as Array<keyof typeof stores>) stores[key] = [];
});

describe('published regions loader', () => {
  it('returns only published regions as light refs (a draft such as Ladakh is never returned)', async () => {
    stores.Region = [
      { _id: 'r1', name: 'Himachal Pradesh', slug: 'himachal-pradesh', shortDescription: 'x', cardImage: '/h.jpg', status: 'published' },
      { _id: 'r4', name: 'Ladakh', slug: 'ladakh', shortDescription: 'y', cardImage: '/l.jpg', status: 'draft' }
    ];
    const regions = await getPublishedRegionRefs();
    expect(regions).toEqual([{ id: 'r1', slug: 'himachal-pradesh', name: 'Himachal Pradesh', shortDescription: 'x', image: '/h.jpg' }]);
    expect(calls[0].filter).toEqual({ status: 'published' });
    // a projection read: only the fields search needs, never a whole Region Hub document
    expect(calls[0].projection).toEqual({ name: 1, slug: 1, shortDescription: 1, cardImage: 1 });
  });
  it('a newly published region is returned on the next read', async () => {
    stores.Region = [{ _id: 'r4', name: 'Ladakh', slug: 'ladakh', status: 'draft' }];
    expect(await getPublishedRegionRefs()).toEqual([]);
    stores.Region = [{ _id: 'r4', name: 'Ladakh', slug: 'ladakh', status: 'published' }];
    expect((await getPublishedRegionRefs()).map((r) => r.slug)).toEqual(['ladakh']);
  });
});

describe('expert loader eligibility (unchanged) and the optional time bound', () => {
  it('queries only active AND publiclyListed experts', async () => {
    await getAllExperts();
    expect(calls[0].filter).toEqual({ active: true, publiclyListed: true });
  });
});

describe('maxTimeMS: the database itself bounds each global-search read', () => {
  it('is applied to every catalog loader when requested', async () => {
    await getPublishedRegionRefs({ maxTimeMS: 1500 });
    await getAllExperts({ maxTimeMS: 1500 });
    await getAllPackages({ maxTimeMS: 1500 });
    await getCuratedDestinations({ maxTimeMS: 1500 });
    await getAllExperiences(1500);
    expect(calls.map((c) => [c.model, c.maxTimeMS])).toEqual([['Region', 1500], ['Expert', 1500], ['Journey', 1500], ['Destination', 1500], ['Experience', 1500]]);
  });

  it('leaves every existing caller exactly as before when it is not requested', async () => {
    await getAllExperts();
    await getAllPackages();
    await getCuratedDestinations();
    expect(calls.every((c) => c.maxTimeMS === undefined)).toBe(true);
  });

  it('passes a projection only when asked, to every projectable loader', async () => {
    const projection = { slug: 1, title: 1 } as const;
    await getCuratedDestinations({ projection: { ...projection } });
    await getAllPackages({ projection: { ...projection } });
    await getAllExperiences(undefined, { ...projection });
    expect(calls.map((c) => [c.model, c.projection])).toEqual([['Destination', projection], ['Journey', projection], ['Experience', projection]]);
    calls.length = 0;
    await getCuratedDestinations();
    await getAllPackages();
    await getAllExperiences();
    expect(calls.every((c) => c.projection === undefined)).toBe(true);
  });

  it('keeps each loader\'s own public-eligibility filter', async () => {
    await getAllPackages({ maxTimeMS: 1500 });
    await getCuratedDestinations({ maxTimeMS: 1500 });
    expect(calls.find((c) => c.model === 'Journey')?.filter).toEqual({ status: 'published' });
    expect(calls.find((c) => c.model === 'Destination')?.filter).toEqual({ status: 'published' });
  });
});
