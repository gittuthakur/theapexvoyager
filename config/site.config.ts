import type { NavItem } from '@/types';

export const siteConfig = {
  name: 'The Apex Voyager',
  tagline: 'Beyond Destinations Into Experience',
  description: 'Luxury expedition travel experiences across the Himalayas.',
  url: 'https://theapexvoyager.com',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917307521100',
  contactEmail: 'hello@theapexvoyager.com',
  contactPhone: '+91 7307521100',
  signInHref: '/sign-in',
  bookNowHref: '/booking'
} as const;

export const navRoutes: NavItem[] = [
  { label: 'Destinations', href: '/destinations' },
  { label: 'Featured Tours', href: '/tours' },
  { label: 'Homestays', href: '/homestays' },
  { label: 'About Us', href: '/about' },
  { label: 'Blog', href: '/blog' }
];

export const footerLinks: NavItem[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Cancellation Policy', href: '/cancellation-policy' }
];
