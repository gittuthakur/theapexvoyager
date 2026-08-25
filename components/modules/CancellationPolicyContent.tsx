import { Mail, Phone, Sparkles } from 'lucide-react';
import { siteConfig } from '@/config/site.config';

const pendingClass =
  'inline-block rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700';

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: '1. Booking Cancellation',
    body: (
      <p>
        If you wish to cancel a confirmed booking, please contact our travel team as soon as possible by phone,
        email, or WhatsApp. <span className={pendingClass}>[FINAL CANCELLATION TERMS TO BE CONFIRMED]</span>
      </p>
    )
  },
  {
    heading: '2. Customer-Requested Date Changes',
    body: (
      <p>
        Requests to change your travel dates are handled on a case-by-case basis, subject to availability with our
        partner stays and transport providers.{' '}
        <span className={pendingClass}>[FINAL CANCELLATION TERMS TO BE CONFIRMED]</span>
      </p>
    )
  },
  {
    heading: '3. Hotel Cancellations',
    body: (
      <p>
        Cancellation terms for stays, hotels, and homestays may vary by property. Our travel team will confirm the
        specific terms applicable to your stay at the time of booking.{' '}
        <span className={pendingClass}>[FINAL CANCELLATION TERMS TO BE CONFIRMED]</span>
      </p>
    )
  },
  {
    heading: '4. Transport Cancellations',
    body: (
      <p>
        Cancellation terms for transport bookings depend on the vehicle operator and route. Our travel team will
        confirm the applicable terms at the time of booking.{' '}
        <span className={pendingClass}>[FINAL CANCELLATION TERMS TO BE CONFIRMED]</span>
      </p>
    )
  },
  {
    heading: '5. Itinerary Changes',
    body: (
      <p>
        Where The Apex Voyager needs to change part of your itinerary due to availability or safety reasons, we
        will work with you to find a suitable alternative wherever possible.
      </p>
    )
  },
  {
    heading: '6. Weather / Road Conditions',
    body: (
      <p>
        Trips affected by weather, landslides, or road closures beyond our control are handled on a case-by-case
        basis, with our team working to reschedule or adjust your itinerary where possible.
      </p>
    )
  },
  {
    heading: '7. Force Majeure',
    body: (
      <p>
        The Apex Voyager is not responsible for cancellations or changes arising from events beyond our reasonable
        control, including natural disasters, extreme weather, or government restrictions.
      </p>
    )
  },
  {
    heading: '8. Refund Process',
    body: (
      <p>
        Where a refund is applicable, it will be processed to the original mode of payment.{' '}
        <span className={pendingClass}>[FINAL CANCELLATION TERMS TO BE CONFIRMED]</span>
      </p>
    )
  },
  {
    heading: '9. Important Notes',
    body: (
      <p>
        This Cancellation Policy is provided for general guidance. Exact cancellation and refund terms for your
        specific booking will be confirmed in writing by our travel team before you make payment.
      </p>
    )
  }
];

export default function CancellationPolicyContent() {
  return (
    <main className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider text-apex-600">
            <Sparkles size={16} /> Before You Book
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Cancellation{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            General guidance on how cancellations, date changes, and refunds are handled for journeys, stays, and
            transport booked through The Apex Voyager.
          </p>
          <p className="text-xs text-slate-400">
            Last updated: <span className={pendingClass}>[DATE TO BE CONFIRMED]</span>
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <div key={section.heading} className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{section.heading}</h2>
                <div className="text-sm leading-relaxed text-slate-600 sm:text-base">{section.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-apex-300">
              <Mail size={24} />
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-bold sm:text-2xl">Need to cancel or reschedule?</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Contact our travel team directly and we&apos;ll confirm the exact terms for your booking.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm">
                <a
                  href={siteConfig.contactPhoneHref}
                  className="cursor-hover inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <Phone size={15} /> {siteConfig.contactPhone}
                </a>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="cursor-hover inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40"
                >
                  <Mail size={15} /> {siteConfig.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
