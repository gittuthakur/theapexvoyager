import type { Metadata } from 'next';
import InnerHeroBanner from '@/components/modules/InnerHeroBanner';
import {
  TransportHeroSearch,
  TransportServices,
  VehicleCategories,
  TransportResults,
  RouteExplorer,
  VehicleRecommendation,
  TransportFAQ
} from '@/components/modules/transport';
import { images } from '@/config/images.config';
import { getVehicles, getRoutes } from '@/lib/transport';

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
    from?: string;
    journeySlug?: string;
  }>;
}

export default async function TransportPage({ searchParams }: TransportPageProps) {
  const { pickup, destination, date, travellers, vehicle, from, journeySlug } = await searchParams;

  // Vehicles are filtered by category only — serviceAreas are broad regions (Himachal
  // Pradesh, Kashmir, Uttarakhand), while pickup/destination are specific city names, so
  // matching one against the other would false-negative on nearly every real search
  // (e.g. "Manali" never appearing verbatim in a "Himachal Pradesh" service area). Route
  // matching below is genuinely city-level and stays filtered by pickup/destination.
  const [vehicles, routes] = await Promise.all([
    getVehicles({ category: vehicle }),
    getRoutes({ origin: pickup, destination })
  ]);

  const hasActiveFilter = Boolean(vehicle);

  return (
    <>
      <InnerHeroBanner
        eyebrow="TRAVEL TRANSPORT"
        title="Move Through the"
        highlite="Himalayas, Your Way."
        subtitle="From airport pickups to mountain road journeys, find reliable transport designed around your trip."
        bgImage={images.toursHero}
      >
        <TransportHeroSearch
          initialPickup={pickup}
          initialDrop={destination}
          initialDate={date}
          initialTravelers={travellers ? Number(travellers) || 2 : undefined}
          initialVehicle={vehicle}
        />
      </InnerHeroBanner>

      <main className="space-y-14 py-14">
        <TransportServices />

        <VehicleCategories vehicles={vehicles} />

        <TransportResults
          vehicles={vehicles}
          pickup={pickup}
          destination={destination}
          date={date}
          travellers={travellers}
          hasActiveFilter={hasActiveFilter}
          journeyContext={{ from, journeySlug }}
        />

        <RouteExplorer routes={routes} />

        <VehicleRecommendation vehicles={vehicles} />

        <TransportFAQ />
      </main>
    </>
  );
}
