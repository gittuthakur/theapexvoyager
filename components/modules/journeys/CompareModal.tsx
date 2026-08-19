'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatINR } from '@/lib/pricing';
import { getPackageInclusionTags, getPackageRating } from '@/lib/packageFilters';
import type { Destination, TravelPackage } from '@/types';

export interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  packages: TravelPackage[];
  destinationsBySlug: Map<string, Destination>;
  destinationRatings: Map<string, { rating: number; count: number }>;
}

const ROWS: { label: string; render: (pkg: TravelPackage, rating?: { rating: number; count: number }) => ReactNode }[] = [
  { label: 'Destination', render: (pkg) => pkg.destination },
  { label: 'Duration', render: (pkg) => pkg.duration },
  { label: 'Travel style', render: (pkg) => pkg.category },
  { label: 'Starting price', render: (pkg) => `${formatINR(pkg.price)} / person` },
  {
    label: 'Rating',
    render: (_pkg, rating) =>
      rating ? (
        <span className="inline-flex items-center gap-1">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          {rating.rating.toFixed(1)} <span className="text-slate-400">({rating.count})</span>
        </span>
      ) : (
        <span className="text-slate-400">—</span>
      )
  },
  {
    label: 'Key inclusions',
    render: (pkg) => (getPackageInclusionTags(pkg).length ? getPackageInclusionTags(pkg).join(', ') : <span className="text-slate-400">—</span>)
  },
  {
    label: 'Main experiences',
    render: (pkg) => (
      <ul className="space-y-1">
        {pkg.highlights.slice(0, 3).map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
    )
  }
];

export default function CompareModal({ open, onClose, packages, destinationsBySlug, destinationRatings }: CompareModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Compare Journeys" className="max-w-4xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-40 pb-4 pr-4 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-slate-400" />
              {packages.map((pkg) => (
                <th key={pkg.slug} className="min-w-[180px] pb-4 pl-4 text-left align-bottom">
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-slate-100">
                    <SafeImage src={pkg.image} alt={pkg.name} fill sizes="220px" className="object-cover" />
                  </div>
                  <p className="text-base font-bold text-slate-900">{pkg.name}</p>
                  <Link href={`/journeys/${pkg.slug}`} className="cursor-hover mt-1 inline-block text-xs font-semibold text-apex-600 hover:text-apex-700">
                    View Journey →
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="py-3 pr-4 align-top text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</td>
                {packages.map((pkg) => (
                  <td key={pkg.slug} className="py-3 pl-4 align-top text-slate-700">
                    {row.render(pkg, getPackageRating(pkg, destinationsBySlug, destinationRatings))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
