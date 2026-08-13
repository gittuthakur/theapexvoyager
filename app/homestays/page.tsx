import Link from 'next/link';
import { Home } from 'lucide-react';
import HeroSection, { type HeroSectionData } from '@/components/modules/HeroSection';
import HotelCard from '@/components/modules/HotelCard';
import { images } from '@/config/images.config';
import { getHotels } from '@/lib/hotels';
import { cn } from '@/lib/utils';
import type { HotelCategory } from '@/types';

export const dynamic = 'force-dynamic';

const homestaysHeroData: HeroSectionData = {
  badge: {
    icon: <Home size={16} className="text-apex-300" />,
    text: 'Beyond Hotels. Into Homes.'
  },
  titleTop: 'Wake Up Inside',
  titleBottomPrefix: 'A Real ',
  titleHighlight: 'Himachali Home',
  subtitle: 'Handpicked homestays and boutique stays run by local families — mountain hospitality no hotel chain can copy.',
  media: {
    src: images.destinations.dharamshala,
    alt: 'Cozy pine-forest homestay in the Himachal mountains'
  }
};

const categoryTabs: Array<{ label: string; value?: HotelCategory }> = [
  { label: 'All Stays' },
  { label: 'Homestays', value: 'Homestay' },
  { label: 'Hotels', value: 'Hotel' },
  { label: 'Resorts', value: 'Resort' },
  { label: 'Villas & Cottages', value: 'Villa' },
  { label: 'Camps & Tents', value: 'Camp' },
  { label: 'Treehouses', value: 'Treehouse' },
  { label: 'Farmstays & Orchards', value: 'Farmstay' },
  { label: 'Backpacker Hostels', value: 'Hostel' },
  { label: 'Heritage Properties', value: 'Heritage' },
  { label: 'Guest Houses & Lodges', value: 'GuestHouse' }
];

const validCategories: HotelCategory[] = categoryTabs
  .map((tab) => tab.value)
  .filter((value): value is HotelCategory => Boolean(value));

interface HomestaysPageProps {
  searchParams: Promise<{ category?: string; destination?: string }>;
}

export default async function HomestaysPage({ searchParams }: HomestaysPageProps) {
  const { category, destination } = await searchParams;
  const activeCategory = validCategories.find((value) => value === category);
  const hotels = await getHotels({ category: activeCategory, destination });

  return (
    <>
      <HeroSection data={homestaysHeroData} />

      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <section className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 shadow-glow">
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">Stays catalog</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Hotels, Homestays &amp; More</h2>
            <p className="mt-4 max-w-3xl text-slate-300">
              {destination
                ? `Showing stays near ${destination}.`
                : 'Curated homestays, hotels, resorts, villas, and mountain camps across the Himalayas.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {categoryTabs.map((tab) => {
                const isActive = activeCategory === tab.value;
                const href = tab.value ? `/homestays?category=${tab.value}` : '/homestays';
                return (
                  <Link
                    key={tab.label}
                    href={href}
                    className={cn(
                      'rounded-full px-5 py-2.5 text-sm font-semibold transition',
                      isActive ? 'bg-apex-500 text-white shadow-lg shadow-apex-500/30' : 'bg-white/5 text-slate-300 hover:text-white'
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {hotels.length > 0 ? (
              hotels.map((hotel) => <HotelCard key={hotel.slug} hotel={hotel} />)
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-center text-slate-300 shadow-glow xl:col-span-2">
                <p className="text-lg font-semibold text-white">No stays match your filters.</p>
                <p className="mt-3">Try a different category or broaden your destination search.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
