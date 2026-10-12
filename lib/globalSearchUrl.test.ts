import { describe, expect, it } from 'vitest';
import { buildGlobalSearchTarget, toSearchUrl, type GlobalSearchFields, type GlobalSearchResolvers } from '@/lib/globalSearchUrl';
import { globalSearchTabs, stayTypes } from '@/config/search.config';
import { vehicleOptions } from '@/config/transport.config';

const EMPTY: GlobalSearchFields = {
  destination: '',
  pickup: '',
  drop: '',
  travelStyle: '',
  season: '',
  dateRange: { checkIn: null, checkOut: null },
  occupancy: { adults: 2, children: 0 },
  date: '',
  time: '',
  participants: 2,
  passengers: 2,
  travelers: 2
};

const RESOLVERS: GlobalSearchResolvers = {
  staysPath: '/stays/search',
  resolveDestinationSlug: (value) => (value.trim().toLowerCase() === 'manali' ? 'manali' : undefined),
  resolveExpertTravelStyle: (need) => (need === 'Honeymoon' ? 'Couple' : undefined)
};

function url(tab: (typeof globalSearchTabs)[number], fields: Partial<GlobalSearchFields> = {}, resolvers: Partial<GlobalSearchResolvers> = {}) {
  return toSearchUrl(buildGlobalSearchTarget(tab, { ...EMPTY, ...fields }, { ...RESOLVERS, ...resolvers }));
}

const FEB1 = new Date(2027, 1, 1);
const FEB5 = new Date(2027, 1, 5);

