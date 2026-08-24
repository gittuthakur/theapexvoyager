import { Fragment, type ReactNode } from 'react';
import type { Metadata } from 'next';
import InnerHeroBanner from '@/components/modules/InnerHeroBanner';
import {
  TransportHeroSearch,
  ChooseRideStyle,
  TransportServices,
  VehicleCategories,
  FourByFourVehicles,
  SelfDriveRentals,
  BikeRentals,
  TransportResults,
  RouteExplorer,
  LocalMobility,
  VehicleRecommendation,
  WhyBookTransport,
  HowTransportBookingWorks,
  TransportFAQ,
  TransportPartnerCTA,
  TransportSearchProvider,
  TransportSearchResultsBar
} from '@/components/modules/transport';
import { images } from '@/config/images.config';
import { getVehicles, getRoutes, getVehiclesByDestinationSlug } from '@/lib/transport';
import { findDestinationByLocationText } from '@/lib/destinations';
import { categoriesForMotorcycleType, serviceTypeFromUrlSlug, SERVICE_TYPE_UI } from '@/config/transportServiceTypes.config';

export const metadata: Metadata = {
  title: 'Travel Transport & Private Transfers | The Apex Voyager',
  description: 'Book private transfers, SUVs, group vehicles and customised Himalayan transport with The Apex Voyager.'
};

interface TransportPageProps {
  searchParams: Promise<{
    pickup?: string;
    destination?: string;
    date?: string;
    time?: string;
    travellers?: string;
    vehicle?: string;
    service?: string;
    returnDate?: string;
    returnTime?: string;
    returnLocation?: string;
    driveMode?: string;
    quantity?: string;
    tripType?: string;
    tripDuration?: string;
    from?: string;
    journeySlug?: string;
    transmission?: string;
    minSeats?: string;
    maxPrice?: string;
    bikeType?: string;
    /** Set only by a real Hero-search submission (TransportHeroSearch.tsx) — never by
     *  a discovery-card click. Distinguishes an intentional search from browsing; see
     *  "SEARCH RESULTS MODE" below. */
    searched?: string;
  }>;
}

/** e.g. "Manali → Chandigarh · 27 Aug – 30 Aug" / "Manali · 27 Aug" — only the parts
 *  that were actually provided; empty string when nothing was. */
function buildSearchSummary(pickup?: string, destination?: string, date?: string, returnDate?: string): string {
  const route = pickup && destination ? `${pickup} → ${destination}` : destination || pickup || '';
  const dates = date && returnDate ? `${date} – ${returnDate}` : date || '';
  return [route, dates].filter(Boolean).join(' · ');
}

