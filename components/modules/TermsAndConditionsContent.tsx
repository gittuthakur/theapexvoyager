import { Mail, Phone, Sparkles } from 'lucide-react';
import { siteConfig } from '@/config/site.config';

const pendingClass =
  'inline-block rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700';

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: '1. General',
    body: (
      <p>
        These Terms &amp; Conditions govern your use of The Apex Voyager website and any journeys, stays,
        transport, or experiences booked through us. By enquiring about or booking a trip with us, you agree to
        these terms.
      </p>
    )
  },
  {
    heading: '2. Travel Enquiries',
    body: (
      <p>
        Submitting an enquiry through our website, WhatsApp, phone, or email does not constitute a confirmed
        booking. All enquiries are reviewed by our travel team, who will confirm availability, pricing, and next
        steps with you directly.
      </p>
    )
  },
  {
    heading: '3. Bookings',
    body: (
      <p>
        A booking is considered confirmed only once it has been explicitly confirmed by The Apex Voyager, typically
        following receipt of any required advance payment.
      </p>
    )
  },
  {
    heading: '4. Payments',
    body: (
      <p>
        Payment terms for your trip, including advance amounts and balance due dates, will be communicated to you
        directly by our travel team. <span className={pendingClass}>[BUSINESS POLICY TO BE CONFIRMED]</span>
      </p>
    )
  },
  {
    heading: '5. Accommodation',
    body: (
      <p>
        Stays, hotels, and homestays featured on this website are offered by independent partner properties. Room
        categories, amenities, and availability are subject to confirmation by the property at the time of
        booking.
      </p>
    )
  },
  {
    heading: '6. Transportation',
    body: (
      <p>
        Transport services are provided by independent vehicle operators. Vehicle type, route, and timing are
        subject to confirmation and may vary based on availability and road conditions.
      </p>
    )
  },
  {
    heading: '7. Itinerary Changes',
    body: (
      <p>
        Itineraries are planned in good faith based on information available at the time of booking. The Apex
        Voyager reserves the right to make reasonable changes to an itinerary where necessary for traveller safety
        or due to circumstances beyond our control.
      </p>
    )
  },
  {
    heading: '8. Weather and Road Conditions',
    body: (
      <p>
        Himalayan routes can be affected by weather, landslides, or road closures beyond our control. Where this
        affects your trip, our team will work with you to adjust the itinerary or offer reasonable alternatives
        where possible.
      </p>
    )
  },
  {
    heading: '9. Optional Activities',
    body: (
      <p>
        Certain optional activities offered during a trip may be operated by independent third parties and may
        carry inherent risk. Participation in any optional activity is at your own discretion.
      </p>
    )
  },
  {
    heading: '10. Customer Responsibilities',
    body: (
      <p>
        Travellers are responsible for providing accurate personal and travel information, carrying valid
        identification and any required permits, and complying with local laws and property or vehicle rules
        during their trip.
      </p>
    )
  },
  {
    heading: '11. Cancellations',
    body: (
      <p>
        Cancellations, whether requested by the traveller or arising from circumstances requiring rescheduling, are
        handled in accordance with our Cancellation Policy.{' '}
        <span className={pendingClass}>[BUSINESS POLICY TO BE CONFIRMED]</span>
      </p>
    )
  },
  {
    heading: '12. Force Majeure',
    body: (
      <p>
        The Apex Voyager is not liable for delays, changes, or cancellations arising from events beyond our
        reasonable control, including natural disasters, extreme weather, road closures, or government
        restrictions.
      </p>
    )
  },
  {
    heading: '13. Information Accuracy',
    body: (
      <p>
        We aim to keep information on this website accurate and up to date. However, pricing, availability, and
        itinerary details are subject to change and will be reconfirmed with you before your booking is finalised.
      </p>
    )
  },
  {
    heading: '14. Liability',
    body: <p className={pendingClass}>[BUSINESS POLICY TO BE CONFIRMED]</p>
  }
];

export default function TermsAndConditionsContent() {
  return (
    <main className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <section className="space-y-5 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider text-apex-600">
            <Sparkles size={16} /> Please Read Carefully
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Terms &amp;{' '}
            <span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">
              Conditions
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            These terms apply to every journey, stay, transport booking, and experience arranged through The Apex
            Voyager.
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
              <h2 className="text-xl font-bold sm:text-2xl">15. Contact</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                If you have any questions about these Terms &amp; Conditions, please get in touch with our travel
                team.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm">
                <a
                  href={`tel:${siteConfig.contactPhone}`}
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
