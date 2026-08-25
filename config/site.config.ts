import type { NavItem } from '@/types';

export const siteConfig = {
  name: 'The Apex Voyager',
  tagline: 'Beyond Destinations Into Experience',
  description: 'Luxury expedition travel experiences across the Himalayas.',
  url: 'https://theapexvoyager.com',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '917307521100',
  contactEmail: 'hello@theapexvoyager.com',
  contactPhone: '+91 7307521100',
  // Machine-safe tel: URI — a raw `tel:${contactPhone}` embeds the display string's
  // space, which is invalid in a tel URI. Kept as its own field so every consumer's
  // visible text (contactPhone) stays exactly as designed while every href switches
  // to this instead.
  contactPhoneHref: 'tel:+917307521100',
  signInHref: '/sign-in',
  bookNowHref: '/plan-my-journey'
} as const;

export const navRoutes: NavItem[] = [
  { label: 'Destinations', href: '/destinations' },
  { label: 'Journeys', href: '/journeys' },
  { label: 'Stays', href: '/stays' },
  { label: 'Experiences', href: '/experiences' },
  { label: 'Transport', href: '/transport' },
  { label: 'Travel Experts', href: '/experts' },
  { label: 'About Us', href: '/about' }
];

export const footerLinks: NavItem[] = [
  { label: 'About Us', href: '/about' },
  { label: 'Why The Apex Voyager', href: '/why-the-apex-voyager' },
  { label: 'Careers', href: '/careers' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Cancellation Policy', href: '/cancellation-policy' }
];
