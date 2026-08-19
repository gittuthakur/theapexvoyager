import Link from 'next/link';
import { FILTER_PANEL_CLASS, FILTER_LABEL_CLASS, filterPillClass } from '@/components/modules/filters/filterStyles';
import { cn } from '@/lib/utils';
import { stayTypes } from '@/config/stayTypes.config';

const priceOptions: Array<{ label: string; value?: string }> = [
  { label: 'Any price' },
  { label: 'Up to ₹2,000', value: '2000' },
  { label: 'Up to ₹5,000', value: '5000' },
  { label: 'Up to ₹10,000', value: '10000' },
  { label: 'Up to ₹20,000', value: '20000' }
];

export interface StayFiltersProps {
  /** Every currently-set search param on /stays/search, so links can preserve the rest while toggling one. */
  currentParams: Record<string, string | undefined>;
  amenityOptions: string[];
  activePriceMax?: string;
  activeType?: string;
  activeAmenity?: string;
}

function buildHref(currentParams: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const merged = { ...currentParams, ...overrides };
  const query = new URLSearchParams();
  Object.entries(merged).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `/stays/search?${queryString}` : '/stays/search';
}

export default function StayFilters({ currentParams, amenityOptions, activePriceMax, activeType, activeAmenity }: StayFiltersProps) {
  return (
    <aside className={cn(FILTER_PANEL_CLASS, 'space-y-6 p-6 xl:w-80 xl:shrink-0')}>
      <div>
        <p className={FILTER_LABEL_CLASS}>Stay type</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={buildHref(currentParams, { type: undefined })} className={filterPillClass(!activeType)}>
            Any
          </Link>
          {stayTypes.map((type) => {
            const isActive = activeType === type.slug;
            return (
              <Link key={type.slug} href={buildHref(currentParams, { type: isActive ? undefined : type.slug })} className={filterPillClass(isActive)}>
                {type.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className={FILTER_LABEL_CLASS}>Price per night</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {priceOptions.map((option) => {
            const isActive = (activePriceMax ?? undefined) === option.value;
            return (
              <Link key={option.label} href={buildHref(currentParams, { priceMax: option.value })} className={filterPillClass(isActive)}>
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      {amenityOptions.length > 0 ? (
        <div>
          <p className={FILTER_LABEL_CLASS}>Amenities</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={buildHref(currentParams, { amenity: undefined })} className={filterPillClass(!activeAmenity)}>
              Any
            </Link>
            {amenityOptions.map((amenity) => {
              const isActive = activeAmenity === amenity;
              return (
                <Link key={amenity} href={buildHref(currentParams, { amenity: isActive ? undefined : amenity })} className={filterPillClass(isActive)}>
                  {amenity}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
