import type { HotelCategory } from '@/types';

export const HOTEL_CATEGORIES: HotelCategory[] = ['Hotel', 'Homestay', 'Resort', 'Villa', 'Camp', 'Treehouse', 'Farmstay', 'Hostel', 'Heritage', 'GuestHouse'];

export function isHotelCategory(value?: string): value is HotelCategory {
  return Boolean(value) && HOTEL_CATEGORIES.includes(value as HotelCategory);
}

/**
 * A `category` value that was supplied but isn't a real HotelCategory (a stale or
 * hand-edited link — `?category=Bogus`) must narrow to a genuine zero-result state, never
 * fall through to "no filter" and show the whole catalog. A resolved `type`/`mood` already
 * supplies its own category, so `category` is only authoritative when neither resolved —
 * the same precedence /stays/search uses when it builds its category filter.
 */
export function isCategoryRequestedButUnresolved(categoryParam: string | undefined, hasResolvedTypeOrMood: boolean): boolean {
  return !hasResolvedTypeOrMood && Boolean(categoryParam) && !isHotelCategory(categoryParam);
}
