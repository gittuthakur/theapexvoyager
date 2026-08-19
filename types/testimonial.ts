export interface Testimonial {
  id: string;
  author: string;
  location?: string;
  rating: number;
  quote: string;
  tourTitle?: string;
  duration?: string;
  tripDate?: string;
  /** Trip destination region — drives the homepage testimonial section's primary region tabs. */
  region?: string;
  /** Travel style — drives the homepage testimonial section's secondary style chips. */
  category?: string;
  avatar?: string;
  featured?: boolean;
  verified?: boolean;
  /** Independent review source reference, e.g. Google Reviews. */
  source?: {
    label: string;
    url: string;
  };
}
