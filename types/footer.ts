import type { LucideIcon } from 'lucide-react';
import type { NavItem } from './navigation';

export interface FooterColumn {
  heading: string;
  links: NavItem[];
}

export interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}
