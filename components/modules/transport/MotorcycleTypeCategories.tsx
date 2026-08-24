'use client';

import { ArrowRight, Bike, Compass, Feather, History, Mountain, Route, Zap, type LucideIcon } from 'lucide-react';
import { MOTORCYCLE_TYPE_UI } from '@/config/transportServiceTypes.config';
import type { VehicleOption } from '@/types/transport';

const TYPE_ICONS: Record<string, LucideIcon> = {
  'adventure-adv': Mountain,
  touring: Route,
  'classic-retro': History,
  cruiser: Bike,
  scrambler: Compass,
  'lightweight-adventure': Feather,
  roadster: Zap
};

export interface MotorcycleTypeCategoriesProps {
  /** The real, unfiltered Bike/Motorcycle fleet — used only to derive each type's
   *  real example-model names (never a fabricated/hardcoded list). */
  allBikeVehicles: VehicleOption[];
  /** Opens the discovery popup for that type — no navigation, no URL/Hero change. */
  onSelectType: (value: string) => void;
}

/**
 * "Two Wheels. Endless Roads." main-page teaser — motorcycle TYPES first, actual
 * models second. Mirrors VehicleCategories/ChooseRideStyle's card chrome exactly (no
 * new visual system). Clicking a card opens MotorcycleCategoryPopup in place — it does
 * NOT navigate or touch the Hero/URL, per the discovery-popup brief.
 */
export default function MotorcycleTypeCategories({ allBikeVehicles, onSelectType }: MotorcycleTypeCategoriesProps) {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {MOTORCYCLE_TYPE_UI.map(({ value, label, description, categories }) => {
        const Icon = TYPE_ICONS[value] ?? Bike;
        const exampleModels = allBikeVehicles.filter((v) => v.category && categories.includes(v.category)).map((v) => v.name);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelectType(value)}
            className="cursor-hover block w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
              <Icon size={24} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{label}</h3>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            {exampleModels.length > 0 ? (
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-apex-600">e.g. {exampleModels.join(', ')}</p>
            ) : null}
            <span className="cursor-hover mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out">
              Explore Bikes <ArrowRight size={16} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
