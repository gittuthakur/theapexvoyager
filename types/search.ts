export interface SearchFilterOption {
  id: string;
  label: string;
  defaultValue: string;
  options: string[];
}

export interface DateRange {
  checkIn: Date | null;
  checkOut: Date | null;
}

export interface OccupancyDetails {
  adults: number;
  children: number;
  rooms: number;
  pets: boolean;
}

export interface SearchQuery {
  tab: string;
  destination: string;
  dates: string;
  occupancy: string;
  filters: Record<string, string>;
  dateRange?: DateRange;
  occupancyDetails?: OccupancyDetails;
}
