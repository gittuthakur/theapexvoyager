import Link from 'next/link';
import { Car, Compass, Map, Home as HomeIcon, ArrowRight } from 'lucide-react';

const supportLinks = [
  { label: 'Journeys', description: 'Curated multi-day itineraries.', href: '/journeys', icon: Map },
  { label: 'Transport', description: 'Vehicles and transfers for the route.', href: '/transport', icon: Car },
  { label: 'Stays', description: 'Homestays, hotels and resorts.', href: '/stays', icon: HomeIcon },
  { label: 'Experiences', description: 'Local, on-ground activities.', href: '/experiences', icon: Compass }
];

// Simple internal-link strip (spec §23) — no new data modeling, just routes into
// the existing verticals an expert's recommendations draw from.
export default function ExpertTravelSupport() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16">
      <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">More Than Booking. Real Travel Guidance.</h2>
      <p className="mt-3 max-w-2xl text-slate-600">
        Experts don&apos;t work in isolation — they draw on the same journeys, transport, stays and experiences already on
        The Apex Voyager.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {supportLinks.map(({ label, description, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="cursor-hover group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-apex-300 hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-apex-50 text-apex-600">
              <Icon size={18} />
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{label}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-apex-600">
              Explore <ArrowRight size={14} className="transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
