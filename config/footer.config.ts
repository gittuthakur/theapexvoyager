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
      { label: 'Trekking Tours', href: '/tours?category=trekking' },
      { label: 'Bike Expeditions', href: '/tours?category=biking' },
      { label: 'Camping Trips', href: '/tours?category=camping' },
      { label: 'Homestay Tours', href: '/homestays' },
      { label: 'Wellness Retreats', href: '/tours?category=wellness' },
      { label: 'Group Tours', href: '/tours?category=group' }
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
