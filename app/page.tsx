import { Compass } from 'lucide-react';
import HeroSection, { type HeroSectionData } from '@/components/modules/HeroSection';
import BookingWidget from '@/components/modules/BookingWidget';
import TrustBadges from '@/components/modules/TrustBadges';
import StatsBar from '@/components/modules/StatsBar';
import WhyChooseUs from '@/components/modules/WhyChooseUs';
import ImageCtaBanner from '@/components/modules/ImageCtaBanner';
import FinalCta from '@/components/modules/FinalCta';
import { createLazyModule } from '@/components/layout';
import WhatsAppButton from '@/components/modules/WhatsAppButton';
import { siteConfig } from '@/config/site.config';
import { images } from '@/config/images.config';
import { buildTouristTripSchema } from '@/lib/schema';
import { getTours } from '@/lib/tours';
import type { Destination, Testimonial } from '@/types';

// Tours now come live from MongoDB, so this page can't be statically prerendered at build time.
export const dynamic = 'force-dynamic';

const DestinationCarousel = createLazyModule<import('@/components/modules/DestinationCarousel').DestinationCarouselProps>(
  () => import('@/components/modules/DestinationCarousel')
);
const FeatureGrid = createLazyModule<import('@/components/modules/FeatureGrid').FeatureGridProps>(
  () => import('@/components/modules/FeatureGrid')
);
const ExploreStays = createLazyModule<import('@/components/modules/ExploreStays').ExploreStaysProps>(
  () => import('@/components/modules/ExploreStays')
);
const TestimonialSection = createLazyModule<import('@/components/modules/TestimonialSection').TestimonialSectionProps>(
  () => import('@/components/modules/TestimonialSection'),
  { skeletonCount: 3 }
);

const destinations: Destination[] = [
  {
    slug: 'manali',
    title: 'Manali',
    category: 'Most Popular',
    description: 'Snow peaks, river valleys, and adventure sports awaiting every traveler.',
    toursCount: 24,
    image: images.destinations.manali
  },
  {
    slug: 'kinnaur',
    title: 'Kinnaur',
    category: 'Most Popular',
    description: 'Snow peaks, river valleys, and adventure sports awaiting every traveler.',
    toursCount: 24,
    image: images.destinations.kinnaur
  },
  {
    slug: 'spiti-valley',
    title: 'Spiti Valley',
    category: 'Adventure',
    description: 'Remote high-altitude desert with ancient monasteries and dramatic lunar landscapes.',
    toursCount: 18,
    image: images.destinations.spitiValley
  },
  {
    slug: 'dharamshala',
    title: 'Dharamshala',
    category: 'Wellness',
    description: 'Pine forests and sweeping Himalayan views, ideal for retreats and trekking.',
    toursCount: 15,
    image: images.destinations.dharamshala
  },
  {
    slug: 'shimla',
    title: 'Shimla',
    category: 'Colonial Charm',
    description: 'Pine-clad ridgelines and heritage architecture along the historic Mall Road.',
    toursCount: 20,
    image: images.destinations.shimla
  },
  {
    slug: 'kasol',
    title: 'Kasol',
    category: 'Riverside',
    description: 'A laid-back riverside village tucked into the Parvati Valley, popular with trekkers.',
    toursCount: 12,
    image: images.destinations.kasol
  },
  {
    slug: 'bir-billing',
    title: 'Bir Billing',
    category: 'Adventure',
    description: "India's paragliding capital, with wide valley views and a laid-back Tibetan-influenced village.",
    toursCount: 9,
    image: images.destinations.manali
  },
  {
    slug: 'tirthan-valley',
    title: 'Tirthan Valley',
    category: 'Offbeat',
    description: 'Trout-filled rivers and forest trails on the edge of the Great Himalayan National Park.',
    toursCount: 8,
    image: images.destinations.kasol
  },
  {
    slug: 'sangla-valley',
    title: 'Sangla Valley',
    category: 'Adventure',
    description: 'Apple orchards and apricot groves along the Baspa river, deep in the Kinnaur Himalayas.',
    toursCount: 7,
    image: images.destinations.kinnaur
  },
  {
    slug: 'chamba',
    title: 'Chamba',
    category: 'Colonial Charm',
    description: 'Ancient temples and hillside palaces in one of Himachal’s oldest princely towns.',
    toursCount: 10,
    image: images.destinations.shimla
  }
];

