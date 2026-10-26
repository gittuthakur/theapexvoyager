import { isValidPrice } from '@/lib/pricing';
import { buildStartingFromLabel } from '@/lib/journeyPriceDisplay';
import type { TravelPackage } from '@/types/package';

export interface AssistantCard {
  slug: string;
  name: string;
  /** Always the real journey detail page. */
  url: string;
  destination: string;
  duration: string;
  image?: string;
  /** Present only when the stored price is a real positive number; built by the site's own price formatter. */
  priceLabel?: string;
  /** Verbatim `inclusions` entries from the database, only when any exist. */
  inclusions?: string[];
}

const MAX_INCLUSIONS = 4;
const MAX_INCLUSION_CHARS = 140;

function safeImage(value: unknown): string | undefined {
  return typeof value === 'string' && (value.startsWith('/') && !value.startsWith('//') ? true : value.startsWith('https://')) ? value : undefined;
}

/** Cards are built only from a published package's own verified fields. Nothing here comes from the model. */
export function buildCard(pkg: TravelPackage): AssistantCard {
  const inclusions = (pkg.inclusions ?? [])
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, MAX_INCLUSIONS)
    .map((item) => item.trim().slice(0, MAX_INCLUSION_CHARS));
  return {
    slug: pkg.slug,
    name: pkg.name,
    url: `/journeys/${encodeURIComponent(pkg.slug)}`,
    destination: pkg.destination,
    duration: pkg.duration,
    image: safeImage(pkg.image),
    priceLabel: isValidPrice(pkg.price) ? buildStartingFromLabel(pkg.price) : undefined,
    inclusions: inclusions.length ? inclusions : undefined
  };
}
