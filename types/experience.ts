export type ExperienceRegion = 'Himachal Pradesh' | 'Jammu & Kashmir' | 'Uttarakhand';

/** The 8 canonical activity types — the single source of truth for the listing's "Experience Type" filter and the search bar's "What are you looking for?" field. */
export type ExperienceType = 'Adventure' | 'Culture' | 'Food' | 'Nature' | 'Wellness' | 'Romance' | 'Family' | 'Offbeat';

export type ExperienceDifficulty = 'Easy' | 'Moderate' | 'Challenging';

export type ExperienceSeason = 'Spring' | 'Summer' | 'Monsoon' | 'Autumn' | 'Winter';

export type ExperienceBestFor = 'Couples' | 'Families' | 'Friends & Groups' | 'Solo Travellers';

export type ExperienceDurationBand = 'under-3-hours' | 'half-day' | 'full-day' | 'multi-day';

export type ExperienceBadge = 'Best Seller' | 'Popular' | 'New';

/** Honest availability signal shown on cards/detail — never a live inventory count, since there is no booking-engine backing this catalog yet. */
export type ExperienceAvailability = 'Available' | 'Seasonal' | 'On Request';

/**
 * The 7 "mood" discovery tiles on the /experiences hero grid — a curated, editorial
 * grouping distinct from `category`. One mood can span more than one canonical
 * `ExperienceType` (see config/experiences.config.ts's `experienceMoods`), so this is
 * a separate taxonomy rather than a renamed copy of ExperienceType.
 */
export type ExperienceMood = 'adventure' | 'romantic-escapes' | 'family' | 'slow-soulful' | 'local-life' | 'taste-himalayas' | 'wild-offbeat';

export interface Experience {
  id: string;
  slug: string;
  title: string;
  /** Town/village-level place name, e.g. "Kaza, Spiti Valley" — distinct from `region`. */
  location: string;
  region: ExperienceRegion;
  category: ExperienceType;
  /** Free-text refinement shown as a small tag on the detail page, e.g. "Homestay", "River Rafting". */
  subCategory: string;
  mood: ExperienceMood;
  shortDescription: string;
  description: string;
  image: string;
  /** Detail-page gallery — kept short (2–3 shots) since the project's photo library doesn't yet have per-experience sets for every region. */
  gallery: string[];
  rating?: number;
  reviewCount?: number;
  /** Human-readable duration for display, e.g. "3 Hours", "2 Days". */
  duration: string;
  durationBand: ExperienceDurationBand;
  /** Human-readable group-size line for cards, e.g. "Small Group (up to 8)" or "Private, up to 2". */
  groupSize: string;
  groupSizeMax: number;
  difficulty?: ExperienceDifficulty;
  /** Customer-facing selling price — the only price ever rendered in the UI. */
  price: number;
  currency: 'INR';
  bestFor: ExperienceBestFor[];
  seasons: ExperienceSeason[];
  highlights: string[];
  whatYoullExperience: string[];
  inclusions: string[];
  exclusions: string[];
  meetingPoint: string;
  whatToBring: string[];
  importantInfo?: string[];
  availability: ExperienceAvailability;
  /** True only for experiences that have actually been vetted — not every experience carries this badge, so it stays meaningful. */
  verified: boolean;
  featured?: boolean;
  badge?: ExperienceBadge;

  // --- Future business-model fields — deliberately typed now so the catalog can
  // later support partner/commission-based pricing, but NEVER read by customer-
  // facing UI. Keep these optional and out of every card/detail render. ---
  /** What The Apex Voyager pays a local partner — internal only. */
  basePrice?: number;
  /** Margin between basePrice and price, as a fraction — internal only. */
  commission?: number;
  /** Operating partner name/id — internal only, never shown publicly. */
  partner?: string;
  bookingMethod?: 'whatsapp' | 'partner-managed' | 'instant';
}
