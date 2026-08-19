import { Mountain, Snowflake, Trees, type LucideIcon } from 'lucide-react';
import type { SearchFilterOption } from '@/types';

export interface RegionCategory {
  name: string;
  description: string;
  icon: LucideIcon;
}

export const regionCategories: RegionCategory[] = [
  { name: 'Himachal Pradesh', description: 'Manali, Shimla & Spiti Valley', icon: Mountain },
  { name: 'Kashmir', description: 'Gulmarg, Srinagar & alpine valleys', icon: Snowflake },
  { name: 'Uttarakhand', description: 'Rishikesh, Haridwar & the Himalayas', icon: Trees }
];

export const bookingTabs: string[] = ['Tours', 'Hotels', 'Homestays'];

export const bookingFilters: SearchFilterOption[] = [
  { id: 'tripType', label: 'Trip type', defaultValue: 'One Way', options: ['One Way', 'Round Trip', 'Multi-City'] },
  {
    id: 'travelers',
    label: 'Travelers',
    defaultValue: '1 Passenger',
    options: ['1 Passenger', '2 Passengers', '3+ Passengers']
  },
  { id: 'class', label: 'Class', defaultValue: 'Economy', options: ['Economy', 'Premium', 'Luxury Expedition'] }
];

export const destinationPlaceholder = 'e.g., Manali, Spiti, Dharamshala, Shimla';

export const trendingDestinations: string[] = [
  'New Delhi',
  'Chandigarh',
  'Manali',
  'Shimla',
  'Spiti Valley',
  'Dharamshala',
  'Kasol',
  'Amritsar'
];

export const flexDateWindows: string[] = ['Exact dates', '± 1 day', '± 3 days', '± 7 days'];

export const flexTripLengths: string[] = ['Weekend', 'Week', 'Month'];

// Single source of truth for GlobalSearchFilter (components/GlobalSearchFilter.tsx) —
// every page that renders the shared search panel gets these same tabs and per-tab
// option lists, so editing a list here updates it everywhere at once.
export const globalSearchTabs = ['Destinations', 'Stays', 'Journeys', 'Experiences', 'Transport', 'Travel Experts'] as const;
export type GlobalSearchTab = (typeof globalSearchTabs)[number];

export const destinationTravelStyles: string[] = ['Adventure', 'Nature', 'Road trips', 'Culture', 'Family', 'Slow travel'];
export const seasonOptions: string[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const stayTypes: string[] = ['Hotel', 'Homestay', 'Resort', 'Villa', 'Camp', 'Treehouse', 'Farmstay', 'Hostel', 'Heritage', 'GuestHouse'];
export const journeyCategories: string[] = ['Adventure', 'Luxury', 'Offbeat', 'Honeymoon', 'Family', 'Spiritual'];
export const planningNeeds: string[] = ['Custom trip', 'Honeymoon', 'Family trip', 'Adventure', 'Offbeat', 'Luxury', 'Group'];

// Clicking a chip should always feel relevant to whatever tab is active — a place
// name on Stays should search stays, the same word on Destinations should search
// destination guides, and Transport/Experts get chips that actually fit those tabs.
export const popularSearchesByTab: Record<GlobalSearchTab, string[]> = {
  Destinations: ['Manali', 'Spiti Valley', 'Kinnaur', 'Rishikesh', 'Kasol', 'Auli'],
  Stays: ['Manali', 'Spiti Valley', 'Gulmarg', 'Rishikesh', 'Kasol', 'Tirthan Valley'],
  Journeys: ['Manali', 'Kashmir', 'Spiti Valley', 'Shimla', 'Rishikesh'],
  Experiences: ['Srinagar', 'Manali', 'Rishikesh', 'Spiti Valley', 'Kasol'],
  Transport: ['Manali', 'Shimla', 'Kasol', 'Srinagar'],
  'Travel Experts': ['Spiti', 'Kashmir', 'Uttarakhand', 'Manali']
};
