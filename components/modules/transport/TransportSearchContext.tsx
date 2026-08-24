'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_SERVICE_TYPE,
  getVehicleTypeOptionsForService,
  serviceTypeFromUrlSlug,
  TRIP_PURPOSE_UI,
  tripPurposeFromUrlParam,
  urlSlugFromServiceType,
  vehicleLabelFromValue,
  vehicleValueFromLabel,
  type ServiceType,
  type TripPurpose
} from '@/config/transportServiceTypes.config';

export interface TransportSearchFields {
  service: ServiceType;
  tripPurpose: TripPurpose | '';
  pickup: string;
  drop: string;
  date: string;
  time: string;
  passengers: number;
  vehicle: string;
  returnDate: string;
  returnTime: string;
  returnAtDifferentLocation: boolean;
  returnLocation: string;
  driveMode: string;
  quantity: number;
  tripType: string;
  tripDuration: string;
}

const DEFAULT_FIELDS: TransportSearchFields = {
  service: DEFAULT_SERVICE_TYPE,
  tripPurpose: '',
  pickup: '',
  drop: '',
  date: '',
  time: '',
  passengers: 2,
  vehicle: '',
  returnDate: '',
  returnTime: '',
  returnAtDifferentLocation: false,
  returnLocation: '',
  driveMode: '',
  quantity: 1,
  tripType: '',
  tripDuration: ''
};

const TRIP_PURPOSE_BY_VALUE = new Map(TRIP_PURPOSE_UI.map((entry) => [entry.value, entry]));

/** Builds canonical field state from a URL query string — the one place that maps
 *  `?service=&vehicle=&purpose=&pickup=...` into the shape the Hero renders from.
 *  Used both for first-mount hydration and for resyncing after an external
 *  navigation (browser Back/Forward, or the Hero's own Search-submit push). */
function resyncFromParams(params: URLSearchParams): TransportSearchFields {
  const service = serviceTypeFromUrlSlug(params.get('service') ?? undefined);
  const vehicleValue = params.get('vehicle') ?? '';
  const travellersRaw = params.get('travellers');
  const quantityRaw = params.get('quantity');
  return {
    service,
    tripPurpose: tripPurposeFromUrlParam(params.get('purpose') ?? undefined) ?? '',
    pickup: params.get('pickup') ?? '',
    drop: params.get('destination') ?? '',
    date: params.get('date') ?? '',
    time: params.get('time') ?? '',
    passengers: travellersRaw ? Number(travellersRaw) || DEFAULT_FIELDS.passengers : DEFAULT_FIELDS.passengers,
    vehicle: vehicleValue ? vehicleLabelFromValue(service, vehicleValue) : '',
    returnDate: params.get('returnDate') ?? '',
    returnTime: params.get('returnTime') ?? '',
    returnAtDifferentLocation: Boolean(params.get('returnLocation')),
    returnLocation: params.get('returnLocation') ?? '',
    driveMode: params.get('driveMode') ?? '',
    quantity: quantityRaw ? Number(quantityRaw) || DEFAULT_FIELDS.quantity : DEFAULT_FIELDS.quantity,
    tripType: params.get('tripType') ?? '',
    tripDuration: params.get('tripDuration') ?? ''
  };
}

/** Clears only the fields that genuinely conflict with a newly selected service
 *  (brief §5) — pickup/drop/date/time/passengers/returnDate/returnTime/quantity are
 *  compatible across services and are always preserved. Also drops tripPurpose when
 *  it no longer matches the new service (e.g. "Intercity Transfers" doesn't survive a
 *  switch to Self Drive). */
function clearIncompatibleFields(fields: TransportSearchFields, nextService: ServiceType): TransportSearchFields {
  const nextVehicleLabels = getVehicleTypeOptionsForService(nextService).map((o) => o.label);
  const vehicle = fields.vehicle && nextVehicleLabels.includes(fields.vehicle) ? fields.vehicle : '';
  const is4x4 = nextService === '4x4 / Mountain Vehicle';
  const isCab = nextService === 'Cab with Driver' || nextService === 'Local Taxi';
  const isSelfDrive = nextService === 'Self-Drive Car';
  const tripPurposeStillValid = fields.tripPurpose && TRIP_PURPOSE_BY_VALUE.get(fields.tripPurpose)?.service === nextService;
  return {
    ...fields,
    service: nextService,
    tripPurpose: tripPurposeStillValid ? fields.tripPurpose : '',
    vehicle,
    driveMode: is4x4 ? fields.driveMode : '',
    tripDuration: is4x4 ? fields.tripDuration : '',
    tripType: isCab ? fields.tripType : '',
    returnAtDifferentLocation: isSelfDrive ? fields.returnAtDifferentLocation : false,
    returnLocation: isSelfDrive ? fields.returnLocation : ''
  };
}

