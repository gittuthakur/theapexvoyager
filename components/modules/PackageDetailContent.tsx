'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car, Check, Gem, X as XIcon } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import DetailPageContainer from '@/components/modules/detail/DetailPageContainer';
import PackageBookingModal from '@/components/modules/PackageBookingModal';
import JourneyHero from '@/components/modules/journey-detail/JourneyHero';
import JourneyBookingSidebar from '@/components/modules/journey-detail/JourneyBookingSidebar';
import JourneySection from '@/components/modules/journey-detail/JourneySection';
import RelatedJourneys from '@/components/modules/journey-detail/RelatedJourneys';
import { formatINR } from '@/lib/pricing';
import type { TravelPackage } from '@/types/package';

export interface PackageDetailContentProps {
  pkg: TravelPackage;
  autoOpenBooking?: boolean;
  /** Same-catalog journeys to surface at the bottom of the page — real data only, see app/journeys/[slug]/page.tsx. */
  relatedJourneys?: TravelPackage[];
}

export default function PackageDetailContent({ pkg, autoOpenBooking = false, relatedJourneys = [] }: PackageDetailContentProps) {
  // Never true on the initial render (server or first client paint) — the modal's
  // FloatingOverlay bails out to `null` during SSR (no `document`), so starting this
  // `true` from ?book=1 makes the server and client render different trees on the
  // very first pass. Opening it from an effect instead means both renders agree
  // (closed), and the modal opens a beat later once mounted client-side.
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (autoOpenBooking) setBookingOpen(true);
  }, [autoOpenBooking]);

  return (
    <DetailPageContainer mainClassName="pb-28 lg:pb-14">
      <BackButton fallbackHref="/journeys" label="Back to Journeys" />

      <JourneyHero pkg={pkg} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
          <div className="space-y-6">
            {/* Highlights */}
            <JourneySection title="Highlights">
              <div className="grid gap-3 sm:grid-cols-2">
                {pkg.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Check size={18} className="mt-0.5 shrink-0 text-apex-300" />
                    <span className="text-sm text-slate-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </JourneySection>

            {/* Apex Picks */}
            {pkg.apexPicks ? (
              <JourneySection title="Apex Picks" subtitle="Our team's curated picks for this journey.">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              </JourneySection>
            ) : null}

            {/* Itinerary */}
            <JourneySection title="Itinerary">
              <div className="space-y-4">
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
            </JourneySection>

            {/* Signature Moments */}
            {pkg.signatureMoments?.length ? (
              <JourneySection title="Signature Moments">
                <div className="space-y-6 border-l-2 border-apex-100 pl-6">
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
              </JourneySection>
            ) : null}

            {/* Included / Not Included */}
            <div className="grid gap-6 sm:grid-cols-2">
              <JourneySection title="Included" className="sm:p-8">
                <ul className="space-y-3">
                  {pkg.inclusions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </JourneySection>
              <JourneySection title="Not Included" className="sm:p-8">
                <ul className="space-y-3">
                  {pkg.exclusions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <XIcon size={16} className="mt-0.5 shrink-0 text-rose-500" /> {item}
                    </li>
                  ))}
                </ul>
              </JourneySection>
            </div>

            {/* Stay Options */}
            <JourneySection title="Stay Options">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pkg.stayOptions.map((option) => (
                  <div key={option.id} className="rounded-2xl border border-slate-300 bg-slate-100 p-5">
                    <p className="font-medium text-slate-500">{option.label}</p>
                    <p
                      className={`mt-1 text-apex-500 ${
                        option.extraPrice > 0
                          ? 'text-2xl font-bold'
                          : 'text-base font-normal'
                      }`}
                    >
                      {option.extraPrice > 0
                        ? `+${formatINR(option.extraPrice)}`
                        : 'Included'}
                    </p>
                  </div>
                ))}
              </div>
            </JourneySection>

            {/* Add-ons */}
            <JourneySection title="Add-ons">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pkg.addOns.map((addOn) => (
                  <div key={addOn.id} className="rounded-2xl border border-slate-300 bg-slate-100 p-5">
                    <p className="font-semibold text-slate-900">{addOn.label}</p>
                    <p className="mt-2 text-2xl font-bold text-apex-500">+{formatINR(addOn.price)}</p>
                  </div>
                ))}
              </div>
            </JourneySection>

            {/* Transport Options */}
            {pkg.transportOptions?.length ? (
              <JourneySection
                title="Transport Options"
                action={
                  <Link
                    href={`/transport?destination=${encodeURIComponent(pkg.destination)}&from=journey&journeySlug=${encodeURIComponent(pkg.slug)}`}
                    className="cursor-hover flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
                  >
                    <Car size={20} />
                    Change Vehicle
                  </Link>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pkg.transportOptions.map((option) => (
                    <div key={option.id} className="rounded-2xl border border-slate-300 bg-slate-100 p-5">
                      <p className="font-semibold text-slate-900">{option.label}</p>
                      <p
                        className={`mt-2 text-apex-500 ${
                          option.extraPrice > 0
                            ? 'text-2xl font-extrabold'
                            : 'text-base font-normal'
                        }`}
                      >
                        {option.extraPrice > 0
                          ? `+${formatINR(option.extraPrice)}`
                          : 'Included'}
                      </p>
                    </div>
                  ))}
                </div>
              </JourneySection>
            ) : null}

            {/* Pace */}
            {pkg.pace?.length ? (
              <JourneySection title="Choose Your Pace">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pkg.pace.map((option) => (
                    <div key={option.id} className="rounded-2xl border border-slate-300 bg-slate-100 p-5">
                      <p className="font-semibold text-slate-900">{option.label}</p>
                      <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                      <p className="mt-2 text-xl font-semibold text-apex-600">×{option.priceMultiplier}</p>
                    </div>
                  ))}
                </div>
              </JourneySection>
            ) : null}

            {/* FAQs */}
            {pkg.faqs?.length ? (
              <JourneySection title="Frequently Asked Questions">
                <div className="space-y-4">
                  {pkg.faqs.map((faq) => (
                    <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="font-semibold text-slate-900">{faq.question}</p>
                      <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </JourneySection>
            ) : null}

            <RelatedJourneys journeys={relatedJourneys} />
          </div>

          <JourneyBookingSidebar pkg={pkg} onCustomize={() => setBookingOpen(true)} />
        </div>

      <PackageBookingModal pkg={pkg} open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </DetailPageContainer>
  );
}
