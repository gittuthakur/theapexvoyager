import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Home,
  Landmark,
  MapPinned,
  Sparkles,
  TentTree,
  TreePine,
  Users,
  Waves,
  type LucideIcon
} from 'lucide-react';
import HeroSection, { type HeroSectionData } from '@/components/modules/HeroSection';
import StaysHeroSearch from '@/components/modules/StaysHeroSearch';
import StayTypeCard from '@/components/modules/StayTypeCard';
import DestinationStayCard from '@/components/modules/DestinationStayCard';
import StayMoodCard from '@/components/modules/StayMoodCard';
import PropertyCard from '@/components/modules/PropertyCard';
import { ButtonLink } from '@/components/ui/Button';
import { getHotels } from '@/lib/hotels';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import { siteConfig } from '@/config/site.config';
import { images } from '@/config/images.config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apex Stays — Stay Somewhere Worth Remembering | The Apex Voyager',
  description: 'From mountain-view hotels to hidden homestays, discover stays that make your Himalayan journey unforgettable.',
  alternates: { canonical: '/stays' }
};

// Same signature banner treatment as the Journeys hero — full-bleed mountain image,
// the light cinematic overlay (overlayClassName below), and the shared badge/heading
// hierarchy, so Apex Stays reads as part of the same product rather than a bolt-on.
const staysHeroData: HeroSectionData = {
  badge: {
    icon: <Home size={16} className="hidden" />,
    text: 'Apex Stays'
  },
  titleTop: 'Stay Somewhere',
  titleBottomPrefix: '',
  titleHighlight: 'Worth Remembering',
  subtitle: 'From mountain-view hotels to hidden homestays, discover stays that make your Himalayan journey unforgettable.',
  media: {
    src: images.experiences.riversideCamp,
    alt: 'Himalayan mountain-view stay overlooking a river valley'
  }
};

// Every label resolves to a real, working destination — either its dedicated
// /stays/[slug] page when a matching curated destination exists, or the live
// free-text destination search otherwise (never a fabricated route).
const POPULAR_DESTINATION_LABELS = ['Manali', 'Spiti Valley', 'Shimla', 'Kashmir', 'Rishikesh', 'Tirthan Valley'];

async function resolveDestinationHref(label: string): Promise<string> {
  const slug = label.toLowerCase().replace(/\s+/g, '-');
  const destination = await getCuratedDestinationBySlug(slug);
  return destination ? `/stays/${slug}` : `/stays/search?destination=${encodeURIComponent(label)}`;
}

const UNIQUE_STAYS: Array<{ label: string; description: string; href: string; icon: LucideIcon }> = [
  { label: 'Hidden Cabins', description: 'Tucked away, wood-panelled retreats.', href: '/stays/cabins', icon: Home },
  { label: 'Riverside Retreats', description: 'Fall asleep to the sound of the river.', href: '/stays/search?mood=riverside', icon: Waves },
  { label: 'Forest Stays', description: 'Deep among the deodar and pine.', href: '/stays/search?mood=deep-in-nature', icon: TreePine },
  { label: 'Village Homestays', description: 'Everyday life with a local family.', href: '/stays/search?mood=village-living', icon: Users },
  { label: 'Heritage Properties', description: 'Colonial-era manors and forts.', href: '/stays/heritage', icon: Landmark },
  { label: 'Treehouses', description: 'Raised hideouts among the pines.', href: '/stays/treehouses', icon: TentTree },
  { label: 'Remote Mountain Stays', description: 'Away from the well-trodden trail.', href: '/stays/search?mood=offbeat-escape', icon: Sparkles }
];

const WHY_APEX_STAYS: Array<{ title: string; description: string; icon: LucideIcon }> = [
  { title: 'Verified Stays', description: 'Every Apex Verified property is checked before it earns the badge.', icon: BadgeCheck },
  { title: 'Local Expertise', description: 'Curated by people who actually know the Himalayas.', icon: MapPinned },
  { title: 'Curated Recommendations', description: 'Handpicked for location, character and experience — not volume.', icon: Sparkles },
  { title: '24/7 Travel Support', description: 'Real help on WhatsApp, before and during your stay.', icon: Clock }
];

