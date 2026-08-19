import { redirect } from 'next/navigation';

// /homestays/[slug] is kept as a permanent redirect to /stays/[slug] — the Hotel
// model is shared between the old Homestays vertical and the new Apex Stays
// catch-all, so the slug itself carries over unchanged.
interface HotelDetailRedirectProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}

export default async function HotelDetailRedirect({ params, searchParams }: HotelDetailRedirectProps) {
  const { slug } = await params;
  const { checkIn, checkOut, guests } = await searchParams;

  const query = new URLSearchParams();
  if (checkIn) query.set('checkIn', checkIn);
  if (checkOut) query.set('checkOut', checkOut);
  if (guests) query.set('guests', guests);
  const qs = query.toString();
  redirect(qs ? `/stays/${slug}?${qs}` : `/stays/${slug}`);
}
