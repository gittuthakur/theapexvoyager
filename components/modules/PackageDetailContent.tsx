'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Gem, MapPin, X as XIcon } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { SafeImage } from '@/components/ui/SafeImage';
import PackageBookingModal from '@/components/modules/PackageBookingModal';
import WhatsAppButton from '@/components/modules/WhatsAppButton';
import { formatINR } from '@/lib/pricing';
import type { TravelPackage } from '@/types/package';

export interface PackageDetailContentProps {
  pkg: TravelPackage;
  autoOpenBooking?: boolean;
}

export default function PackageDetailContent({ pkg, autoOpenBooking = false }: PackageDetailContentProps) {
  const [bookingOpen, setBookingOpen] = useState(autoOpenBooking);

  return (
    <main className="min-h-screen px-6 py-14 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-6xl space-y-6">
        <BackButton fallbackHref="/journeys" label="Back to Journeys" />

        {/* Hero */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-apex-500 px-3 py-1 text-xs font-semibold uppercase text-white">{pkg.category}</span>
              <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">{pkg.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={16} className="text-apex-300" /> {pkg.destination}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock size={16} className="text-apex-300" /> {pkg.duration}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Starting from</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatINR(pkg.price)} <span className="text-sm font-normal text-slate-500">/ person</span>
              </p>
            </div>
          </div>

          <div className="relative mt-8 h-[360px] w-full overflow-hidden rounded-[1.5rem] bg-slate-900">
            <SafeImage src={pkg.image} alt={pkg.name} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <p className="max-w-2xl text-lg leading-8 text-slate-600">{pkg.shortDescription}</p>
            <div className="flex flex-wrap items-center gap-3">
              <WhatsAppButton
                tripTitle={pkg.name}
                destination={pkg.destination}
                className="static shadow-none hover:scale-100"
              />
              <button
                type="button"
                onClick={() => setBookingOpen(true)}
                className="cursor-hover inline-flex items-center gap-2 rounded-full bg-apex-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-apex-500/20 transition-all duration-300 ease-in-out hover:bg-apex-400"
              >
                Customize This Journey <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Highlights</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {pkg.highlights.map((highlight) => (
              <div key={highlight} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Check size={18} className="mt-0.5 shrink-0 text-apex-300" />
                <span className="text-sm text-slate-700">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Apex Picks */}
        {pkg.apexPicks ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Apex Picks</h2>
            <p className="mt-2 text-sm text-slate-500">Our team's curated picks for this journey.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {(
                [
                  ['view', 'Apex View'],
                  ['stay', 'Apex Stay'],
                  ['experience', 'Apex Experience'],
                  ['taste', 'Apex Taste'],
                  ['moment', 'Apex Moment']
                ] as const
              ).map(([key, label]) => {
                const pick = pkg.apexPicks?.[key];
                if (!pick) return null;
                return (
                  <article key={key} className="rounded-2xl border border-apex-100 bg-apex-50/40 p-5">
                    <Gem className="text-apex-500" size={18} />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-apex-600">{label}</p>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">{pick.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{pick.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Itinerary */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Itinerary</h2>
          <div className="mt-5 space-y-4">
            {pkg.itinerary.map((day) => (
              <div key={day.day} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-apex-50 text-sm font-bold text-apex-600">
                  {day.day}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{day.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{day.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Moments */}
        {pkg.signatureMoments?.length ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Signature Moments</h2>
            <div className="mt-6 space-y-6 border-l-2 border-apex-100 pl-6">
              {pkg.signatureMoments.map((moment) => (
                <div key={moment.title} className="relative">
                  <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full bg-apex-500" />
                  {moment.time ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-apex-600">{moment.time}</p>
                  ) : null}
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{moment.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{moment.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Included / Not Included */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Included</h2>
            <ul className="mt-4 space-y-3">
              {pkg.inclusions.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Not Included</h2>
            <ul className="mt-4 space-y-3">
              {pkg.exclusions.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <XIcon size={16} className="mt-0.5 shrink-0 text-rose-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stay Options */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Stay Options</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pkg.stayOptions.map((option) => (
              <div key={option.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                <p className="font-semibold text-slate-900">{option.label}</p>
                <p className="mt-2 text-sm text-apex-600">
                  {option.extraPrice > 0 ? `+${formatINR(option.extraPrice)}` : 'Included'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Add-ons</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pkg.addOns.map((addOn) => (
              <div key={addOn.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                <p className="font-semibold text-slate-900">{addOn.label}</p>
                <p className="mt-2 text-sm text-apex-600">+{formatINR(addOn.price)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transport Options */}
        {pkg.transportOptions?.length ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Transport Options</h2>
              <Link
                href={`/transport?destination=${encodeURIComponent(pkg.destination)}&from=journey&journeySlug=${encodeURIComponent(pkg.slug)}`}
                className="cursor-hover text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
              >
                Change Vehicle
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pkg.transportOptions.map((option) => (
                <div key={option.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="font-semibold text-slate-900">{option.label}</p>
                  <p className="mt-2 text-sm text-apex-600">
                    {option.extraPrice > 0 ? `+${formatINR(option.extraPrice)}` : 'Included'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Pace */}
        {pkg.pace?.length ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Choose Your Pace</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pkg.pace.map((option) => (
                <div key={option.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">{option.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                  <p className="mt-2 text-sm text-apex-600">×{option.priceMultiplier}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* FAQs */}
        {pkg.faqs?.length ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-5 space-y-4">
              {pkg.faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">{faq.question}</p>
                  <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Booking CTA */}
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-apex-50 to-white p-8 text-center shadow-glow sm:p-12">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Ready to book {pkg.name}?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Configure your trip, see the live price, and send a booking request in minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <WhatsAppButton tripTitle={pkg.name} destination={pkg.destination} className="static shadow-none hover:scale-100" />
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="cursor-hover inline-flex items-center gap-2 rounded-full bg-apex-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-apex-500/30 transition-all duration-300 ease-in-out hover:bg-apex-400"
            >
              Customize This Journey <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <PackageBookingModal pkg={pkg} open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </main>
  );
}
