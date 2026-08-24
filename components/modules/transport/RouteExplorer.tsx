'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useBookingRequest } from '@/components/modules/BookingRequestModal';
import { buildTransportRequestMessage } from '@/lib/whatsapp';
import { getRecommendedServiceTypesForRoute, type ServiceType } from '@/config/transportServiceTypes.config';
import type { TransportRoute, VehicleOption } from '@/types/transport';
import RouteDiscoveryLauncher from './RouteDiscoveryLauncher';
import RouteBookingPopup, { type RouteBookingTripContext } from './RouteBookingPopup';
import TransportDetail from './TransportDetail';
import CustomRouteRequest from './CustomRouteRequest';

export interface RouteExplorerProps {
  /** Curated routes matching the active pickup/destination search — or every active
   *  route when nothing was searched. */
  routes: TransportRoute[];
  /** Every active curated route regardless of the current search — feeds the "View All
   *  Routes" dialog's quick-pick list so it isn't limited by an active search filter. */
  allRoutes: TransportRoute[];
  pickup?: string;
  destination?: string;
  date?: string;
  travellers?: string;
  service?: ServiceType;
  journeyContext?: { from?: string; journeySlug?: string };
  /** Already-fetched, unfiltered per-service vehicle catalogs — reused for the Route
   *  Booking Popup's vehicle-matching step so it never runs a second inventory fetch. */
  chauffeurVehicles: VehicleOption[];
  fourByFourVehicles: VehicleOption[];
  selfDriveVehicles: VehicleOption[];
  bikeVehicles: VehicleOption[];
}

// Every ride style a route (curated or custom) can offer — Local Taxi/Local Mobility
// are destination-specific, not route-to-route, so they're deliberately excluded here.
const ALL_ROUTE_SERVICES: ServiceType[] = ['Cab with Driver', 'Self-Drive Car', 'Group Transport', '4x4 / Mountain Vehicle', 'Bike / Motorcycle'];

interface SelectedVehicleState {
  vehicle: VehicleOption;
  trip: RouteBookingTripContext;
}

/**
 * The 6-or-so seeded routes here are FEATURED/popular shortcuts, not a whitelist of
 * where transport can be arranged — searching an origin/destination pair that isn't in
 * this curated catalogue still works (see CustomRouteRequest), it just doesn't get the
 * pre-written duration/vehicle-category copy a curated route has.
 */
