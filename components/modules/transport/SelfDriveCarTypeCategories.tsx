'use client';

import { ArrowRight, Car, Route, Compass, Mountain, Gem, Truck, type LucideIcon } from 'lucide-react';
import { SELF_DRIVE_CAR_TYPE_UI } from '@/config/transportServiceTypes.config';
import type { VehicleOption } from '@/types/transport';

const TYPE_ICONS: Record<string, LucideIcon> = {
  Hatchback: Car,
  Sedan: Route,
  'Compact SUV': Compass,
  SUV: Mountain,
  'Premium SUV': Gem,
  '4x4': Truck
};

export interface SelfDriveCarTypeCategoriesProps {
  /** The real, unfiltered self-drive fleet — used only to derive each type's real
   *  example-model names (never a fabricated/hardcoded list). */
  allSelfDriveVehicles: VehicleOption[];
  /** A card is a discovery entry point, not a Hero-Search submission — it opens the
   *  matching category's popup in place (see SelfDriveRentals.tsx) rather than
   *  navigating anywhere or touching the Hero/URL. */
  onSelectCategory: (category: string) => void;
}

/**
 * "Drive the Himalayas Your Way" main-page teaser — self-drive car TYPES first,
 * actual vehicles second. Mirrors MotorcycleTypeCategories/VehicleCategories' card
 * chrome exactly (no new visual system).
 */
export default function SelfDriveCarTypeCategories({ allSelfDriveVehicles, onSelectCategory }: SelfDriveCarTypeCategoriesProps) {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {SELF_DRIVE_CAR_TYPE_UI.map(({ category, label, tagline, description, ctaLabel }) => {
        const Icon = TYPE_ICONS[category] ?? Car;
        const exampleModels = allSelfDriveVehicles.filter((v) => v.category === category).map((v) => v.name);
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className="cursor-hover block w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
              <Icon size={24} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{label}</h3>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-apex-600">{tagline}</p>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            {exampleModels.length > 0 ? (
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-apex-600">e.g. {exampleModels.join(', ')}</p>
            ) : null}
            <span className="cursor-hover mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out">
              {ctaLabel} <ArrowRight size={16} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
