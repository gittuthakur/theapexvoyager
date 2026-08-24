import { Facebook, Instagram, Youtube } from 'lucide-react';
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

export const socialLinks: SocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { label: 'YouTube', href: 'https://youtube.com', icon: Youtube }
];