export default function RouteExplorer({
  routes,
  allRoutes,
  pickup,
  destination,
  date,
  travellers,
  service,
  journeyContext,
  chauffeurVehicles,
  fourByFourVehicles,
  selfDriveVehicles,
  bikeVehicles
}: RouteExplorerProps) {
  const isRouteSearch = Boolean(pickup) && Boolean(destination);
  const matchedRoute = isRouteSearch ? routes[0] : undefined;

  const { openBookingRequest } = useBookingRequest();
  const [bookingRoute, setBookingRoute] = useState<{ origin: string; destination: string; routeMeta?: TransportRoute } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicleState | null>(null);

  const vehiclesByService = useMemo<Partial<Record<ServiceType, VehicleOption[]>>>(
    () => ({
      'Cab with Driver': chauffeurVehicles.filter((vehicle) => vehicle.serviceType === 'Cab with Driver'),
      'Group Transport': chauffeurVehicles.filter((vehicle) => vehicle.serviceType === 'Group Transport'),
      '4x4 / Mountain Vehicle': fourByFourVehicles,
      'Self-Drive Car': selfDriveVehicles,
      'Bike / Motorcycle': bikeVehicles
    }),
    [chauffeurVehicles, fourByFourVehicles, selfDriveVehicles, bikeVehicles]
  );

  const allowedServices = useMemo(() => {
    if (!bookingRoute?.routeMeta) return ALL_ROUTE_SERVICES;
    const recommended = getRecommendedServiceTypesForRoute(bookingRoute.routeMeta);
    return recommended.length > 0 ? recommended : ALL_ROUTE_SERVICES;
  }, [bookingRoute]);

  if (!isRouteSearch && routes.length === 0) return null;

  const featuredRoutes = allRoutes.map((route) => ({ origin: route.origin, destination: route.destination }));

  function handleViewDetails(vehicle: VehicleOption, trip: RouteBookingTripContext) {
    // Close the Route Booking Popup before opening TransportDetail — no modal-on-modal.
    setBookingRoute(null);
    setSelectedVehicle({ vehicle, trip });
  }

  function handleRequestVehicle(vehicle: VehicleOption, trip: RouteBookingTripContext) {
    setBookingRoute(null);
    setSelectedVehicle(null);
    openBookingRequest({
      type: 'transport',
      itemName: vehicle.name,
      destination: `${trip.pickup} → ${trip.destination}`,
      dates: trip.returnDate ? `${trip.date} – ${trip.returnDate}` : trip.date,
      travelers: trip.travellers,
      details: {
        serviceType: trip.service,
        vehicleSlug: vehicle.slug ?? vehicle.id,
        pickup: trip.pickup,
        destination: trip.destination,
        date: trip.date,
        returnDate: trip.returnDate || undefined,
        travellers: trip.travellers,
        tripType: trip.tripType,
        routeSlug: trip.routeSlug,
        customRoute: trip.customRoute,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-route-booking'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({
          referenceId,
          pickup: trip.pickup,
          destination: trip.destination,
          date: trip.date,
          returnDate: trip.returnDate || undefined,
          travelers: trip.travellers,
          vehicleName: vehicle.name
        })
    });
  }

  function handleRequestCustomTransport(trip: RouteBookingTripContext) {
    setBookingRoute(null);
    openBookingRequest({
      type: 'transport',
      itemName: `Custom route: ${trip.pickup} → ${trip.destination}`,
      destination: `${trip.pickup} → ${trip.destination}`,
      dates: trip.returnDate ? `${trip.date} – ${trip.returnDate}` : trip.date,
      travelers: trip.travellers,
      details: {
        pickup: trip.pickup,
        destination: trip.destination,
        date: trip.date,
        returnDate: trip.returnDate || undefined,
        travellers: trip.travellers,
        tripType: trip.tripType,
        serviceType: trip.service,
        customRoute: true,
        routeSlug: trip.routeSlug,
        from: journeyContext?.from,
        journeySlug: journeyContext?.journeySlug,
        source: 'transport-route-booking-custom'
      },
      buildWhatsAppMessage: (referenceId) =>
        buildTransportRequestMessage({
          referenceId,
          pickup: trip.pickup,
          destination: trip.destination,
          date: trip.date,
          returnDate: trip.returnDate || undefined,
          travelers: trip.travellers,
          vehicleName: `${trip.service} (to be arranged)`
        })
    });
  }

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <div className="flex flex-col">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-apex-600">
          {isRouteSearch ? 'Route lookup' : 'Popular routes'}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          {isRouteSearch ? `${pickup} → ${destination}` : 'Himalayan routes we cover'}
        </h2>
        {!isRouteSearch ? (
          <p className="mt-2 text-sm text-slate-600">
            These are just our most popular Himalayan routes — our partner network arranges transport for any origin
            and destination, not only the ones featured here.
          </p>
          ) : null}
      </div>

      {isRouteSearch ? (
        matchedRoute ? (
          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-xl sm:max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Curated route</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {matchedRoute.estimatedDuration ? (
                <span className="rounded-full bg-slate-200 px-3 py-1">{matchedRoute.estimatedDuration}</span>
              ) : null}
              {matchedRoute.seasonalStatus ? (
                <span className="rounded-full bg-slate-200 px-3 py-1">{matchedRoute.seasonalStatus}</span>
              ) : null}
              {matchedRoute.routeType ? (
                <span className="rounded-full bg-slate-200 px-3 py-1">{matchedRoute.routeType}</span>
              ) : null}
            </div>
            {matchedRoute.supportedVehicleCategories.length > 0 ? (
              <p className="mt-3 text-sm text-slate-600">Supported vehicles: {matchedRoute.supportedVehicleCategories.join(', ')}</p>
            ) : null}
            <p className="mt-3 text-sm text-slate-600">
              {matchedRoute.startingFare ? (
                <>
                  Starting from{' '}
                  <span className="text-2xl font-bold text-apex-500">₹{matchedRoute.startingFare.toLocaleString('en-IN')}</span>
                </>
              ) : (
                'Get a Custom Quote'
              )}
            </p>
            <a
              href="#transport-results"
              className="cursor-hover mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
            >
              View matching transport <ArrowRight size={18} />
            </a>
          </div>
        ) : (
          <CustomRouteRequest
            pickup={pickup!}
            destination={destination!}
            date={date}
            travellers={travellers}
            service={service}
            journeyContext={journeyContext}
          />
        )
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <div
              key={`${route.origin}-${route.destination}`}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {route.origin} → {route.destination}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {route.estimatedDuration ? <span className="rounded-full bg-slate-200 px-3 py-1">{route.estimatedDuration}</span> : null}
                {route.seasonalStatus ? <span className="rounded-full bg-slate-200 px-3 py-1">{route.seasonalStatus}</span> : null}
              </div>
              <div className='flex flex-wrap items-end justify-between gap-3 mt-4'>
                <p className="mt-3 text-sm text-slate-600">
                  {route.startingFare ? (
                    <>
                      Starting from{' '}
                      <span className="text-3xl block font-bold text-apex-500">₹{route.startingFare.toLocaleString('en-IN')}</span>
                    </>
                  ) : (
                    'Get a Custom Quote'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setBookingRoute({ origin: route.origin, destination: route.destination, routeMeta: route })}
                  className="cursor-hover mt-4 inline-flex items-center gap-2 text-sm font-semibold text-apex-600 transition-colors duration-300 ease-in-out hover:text-apex-700"
                >
                  Plan This Route <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className='flex justify-center mt-12'>
        <RouteDiscoveryLauncher
          featuredRoutes={featuredRoutes}
          onSelectRoute={(origin, dest) => {
            const routeMeta = allRoutes.find((route) => route.origin === origin && route.destination === dest);
            setBookingRoute({ origin, destination: dest, routeMeta });
          }}
        />
      </div>

      {bookingRoute ? (
        <RouteBookingPopup
          origin={bookingRoute.origin}
          destination={bookingRoute.destination}
          routeMeta={bookingRoute.routeMeta}
          allowedServices={allowedServices}
          vehiclesByService={vehiclesByService}
          journeyContext={journeyContext}
          onClose={() => setBookingRoute(null)}
          onViewDetails={handleViewDetails}
          onRequestVehicle={handleRequestVehicle}
          onRequestCustomTransport={handleRequestCustomTransport}
        />
      ) : null}

      {selectedVehicle ? (
        <TransportDetail
          vehicle={selectedVehicle.vehicle}
          pickup={selectedVehicle.trip.pickup}
          destination={selectedVehicle.trip.destination}
          date={selectedVehicle.trip.date}
          travellers={selectedVehicle.trip.travellers}
          returnDate={selectedVehicle.trip.returnDate || undefined}
          journeyContext={journeyContext}
          ctaLabel="Select Vehicle"
          onRequestVehicle={(vehicle) => handleRequestVehicle(vehicle, selectedVehicle.trip)}
          onClose={() => setSelectedVehicle(null)}
        />
      ) : null}
    </section>
  );
}
