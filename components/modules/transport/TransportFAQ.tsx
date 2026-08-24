const FAQS = [
  {
    question: 'How is pricing calculated?',
    answer:
      'Estimated prices depend on route, vehicle category, distance and season. Final pricing is confirmed by our travel experts before you book.'
  },
  {
    question: 'Is availability instant?',
    answer: 'Availability is confirmed on request — send us your trip details and we\'ll confirm within a short time on WhatsApp.'
  },
  {
    question: 'Can I change my vehicle later?',
    answer: 'Yes — you can request a different vehicle any time before your trip by reaching out to our travel experts.'
  },
  {
    question: 'Do you cover remote Himalayan routes?',
    answer: 'Yes, subject to route conditions and seasonal availability — routes like Spiti, Kinnaur and Lahaul are seasonal.'
  },
  {
    question: 'What is included in Cab With Driver?',
    answer: 'Driver allowance and fuel are typically included within the stated service area — see each vehicle\'s inclusions/exclusions for specifics.'
  },
  {
    question: 'How does Self Drive work?',
    answer: 'You pick up the vehicle, drive it yourself for the rented period and return it — fuel, deposit and included kilometres vary by vehicle and are shown on each listing.'
  },
  {
    question: 'What documents may be required for rentals?',
    answer: 'Where specified for that vehicle, a valid driving licence and a minimum age may apply — check the specific vehicle\'s details, as requirements vary.'
  },
  {
    question: 'Is fuel included?',
    answer: 'It varies by vehicle — Cab With Driver typically includes fuel, while Self-Drive and rentals usually exclude it. Always check that vehicle\'s inclusions/exclusions.'
  },
  {
    question: 'Can I rent a bike?',
    answer: 'Yes — see the "Two Wheels. Endless Roads." section for available touring and adventure motorcycle categories.'
  },
  {
    question: 'Can I request a 4x4?',
    answer: 'Yes — 4x4 vehicles are available for remote and demanding Himalayan routes, with or without a driver depending on availability.'
  },
  {
    question: 'How does local transport work?',
    answer: 'It\'s destination-specific. Where we have verified local partners, options are shown directly; otherwise, tell us your destination and dates and we\'ll arrange it for you.'
  },
  {
    question: 'How are cancellations handled?',
    answer: 'Cancellation terms are shared at the time your quote is confirmed, before you commit to a booking.'
  }
];

export default function TransportFAQ() {
  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FAQS.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-slate-300 bg-slate-100 p-5">
              <p className="font-semibold text-slate-900">{faq.question}</p>
              <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
