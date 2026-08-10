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
import type { Destination, TourPackage, Testimonial } from '@/types';

const DestinationCarousel = createLazyModule<import('@/components/modules/DestinationCarousel').DestinationCarouselProps>(
  () => import('@/components/modules/DestinationCarousel')
);
const FeatureGrid = createLazyModule<import('@/components/modules/FeatureGrid').FeatureGridProps>(
  () => import('@/components/modules/FeatureGrid')
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
  }
];

const tours: TourPackage[] = [
  {
    slug: 'spiti-circuit',
    title: 'Spiti Circuit',
    category: 'Adventure',
    badge: 'Best Seller',
    location: 'Spiti Valley',
    price: '₹28,500',
    duration: '10 Days / 9 Nights',
    rating: 4.9,
    reviewCount: 140,
    highlights: ['Transport', 'Stays', 'All Meals', 'Expert Guide'],
    description: 'The ultimate high-altitude expedition through remote wilderness and alpine villages.',
    image: images.tours.spitiCircuit,
    destinationSlug: 'spiti-valley',
    featured: true
  },
  {
    slug: 'manali-leh-highway',
    title: 'Manali-Leh Highway',
    category: 'Adventure',
    badge: 'Adventure',
    location: 'Manali → Leh',
    price: '₹32,000',
    duration: '8 Days / 7 Nights',
    rating: 4.8,
    reviewCount: 96,
    description: "A legendary road adventure across India's most iconic mountain highway.",
    image: images.tours.manaliLehHighway,
    destinationSlug: 'manali'
  },
  {
    slug: 'dharamshala-retreat',
    title: 'Dharamshala Retreat',
    category: 'Wellness',
    badge: 'Wellness',
    location: 'Dharamshala',
    price: '₹22,000',
    duration: '6 Days / 5 Nights',
    rating: 4.7,
    reviewCount: 78,
    description: 'Wellness, culture, and mountain trekking in the shadow of the Dhauladhar range.',
    image: images.tours.dharamshalaRetreat,
    destinationSlug: 'dharamshala'
  },
  {
    slug: 'shimla-heritage-walk',
    title: 'Shimla Heritage Walk',
    category: 'Cultural',
    badge: 'Cultural',
    location: 'Shimla',
    price: '₹14,500',
    duration: '4 Days / 3 Nights',
    rating: 4.6,
    reviewCount: 52,
    description: 'Colonial architecture, Mall Road markets, and pine-clad ridge walks.',
    image: images.tours.shimlaHeritageWalk,
    destinationSlug: 'shimla'
  },
  {
    slug: 'kasol-backpacking-trail',
    title: 'Kasol Backpacking Trail',
    category: 'Adventure',
    badge: 'Budget Friendly',
    location: 'Kasol',
    price: '₹11,000',
    duration: '5 Days / 4 Nights',
    rating: 4.5,
    reviewCount: 64,
    description: 'Riverside cafes, Parvati Valley treks, and a laid-back backpacker trail.',
    image: images.tours.kasolBackpacking,
    destinationSlug: 'kasol'
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
    text: 'The Apex Standard · Himachal Expeditions'
  },
  titleTop: 'Expedition Travel',
  titleBottomPrefix: 'At Its ',
  titleHighlight: 'Highest Standard',
  subtitle:
    'Unrivaled luxury treks, off-grid journeys, and curated mountain stays across Himachal Pradesh and the Himalayas.',
  media: {
    src: images.hero,
    alt: 'Luxury Himalayan expedition trek through Spiti Valley and Manali tour packages, Himachal Pradesh, at dusk'
  },
  schema: buildTouristTripSchema({
    name: 'Himachal Pradesh Expedition Tours — The Apex Voyager',
    description:
      'Unrivaled luxury treks, off-grid journeys, and curated mountain stays across Himachal Pradesh and the Himalayas.',
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

export default function HomePage() {
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
        <WhyChooseUs />
        <ImageCtaBanner media={{ src: images.ctaBanner, alt: 'Sunset over Himalayan peaks in Himachal Pradesh' }} />
        <TestimonialSection testimonials={testimonials} />
        <FinalCta />
        <WhatsAppButton destination="the Himalayas" />
      </main>
    </>
  );
}
