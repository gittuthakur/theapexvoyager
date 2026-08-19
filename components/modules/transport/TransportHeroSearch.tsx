'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Search, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DestinationField, TravelStyleField, CounterField, SEARCH_PANEL_CLASS } from '@/components/modules/search';
import { trendingDestinations } from '@/config/search.config';
import { vehicleOptions } from '@/config/transport.config';
import { cn } from '@/lib/utils';

const VEHICLE_NAMES = vehicleOptions.map((vehicle) => vehicle.name);

export interface TransportHeroSearchProps {
  className?: string;
  initialPickup?: string;
  initialDrop?: string;
  initialDate?: string;
  initialTravelers?: number;
  initialVehicle?: string;
}

/** A plain native date/time input, styled to match the FieldPopover-based fields around it. */
function InlineDateTimeField({
  icon: Icon,
  label,
  type,
  value,
  onChange
}: {
  icon: LucideIcon;
  label: string;
  type: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative z-0 flex items-center gap-3 rounded-2xl border border-transparent bg-slate-200 px-4 py-3 transition-all duration-300 ease-out hover:bg-slate-40 focus-within:z-10 focus-within:scale-[1.02] focus-within:border-white focus-within:bg-white focus-within:shadow-lg">
      <Icon size={20} className="shrink-0 text-apex-500" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        />
      </span>
    </label>
  );
}

/**
 * The Transport page's own hero search — shares the portal's canonical pill-shaped
 * search card chrome (SEARCH_PANEL_CLASS) and primary CTA (the shared Button
 * component) with the Home and Journeys hero searches, but keeps a dedicated,
 * transport-only field set (pickup/drop locations, date, time, passengers, vehicle
 * type) instead of the multi-tab Destinations/Stays/Journeys/.../Transport switcher.
 */
export default function TransportHeroSearch({
  className,
  initialPickup = '',
  initialDrop = '',
  initialDate = '',
  initialTravelers = 2,
  initialVehicle = ''
}: TransportHeroSearchProps) {
  const router = useRouter();
  const [pickup, setPickup] = useState(initialPickup);
  const [drop, setDrop] = useState(initialDrop);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState(initialTravelers);
  const [vehicle, setVehicle] = useState(initialVehicle);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (pickup.trim()) params.set('pickup', pickup.trim());
    if (drop.trim()) params.set('destination', drop.trim());
    if (date) params.set('date', date);
    if (time) params.set('time', time);
    params.set('travellers', String(passengers));
    if (vehicle) params.set('vehicle', vehicle);
    const qs = params.toString();
    router.push(qs ? `/transport?${qs}` : '/transport');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(SEARCH_PANEL_CLASS, 'flex w-full flex-col gap-2 lg:flex-row lg:items-end lg:gap-3', className)}
    >
      <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-6 lg:items-center lg:gap-3">
        <motion.div className="sm:col-span-2 lg:col-span-2" whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <DestinationField
            value={pickup}
            onChange={setPickup}
            label="Pick-up Location"
            icon={MapPin}
            placeholder="e.g., Manali Bus Stand"
            destinations={trendingDestinations}
          />
        </motion.div>
        <motion.div className="sm:col-span-2 lg:col-span-2" whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <DestinationField
            value={drop}
            onChange={setDrop}
            label="Drop-off Location"
            icon={MapPin}
            placeholder="e.g., Chandigarh Airport"
            destinations={trendingDestinations}
          />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <InlineDateTimeField icon={Calendar} label="Date" type="date" value={date} onChange={setDate} />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <InlineDateTimeField icon={Clock} label="Time" type="time" value={time} onChange={setTime} />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <CounterField label="Passengers" value={passengers} onChange={setPassengers} min={1} max={30} stepperLabel="Passenger" />
        </motion.div>
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <TravelStyleField value={vehicle} onChange={setVehicle} styles={VEHICLE_NAMES} placeholder="Vehicle Type" label="Vehicle Type" />
        </motion.div>
      </div>

      <Button type="submit" size="lg" className="w-full justify-center gap-2 lg:w-auto">
        <Search size={18} />
        Search Transport
      </Button>
    </form>
  );
}
