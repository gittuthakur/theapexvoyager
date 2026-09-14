import { Facebook, Instagram } from 'lucide-react';
import { footerLinks } from './site.config';
import type { FooterColumn, SocialLink } from '@/types';

export const footerColumns: FooterColumn[] = [
  {
    heading: 'Destinations',
    links: [
      { label: 'Manali', href: '/destinations/manali' },
      { label: 'Spiti Valley', href: '/destinations/spiti-valley' },
      { label: 'Shimla', href: '/destinations/shimla' },
      { label: 'Dharamshala', href: '/destinations/dharamshala' },
      { label: 'Bir Billing', href: '/destinations/bir-billing' },
      { label: 'Kasol', href: '/destinations/kasol' }
    ]
  },
  {
    heading: 'Experiences',
    links: [
      { label: 'Trekking Tours', href: '/journeys?category=Adventure' },
      { label: 'Honeymoon Escapes', href: '/journeys?category=Honeymoon' },
      { label: 'Camping Trips', href: '/stays/glamping' },
      { label: 'Homestay Tours', href: '/stays/homestays' },
      { label: 'Offbeat Trails', href: '/journeys?category=Offbeat' },
      { label: 'Spiritual Journeys', href: '/journeys?category=Spiritual' }
    ]
  },
  {
    heading: 'Quick Links',
    links: footerLinks
  }
];

// No official YouTube channel is confirmed yet — omitted here rather than left
// pointing at the generic youtube.com homepage. Add it back with a real channel
// URL once one exists; the Youtube icon remains available from lucide-react and
// SocialLink/Footer already render any number of entries generically.
export const socialLinks: SocialLink[] = [
  { label: 'Instagram', href: 'https://www.instagram.com/theapexvoyager/', icon: Instagram },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61593334715757', icon: Facebook }
];