describe('homepage search panel: field -> URL contract (all six tabs)', () => {
  it('covers exactly the six tabs the panel shows', () => {
    expect([...globalSearchTabs]).toEqual(['Destinations', 'Stays', 'Journeys', 'Experiences', 'Transport', 'Travel Experts']);
  });

  describe('Destinations (all three fields FILTER /destinations)', () => {
    it('maps destination, style and season', () => {
      expect(url('Destinations', { destination: 'Kullu', travelStyle: 'Adventure', season: 'Winter' })).toBe('/destinations?destination=Kullu&style=Adventure&season=Winter');
    });
    it('an empty search carries no params', () => {
      expect(url('Destinations')).toBe('/destinations');
    });
  });

  describe('Stays (destination/category FILTER; dates + guests are PREFERENCES; no rooms/pets)', () => {
    it('maps destination, stay type, dates and guests', () => {
      expect(url('Stays', { destination: 'Manali', travelStyle: 'Homestay', dateRange: { checkIn: FEB1, checkOut: FEB5 }, occupancy: { adults: 2, children: 1 } })).toBe(
        '/stays/search?destination=Manali&category=Homestay&checkIn=2027-02-01&checkOut=2027-02-05&guests=3'
      );
    });
    it('always carries the guest count and never emits rooms or pets', () => {
      const href = url('Stays');
      expect(href).toBe('/stays/search?guests=2');
      expect(href).not.toMatch(/rooms|pets/);
    });
    it('every stay type the panel offers is a value /stays/search accepts as category', () => {
      for (const type of stayTypes) expect(url('Stays', { travelStyle: type })).toContain(`category=${type}`);
    });
    it('honours a custom stays path', () => {
      expect(url('Stays', {}, { staysPath: '/homestays' })).toMatch(/^\/homestays\?/);
    });
  });

  describe('Journeys (destination/category FILTER; dates + travelers are PREFERENCES)', () => {
    it('maps destination and category only when no preference was stated', () => {
      expect(url('Journeys', { destination: 'Kullu', travelStyle: 'Adventure' })).toBe('/journeys?destination=Kullu&category=Adventure');
    });
    it('carries travel dates and the party as preferences', () => {
      expect(url('Journeys', { dateRange: { checkIn: FEB1, checkOut: FEB5 }, occupancy: { adults: 2, children: 1 } })).toBe(
        '/journeys?travelStartDate=2027-02-01&travelEndDate=2027-02-05&adults=2&children=1'
      );
    });
    it('carries a changed party without dates, and no rooms/pets ever', () => {
      const href = url('Journeys', { occupancy: { adults: 4, children: 0 } });
      expect(href).toBe('/journeys?adults=4');
      expect(href).not.toMatch(/rooms|pets/);
    });
    it('preference params are named so no existing /journeys filter can read them', () => {
      const params = new URLSearchParams(url('Journeys', { dateRange: { checkIn: FEB1, checkOut: FEB5 } }).split('?')[1]);
      for (const filterKey of ['destination', 'category', 'region', 'season', 'priceMin', 'priceMax', 'duration', 'accommodation', 'sort', 'page']) {
        expect(params.has(filterKey)).toBe(false);
      }
    });
  });

  describe('Experiences (q/category FILTER; preferred date + participants are PREFERENCES)', () => {
    it('maps q and category with the listing anchor', () => {
      expect(url('Experiences', { destination: 'Kullu', travelStyle: 'Adventure' })).toBe('/experiences?q=Kullu&category=Adventure#listing');
    });
    it('carries the preferred date and participants without applying any capacity filter', () => {
      expect(url('Experiences', { date: '2027-03-01', participants: 6 })).toBe('/experiences?preferredDate=2027-03-01&participants=6#listing');
    });
    it('an untouched default participant count is not stated as a preference', () => {
      expect(url('Experiences')).toBe('/experiences#listing');
    });
  });

  describe('Transport (every field already filters or feeds the enquiry; Phase A behaviour preserved)', () => {
    it('maps pickup, drop, date, time, passengers, a vehicle category and the results-mode flag', () => {
      expect(url('Transport', { pickup: 'Manali', drop: 'Chandigarh', date: '2027-03-01', time: '09:30', passengers: 4 })).toBe(
        '/transport?pickup=Manali&destination=Chandigarh&date=2027-03-01&time=09%3A30&travellers=4&searched=1'
      );
    });
    it('sends the STORED category for every vehicle the dropdown offers (Sedan -> Comfort, Premium SUV -> Premium)', () => {
      const sedan = new URLSearchParams(url('Transport', { travelStyle: 'Sedan' }).split('?')[1]);
      expect(sedan.get('vehicle')).toBe('Comfort');
      const premium = new URLSearchParams(url('Transport', { travelStyle: 'Premium SUV' }).split('?')[1]);
      expect(premium.get('vehicle')).toBe('Premium');
      for (const vehicle of vehicleOptions) {
        const params = new URLSearchParams(url('Transport', { travelStyle: vehicle.name }).split('?')[1]);
        expect(params.get('vehicle'), vehicle.name).toBe(vehicle.category ?? vehicle.name);
      }
    });
    it('opens a Group Transport vehicle under the group service and leaves Cab with Driver on the default', () => {
      expect(url('Transport', { travelStyle: 'Coach / Mini Bus' })).toContain('service=group');
      expect(url('Transport', { travelStyle: 'Sedan' })).not.toContain('service=');
    });
    it('always flags an intentional search', () => {
      expect(url('Transport')).toContain('searched=1');
    });
  });

  describe('Travel Experts (destination slug + travelStyle FILTER; date + travelers are PREFERENCES)', () => {
    it('maps a resolvable place to its slug and a mapped need to a travel style', () => {
      expect(url('Travel Experts', { destination: 'Manali', travelStyle: 'Honeymoon' })).toBe('/experts?destination=manali&travelStyle=Couple');
    });
    it('a place that is not one catalog destination is searched as text, never dropped (which would show every expert)', () => {
      expect(url('Travel Experts', { destination: 'Kullu', travelStyle: 'Honeymoon' })).toBe('/experts?q=Kullu&travelStyle=Couple');
    });
    it('drops a need that can never match a travel style (no dead filter)', () => {
      expect(url('Travel Experts', { destination: 'Manali', travelStyle: 'Custom trip' })).toBe('/experts?destination=manali');
    });
    it('an empty place adds neither a destination nor a text query', () => {
      expect(url('Travel Experts', { travelStyle: 'Custom trip' })).toBe('/experts');
    });
    it('carries the preferred date and travelers as preferences', () => {
      expect(url('Travel Experts', { date: '2027-03-01', travelers: 5 })).toBe('/experts?preferredDate=2027-03-01&travelers=5');
    });
  });
});

describe('toSearchUrl', () => {
  it('drops blank and undefined params and trims values', () => {
    expect(toSearchUrl({ path: '/x', params: { a: ' 1 ', b: '', c: undefined, d: '   ' } })).toBe('/x?a=1');
  });
  it('appends the hash after the query', () => {
    expect(toSearchUrl({ path: '/x', params: { a: '1' }, hash: 'listing' })).toBe('/x?a=1#listing');
    expect(toSearchUrl({ path: '/x', params: {}, hash: 'listing' })).toBe('/x#listing');
  });
});
