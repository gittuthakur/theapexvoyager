'use client';

import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SEARCH_PANEL_CLASS } from '@/components/modules/search';
import {
  getVehicleTypeOptionsForService,
  labelForTripPurpose,
  urlSlugFromServiceType,
  vehicleValueFromLabel,
  type ServiceType
} from '@/config/transportServiceTypes.config';
import { useTransportSearch } from './TransportSearchContext';
import ServiceTypeSelector from './ServiceTypeSelector';
import {
  CabWithDriverFields,
  SelfDriveFields,
  GroupTransportFields,
  FourByFourFields,
  BikeRentalFields,
  LocalTransportFields
} from './TransportServiceFields';
import { cn } from '@/lib/utils';

const SUBMIT_LABEL: Record<ServiceType, string> = {
  'Cab with Driver': 'Find Cabs',
  'Local Taxi': 'Find Cabs',
  'Group Transport': 'Find Group Transport',
  '4x4 / Mountain Vehicle': 'Find 4x4 Vehicles',
  'Self-Drive Car': 'Find Self-Drive Vehicles',
  'Bike / Motorcycle': 'Find Bikes',
  'Local Mobility': 'Arrange Local Transport'
};

export interface TransportHeroSearchProps {
  className?: string;
  /** Defaults to 'transport-hero-search' — override when a second instance is mounted
   *  on the same page (e.g. inside a route-discovery dialog) to avoid a duplicate id. */
  formId?: string;
  /** Called after the search navigates — lets a caller embedding this in a dialog
   *  close itself once the search has been submitted. */
  onSubmitted?: () => void;
}

/**
 * The Transport page's own hero search — shares the portal's canonical pill-shaped
 * search card chrome (SEARCH_PANEL_CLASS) and primary CTA (the shared Button
 * component) with the Home and Journeys hero searches. "How do you want to travel?"
 * (ServiceTypeSelector) is the first decision; the field set below it is entirely
 * driven by that choice (see TransportServiceFields.tsx for each service's field
 * list) — no single generic field set tries to cover every service at once.
 *
 * All field state lives in TransportSearchContext (a TransportSearchProvider ancestor
 * is required), shared with "Choose Your Ride Style", "We Don't Just Arrange a
 * Vehicle" and "Pick the Right Fit for Your Journey" — a discovery-card click updates
 * the exact same state this form renders from, so the Hero always reflects the
 * customer's latest explicit selection instead of a stale, pre-navigation snapshot.
 */
