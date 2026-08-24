import { Handshake, MapPinned, MessageCircle, Network, Route, ShieldCheck, type LucideIcon } from 'lucide-react';

interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: ShieldCheck,
    title: 'Curated Transport Options',
    description: 'Every vehicle is checked by our travel team, with partner availability confirmed directly on request.'
  },
  {
    icon: Route,
    title: 'Himalayan Route Knowledge',
    description: 'Local, on-ground understanding of Himachal, Kashmir and Uttarakhand routes.'
  },
  {
    icon: MessageCircle,
    title: 'Transparent Quote Process',
    description: 'You see one clear quote — no hidden surprises once your trip is confirmed.'
  },
  {
    icon: Handshake,
    title: 'Human Travel Assistance',
    description: 'A real travel expert is available on WhatsApp for every request.'
  },
  {
    icon: MapPinned,
    title: 'Multiple Transport Options',
    description: 'Cabs, self-drive, group vehicles, 4x4s, bikes and local transport in one place.'
  },
  {
    icon: Network,
    title: 'Local Partner Network',
    description: 'Growing coverage across destinations as more verified partners onboard.'
  }
];

export default function WhyBookTransport() {
  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Why book with us</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Why Book Transport Through The Apex Voyager?</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-xl">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
              <Icon size={24} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