interface TransportSearchContextValue {
  fields: TransportSearchFields;
  setField: <K extends keyof TransportSearchFields>(key: K, value: TransportSearchFields[K]) => void;
  selectRideStyle: (service: ServiceType) => void;
  selectTripPurpose: (purpose: TripPurpose) => void;
  selectVehicleFit: (service: ServiceType, vehicleLabel: string) => void;
}

const TransportSearchContext = createContext<TransportSearchContextValue | null>(null);

export function TransportSearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fields, setFields] = useState<TransportSearchFields>(() => resyncFromParams(searchParams));
  const lastAppliedQueryRef = useRef<string>(searchParams.toString());

  useEffect(() => {
    const qs = searchParams.toString();
    if (qs === lastAppliedQueryRef.current) return;
    lastAppliedQueryRef.current = qs;
    setFields(resyncFromParams(searchParams));
  }, [searchParams]);

  const setField = useCallback(<K extends keyof TransportSearchFields>(key: K, value: TransportSearchFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Pushes only the configuration keys (service/vehicle/purpose) to the URL, keeping
   *  every other existing query param untouched — a new history entry each time, so
   *  Back/Forward between ride-style selections (brief Test G) actually has somewhere
   *  to go. */
  const syncUrl = useCallback(
    (next: TransportSearchFields) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('service', urlSlugFromServiceType(next.service));
      const vehicleValue = next.vehicle ? vehicleValueFromLabel(next.service, next.vehicle) : '';
      if (vehicleValue) params.set('vehicle', vehicleValue);
      else params.delete('vehicle');
      if (next.tripPurpose) params.set('purpose', next.tripPurpose);
      else params.delete('purpose');
      const qs = params.toString();
      lastAppliedQueryRef.current = qs;
      router.push(qs ? `/transport?${qs}` : '/transport', { scroll: false });
    },
    [router, searchParams]
  );

  const selectRideStyle = useCallback(
    (service: ServiceType) => {
      const next = clearIncompatibleFields(fields, service);
      setFields(next);
      syncUrl(next);
    },
    [fields, syncUrl]
  );

  const selectTripPurpose = useCallback(
    (purpose: TripPurpose) => {
      const entry = TRIP_PURPOSE_BY_VALUE.get(purpose);
      if (!entry) return;
      const cleared = clearIncompatibleFields(fields, entry.service);
      const next: TransportSearchFields = {
        ...cleared,
        tripPurpose: purpose,
        tripType: entry.tripType ?? cleared.tripType
      };
      setFields(next);
      syncUrl(next);
    },
    [fields, syncUrl]
  );

  const selectVehicleFit = useCallback(
    (service: ServiceType, vehicleLabel: string) => {
      const cleared = clearIncompatibleFields(fields, service);
      const validLabel = getVehicleTypeOptionsForService(service).some((o) => o.label === vehicleLabel);
      const next: TransportSearchFields = { ...cleared, vehicle: validLabel ? vehicleLabel : '' };
      setFields(next);
      syncUrl(next);
    },
    [fields, syncUrl]
  );

  const value = useMemo<TransportSearchContextValue>(
    () => ({ fields, setField, selectRideStyle, selectTripPurpose, selectVehicleFit }),
    [fields, setField, selectRideStyle, selectTripPurpose, selectVehicleFit]
  );

  return <TransportSearchContext.Provider value={value}>{children}</TransportSearchContext.Provider>;
}

export function useTransportSearch(): TransportSearchContextValue {
  const ctx = useContext(TransportSearchContext);
  if (!ctx) throw new Error('useTransportSearch must be used within a TransportSearchProvider');
  return ctx;
}
