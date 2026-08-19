import { redirect } from 'next/navigation';
import type { HotelCategory } from '@/types';

// /homestays is kept as a permanent redirect to the Apex Stays vertical (/stays) —
// the old Hotel-catalog browsing page has been deprecated in favor of /stays and its
// /stays/[type] and /stays/search routes, which read the same underlying Hotel data.
const CATEGORY_TO_STAY_SLUG: Partial<Record<HotelCategory, string>> = {
  Hotel: 'hotels',
  Resort: 'resorts',
  Homestay: 'homestays',
  Villa: 'villas',
  Treehouse: 'treehouses',
  Camp: 'glamping',
  Heritage: 'heritage'
};

interface HomestaysRedirectProps {
  searchParams: Promise<{
    category?: string;
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>;
}

export default async function HomestaysRedirect({ searchParams }: HomestaysRedirectProps) {
  const { category, destination, checkIn, checkOut, guests } = await searchParams;

  const staySlug = category ? CATEGORY_TO_STAY_SLUG[category as HotelCategory] : undefined;
  if (staySlug) {
    redirect(`/stays/${staySlug}`);
  }

  const query = new URLSearchParams();
  if (destination) query.set('destination', destination);
  if (checkIn) query.set('checkIn', checkIn);
  if (checkOut) query.set('checkOut', checkOut);
  if (guests) query.set('guests', guests);
  const qs = query.toString();
  redirect(qs ? `/stays/search?${qs}` : '/stays');
}