const testimonials: Testimonial[] = [
  {
    id: 'ananya-sharma',
    author: 'Ananya Sharma',
    location: 'Bangalore, India',
    rating: 5,
    quote:
      "Spiti Circuit with Apex was the best 10 days of my life. Every detail was perfect — the homestays, the food, the guides. They delivered an experience I didn't think was possible in India.",
    tourTitle: 'Spiti Valley Expedition',
    tripDate: 'Oct 2025',
    category: 'Adventure',
    featured: true
  },
  {
    id: 'vikram-mehra',
    author: 'Vikram Mehra',
    location: 'Manali, India',
    rating: 5,
    quote: 'True local access and unmatched quality. No one else compares.',
    category: 'Trekking'
  },
  {
    id: 'rohit-kumar',
    author: 'Rohit Kumar',
    location: 'Kullu Rafting',
    rating: 5,
    quote: 'The river rafting was intense and perfectly organized. 10/10 would do again.',
    category: 'Adventure'
  },
  {
    id: 'priya-nair',
    author: 'Priya Nair',
    location: 'Dharamshala',
    rating: 5,
    quote: 'A life-changing retreat, my parents came back completely transformed.',
    category: 'Family'
  },
  {
    id: 'karan-verma',
    author: 'Karan Verma',
    location: 'Shimla',
    rating: 4.8,
    quote: 'The heritage walk was so well curated — our guide knew every alley of Mall Road.',
    category: 'Cultural'
  },
  {
    id: 'meera-iyer',
    author: 'Meera Iyer',
    location: 'Kasol',
    rating: 4.9,
    quote: 'Backpacking Kasol with Apex felt effortless. Every stay and cafe stop was on point.',
    category: 'Adventure'
  },
  {
    id: 'arjun-nair',
    author: 'Arjun Nair',
    location: 'Kinnaur',
    rating: 5,
    quote: 'Took my whole family trekking through Kinnaur — safe, scenic, and unforgettable.',
    category: 'Family'
  }
];

const heroData: HeroSectionData = {
  badge: {
    icon: <Compass size={16} className="text-apex-300" />,
    text: 'Real Himachal. Rarely Found.'
  },
  titleTop: 'Escape to the',
  titleBottomPrefix: 'Quiet Side of ',
  titleHighlight: 'the Mountains',
  subtitle:
    'Handpicked homestays, remote valleys, and slow mountain living — the Himachal that most travelers never discover.',
  media: {
    src: images.hero,
    alt: 'Luxury Himalayan expedition trek through Spiti Valley and Manali tour packages, Himachal Pradesh, at dusk'
  },
  schema: buildTouristTripSchema({
    name: 'Himachal Pradesh Expedition Tours — The Apex Voyager',
    description:
      'Handpicked homestays, remote valleys, and slow mountain living across Himachal Pradesh and the Himalayas.',
    image: `${siteConfig.url}${images.hero}`,
    url: siteConfig.url,
    priceFrom: { amount: 28500, currency: 'INR' },
    ratingValue: Number(
      (testimonials.reduce((sum, testimonial) => sum + testimonial.rating, 0) / testimonials.length).toFixed(1)
    ),
    reviewCount: testimonials.length,
    areaServed: destinations.map((destination) => destination.title)
  })
};

export default async function HomePage() {
  const tours = await getTours();

  return (
    <>
      <HeroSection data={heroData}>
        <BookingWidget />
        <TrustBadges />
      </HeroSection>

      <StatsBar />

      <main>
        <DestinationCarousel destinations={destinations} />
        <FeatureGrid tours={tours} />
        <ExploreStays />
        <WhyChooseUs />
        <ImageCtaBanner media={{ src: images.ctaBanner, alt: 'Sunset over Himalayan peaks in Himachal Pradesh' }} />
        <TestimonialSection testimonials={testimonials} />
        <FinalCta />
        <WhatsAppButton destination="the Himalayas" />
      </main>
    </>
  );
}