export default async function TransportPage({ searchParams }: TransportPageProps) {
  const {
    pickup,
    destination,
    date,
    travellers,
    vehicle,
    service: serviceSlug,
    returnDate,
    returnTime,
    returnLocation,
    driveMode,
    quantity,
    tripType,
    tripDuration,
    from,
    journeySlug,
    transmission,
    minSeats,
    maxPrice,
    bikeType,
    searched
  } = await searchParams;

  // Search Results Mode: only a real Hero-search submission sets `searched=1` — a
  // discovery-card click (Choose Your Ride Style / Pick the Right Fit / We Don't Just
  // Arrange a Vehicle) updates TransportSearchContext/the URL too but never this flag,
  // so simply browsing never leaves Discovery Mode (brief §2, §10, Test G). In this
  // mode the page shows only the searched service's own results, hiding every other
  // discovery/marketing section (brief §1 Mode B, §4).
  const isSearchResultsMode = searched === '1';

  // "How do you want to travel?" is now the first decision (service, always resolved
  // to a real value — defaults to Cab with Driver so a fresh page load is unchanged).
  // Every standing catalog below (Chauffeur/4x4/Self-Drive/Bike) always shows its own
  // full, unfiltered subset for browsing — "never mix" (brief §12) is satisfied because
  // each section only ever queries its own service type, not by hiding sections from
  // each other. Submitting the hero search additionally narrows *only the section
  // matching the active service* by whatever extra fields were submitted.
  const service = serviceTypeFromUrlSlug(serviceSlug);

  // Vehicles are filtered by category only — serviceAreas are broad regions (Himachal
  // Pradesh, Kashmir, Uttarakhand), while pickup/destination are specific city names, so
  // matching one against the other would false-negative on nearly every real search
  // (e.g. "Manali" never appearing verbatim in a "Himachal Pradesh" service area). Route
  // matching below is genuinely city-level and stays filtered by pickup/destination.
  const resolvedDestination = destination ? await findDestinationByLocationText(destination) : undefined;

  // Self-Drive's "pickup destination" filter: resolves to the destination's real
  // `state` (e.g. "Himachal Pradesh") rather than matching city text directly against
  // the broad `serviceAreas` strings — avoids the false-negative the comment above
  // describes, since every seeded self-drive vehicle's serviceAreas already lists that
  // exact state name.
  const resolvedPickup = pickup ? await findDestinationByLocationText(pickup) : undefined;

  const hasActiveFilter =
    Boolean(vehicle) || Boolean(pickup) || Boolean(destination) || Boolean(date) || Boolean(returnDate) || Boolean(driveMode);

  const fourByFourWithDriverFilter =
    service === '4x4 / Mountain Vehicle' && driveMode ? driveMode === 'With Driver' : undefined;

  const selfDriveIsActiveService = service === 'Self-Drive Car';
  const bikeIsActiveService = service === 'Bike / Motorcycle';
  const bikeTypeCategories = categoriesForMotorcycleType(bikeType);

  const [
    chauffeurVehicles,
    routes,
    allRoutes,
    fourByFourVehicles,
    allSelfDriveVehicles,
    filteredSelfDriveVehicles,
    allBikeVehicles,
    filteredBikeVehicles,
    localMobilityVehicles
  ] = await Promise.all([
      getVehicles({
        serviceTypeIn: ['Cab with Driver', 'Group Transport'],
        category: service === 'Cab with Driver' || service === 'Group Transport' ? vehicle : undefined
      }),
      getRoutes({ origin: pickup, destination }),
      // Unfiltered — feeds RouteExplorer's "View All Routes" quick-pick list, which must
      // stay independent of whatever route was just searched.
      getRoutes(),
      getVehicles({
        serviceType: '4x4 / Mountain Vehicle',
        withDriver: fourByFourWithDriverFilter
      }),
      // Unfiltered — feeds the main-page teaser (capped in SelfDriveRentals) and the
      // full-results filter bar's real, derived option lists (never a fabricated list).
      getVehicles({ serviceType: 'Self-Drive Car' }),
      // Only meaningfully different from the list above once a real filter is set.
      selfDriveIsActiveService
        ? getVehicles({
            serviceType: 'Self-Drive Car',
            category: vehicle,
            transmission,
            minSeats: minSeats ? Number(minSeats) || undefined : undefined,
            maxPrice: maxPrice ? Number(maxPrice) || undefined : undefined,
            serviceArea: resolvedPickup?.state
          })
        : Promise.resolve([]),
      // Unfiltered — feeds the main-page teaser's motorcycle-TYPE cards (real example
      // models are derived from this list, never a fabricated/hardcoded one).
      getVehicles({ serviceType: 'Bike / Motorcycle' }),
      // Only meaningfully different from the list above once a real filter is set.
      // `categoryIn` (from a type-card click) takes precedence over the Hero's own
      // single-category `vehicle` dropdown when both are somehow present.
      bikeIsActiveService
        ? getVehicles({
            serviceType: 'Bike / Motorcycle',
            categoryIn: bikeTypeCategories,
            category: bikeTypeCategories ? undefined : vehicle
          })
        : Promise.resolve([]),
      resolvedDestination ? getVehiclesByDestinationSlug(resolvedDestination.slug) : Promise.resolve([])
    ]);

  const selfDriveVehicles = selfDriveIsActiveService ? filteredSelfDriveVehicles : allSelfDriveVehicles;
  const bikeVehicles = bikeIsActiveService ? filteredBikeVehicles : allBikeVehicles;
  const selfDriveAvailableTransmissions = Array.from(
    new Set(allSelfDriveVehicles.map((v) => v.transmission).filter((t): t is 'Manual' | 'Automatic' => Boolean(t)))
  );
  const selfDriveAvailableSeatCounts = Array.from(new Set(allSelfDriveVehicles.map((v) => v.seats))).sort((a, b) => a - b);

  const fourByFourSearchActive = service === '4x4 / Mountain Vehicle' && hasActiveFilter;
  const selfDriveSearchActive = selfDriveIsActiveService && hasActiveFilter;
  const bikeSearchActive = bikeIsActiveService && hasActiveFilter;
  const localSearchActive = service === 'Local Mobility' && hasActiveFilter;

  // Attribution when this visit came from a specific Journey/Package's "Plan
  // Transport" link — preserved into every section's request/WhatsApp flow instead of
  // being display-only.
  const journeyContext = { from, journeySlug };

  const chauffeurSummary = hasActiveFilter && (service === 'Cab with Driver' || service === 'Group Transport') ? buildSearchSummary(pickup, destination, date, returnDate) : '';
  const fourByFourSummary = fourByFourSearchActive ? buildSearchSummary(pickup, destination, date, returnDate) : '';
  const selfDriveSummary = selfDriveSearchActive ? buildSearchSummary(pickup, undefined, date, returnDate) : '';
  const bikeSummary = bikeSearchActive ? buildSearchSummary(pickup, undefined, date, returnDate) : '';
  const localSummary = localSearchActive ? buildSearchSummary(undefined, destination, date, undefined) : '';

  // Search Results Mode summary bar (brief §6/§9) — resolves to whichever single
  // service is active, mirroring the same per-section `active`/summary/count values
  // used below so the bar and the results it sits above never disagree.
  const resultsBarServiceLabel = SERVICE_TYPE_UI.find((entry) => entry.value === service)?.label ?? service;
  const resultsBarSummary =
    service === 'Cab with Driver' || service === 'Group Transport' || service === 'Local Taxi'
      ? chauffeurSummary
      : selfDriveIsActiveService
        ? selfDriveSummary
        : service === '4x4 / Mountain Vehicle'
          ? fourByFourSummary
          : bikeIsActiveService
            ? bikeSummary
            : service === 'Local Mobility'
              ? localSummary
              : '';
  const resultsBarCount =
    service === 'Cab with Driver' || service === 'Group Transport' || service === 'Local Taxi'
      ? chauffeurVehicles.length
      : selfDriveIsActiveService
        ? selfDriveVehicles.length
        : service === '4x4 / Mountain Vehicle'
          ? fourByFourVehicles.length
          : bikeIsActiveService
            ? bikeVehicles.length
            : service === 'Local Mobility'
              ? localMobilityVehicles.length
              : 0;

  // Each of the 5 inventory sections stays exactly as it renders today — this only
  // reorders which one appears first, so a selected service's own inventory is never
  // stuck behind unrelated sections. `active` mirrors each section's own existing
  // `isActiveService`/`isLocalServiceActive` computation above (Local Mobility uses
  // the plain service check here, not `localSearchActive`'s extra `hasActiveFilter`
  // requirement, since picking Local Transport as a service should prioritize it
  // immediately, independent of whether a destination was also searched). Since the
  // default `service` is 'Cab with Driver' (line 94's fallback), a bare `/transport`
  // visit keeps today's exact order — only an explicit selection reprioritizes.
  const inventorySections: Array<{ key: string; active: boolean; node: ReactNode }> = [
    {
      key: 'cab-group',
      active: service === 'Cab with Driver' || service === 'Group Transport' || service === 'Local Taxi',
      node: (
        <TransportResults
          vehicles={chauffeurVehicles}
          pickup={pickup}
          destination={destination}
          date={date}
          travellers={travellers}
          hasActiveFilter={hasActiveFilter}
          journeyContext={journeyContext}
          searchSummary={chauffeurSummary || undefined}
          service={service}
          vehicleCategory={vehicle}
          tripType={tripType}
          isActiveService={service === 'Cab with Driver' || service === 'Group Transport'}
        />
      )
    },
    {
      key: 'self-drive',
      active: selfDriveIsActiveService,
      node: (
        <SelfDriveRentals
          vehicles={selfDriveVehicles}
          pickup={selfDriveSearchActive ? pickup : undefined}
          date={selfDriveSearchActive ? date : undefined}
          returnDate={selfDriveSearchActive ? returnDate : undefined}
          journeyContext={journeyContext}
          activeSearchEmptyMessage={
            selfDriveIsActiveService && selfDriveVehicles.length === 0
              ? vehicle
                ? `No ${vehicle} rentals are currently listed for this trip.`
                : "We couldn't find a verified vehicle matching this trip yet."
              : undefined
          }
          searchSummary={selfDriveSummary || undefined}
          isActiveService={selfDriveIsActiveService}
          transmission={transmission}
          minSeats={minSeats ? Number(minSeats) || undefined : undefined}
          maxPrice={maxPrice ? Number(maxPrice) || undefined : undefined}
          availableTransmissions={selfDriveAvailableTransmissions}
          availableSeatCounts={selfDriveAvailableSeatCounts}
          vehicleCategory={selfDriveIsActiveService ? vehicle : undefined}
        />
      )
    },
    {
      key: '4x4',
      active: service === '4x4 / Mountain Vehicle',
      node: (
        <FourByFourVehicles
          vehicles={fourByFourVehicles}
          pickup={fourByFourSearchActive ? pickup : undefined}
          destination={fourByFourSearchActive ? destination : undefined}
          date={fourByFourSearchActive ? date : undefined}
          returnDate={fourByFourSearchActive ? returnDate : undefined}
          travellers={fourByFourSearchActive ? travellers : undefined}
          driveMode={fourByFourSearchActive ? driveMode : undefined}
          journeyContext={journeyContext}
          activeSearchEmptyMessage={fourByFourSearchActive && fourByFourVehicles.length === 0 ? "We couldn't find a verified vehicle matching this trip yet." : undefined}
          searchSummary={fourByFourSummary || undefined}
          isActiveService={service === '4x4 / Mountain Vehicle'}
        />
      )
    },
    {
      key: 'bike',
      active: bikeIsActiveService,
      node: (
        <BikeRentals
          vehicles={bikeVehicles}
          pickup={bikeSearchActive ? pickup : undefined}
          date={bikeSearchActive ? date : undefined}
          returnDate={bikeSearchActive ? returnDate : undefined}
          quantity={bikeSearchActive && quantity ? Number(quantity) || undefined : undefined}
          journeyContext={journeyContext}
          activeSearchEmptyMessage={bikeIsActiveService && bikeVehicles.length === 0 ? "We couldn't find a verified vehicle matching this trip yet." : undefined}
          searchSummary={bikeSummary || undefined}
          isActiveService={bikeIsActiveService}
        />
      )
    },
    {
      key: 'local',
      active: service === 'Local Mobility',
      node: (
        <LocalMobility
          vehicles={localMobilityVehicles}
          destinationTitle={resolvedDestination?.title}
          destinationSlug={resolvedDestination?.slug}
          date={date}
          travellers={travellers}
          journeyContext={journeyContext}
          isLocalServiceActive={localSearchActive}
        />
      )
    }
  ];
  const orderedInventorySections = [...inventorySections.filter((s) => s.active), ...inventorySections.filter((s) => !s.active)];
  // Search Results Mode (brief §4): only the searched service's own inventory section
  // renders — never the other 4 catalogs. Discovery Mode is unchanged (all 5, active
  // one first).
  const visibleInventorySections = isSearchResultsMode ? orderedInventorySections.filter((s) => s.active) : orderedInventorySections;

  return (
    <TransportSearchProvider>
      <InnerHeroBanner
        eyebrow="TRAVEL TRANSPORT"
        title="Move Through the"
        highlite="Himalayas, Your Way."
        subtitle="From airport pickups to mountain road journeys, find reliable transport designed around your trip."
        bgImage={images.toursHero}
      >
        <TransportHeroSearch />
      </InnerHeroBanner>

      <main className="space-y-14 py-14">
        {isSearchResultsMode ? (
          <TransportSearchResultsBar
            serviceLabel={resultsBarServiceLabel}
            summary={resultsBarSummary || undefined}
            travellers={travellers}
            vehicle={vehicle}
            resultsCount={resultsBarCount}
          />
        ) : (
          <>
            <ChooseRideStyle />

            <TransportServices />

            <VehicleCategories />
          </>
        )}

        {visibleInventorySections.map((section) => (
          <Fragment key={section.key}>{section.node}</Fragment>
        ))}

        {isSearchResultsMode ? null : (
          <>
            <RouteExplorer
              routes={routes}
              allRoutes={allRoutes}
              pickup={pickup}
              destination={destination}
              date={date}
              travellers={travellers}
              service={service}
              journeyContext={journeyContext}
              chauffeurVehicles={chauffeurVehicles}
              fourByFourVehicles={fourByFourVehicles}
              selfDriveVehicles={allSelfDriveVehicles}
              bikeVehicles={allBikeVehicles}
            />

            <VehicleRecommendation vehicles={[...chauffeurVehicles, ...fourByFourVehicles, ...allSelfDriveVehicles, ...allBikeVehicles]} />

            <WhyBookTransport />

            <HowTransportBookingWorks />

            <TransportFAQ />

            <TransportPartnerCTA />
          </>
        )}
      </main>
    </TransportSearchProvider>
  );
}
