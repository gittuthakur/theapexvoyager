const STEPS = [
  'Tell Us About Your Trip',
  'Choose / Request a Ride',
  'We Verify Availability',
  'Receive Your Quote',
  'Confirm Your Booking'
];

export default function HowTransportBookingWorks() {
  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">The process</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">How Transport Booking Works</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <div key={step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-apex-500 text-sm font-bold text-white">
              {index + 1}
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
