const FAQS = [
  {
    question: 'How is pricing calculated?',
    answer:
      'Estimated prices depend on route, vehicle category, distance and season. Final pricing is confirmed by our travel experts before you book.'
  },
  {
    question: 'Is availability guaranteed instantly?',
    answer: 'Availability is confirmed on request — send us your trip details and we\'ll confirm within a short time on WhatsApp.'
  },
  {
    question: 'Can I change my vehicle later?',
    answer: 'Yes — you can request a different vehicle any time before your trip by reaching out to our travel experts.'
  },
  {
    question: 'Do you cover remote Himalayan routes?',
    answer: 'Yes, subject to route conditions and seasonal availability — routes like Spiti, Kinnaur and Lahaul are seasonal.'
  }
];

export default function TransportFAQ() {
  return (
    <section className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-glow sm:p-10">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
        <div className="mt-5 space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">{faq.question}</p>
              <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
