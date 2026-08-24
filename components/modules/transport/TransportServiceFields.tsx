'use client';

import { Calendar, Clock, MapPin, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { DestinationField, TravelStyleField, CounterField } from '@/components/modules/search';
import { Checkbox } from '@/components/ui/Checkbox';
import { trendingDestinations } from '@/config/search.config';
import { TRIP_TYPE_OPTIONS, TRIP_DURATION_OPTIONS, type VehicleTypeOption } from '@/config/transportServiceTypes.config';

const FIELD_MOTION = { whileHover: { y: -2 }, transition: { duration: 0.2, ease: 'easeOut' as const } };

/** A plain native date/time input, styled to match the FieldPopover-based fields around it. */
export function InlineDateTimeField({
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

export interface CabWithDriverFieldsProps {
  pickup: string;
  onPickupChange: (value: string) => void;
  drop: string;
  onDropChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
  passengers: number;
  onPassengersChange: (value: number) => void;
  vehicle: string;
  onVehicleChange: (value: string) => void;
  vehicleTypeOptions: VehicleTypeOption[];
  tripType: string;
  onTripTypeChange: (value: string) => void;
}

/** §2 — the field set the Transport search has always had, plus Trip Type. */
export function CabWithDriverFields({
  pickup,
  onPickupChange,
  drop,
  onDropChange,
  date,
  onDateChange,
  time,
  onTimeChange,
  passengers,
  onPassengersChange,
  vehicle,
  onVehicleChange,
  vehicleTypeOptions,
  tripType,
  onTripTypeChange
}: CabWithDriverFieldsProps) {
  return (
    <>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={pickup} onChange={onPickupChange} label="Pick-up Location" icon={MapPin} placeholder="e.g., Manali Bus Stand" destinations={trendingDestinations} />
      </motion.div>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={drop} onChange={onDropChange} label="Drop-off Location" icon={MapPin} placeholder="e.g., Chandigarh Airport" destinations={trendingDestinations} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Date" type="date" value={date} onChange={onDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Clock} label="Time" type="time" value={time} onChange={onTimeChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <CounterField label="Passengers" value={passengers} onChange={onPassengersChange} min={1} max={30} stepperLabel="Passenger" />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <TravelStyleField value={tripType} onChange={onTripTypeChange} styles={TRIP_TYPE_OPTIONS} placeholder="Trip Type" label="Trip Type" />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <TravelStyleField value={vehicle} onChange={onVehicleChange} styles={vehicleTypeOptions.map((o) => o.label)} placeholder="Vehicle Type" label="Vehicle Type" />
      </motion.div>
    </>
  );
}

export interface SelfDriveFieldsProps {
  pickup: string;
  onPickupChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
  returnDate: string;
  onReturnDateChange: (value: string) => void;
  returnTime: string;
  onReturnTimeChange: (value: string) => void;
  vehicle: string;
  onVehicleChange: (value: string) => void;
  vehicleTypeOptions: VehicleTypeOption[];
  returnAtDifferentLocation: boolean;
  onReturnAtDifferentLocationChange: (value: boolean) => void;
  returnLocation: string;
  onReturnLocationChange: (value: string) => void;
}

/** §3 — no driver-allowance/chauffeur language anywhere in this field set. */
export function SelfDriveFields({
  pickup,
  onPickupChange,
  date,
  onDateChange,
  time,
  onTimeChange,
  returnDate,
  onReturnDateChange,
  returnTime,
  onReturnTimeChange,
  vehicle,
  onVehicleChange,
  vehicleTypeOptions,
  returnAtDifferentLocation,
  onReturnAtDifferentLocationChange,
  returnLocation,
  onReturnLocationChange
}: SelfDriveFieldsProps) {
  return (
    <>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={pickup} onChange={onPickupChange} label="Pickup City / Location" icon={MapPin} placeholder="e.g., Manali Bus Stand" destinations={trendingDestinations} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Pickup Date" type="date" value={date} onChange={onDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Clock} label="Pickup Time" type="time" value={time} onChange={onTimeChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Return Date" type="date" value={returnDate} onChange={onReturnDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Clock} label="Return Time" type="time" value={returnTime} onChange={onReturnTimeChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <TravelStyleField value={vehicle} onChange={onVehicleChange} styles={vehicleTypeOptions.map((o) => o.label)} placeholder="Vehicle Type" label="Vehicle Type" />
      </motion.div>
      <motion.div className="sm:col-span-2 lg:col-span-2 flex items-center" {...FIELD_MOTION}>
        <Checkbox
          label="Return at a different location"
          checked={returnAtDifferentLocation}
          onChange={(event) => onReturnAtDifferentLocationChange(event.target.checked)}
        />
      </motion.div>
      {returnAtDifferentLocation ? (
        <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
          <DestinationField value={returnLocation} onChange={onReturnLocationChange} label="Return Location" icon={MapPin} placeholder="e.g., Chandigarh Airport" destinations={trendingDestinations} />
        </motion.div>
      ) : null}
    </>
  );
}

export interface GroupTransportFieldsProps {
  pickup: string;
  onPickupChange: (value: string) => void;
  drop: string;
  onDropChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  returnDate: string;
  onReturnDateChange: (value: string) => void;
  passengers: number;
  onPassengersChange: (value: number) => void;
  vehicle: string;
  onVehicleChange: (value: string) => void;
  vehicleTypeOptions: VehicleTypeOption[];
}

/** §4 */
export function GroupTransportFields({
  pickup,
  onPickupChange,
  drop,
  onDropChange,
  date,
  onDateChange,
  returnDate,
  onReturnDateChange,
  passengers,
  onPassengersChange,
  vehicle,
  onVehicleChange,
  vehicleTypeOptions
}: GroupTransportFieldsProps) {
  return (
    <>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={pickup} onChange={onPickupChange} label="Pick-up Location" icon={MapPin} placeholder="e.g., Manali Bus Stand" destinations={trendingDestinations} />
      </motion.div>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={drop} onChange={onDropChange} label="Drop-off Location" icon={MapPin} placeholder="e.g., Chandigarh Airport" destinations={trendingDestinations} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Travel Date" type="date" value={date} onChange={onDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Return Date" type="date" value={returnDate} onChange={onReturnDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <CounterField label="Group Size" value={passengers} onChange={onPassengersChange} min={1} max={60} stepperLabel="Traveller" />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <TravelStyleField value={vehicle} onChange={onVehicleChange} styles={vehicleTypeOptions.map((o) => o.label)} placeholder="Vehicle / Seating" label="Vehicle / Seating" />
      </motion.div>
    </>
  );
}

export interface FourByFourFieldsProps {
  pickup: string;
  onPickupChange: (value: string) => void;
  drop: string;
  onDropChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  returnDate: string;
  onReturnDateChange: (value: string) => void;
  passengers: number;
  onPassengersChange: (value: number) => void;
  driveMode: string;
  onDriveModeChange: (value: string) => void;
  tripDuration: string;
  onTripDurationChange: (value: string) => void;
}

const DRIVE_MODE_OPTIONS = ['With Driver', 'Self Drive'];

/** §5 — only shows routes/availability that configured inventory actually supports;
 *  no separate Vehicle Type field, every vehicle in this vertical is already a 4x4. */
export function FourByFourFields({
  pickup,
  onPickupChange,
  drop,
  onDropChange,
  date,
  onDateChange,
  returnDate,
  onReturnDateChange,
  passengers,
  onPassengersChange,
  driveMode,
  onDriveModeChange,
  tripDuration,
  onTripDurationChange
}: FourByFourFieldsProps) {
  return (
    <>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={pickup} onChange={onPickupChange} label="Pick-up Location" icon={MapPin} placeholder="e.g., Manali Bus Stand" destinations={trendingDestinations} />
      </motion.div>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={drop} onChange={onDropChange} label="Destination / Route" icon={MapPin} placeholder="e.g., Spiti Valley" destinations={trendingDestinations} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Travel Date" type="date" value={date} onChange={onDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Return Date" type="date" value={returnDate} onChange={onReturnDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <CounterField label="Passengers" value={passengers} onChange={onPassengersChange} min={1} max={10} stepperLabel="Passenger" />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <TravelStyleField value={tripDuration} onChange={onTripDurationChange} styles={TRIP_DURATION_OPTIONS} placeholder="Trip Duration" label="Trip Duration" />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <TravelStyleField value={driveMode} onChange={onDriveModeChange} styles={DRIVE_MODE_OPTIONS} placeholder="Drive Mode" label="Drive Mode" />
      </motion.div>
    </>
  );
}

export interface BikeRentalFieldsProps {
  pickup: string;
  onPickupChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  time: string;
  onTimeChange: (value: string) => void;
  returnDate: string;
  onReturnDateChange: (value: string) => void;
  returnTime: string;
  onReturnTimeChange: (value: string) => void;
  vehicle: string;
  onVehicleChange: (value: string) => void;
  vehicleTypeOptions: VehicleTypeOption[];
  quantity: number;
  onQuantityChange: (value: number) => void;
}

/** §6 */
export function BikeRentalFields({
  pickup,
  onPickupChange,
  date,
  onDateChange,
  time,
  onTimeChange,
  returnDate,
  onReturnDateChange,
  returnTime,
  onReturnTimeChange,
  vehicle,
  onVehicleChange,
  vehicleTypeOptions,
  quantity,
  onQuantityChange
}: BikeRentalFieldsProps) {
  return (
    <>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={pickup} onChange={onPickupChange} label="Pickup Location" icon={MapPin} placeholder="e.g., Manali Bus Stand" destinations={trendingDestinations} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Start Date" type="date" value={date} onChange={onDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Clock} label="Start Time" type="time" value={time} onChange={onTimeChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Return Date" type="date" value={returnDate} onChange={onReturnDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Clock} label="Return Time" type="time" value={returnTime} onChange={onReturnTimeChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <TravelStyleField value={vehicle} onChange={onVehicleChange} styles={vehicleTypeOptions.map((o) => o.label)} placeholder="Bike Type" label="Bike Type" />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <CounterField label="Quantity" value={quantity} onChange={onQuantityChange} min={1} max={10} stepperLabel="Bike" />
      </motion.div>
    </>
  );
}

export interface LocalTransportFieldsProps {
  destination: string;
  onDestinationChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  passengers: number;
  onPassengersChange: (value: number) => void;
}

/** §7 — deliberately no ride-type dropdown here: with zero Local Mobility vehicles
 *  seeded yet, any option list would be empty. Ride-type selection belongs at the
 *  results level once a destination resolves to real linked vehicles (the vehicle
 *  cards themselves become the picker) — see LocalMobility.tsx. */
export function LocalTransportFields({
  destination,
  onDestinationChange,
  date,
  onDateChange,
  passengers,
  onPassengersChange
}: LocalTransportFieldsProps) {
  return (
    <>
      <motion.div className="sm:col-span-2 lg:col-span-2" {...FIELD_MOTION}>
        <DestinationField value={destination} onChange={onDestinationChange} label="Destination" icon={MapPin} placeholder="e.g., Manali" destinations={trendingDestinations} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <InlineDateTimeField icon={Calendar} label="Date" type="date" value={date} onChange={onDateChange} />
      </motion.div>
      <motion.div {...FIELD_MOTION}>
        <CounterField label="Passengers" value={passengers} onChange={onPassengersChange} min={1} max={20} stepperLabel="Passenger" />
      </motion.div>
    </>
  );
}
