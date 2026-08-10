import type { SearchFilterOption } from '@/types';

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
