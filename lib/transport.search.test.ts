import { beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory stand-ins for the two collections. `find` records the query it was given and, like Mongo,
// applies it, so these tests exercise the REAL getRoutes/getVehicles query + filter code.
const { routeStore, vehicleStore, routeFind, vehicleFind } = vi.hoisted(() => {
  const matches = (doc: Record<string, unknown>, query: Record<string, unknown>) =>
    Object.entries(query).every(([key, condition]) => {
      const value = doc[key];
      if (condition instanceof RegExp) return typeof value === 'string' && condition.test(value);
      if (condition && typeof condition === 'object' && '$in' in condition) return (condition as { $in: unknown[] }).$in.includes(value);
      return value === condition;
    });
  const makeFind = (store: { docs: Record<string, unknown>[] }) =>
    vi.fn((query: Record<string, unknown>) => ({
      sort: () => ({ lean: async () => store.docs.filter((doc) => matches(doc, query)) })
    }));
  const routeStore = { docs: [] as Record<string, unknown>[] };
  const vehicleStore = { docs: [] as Record<string, unknown>[] };
  return { routeStore, vehicleStore, routeFind: makeFind(routeStore), vehicleFind: makeFind(vehicleStore) };
});

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/TransportRoute', () => ({ TransportRoute: { find: routeFind } }));
vi.mock('@/models/TransportVehicle', () => ({ TransportVehicle: { find: vehicleFind } }));

const { getRoutes, getVehicles } = await import('@/lib/transport');

let nextId = 1;
const routeDoc = (o: Record<string, unknown>) => ({ _id: `r${nextId++}`, supportedVehicleCategories: ['SUV'], startingFare: 5000, active: true, ...o });
const vehicleDoc = (o: Record<string, unknown>) => ({
  _id: `v${nextId++}`, slug: `v-${nextId}`, name: 'Car', seats: 4, images: ['/a.jpg'], estimatedFromPrice: 4000, inclusions: [], exclusions: [],
  serviceAreas: ['Himachal Pradesh'], active: true, serviceType: 'Cab with Driver', category: 'SUV', ...o
});
const pairs = (list: Array<{ origin: string; destination: string }>) => list.map((r) => `${r.origin} > ${r.destination}`);

beforeEach(() => {
  routeFind.mockClear();
  vehicleFind.mockClear();
  routeStore.docs = [
    routeDoc({ origin: 'Delhi', destination: 'Manali', startingFare: 9500, supportedVehicleCategories: ['SUV', 'Premium'], seasonalStatus: 'Year-round' }),
    routeDoc({ origin: 'Chandigarh', destination: 'Dharamshala' }),
    routeDoc({ origin: 'Old Town', destination: 'Gone Valley', active: false })
  ];
  vehicleStore.docs = [vehicleDoc({ slug: 'suv-1', category: 'SUV' }), vehicleDoc({ slug: 'suv-off', category: 'SUV', active: false })];
});

describe('getRoutes (live catalog)', () => {
  it('always queries active routes only and searches the live records', async () => {
    expect(pairs(await getRoutes({ origin: 'New Delhi', destination: 'Manali' }))).toEqual(['Delhi > Manali']);
    expect(routeFind.mock.calls.every(([query]) => (query as { active: boolean }).active === true)).toBe(true);
    expect(pairs(await getRoutes({ destination: 'Dharamsala' }))).toEqual(['Chandigarh > Dharamshala']);
  });
  it('keeps direction strict, never returns an inactive route, and leaves fares and categories untouched', async () => {
    expect(await getRoutes({ origin: 'Manali', destination: 'Delhi' })).toEqual([]);
    expect(await getRoutes({ origin: 'Old Town' })).toEqual([]);
    const [route] = await getRoutes({ origin: 'Delhi' });
    expect(route).toMatchObject({ startingFare: 9500, supportedVehicleCategories: ['SUV', 'Premium'], seasonalStatus: 'Year-round', active: true });
  });
  it('reflects added, edited and deactivated routes with no configuration', async () => {
    routeStore.docs.push(routeDoc({ origin: 'Pathankot', destination: 'Dalhousie' }));
    expect(pairs(await getRoutes({ origin: 'Pathankot' }))).toEqual(['Pathankot > Dalhousie']);
    routeStore.docs.find((d) => d.origin === 'Pathankot')!.destination = 'Khajjiar';
    expect(pairs(await getRoutes({ destination: 'Khajjiar' }))).toEqual(['Pathankot > Khajjiar']);
    expect(await getRoutes({ destination: 'Dalhousie' })).toEqual([]);
    routeStore.docs.find((d) => d.origin === 'Pathankot')!.active = false;
    expect(await getRoutes({ origin: 'Pathankot' })).toEqual([]);
  });
});

describe('getVehicles (unchanged eligibility)', () => {
  it('is active-only and a newly added vehicle appears under its own service type and category', async () => {
    expect((await getVehicles({ serviceTypeIn: ['Cab with Driver', 'Group Transport'] })).map((v) => v.slug)).toEqual(['suv-1']);
    vehicleStore.docs.push(vehicleDoc({ slug: 'tt-new', category: 'Tempo Traveller', serviceType: 'Group Transport' }));
    expect((await getVehicles({ serviceTypeIn: ['Cab with Driver', 'Group Transport'] })).map((v) => v.slug)).toEqual(['suv-1', 'tt-new']);
    expect((await getVehicles({ serviceTypeIn: ['Cab with Driver', 'Group Transport'], category: 'tempo traveller' })).map((v) => v.slug)).toEqual(['tt-new']);
    expect(await getVehicles({ serviceType: 'Self-Drive Car' })).toEqual([]);
  });
  it('an inactive vehicle never appears, for any filter', async () => {
    for (const filter of [undefined, { category: 'SUV' }, { serviceTypeIn: ['Cab with Driver'] }, { serviceType: 'Cab with Driver' }]) {
      expect((await getVehicles(filter)).map((v) => v.slug)).not.toContain('suv-off');
    }
    expect(vehicleFind.mock.calls.every(([query]) => (query as { active: boolean }).active === true)).toBe(true);
  });
  it('does not invent destination links: no vehicle gains destinationSlugs from a search', async () => {
    const vehicles = await getVehicles({ category: 'SUV' });
    expect(vehicles.every((v) => v.destinationSlugs === undefined)).toBe(true);
  });
});