export default function TransportHeroSearch({ className, formId = 'transport-hero-search', onSubmitted }: TransportHeroSearchProps) {
  const router = useRouter();
  const { fields, setField, selectRideStyle } = useTransportSearch();
  const {
    service,
    pickup,
    drop,
    date,
    time,
    passengers,
    vehicle,
    returnDate,
    returnTime,
    returnAtDifferentLocation,
    returnLocation,
    driveMode,
    quantity,
    tripType,
    tripDuration,
    tripPurpose
  } = fields;

  const vehicleTypeOptions = getVehicleTypeOptionsForService(service);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set('service', urlSlugFromServiceType(service));

    if (service === 'Self-Drive Car') {
      if (pickup.trim()) params.set('pickup', pickup.trim());
      if (date) params.set('date', date);
      if (time) params.set('time', time);
      if (returnDate) params.set('returnDate', returnDate);
      if (returnTime) params.set('returnTime', returnTime);
      if (vehicle) params.set('vehicle', vehicleValueFromLabel(service, vehicle));
      if (returnAtDifferentLocation && returnLocation.trim()) params.set('returnLocation', returnLocation.trim());
    } else if (service === 'Group Transport') {
      if (pickup.trim()) params.set('pickup', pickup.trim());
      if (drop.trim()) params.set('destination', drop.trim());
      if (date) params.set('date', date);
      if (returnDate) params.set('returnDate', returnDate);
      params.set('travellers', String(passengers));
      if (vehicle) params.set('vehicle', vehicleValueFromLabel(service, vehicle));
    } else if (service === '4x4 / Mountain Vehicle') {
      if (pickup.trim()) params.set('pickup', pickup.trim());
      if (drop.trim()) params.set('destination', drop.trim());
      if (date) params.set('date', date);
      if (returnDate) params.set('returnDate', returnDate);
      params.set('travellers', String(passengers));
      if (driveMode) params.set('driveMode', driveMode);
      if (tripDuration) params.set('tripDuration', tripDuration);
    } else if (service === 'Bike / Motorcycle') {
      if (pickup.trim()) params.set('pickup', pickup.trim());
      if (date) params.set('date', date);
      if (time) params.set('time', time);
      if (returnDate) params.set('returnDate', returnDate);
      if (returnTime) params.set('returnTime', returnTime);
      if (vehicle) params.set('vehicle', vehicleValueFromLabel(service, vehicle));
      params.set('quantity', String(quantity));
    } else if (service === 'Local Mobility') {
      if (drop.trim()) params.set('destination', drop.trim());
      if (date) params.set('date', date);
      params.set('travellers', String(passengers));
    } else {
      // Cab with Driver (and Local Taxi, sharing the same field set/default).
      if (pickup.trim()) params.set('pickup', pickup.trim());
      if (drop.trim()) params.set('destination', drop.trim());
      if (date) params.set('date', date);
      if (time) params.set('time', time);
      params.set('travellers', String(passengers));
      if (vehicle) params.set('vehicle', vehicleValueFromLabel(service, vehicle));
      if (tripType) params.set('tripType', tripType);
    }

    if (tripPurpose) params.set('purpose', tripPurpose);

    // Distinguishes an intentional search submission from a discovery-card click that
    // merely updates the shared TransportSearchContext (see brief "SEARCH RESULTS MODE")
    // — the page only ever enters the focused Search Results Mode when this is present.
    params.set('searched', '1');

    const qs = params.toString();
    router.push(qs ? `/transport?${qs}` : '/transport');
    onSubmitted?.();
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn(SEARCH_PANEL_CLASS, 'flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:gap-3', className)}
    >
      <div className="flex flex-1 flex-col gap-2">
        <ServiceTypeSelector value={service} onChange={selectRideStyle} />
        {tripPurpose ? <p className="px-1 text-xs text-slate-500">Purpose: {labelForTripPurpose(tripPurpose)}</p> : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:gap-3">
          {service === 'Self-Drive Car' ? (
            <SelfDriveFields
              pickup={pickup}
              onPickupChange={(v) => setField('pickup', v)}
              date={date}
              onDateChange={(v) => setField('date', v)}
              time={time}
              onTimeChange={(v) => setField('time', v)}
              returnDate={returnDate}
              onReturnDateChange={(v) => setField('returnDate', v)}
              returnTime={returnTime}
              onReturnTimeChange={(v) => setField('returnTime', v)}
              vehicle={vehicle}
              onVehicleChange={(v) => setField('vehicle', v)}
              vehicleTypeOptions={vehicleTypeOptions}
              returnAtDifferentLocation={returnAtDifferentLocation}
              onReturnAtDifferentLocationChange={(v) => setField('returnAtDifferentLocation', v)}
              returnLocation={returnLocation}
              onReturnLocationChange={(v) => setField('returnLocation', v)}
            />
          ) : service === 'Group Transport' ? (
            <GroupTransportFields
              pickup={pickup}
              onPickupChange={(v) => setField('pickup', v)}
              drop={drop}
              onDropChange={(v) => setField('drop', v)}
              date={date}
              onDateChange={(v) => setField('date', v)}
              returnDate={returnDate}
              onReturnDateChange={(v) => setField('returnDate', v)}
              passengers={passengers}
              onPassengersChange={(v) => setField('passengers', v)}
              vehicle={vehicle}
              onVehicleChange={(v) => setField('vehicle', v)}
              vehicleTypeOptions={vehicleTypeOptions}
            />
          ) : service === '4x4 / Mountain Vehicle' ? (
            <FourByFourFields
              pickup={pickup}
              onPickupChange={(v) => setField('pickup', v)}
              drop={drop}
              onDropChange={(v) => setField('drop', v)}
              date={date}
              onDateChange={(v) => setField('date', v)}
              returnDate={returnDate}
              onReturnDateChange={(v) => setField('returnDate', v)}
              passengers={passengers}
              onPassengersChange={(v) => setField('passengers', v)}
              driveMode={driveMode}
              onDriveModeChange={(v) => setField('driveMode', v)}
              tripDuration={tripDuration}
              onTripDurationChange={(v) => setField('tripDuration', v)}
            />
          ) : service === 'Bike / Motorcycle' ? (
            <BikeRentalFields
              pickup={pickup}
              onPickupChange={(v) => setField('pickup', v)}
              date={date}
              onDateChange={(v) => setField('date', v)}
              time={time}
              onTimeChange={(v) => setField('time', v)}
              returnDate={returnDate}
              onReturnDateChange={(v) => setField('returnDate', v)}
              returnTime={returnTime}
              onReturnTimeChange={(v) => setField('returnTime', v)}
              vehicle={vehicle}
              onVehicleChange={(v) => setField('vehicle', v)}
              vehicleTypeOptions={vehicleTypeOptions}
              quantity={quantity}
              onQuantityChange={(v) => setField('quantity', v)}
            />
          ) : service === 'Local Mobility' ? (
            <LocalTransportFields
              destination={drop}
              onDestinationChange={(v) => setField('drop', v)}
              date={date}
              onDateChange={(v) => setField('date', v)}
              passengers={passengers}
              onPassengersChange={(v) => setField('passengers', v)}
            />
          ) : (
            <CabWithDriverFields
              pickup={pickup}
              onPickupChange={(v) => setField('pickup', v)}
              drop={drop}
              onDropChange={(v) => setField('drop', v)}
              date={date}
              onDateChange={(v) => setField('date', v)}
              time={time}
              onTimeChange={(v) => setField('time', v)}
              passengers={passengers}
              onPassengersChange={(v) => setField('passengers', v)}
              vehicle={vehicle}
              onVehicleChange={(v) => setField('vehicle', v)}
              vehicleTypeOptions={vehicleTypeOptions}
              tripType={tripType}
              onTripTypeChange={(v) => setField('tripType', v)}
            />
          )}
          <span>
            <Button type="submit" size="lg" className="w-full justify-center gap-2 lg:w-auto">
              <Search size={18} />
              {SUBMIT_LABEL[service]}
            </Button>
          </span>
        </div>
      </div>
    </form>
  );
}
