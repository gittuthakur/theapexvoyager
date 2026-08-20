import { Bus, Car, MapPinned, Mountain, Route, Users2, type LucideIcon } from 'lucide-react';

interface ServiceItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const SERVICES: ServiceItem[] = [
  {
    icon: Route,
    title: 'Airport & Railway Transfers',
    description: 'Comfortable pickup and drop services timed to your flight or train.'
  },
  {
    icon: MapPinned,
    title: 'Local Sightseeing',
    description: 'Flexible transport for a day of destination exploration.'
  },
  {
    icon: Car,
    title: 'Intercity Transfers',
    description: 'Reliable travel between Himalayan destinations.'
  },
  {
    icon: Mountain,
    title: 'Multi-Day Private Vehicle',
    description: 'A dedicated vehicle and driver for the entire journey.'
  },
  {
    icon: Bus,
    title: 'Remote Himalayan Transfers',
    description: 'Transport for Spiti, Kinnaur, Lahaul and other remote routes, subject to route and seasonal availability.'
  },
  {
    icon: Users2,
    title: 'Group Travel',
    description: 'Tempo Travellers, minibuses and suitable vehicles for larger groups.'
  }
];

export default function TransportServices() {
  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">What we arrange</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">We don&apos;t just arrange a vehicle</h2>
      <p className="mt-3 max-w-2xl text-slate-600">We help you move through the journey.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-glow">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-apex-50 text-apex-600">
              <Icon size={20} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
