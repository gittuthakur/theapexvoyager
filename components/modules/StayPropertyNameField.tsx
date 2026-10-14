'use client';

import { Building2 } from 'lucide-react';
import { SEARCH_FIELD_CLASS } from '@/components/modules/search';

export interface StayPropertyNameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * The property-name half of Stays search (the `q` param). Kept visibly separate from the
 * destination field so a hotel/homestay name is never typed into — or read as — a place.
 */
export default function StayPropertyNameField({ value, onChange }: StayPropertyNameFieldProps) {
  return (
    <label className={SEARCH_FIELD_CLASS}>
      <Building2 size={18} className="shrink-0 text-apex-500" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Property name</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Hotel or homestay name (optional)"
          autoComplete="off"
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
        />
      </span>
    </label>
  );
}
