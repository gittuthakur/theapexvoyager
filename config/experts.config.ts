import { images } from '@/config/images.config';
import type { TravelExpert } from '@/types/expert';

/**
 * Static fallback catalog for the Travel Experts directory — used by lib/experts.ts
 * when the database is unreachable or the `Expert` collection hasn't been seeded yet
 * (same role as config/packages.config.ts for Journeys). These are illustrative
 * portfolio profiles with invented, generic names; `profileImage` reuses an existing
 * destination photo from config/images.config.ts as a region banner (there is no
 * dedicated headshot photography in this project), not a fabricated likeness of a
 * real person. `destinationSlugs` and `journeySlugs` reference real entries in
 * config/destinations.config.ts and config/packages.config.ts — no invented places
 * or trips. Deliberately excludes rating/review/years-of-experience fields, since
 * none of that data is real (see AGENTS.md: never show fabricated trust signals).
 */
export const travelExperts: TravelExpert[] = [
  {
    slug: 'spiti-kinnaur-specialist',
    name: 'Aditya Sharma',
    role: 'Himalayan Road Trip Specialist',
    profileImage: images.destinations.spitiValley,
    bio: 'Aditya focuses on routing travelers through the high passes of Spiti and Kinnaur, from Chandratal to Chitkul, with acclimatization-safe pacing, monastery stays, and the offbeat villages most tour operators skip.',
    destinationSlugs: ['spiti-valley', 'kinnaur', 'chitkul', 'sangla-valley'],
    travelStyles: ['Adventure', 'Road Trip', 'Slow Travel'],
    expertise: ['Himalayan Road Trips', 'Offbeat Villages', 'Custom Journeys'],
    languages: ['English', 'Hindi'],
    journeySlugs: ['spiti-valley-adventure'],
    featured: true,
    active: true
  },
  {
    slug: 'kashmir-houseboat-gulmarg-specialist',
    name: 'Priya Verma',
    role: 'Kashmir & Luxury Stays Specialist',
    // Was images.destinations.kasol — a real, named Himachal Pradesh photo, mismatched
    // with this expert's own advertised Kashmir region. Same honest generic fallback
    // used elsewhere for Jammu & Kashmir (see config/images.config.ts).
    profileImage: images.experiences.mountainDusk,
    bio: 'Priya designs Kashmir itineraries around Dal Lake houseboat stays and Gulmarg gondola days, with a focus on private transfers and boutique properties for honeymooners and first-time visitors alike.',
    destinationSlugs: ['gulmarg'],
    travelStyles: ['Couple', 'Luxury'],
    expertise: ['Custom Journeys', 'Luxury Travel'],
    languages: ['English', 'Hindi', 'Kashmiri'],
    journeySlugs: ['kashmir-signature-journey'],
    featured: true,
    active: true
  },
  {
    slug: 'uttarakhand-chardham-rishikesh-specialist',
    name: 'Rohan Negi',
    role: 'Pilgrimage & Adventure Specialist',
    // Was images.destinations.shimla — a real, named Himachal Pradesh photo, mismatched
    // with this expert's own advertised Uttarakhand region. Same honest generic
    // fallback used elsewhere for Uttarakhand (see config/images.config.ts).
    profileImage: images.experiences.himalayanVista,
    bio: 'Rohan coordinates pilgrimage and adventure groups across the Rishikesh river belt and Haridwar, from temple darshan logistics to white-water rafting and camping stays along the Ganges.',
    destinationSlugs: ['rishikesh', 'haridwar'],
    travelStyles: ['Group', 'Adventure'],
    expertise: ['Pilgrimage Logistics', 'Adventure Travel', 'Group Travel'],
    languages: ['English', 'Hindi', 'Garhwali'],
    featured: true,
    active: true
  },
  {
    slug: 'honeymoon-luxury-specialist',
    name: 'Ananya Kapoor',
    role: 'Honeymoon & Luxury Specialist',
    profileImage: images.destinations.manali,
    bio: 'Ananya curates honeymoon and anniversary journeys across Himachal and Kashmir — boutique cottages and slow-paced itineraries built around privacy and comfort rather than a packed checklist.',
    destinationSlugs: ['manali', 'gulmarg', 'dharamshala'],
    travelStyles: ['Couple', 'Luxury'],
    expertise: ['Custom Journeys', 'Luxury Travel'],
    languages: ['English', 'Hindi'],
    journeySlugs: ['himachal-himalayan-explorer'],
    featured: false,
    active: true
  },
  {
    slug: 'family-trip-specialist',
    name: 'Karan Mehta',
    role: 'Family Travel Specialist',
    profileImage: images.destinations.dharamshala,
    bio: 'Karan plans multi-generational family holidays across Himachal Pradesh, balancing easy toy-train rides and cable cars for grandparents with short treks and cafe-hopping for teens.',
    destinationSlugs: ['shimla', 'manali', 'dharamshala'],
    travelStyles: ['Family', 'Group'],
    expertise: ['Family Holidays', 'Custom Journeys'],
    languages: ['English', 'Hindi'],
    journeySlugs: ['dharamshala-dalhousie-escape'],
    featured: false,
    active: true
  },
  {
    slug: 'kashmir-trekking-offbeat-specialist',
    name: 'Simran Kaur',
    role: 'Trekking & Offbeat Specialist',
    profileImage: images.destinations.kinnaur,
    bio: 'Simran leads small-group treks around Gulmarg and the Kinnaur valley, focusing on responsible camping, local guide partnerships, and routes that stay clear of the crowded trail heads.',
    destinationSlugs: ['gulmarg', 'kinnaur'],
    travelStyles: ['Adventure', 'Group', 'Slow Travel'],
    expertise: ['Local Experiences', 'Himalayan Road Trips'],
    languages: ['English', 'Hindi'],
    featured: false,
    active: true
  }
];
