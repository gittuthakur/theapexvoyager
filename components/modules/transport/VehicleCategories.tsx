import type { VehicleOption } from '@/types/transport';

type VehicleCategory = NonNullable<VehicleOption['category']>;

const CATEGORY_SUITABILITY: Record<VehicleCategory, string> = {
  Comfort: 'Couples, solo travellers and small groups',
  SUV: 'Families, mountain routes and long journeys',
  'Tempo Traveller': 'Friends, families and group tours',
  Premium: 'Luxury journeys and special occasions',
  Coach: 'Corporate groups, large groups and events'
};

export interface VehicleCategoriesProps {
  vehicles: VehicleOption[];
}

export default function VehicleCategories({ vehicles }: VehicleCategoriesProps) {
  const categories = Array.from(
    new Set(vehicles.map((v) => v.category).filter((c): c is VehicleCategory => c !== undefined))
  );

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">Vehicle categories</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Pick the right fit for your journey</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const representative = vehicles.find((v) => v.category === category) ?? vehicles[0];
          const seatsInCategory = vehicles.filter((v) => v.category === category).map((v) => v.seats);
          const seatsRange =
            seatsInCategory.length > 1
              ? `${Math.min(...seatsInCategory)}–${Math.max(...seatsInCategory)} seats`
              : `${seatsInCategory[0]} seats`;

          return (
            <div key={category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img src={representative.image} alt={category} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-900">{category}</h3>
                <p className="mt-1 text-md font-semibold uppercase tracking-wide text-apex-600">{seatsRange}</p>
                <p className="mt-2 text-md text-slate-600">
                  {CATEGORY_SUITABILITY[category] ?? 'A suitable option for your Himalayan journey.'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
