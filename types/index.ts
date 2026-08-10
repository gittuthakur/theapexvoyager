export * from './destination';
export * from './tour';
export * from './testimonial';
export * from './booking';
export * from './navigation';
export * from './search';
export * from './stats';
export * from './footer';
export interface TourPackage {
  id: string;
  title: string;
  // ... baki properties
  maxGuests?: string; // <-- Yeh line add karein
}