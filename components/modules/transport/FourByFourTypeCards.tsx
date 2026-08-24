'use client';

import { ArrowRight, Compass, MountainSnow, Truck, type LucideIcon } from 'lucide-react';
import { FOUR_BY_FOUR_TYPE_UI, type FourByFourVariant } from '@/config/transportServiceTypes.config';

const TYPE_ICONS: Record<FourByFourVariant, LucideIcon> = {
  'with-driver': MountainSnow,
  'self-drive': Truck,
  expedition: Compass
};

export interface FourByFourTypeCardsProps {
  /** Opens the guided journey popup for that variant — no navigation, no URL/Hero
   *  change, mirrors MotorcycleTypeCategories/SelfDriveCarTypeCategories. */
  onSelectVariant: (variant: FourByFourVariant) => void;
}

/**
 * "4x4 Himalayan Vehicles" main-page teaser — exactly 3 discovery cards (With Driver /
 * Self-Drive / Expeditions), each a guided-journey entry point rather than a plain
 * vehicle grid or filter. Mirrors MotorcycleTypeCategories/SelfDriveCarTypeCategories'
 * card chrome exactly (no new visual system).
 */
export default function FourByFourTypeCards({ onSelectVariant }: FourByFourTypeCardsProps) {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {FOUR_BY_FOUR_TYPE_UI.map(({ value, label, tagline, description, ctaLabel }) => {
        const Icon = TYPE_ICONS[value];
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelectVariant(value)}
            className="cursor-hover block w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
              <Icon size={24} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{label}</h3>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-apex-600">{tagline}</p>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            <span className="cursor-hover mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out">
              {ctaLabel} <ArrowRight size={16} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
