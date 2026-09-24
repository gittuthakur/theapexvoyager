import { describe, expect, it } from 'vitest';
import { getHbxDestinationMapping } from './hbxDestinations.config';

describe('getHbxDestinationMapping', () => {
  it('returns the verified mapping for shimla', () => {
    expect(getHbxDestinationMapping('shimla')).toEqual({
      slug: 'shimla',
      hbxCode: 'SLV',
      hbxName: 'Shimla',
      verifiedAt: '2026-09-24'
    });
  });

  it('returns the verified mapping for manali', () => {
    const mapping = getHbxDestinationMapping('manali');
    expect(mapping?.hbxCode).toBe('IN6');
  });

  it('fails safe (undefined) for an unmapped destination rather than guessing a code', () => {
    expect(getHbxDestinationMapping('kinnaur')).toBeUndefined();
    expect(getHbxDestinationMapping('dharamshala')).toBeUndefined();
    expect(getHbxDestinationMapping('not-a-real-destination')).toBeUndefined();
  });
});
