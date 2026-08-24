import type { Metadata } from 'next';
import TransportPartnerForm from '@/components/modules/transport/TransportPartnerForm';

export const metadata: Metadata = {
  title: 'Become a Transport Partner | The Apex Voyager',
  description: 'Register your cab, traveller or rental fleet with The Apex Voyager.'
};

export default function TransportPartnerPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Transport partners</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Become a Transport Partner</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Own a cab, tempo traveller, 4x4, self-drive or bike rental fleet? Tell us about your business and our
        partnerships team will get in touch.
      </p>
      <TransportPartnerForm />
    </main>
  );
}
