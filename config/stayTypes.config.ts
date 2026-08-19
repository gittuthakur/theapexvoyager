import { images } from '@/config/images.config';
import type { HotelCategory } from '@/types/hotel';

/**
 * Single source of truth mapping every Apex Stays SEO slug (/stays/[slug]) to the
 * real, existing HotelCategory it filters by. Reused by the homepage discovery
 * section, the /stays hub's type chips, and the /stays/[...segments] catch-all
 * resolver, so a stay type only ever has to be defined once.
 *
 * "cottages", "cabins" and "villas" intentionally share the single `Villa`
 * category that exists in the data today — there's no dedicated Cottage/Cabin
 * taxonomy value, so all three point at the same real, working filter rather
 * than inventing new categories. "glamping" is the canonical slug for `Camp`.
 * "boutique-stays" has no category of its own — it surfaces `featured` stays.
 */
export interface StayTypeDefinition {
  slug: string;
  label: string;
  description: string;
  image: string;
  category?: HotelCategory;
}

export const stayTypes: StayTypeDefinition[] = [
  { slug: 'hotels', label: 'Hotels', description: 'Comfortable stays with modern amenities in every town.', image: images.destinations.shimla, category: 'Hotel' },
  { slug: 'resorts', label: 'Resorts', description: 'Full-service getaways with dining, views, and leisure.', image: images.destinations.manali, category: 'Resort' },
  { slug: 'homestays', label: 'Homestays', description: 'Live with local families in cozy mountain homes.', image: images.destinations.dharamshala, category: 'Homestay' },
  { slug: 'villas', label: 'Villas', description: 'Spacious private villas for families and groups.', image: images.destinations.kasol, category: 'Villa' },
  { slug: 'cottages', label: 'Cottages', description: 'Private wood-panelled cottages tucked into the hillside.', image: images.destinations.kinnaur, category: 'Villa' },
  { slug: 'cabins', label: 'Cabins', description: 'Intimate cabins for a quiet mountain retreat.', image: images.destinations.dharamshala, category: 'Villa' },
  { slug: 'treehouses', label: 'Treehouses', description: 'Sleep among the pines in raised forest hideouts.', image: images.destinations.kasol, category: 'Treehouse' },
  { slug: 'glamping', label: 'Glamping', description: 'Riverside and high-altitude camps under open skies.', image: images.destinations.spitiValley, category: 'Camp' },
  { slug: 'boutique-stays', label: 'Boutique Stays', description: 'Handpicked, design-led properties across the Himalayas.', image: images.destinations.shimla },
  // Not part of the hub's default type-chip row (no dedicated UI slot yet), but a
  // real, working route — the editorial "Unique Himalayan Stays" section on /stays
  // links here, and `Heritage` already exists as a real HotelCategory with no
  // reachable /stays/* route before this.
  { slug: 'heritage', label: 'Heritage Stays', description: 'Colonial-era mansions and forts turned boutique stays.', image: images.destinations.shimla, category: 'Heritage' }
];

export function findStayTypeBySlug(slug: string): StayTypeDefinition | undefined {
  return stayTypes.find((type) => type.slug === slug);
}

/** The homepage discovery section's curated subset — one canonical slug per real
 *  category, "Cottages & Cabins" combined into a single card (both share `Villa`). */
export const homepageStayTypeSlugs = ['hotels', 'resorts', 'homestays', 'cottages', 'treehouses', 'glamping', 'villas', 'boutique-stays'];
