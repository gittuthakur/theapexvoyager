import { describe, expect, it } from 'vitest';
import snapshot from '@/lib/search/__fixtures__/transportRoutesSnapshot.json';
import { filterTransportRoutes } from '@/lib/search/transportSearch';
import { matchLocation, matchesLocation } from '@/lib/search/locationMatching';
import type { TransportRoute } from '@/types/transport';

// The 25 real active routes read from production (read-only) — the "eligible catalog".
const routes = snapshot as unknown as TransportRoute[];
const pairs = (list: TransportRoute[]) => list.map((route) => `${route.origin} > ${route.destination}`).sort();
const search = (origin?: string, destination?: string, list: TransportRoute[] = routes) => pairs(filterTransportRoutes(list, { origin, destination }));

function route(overrides: Partial<TransportRoute> & Pick<TransportRoute, 'origin' | 'destination'>): TransportRoute {
  return { supportedVehicleCategories: ['SUV'], startingFare: 5000, routeType: 'Intercity Transfer', seasonalStatus: 'Year-round', active: true, ...overrides };
}

describe('location matching (place-name identity)', () => {
  it('matches spelling variants of the same place', () => {
    expect(matchesLocation('Dharamshala', 'Dharamsala')).toBe(true);
    expect(matchesLocation('Dharamsala', 'Dharamshala')).toBe(true);
    expect(matchesLocation('McLeod Ganj', 'Mcleodganj')).toBe(true);
    expect(matchesLocation('Mcleodganj', 'McLeod Ganj')).toBe(true);
    expect(matchesLocation('Delhi', 'New Delhi')).toBe(true);
    expect(matchesLocation('Shimla', 'Simla')).toBe(true);
    expect(matchesLocation('Spiti Valley', 'spiti-valley')).toBe(true);
    expect(matchesLocation('Kaza, Spiti Valley', 'Kaza')).toBe(true);
  });
  it('does not relate different places', () => {
    expect(matchesLocation('Chandigarh', 'Chandigarh Airport')).toBe(false);
    expect(matchesLocation('Delhi', 'Delhi Airport')).toBe(false);
    expect(matchesLocation('Manali', 'Kullu')).toBe(false);
    expect(matchesLocation('Srinagar', 'Gulmarg')).toBe(false);
  });
  it('arbitrary fragments do not match; word-starts of at least 3 letters do', () => {
    expect(matchLocation('Manali', 'nali')).toBeNull();
    expect(matchLocation('Manali', 'ma')).toBeNull();
    expect(matchLocation('Manali', 'man')).toBe('prefix');
    expect(matchLocation('Spiti Valley', 'val')).toBe('prefix');
    expect(matchLocation('Mcleod Ganj', 'gan')).toBe('prefix');
  });
});

