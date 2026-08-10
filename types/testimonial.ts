export interface Testimonial {
  id: string;
  author: string;
  location?: string;
  rating: number;
  quote: string;
  tourTitle?: string;
  tripDate?: string;
  category?: string;
  avatar?: string;
  featured?: boolean;
}
