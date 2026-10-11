import { describe, expect, it } from 'vitest';
import { vehicleOptions } from '@/config/transport.config';
import {
  getVehicleTypeOptionsForService,
  resolveChauffeurVehicleParam,
  serviceTypeFromUrlSlug,
  urlSlugFromServiceType
} from '@/config/transportServiceTypes.config';

describe('resolveChauffeurVehicleParam (homepage Transport "Vehicle type")', () => {
  it('resolves Sedan and Premium SUV display names to their stored categories', () => {
    expect(resolveChauffeurVehicleParam('Sedan')).toEqual({ value: 'Comfort', serviceType: 'Cab with Driver' });
    expect(resolveChauffeurVehicleParam('Premium SUV')).toEqual({ value: 'Premium', serviceType: 'Cab with Driver' });
  });
  it('resolves every configured chauffeur/group option (the exact list the homepage dropdown offers)', () => {
    for (const vehicle of vehicleOptions) {
      const resolved = resolveChauffeurVehicleParam(vehicle.name);
      expect(resolved.value, vehicle.name).toBe(vehicle.category ?? vehicle.name);
      expect(resolved.serviceType, vehicle.name).toBe(vehicle.serviceType);
    }
  });
  it('agrees with the Hero search\'s own label->value conversion for both chauffeur services', () => {
    for (const service of ['Cab with Driver', 'Group Transport'] as const) {
      for (const option of getVehicleTypeOptionsForService(service)) {
        expect(resolveChauffeurVehicleParam(option.label).value, option.label).toBe(option.value);
      }
    }
  });
  it('Group Transport picks map to the group service slug the page reads', () => {
    const coach = resolveChauffeurVehicleParam('Coach / Mini Bus');
    expect(coach).toEqual({ value: 'Coach', serviceType: 'Group Transport' });
    expect(serviceTypeFromUrlSlug(urlSlugFromServiceType(coach.serviceType!))).toBe('Group Transport');
  });
  it('already-valid category values and unknown input pass through unchanged (existing URLs keep working)', () => {
    for (const value of ['Comfort', 'SUV', 'Premium', 'Tempo Traveller', 'Coach', 'Hatchback', 'Bogus']) {
      expect(resolveChauffeurVehicleParam(value).value, value).toBe(value);
    }
    expect(resolveChauffeurVehicleParam('Bogus')).toEqual({ value: 'Bogus' });
    expect(resolveChauffeurVehicleParam('')).toEqual({ value: '' });
  });
  it('a category value is never re-mapped as if it were a name (no double translation)', () => {
    const names = new Set(vehicleOptions.map((v) => v.name));
    for (const vehicle of vehicleOptions) {
      const category = vehicle.category ?? vehicle.name;
      if (names.has(category) && category !== vehicle.name) {
        // A category that is also another vehicle's name would be ambiguous — fail loudly.
        throw new Error(`Ambiguous: category "${category}" is also a vehicle name`);
      }
    }
  });
});
