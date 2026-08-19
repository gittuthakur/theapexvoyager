import type { HotelCategory } from '@/types/hotel';

// One verified-live Unsplash photo per stay category — real photography instead
// of a generic gray box when a hotel's own image is missing. Direct CDN URLs
// (images.unsplash.com/photo-<id>) rather than the old source.unsplash.com
// "random by keyword" endpoint, which Unsplash shut down (now 503s).
//
// API-ready: swap the body of `getPlaceholderImageForCategory` for a real
// Unsplash API search-by-category call (with an access key, server-side only)
// without touching any call site — every caller already treats this as "the
// current best photo for this category," not "a specific hardcoded photo."
//
// Pure/no Node APIs — safe to import from Client Components (PropertyCard and
// friends). The filesystem-checking half of this lives in
// lib/hotelImages.server.ts, kept separate so this file never pulls `fs`
// into the browser bundle.
const UNSPLASH_FALLBACK_BY_CATEGORY: Record<HotelCategory, string> = {
  Hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&auto=format&fit=crop',
  Resort: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80&auto=format&fit=crop',
  Homestay: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&q=80&auto=format&fit=crop',
  Villa: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80&auto=format&fit=crop',
  Camp: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80&auto=format&fit=crop',
  Treehouse: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80&auto=format&fit=crop',
  Farmstay: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80&auto=format&fit=crop',
  Hostel: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1200&q=80&auto=format&fit=crop',
  Heritage: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80&auto=format&fit=crop',
  GuestHouse: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80&auto=format&fit=crop'
};

const DEFAULT_FALLBACK = UNSPLASH_FALLBACK_BY_CATEGORY.Hotel;

export function getPlaceholderImageForCategory(category: HotelCategory): string {
  return UNSPLASH_FALLBACK_BY_CATEGORY[category] ?? DEFAULT_FALLBACK;
}
