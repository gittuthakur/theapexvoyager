import Link from 'next/link';
import { ArrowRight, Compass, MapPin, Star } from 'lucide-react';
import HeroSection, { type HeroSectionData } from '@/components/modules/HeroSection';
import { images } from '@/config/images.config';
import { getTours } from '@/lib/tours';
import type { TourPackage } from '@/types';

const toursHeroData: HeroSectionData = {
  badge: {
    icon: <Compass size={16} className="text-apex-300" />,
    text: 'Not Tourist Trails. Real Ones.'
  },
  titleTop: 'Expeditions Into the',
  titleBottomPrefix: 'Untouched ',
  titleHighlight: 'Himachal',
  subtitle: 'Handpicked treks, road journeys, and village stays through valleys most maps still get wrong.',
  media: {
    src: images.toursHero,
    alt: 'Himalayan expedition tour hero banner'
  }
};

function TourCard({ tour }: { tour: TourPackage }) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-glow transition hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-900">
        <img src={tour.image} alt={tour.title} className="h-72 w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white">{tour.category}</p>
          <span className="inline-flex items-center gap-1 text-sm text-slate-400">
            <Star size={14} className="text-amber-400" />
            {tour.rating?.toFixed(1)}
          </span>
        </div>
        <h3 className="text-2xl font-semibold text-white">{tour.title}</h3>
        <p className="text-sm leading-7 text-slate-300">{tour.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} className="text-apex-300" />
            {tour.location}
          </span>
          <span>{tour.duration}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-4">
          <p className="text-xl font-bold text-white">{tour.price}</p>
          <Link href={`/booking?tour=${tour.slug}`} className="inline-flex items-center gap-2 rounded-full bg-apex-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-apex-400">
            Book Now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

interface ToursPageProps {
  searchParams: Promise<{ destination?: string; dates?: string; guests?: string }>;
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const { destination, dates, guests } = await searchParams;
  const tours = await getTours({ destination });

  return (
    <>
      <HeroSection data={toursHeroData} />

      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <section className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow">
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Tours catalog</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Find the perfect expedition</h2>
            <p className="mt-4 max-w-3xl text-slate-300">
              {destination || dates || guests
                ? `Showing results for ${destination ? `destination: ${destination}` : ''}${destination && dates ? ', ' : ''}${dates ? `dates: ${dates}` : ''}${(destination || dates) && guests ? ', ' : ''}${guests ? `guests: ${guests}` : ''}`
                : 'Browse our full collection of curated Himalayan expedition tours and book your next adventure.'}
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {tours.length > 0 ? (
              tours.map((tour) => <TourCard key={tour.slug} tour={tour} />)
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-center text-slate-300 shadow-glow">
                <p className="text-lg font-semibold text-white">No tours match your search filters.</p>
                <p className="mt-3">Try a broader destination or leave the fields blank to explore all options.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
