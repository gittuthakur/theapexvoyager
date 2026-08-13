import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import HotelBookingModal from '@/components/modules/HotelBookingModal';
import { getHotelBySlug } from '@/lib/hotels';

export const dynamic = 'force-dynamic';

interface HotelDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function HotelDetailPage({ params }: HotelDetailPageProps) {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);

  if (!hotel) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-5xl space-y-6">
        <Link href="/homestays" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
          <ArrowLeft size={16} /> Back to Hotels &amp; Homestays
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white">{hotel.category}</span>
              <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">{hotel.title}</h1>
              <p className="mt-3 inline-flex items-center gap-2 text-slate-300">
                <MapPin size={16} className="text-apex-300" /> {hotel.location}
              </p>
            </div>
            {hotel.rating ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {hotel.rating.toFixed(1)}
                {hotel.reviewCount ? <span className="text-slate-500"> ({hotel.reviewCount} reviews)</span> : null}
              </span>
            ) : null}
          </div>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] bg-slate-900">
            <img src={hotel.images[0]} alt={hotel.title} className="h-[360px] w-full object-cover" />
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <p className="text-lg leading-8 text-slate-300">{hotel.description}</p>

              {hotel.amenities?.length ? (
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Amenities</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hotel.amenities.map((amenity) => (
                      <span key={amenity} className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Per night</p>
              <p className="text-3xl font-semibold text-white">₹{hotel.pricePerNight.toLocaleString('en-IN')}</p>
              <HotelBookingModal hotelName={hotel.title} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
