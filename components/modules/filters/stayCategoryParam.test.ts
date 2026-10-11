import { describe, expect, it } from 'vitest';
import { HOTEL_CATEGORIES, isCategoryRequestedButUnresolved, isHotelCategory } from '@/components/modules/filters/stayCategoryParam';
import { stayTypes } from '@/config/search.config';

describe('/stays/search category param', () => {
  it('every category the homepage Stays tab can send is a recognized HotelCategory', () => {
    for (const label of stayTypes) expect(isHotelCategory(label), label).toBe(true);
  });
  it('an unknown category is requested-but-unresolved (forces a zero-result state)', () => {
    for (const bogus of ['Bogus', 'hotel', 'HOTEL', 'Hotel ', '<script>']) {
      expect(isCategoryRequestedButUnresolved(bogus, false), bogus).toBe(true);
    }
  });
  it('valid categories and an absent/empty category are never forced empty', () => {
    for (const category of HOTEL_CATEGORIES) expect(isCategoryRequestedButUnresolved(category, false), category).toBe(false);
    expect(isCategoryRequestedButUnresolved(undefined, false)).toBe(false);
    expect(isCategoryRequestedButUnresolved('', false)).toBe(false);
  });
  it('a resolved type/mood owns the category, so a stale category param does not force empty', () => {
    expect(isCategoryRequestedButUnresolved('Bogus', true)).toBe(false);
  });
});
