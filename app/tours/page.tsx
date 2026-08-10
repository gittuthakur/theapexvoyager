'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, MapPin, Star } from 'lucide-react';
import { tours as allTours } from '@/config/tours.config';
import type { TourPackage } from '@/types';

function filterTours(tours: TourPackage[], destination?: string) {
  if (!destination) return tours;
  const normalized = destination.toLowerCase().trim();
  return tours.filter((tour) => (
    tour.location.toLowerCase().includes(normalized) ||
    tour.destinationSlug?.toLowerCase().includes(normalized) ||
    tour.title.toLowerCase().includes(normalized)
  ));
}

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

export default function ToursPage() {
  const searchParams = useSearchParams();
  const destination = searchParams.get('destination') ?? '';
  const dates = searchParams.get('dates') ?? '';
  const guests = searchParams.get('guests') ?? '';
  const filteredTours = filterTours(allTours, destination);

  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow">
          <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Tours catalog</p>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Find the perfect expedition</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            {destination || dates || guests
              ? `Showing results for ${destination ? `destination: ${destination}` : ''}${destination && dates ? ', ' : ''}${dates ? `dates: ${dates}` : ''}${(destination || dates) && guests ? ', ' : ''}${guests ? `guests: ${guests}` : ''}`
              : 'Browse our full collection of curated Himalayan expedition tours and book your next adventure.'}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {filteredTours.length > 0 ? (
            filteredTours.map((tour) => <TourCard key={tour.slug} tour={tour} />)
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-center text-slate-300 shadow-glow">
              <p className="text-lg font-semibold text-white">No tours match your search filters.</p>
              <p className="mt-3">Try a broader destination or leave the fields blank to explore all options.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
