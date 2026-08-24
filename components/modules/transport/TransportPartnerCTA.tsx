import Link from 'next/link';
import { Handshake } from 'lucide-react';

export default function TransportPartnerCTA() {
  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Transport partners</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Own a Cab, Traveller or Rental Fleet?</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Partner with The Apex Voyager and connect with travellers looking for reliable transport across the Himalayas.
        </p>
        <Link
          href="/transport/partner"
          className="cursor-hover mt-6 inline-flex items-center gap-2 rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:bg-apex-400"
        >
          <Handshake size={18} />
          Become a Transport Partner
        </Link>
      </div>
    </section>
  );
}
