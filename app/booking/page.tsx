'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { tours } from '@/config/tours.config';
import type { TourPackage } from '@/types';

function findTour(slug: string | null): TourPackage | undefined {
  if (!slug) return undefined;
  return tours.find((tour) => tour.slug === slug);
}

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourSlug = searchParams.get('tour');
  const selectedTour = useMemo(() => findTour(tourSlug), [tourSlug]);

  if (!selectedTour) {
    return (
      <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-center shadow-glow">
          <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Booking unavailable</p>
          <h1 className="mt-6 text-4xl font-semibold text-white">No tour selected</h1>
          <p className="mt-4 text-slate-300">Please choose a tour from our catalog before booking.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/tours" className="rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-apex-400">
              Browse Tours
            </Link>
            <button
              type="button"
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-300"
              onClick={() => router.back()}
            >
              Go Back
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Your booking</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Reserve {selectedTour.title}</h1>
            <p className="mt-4 max-w-2xl text-slate-300">Complete your reservation for this curated Himalayan adventure. Review the itinerary, date options, and guest details before checkout.</p>
          </div>
          <Link href="/tours" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-300">
            <ArrowLeft size={16} /> Back to Tours
          </Link>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-8">
            <div className="rounded-[1.5rem] overflow-hidden bg-slate-800">
              <img src={selectedTour.image} alt={selectedTour.title} className="h-[360px] w-full object-cover" />
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">{selectedTour.category}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">{selectedTour.duration}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">{selectedTour.location}</span>
              </div>
              <p className="text-lg leading-8 text-slate-300">{selectedTour.description}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-slate-950/70 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Price</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{selectedTour.price}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/70 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Guests</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{(selectedTour as any).maxGuests ?? 'Up to 6'}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/70 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Difficulty</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{selectedTour.difficulty ?? 'Moderate'}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <Calendar size={22} className="text-apex-300" />
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Departure</p>
                  <p className="mt-1 text-base text-white">Flexible dates available</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin size={22} className="text-apex-300" />
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Meeting point</p>
                  <p className="mt-1 text-base text-white">{selectedTour.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Users size={22} className="text-apex-300" />
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Booking type</p>
                  <p className="mt-1 text-base text-white">Private group or solo traveler</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-slate-900/80 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Ready to confirm?</p>
              <p className="mt-4 text-3xl font-semibold text-white">{selectedTour.price}</p>
              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-apex-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-apex-400"
                onClick={() => router.push(`/contact?tour=${selectedTour.slug}`)}
              >
                Request booking details
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
