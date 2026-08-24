'use client';

import { useRef, useState } from 'react';
import { Bike, ChevronDown, Compass, Gem, Heart, Mountain, Sparkles, Tent, Users, type LucideIcon } from 'lucide-react';
import { FieldPopover } from './FieldPopover';
import { SEARCH_FIELD_CLASS } from './panelStyles';
import { cn } from '@/lib/utils';

export interface TravelStyleFieldProps {
  value: string;
  onChange: (value: string) => void;
  styles: string[];
  placeholder?: string;
  label?: string;
  icon?: LucideIcon;
}

const STYLE_ICONS: Record<string, LucideIcon> = {
  Adventure: Mountain,
  Luxury: Gem,
  Honeymoon: Heart,
  Family: Users,
  'Road Trips': Bike,
  Offbeat: Compass,
  Camping: Tent
};

function styleIcon(style: string): LucideIcon {
  return STYLE_ICONS[style] ?? Sparkles;
}

export function TravelStyleField({
  value,
  onChange,
  styles,
  placeholder = 'Select your style',
  label = 'Travel Style',
  icon: Icon = Sparkles
}: TravelStyleFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  function selectStyle(style: string) {
    onChange(style === value ? '' : style);
    setOpen(false);
  }

  return (
    <div ref={anchorRef} className="relative">
      <label className={SEARCH_FIELD_CLASS}>
        <Icon size={18} className="shrink-0 text-apex-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-hover w-full truncate bg-transparent text-left text-sm text-slate-900 outline-none"
          >
            {value || <span className="text-slate-500">{placeholder}</span>}
          </button>
        </span>
        <ChevronDown size={16} className="shrink-0 text-slate-400" />
      </label>

      <FieldPopover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} width={320} className="z-50">
        <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Pick a travel style</p>
        {styles.length === 0 ? (
          <p className="mt-3 px-1 text-sm text-slate-500">No options available yet.</p>
        ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {styles.map((style) => {
            const Icon = styleIcon(style);
            const active = value === style;
            return (
              <button
                key={style}
                type="button"
                onClick={() => selectStyle(style)}
                className={cn(
                  'cursor-hover flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ease-in-out',
                  active
                    ? 'border-apex-500 bg-apex-500 text-white shadow-lg shadow-apex-500/30'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-apex-400/50 hover:bg-apex-50 hover:text-apex-700'
                )}
              >
                <Icon size={14} className={active ? 'text-white' : 'text-apex-400'} />
                {style}
              </button>
            );
          })}
        </div>
        )}
      </FieldPopover>
    </div>
  );
}