describe('route search over the real catalog: expected vs actual', () => {
  const MATRIX: Array<[string, string | undefined, string | undefined, string[]]> = [
    ['exact origin', 'Delhi', undefined, ['Delhi > Manali']],
    ['exact destination', undefined, 'Manali', ['Delhi > Manali', 'Shimla > Manali']],
    ['exact pair', 'Delhi', 'Manali', ['Delhi > Manali']],
    ['reverse of a real route is NOT a route', 'Manali', 'Delhi', []],
    ['New Delhi = Delhi', 'New Delhi', 'Manali', ['Delhi > Manali']],
    ['New Delhi is not a destination here', undefined, 'New Delhi', []],
    ['Dharamsala spelling', 'Chandigarh', 'Dharamsala', ['Chandigarh > Dharamshala']],
    ['Dharamshala spelling', undefined, 'Dharamshala', ['Chandigarh > Dharamshala']],
    ['no route for a catalog place without a route record', 'Chandigarh', 'McLeod Ganj', []],
    ['Chandigarh Airport has no route of its own', 'Chandigarh Airport', undefined, []],
    ['and is not silently Chandigarh', 'Chandigarh Airport', 'Shimla', []],
    ['real airport origin', 'Srinagar Airport', 'Srinagar', ['Srinagar Airport > Srinagar']],
    ['station origin', 'Kathgodam', 'Nainital', ['Kathgodam > Nainital']],
    ['case/spacing variants', '  KATHGODAM ', 'nainital', ['Kathgodam > Nainital']],
    ['multi-word destination by slug spelling', 'Manali', 'spiti-valley', ['Manali > Spiti Valley']],
    ['word-start typing', 'Kathg', 'Nain', ['Kathgodam > Nainital']],
    ['fragments never match', 'nali', undefined, []],
    ['a valid pickup with a destination that has no route from it', 'Delhi', 'Shimla', []]
  ];
  for (const [label, origin, destination, expected] of MATRIX) {
    it(label, () => expect(search(origin, destination)).toEqual([...expected].sort()));
  }

  it('Srinagar city and Srinagar Airport are different endpoints', () => {
    expect(search('Srinagar')).toEqual(['Srinagar > Gulmarg', 'Srinagar > Pahalgam', 'Srinagar > Sonamarg'].sort());
    expect(search('Srinagar Airport')).toEqual(['Srinagar Airport > Srinagar']);
    expect(search(undefined, 'Srinagar')).toEqual(['Srinagar Airport > Srinagar']);
    expect(search('Srinagar', 'Srinagar')).toEqual([]);
    expect(search('Dehradun')).toEqual(['Dehradun > Lansdowne', 'Dehradun > Mussoorie', 'Dehradun > Rishikesh']);
    expect(search('Dehradun Airport', 'Dehradun')).toEqual(['Dehradun Airport > Dehradun']);
  });
  it('a looser match is used only when no route names the place exactly', () => {
    const onlyAirport = routes.filter((r) => r.origin !== 'Srinagar');
    expect(search('Srinagar', undefined, onlyAirport)).toEqual(['Srinagar Airport > Srinagar']);
  });

  it('no filter returns the whole active catalog unchanged and in order', () => {
    expect(filterTransportRoutes(routes)).toEqual(routes);
    expect(filterTransportRoutes(routes, { origin: ' ', destination: '' })).toEqual(routes);
  });

  it('every real route is found by its own endpoints; swapped endpoints find only a route that independently exists', () => {
    for (const r of routes) {
      expect(pairs(filterTransportRoutes(routes, { origin: r.origin, destination: r.destination }))).toContain(`${r.origin} > ${r.destination}`);
      const reverse = filterTransportRoutes(routes, { origin: r.destination, destination: r.origin });
      expect(reverse.some((hit) => hit.origin === r.destination && hit.destination === r.origin)).toBe(false);
    }
  });

  it('returns stored route objects untouched: fares, vehicle categories, type and season', () => {
    const hit = filterTransportRoutes(routes, { origin: 'Delhi', destination: 'Manali' })[0];
    expect(hit).toBe(routes.find((r) => r.origin === 'Delhi' && r.destination === 'Manali'));
    expect(hit.startingFare).toBe(9500);
    expect(hit.supportedVehicleCategories).toEqual(['SUV', 'Tempo Traveller', 'Premium']);
    expect(hit.seasonalStatus).toBe('Year-round');
  });
});

describe('future records need no search configuration', () => {
  it('a newly added active route is searchable at once', () => {
    const next = [...routes, route({ origin: 'Chandigarh', destination: 'Kasol' }), route({ origin: 'Pathankot', destination: 'Dalhousie' })];
    expect(search('Chandigarh', 'Kasol', next)).toEqual(['Chandigarh > Kasol']);
    expect(search('Pathankot', undefined, next)).toEqual(['Pathankot > Dalhousie']);
    expect(search('Pathankot', undefined)).toEqual([]);
  });
  it('a new route is found through verified spelling aliases too', () => {
    const next = [...routes, route({ origin: 'Pathankot', destination: 'Dharamsala' })];
    expect(search('Pathankot', 'Dharamshala', next)).toEqual(['Pathankot > Dharamsala']);
  });
  it('a route edit is reflected', () => {
    const edited = routes.map((r) => (r.origin === 'Delhi' && r.destination === 'Manali' ? { ...r, destination: 'Kullu' } : r));
    expect(search('Delhi', 'Manali', edited)).toEqual([]);
    expect(search('Delhi', 'Kullu', edited)).toEqual(['Delhi > Kullu']);
  });
  it('a deactivated route disappears, and a record that is not explicitly active is never returned', () => {
    const off = routes.map((r) => (r.origin === 'Delhi' ? { ...r, active: false } : r));
    expect(search('Delhi', 'Manali', off)).toEqual([]);
    expect(search('Delhi', undefined, [route({ origin: 'Delhi', destination: 'Agra', active: undefined })])).toEqual([]);
  });
  it('a reverse route exists only if independently present', () => {
    expect(search('Manali', 'Delhi')).toEqual([]);
    const next = [...routes, route({ origin: 'Manali', destination: 'Delhi' })];
    expect(search('Manali', 'Delhi', next)).toEqual(['Manali > Delhi']);
    expect(search('Delhi', 'Manali', next)).toEqual(['Delhi > Manali']);
  });
});