export default async function StaysPage() {
  const allHotels = await getHotels();
  const curated = allHotels.filter((hotel) => hotel.featured);
  const popularDestinationHrefs = await Promise.all(POPULAR_DESTINATION_LABELS.map(resolveDestinationHref));

  return (
    <main className="">
      {/* 1. Hero — same banner component as Home/Journeys, with a pill-styled search bar */}
      <HeroSection
        data={staysHeroData}
        searchBar={<StaysHeroSearch />}
        overlayClassName="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-white/50"
        variant="dark"
      />

      <section className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="font-semibold text-slate-600">Popular:</span>
          {POPULAR_DESTINATION_LABELS.map((label, index) => (
            <Link
              key={label}
              href={popularDestinationHrefs[index]}
              className="cursor-hover rounded-full font-medium border border-slate-400 bg-white px-5 py-2.5 text-slate-600 transition-colors duration-300 ease-in-out hover:border-apex-400/90 hover:text-slate-900"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Stay types */}
      <section className='py-12 lg:py-16'>
        <section className="mx-auto px-6 max-w-[1440px]">
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Stay Your Way</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">What kind of stay fits you?</h2>
          <div className="mt-6">
            <StayTypeCard />
          </div>
        </section>
      </section>

      {/* 3. Destination discovery */}
      <section className='bg-slate-100 py-12 lg:py-16'>
        <section className="mx-auto px-6 max-w-[1440px]">
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Stay Where You Want to Be</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Iconic destinations and hidden mountain escapes</h2>
          <div className="mt-6">
            <DestinationStayCard hotels={allHotels} />
          </div>
        </section>
      </section>

      {/* 4. Curated stays */}
      {curated.length > 0 ? (
        <section className="mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Places Worth Staying For</p>
            <h2 className="mx-auto mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
              Handpicked for Location, Character and Experience
            </h2>
            <p className="mx-auto mt-4 text-slate-600">
              Every stay on this list earned its place — chosen not for volume, but for the view, the welcome, and the
              story it adds to your journey.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {curated.map((hotel, index) => (
              <PropertyCard key={hotel.slug} hotel={hotel} priority={index < 3} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 5. Stay by feeling */}
      <section className='bg-slate-100 py-12 lg:py-16'>
        <section className="mx-auto px-6 max-w-[1440px]">
          <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">How Do You Want to Stay?</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Find a stay that feels like you</h2>
          <div className="mt-6">
            <StayMoodCard />
          </div>
        </section>
      </section>

      {/* 6. Unique Himalayan stays — editorial, deliberately distinct from the
          image-grid sections above so Apex Stays doesn't read as a generic OTA. */}
      <section className="mx-auto px-6 py-12 lg:py-16 max-w-[1440px]">
        <p className="text-md font-semibold uppercase tracking-[0.16em] text-apex-600">Unique Himalayan Stays</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Not your average hotel search</h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {UNIQUE_STAYS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="cursor-hover group flex items-start gap-3 rounded-2xl border border-slate-300 bg-white p-5 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-apex-400/50 hover:shadow-md"
              >
                <span className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-apex-100 text-apex-600 transition-colors duration-300 ease-in-out group-hover:bg-apex-500 group-hover:text-white">
                  <Icon size={24} />
                </span>
                <span>
                  <span className="block text-lg font-semibold text-slate-900">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 7. Why Apex Stays */}
      <section className='bg-slate-100 py-12 lg:py-16'>
        <section className="mx-auto px-6 max-w-[1440px]">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why Apex Stays</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_APEX_STAYS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-300 bg-white p-6">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600">
                    <Icon size={24} />
                  </span>
                  <p className="mt-4 text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      {/* 8. Final CTA */}
      <section className="mx-auto mt-16 mb-8 max-w-6xl rounded-3xl bg-apex-50 border border-slate-300 px-8 py-10 text-center sm:px-12">
        <h2 className="text-2xl font-bold text-slate-700 sm:text-3xl">Find Your Place in the Mountains</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href="/stays/search" size="lg">
            Explore All Stays
            <ArrowRight size={20} />
          </ButtonLink>
          <Link
            href={siteConfig.bookNowHref}
            className="cursor-hover text-lg font-semibold text-apex-500 underline-offset-4 transition hover:underline"
          >
            Plan My Journey
          </Link>
        </div>
      </section>
    </main>
  );
}
