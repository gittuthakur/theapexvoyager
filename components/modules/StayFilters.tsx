'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import {
  FILTER_PANEL_CLASS,
  FILTER_LABEL_CLASS,
  FILTER_SECTION_CLASS,
  FILTER_CHIP_CLASS,
  FILTER_CHIP_REMOVE_CLASS,
  filterPillClass
} from '@/components/modules/filters/filterStyles';
import FilterListOption from '@/components/modules/filters/FilterListOption';
import PriceMaxSlider from '@/components/modules/filters/PriceMaxSlider';
import MobileFilterDrawer from '@/components/modules/filters/MobileFilterDrawer';
import { FilterAccordion } from '@/components/modules/destinations/FilterAccordion';
import { cn } from '@/lib/utils';
import { stayTypes, findStayTypeBySlug } from '@/config/stayTypes.config';
import { findStayMoodBySlug } from '@/config/stayMoods.config';
import { parseValidPriceMax } from '@/components/modules/filters/priceMax';

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
  /** Real, already-filtered result count — shown next to the panel header, matching
   *  the Destinations filter's "N destinations found" feedback. */
  resultCount: number;
  /** Real min/max nightly price across the current result set, for the desktop price
   *  slider — null when there's nothing meaningful to slide between (mirrors
   *  PriceRangeSlider's own honest-empty-state rule). Not used by the mobile drawer,
   *  which keeps its original discrete price options untouched. */
  priceBounds: { min: number; max: number } | null;
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

/**
 * Same visual language as the Destinations filter panel: FILTER_PANEL_CLASS shell,
 * "Filter by" heading, FILTER_LABEL_CLASS section labels, active-filter chips, a
 * result count, a "Clear" action, and — on desktop — the same accordion/checkbox-grid
 * treatment Destinations uses for Travel Style/Best For/Season (reusing its exact
 * `FilterAccordion` component, unmodified) plus a single-handle price slider in the
 * same visual language as its `PriceRangeSlider`. Every option is still a plain
 * `<Link>` (the slider is the one exception — see PriceMaxSlider's own doc comment for
 * why a slider needs to commit navigation on release, not on every drag frame) —
 * filtering stays fully URL/server-driven exactly as before; only the presentation
 * changed.
 *
 * Deliberately NOT included here, per this task's "don't fabricate" instructions:
 * - A free-text "Search stays" field — no such query param/behavior exists today.
 * - A "Region" filter — `getHotels()` has no state/region filter capability; Stays'
 *   `destination` param is a free-text regex against `hotel.location`, not a
 *   3-state enum like Destinations' Region, and there's no honest way to wire
 *   "Himachal Pradesh"/"Jammu & Kashmir"/"Uttarakhand" pills to it without either
 *   inventing new backend filtering or silently returning wrong/empty results.
 * - A "Best For" filter — no supported UI/param exists for it on Stays today.
 *
 * Desktop and mobile intentionally render DIFFERENT controls for Stay Type/Price:
 * desktop uses the accordion/checkbox/slider language above, while the mobile drawer
 * keeps its previously-shipped pill controls completely untouched, per this task's
 * explicit "do not touch the mobile drawer" scope.
 */
export default function StayFilters({
  currentParams,
  amenityOptions,
  activePriceMax,
  activeType,
  activeAmenity,
  resultCount,
  priceBounds
}: StayFiltersProps) {
  const activeStayType = activeType ? findStayTypeBySlug(activeType) : undefined;
  const activePriceOption = priceOptions.find((option) => option.value === activePriceMax);
  // `mood` (set only via a StayMoodCard link on /stays) isn't one of this panel's own
  // controls, but it's a real active filter on the current result set — without
  // accounting for it here it had no chip, wasn't counted, and "Clear" left it behind.
  const activeMoodSlug = currentParams.mood;
  const activeMood = activeMoodSlug ? findStayMoodBySlug(activeMoodSlug) : undefined;
  const activeFilterCount = [activeType, activePriceMax, activeAmenity, activeMoodSlug].filter(Boolean).length;
  const clearHref = buildHref(currentParams, { type: undefined, priceMax: undefined, amenity: undefined, mood: undefined });
  const resultCountLabel = `${resultCount} stay${resultCount === 1 ? '' : 's'} found`;
  const activePriceMaxNumber = parseValidPriceMax(activePriceMax);
  // A priceMax that's present but doesn't parse to a real, non-negative number (a
  // hand-edited `?priceMax=-100` or `?priceMax=abc`) is never displayed as a price —
  // same "still active, but honestly not a real value" treatment mood/type already get
  // for an unresolved slug — and remains removable through the exact same chip.
  const priceValueInvalid = Boolean(activePriceMax) && activePriceMaxNumber === undefined;
  const activePriceLabel =
    activePriceMaxNumber !== undefined
      ? `Up to ₹${activePriceMaxNumber.toLocaleString('en-IN')}`
      : priceValueInvalid
        ? 'Invalid price filter'
        : activePriceOption?.value
          ? activePriceOption.label
          : undefined;

  const activeChips =
    activeFilterCount > 0 ? (
      <div className="flex flex-wrap gap-2">
        {activeStayType ? (
          <span key="type" className={FILTER_CHIP_CLASS}>
            {activeStayType.label}
            <Link href={buildHref(currentParams, { type: undefined })} aria-label={`Remove ${activeStayType.label} filter`} className={FILTER_CHIP_REMOVE_CLASS}>
              <X size={13} />
            </Link>
          </span>
        ) : null}
        {activePriceLabel ? (
          <span key="price" className={FILTER_CHIP_CLASS}>
            {activePriceLabel}
            <Link href={buildHref(currentParams, { priceMax: undefined })} aria-label="Remove price filter" className={FILTER_CHIP_REMOVE_CLASS}>
              <X size={13} />
            </Link>
          </span>
        ) : null}
        {activeAmenity ? (
          <span key="amenity" className={FILTER_CHIP_CLASS}>
            {activeAmenity}
            <Link href={buildHref(currentParams, { amenity: undefined })} aria-label={`Remove ${activeAmenity} filter`} className={FILTER_CHIP_REMOVE_CLASS}>
              <X size={13} />
            </Link>
          </span>
        ) : null}
        {activeMoodSlug ? (
          <span key="mood" className={FILTER_CHIP_CLASS}>
            {activeMood?.label ?? activeMoodSlug}
            <Link href={buildHref(currentParams, { mood: undefined })} aria-label={`Remove ${activeMood?.label ?? activeMoodSlug} filter`} className={FILTER_CHIP_REMOVE_CLASS}>
              <X size={13} />
            </Link>
          </span>
        ) : null}
      </div>
    ) : null;

  // Desktop: accordion + 2-column checkbox grid (Destinations' own FilterAccordion,
  // reused unmodified) for Stay Type/Amenities, both still single-select — clicking
  // the already-checked option unchecks it, the same toggle-off href this section
  // already used as pills. Price becomes a single-handle "up to" slider.
  const desktopBody = (
    <div className="space-y-5">
      {activeChips}

      <div className={FILTER_SECTION_CLASS}>
        <p className={FILTER_LABEL_CLASS}>Price Per Night</p>
        <div className="mt-3">
          {priceBounds ? (
            <PriceMaxSlider
              min={priceBounds.min}
              max={priceBounds.max}
              value={activePriceMaxNumber}
              buildHref={(nextPriceMax) => buildHref(currentParams, { priceMax: nextPriceMax !== undefined ? String(nextPriceMax) : undefined })}
            />
          ) : (
            <p className="text-sm text-slate-500">Pricing isn&apos;t available for enough stays yet to filter by price.</p>
          )}
        </div>
      </div>

      <FilterAccordion title="Stay Type" count={activeType ? 1 : 0}>
        {stayTypes.map((type) => {
          const isActive = activeType === type.slug;
          return (
            <FilterListOption key={type.slug} href={buildHref(currentParams, { type: isActive ? undefined : type.slug })} active={isActive} variant="checkbox">
              {type.label}
            </FilterListOption>
          );
        })}
      </FilterAccordion>

      {amenityOptions.length > 0 ? (
        <FilterAccordion title="Amenities" count={activeAmenity ? 1 : 0}>
          {amenityOptions.map((amenity) => {
            const isActive = activeAmenity === amenity;
            return (
              <FilterListOption key={amenity} href={buildHref(currentParams, { amenity: isActive ? undefined : amenity })} active={isActive} variant="checkbox">
                {amenity}
              </FilterListOption>
            );
          })}
        </FilterAccordion>
      ) : null}
    </div>
  );

  // Mobile drawer: unchanged from before this task — same pill controls as shipped
  // previously, per this task's explicit "do not touch the mobile drawer" scope.
  const mobileBody = (
    <div className="space-y-5">
      {activeChips}

      <div className={FILTER_SECTION_CLASS}>
        <p className={FILTER_LABEL_CLASS}>Stay Type</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link aria-current={!activeType ? 'true' : undefined} href={buildHref(currentParams, { type: undefined })} className={filterPillClass(!activeType)}>
            Any
          </Link>
          {stayTypes.map((type) => {
            const isActive = activeType === type.slug;
            return (
              <Link aria-current={isActive ? 'true' : undefined} key={type.slug} href={buildHref(currentParams, { type: isActive ? undefined : type.slug })} className={filterPillClass(isActive)}>
                {type.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className={FILTER_SECTION_CLASS}>
        <p className={FILTER_LABEL_CLASS}>Price Per Night</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {priceOptions.map((option) => {
            const isActive = (activePriceMax ?? undefined) === option.value;
            return (
              <Link aria-current={isActive ? 'true' : undefined} key={option.label} href={buildHref(currentParams, { priceMax: option.value })} className={filterPillClass(isActive)}>
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      {amenityOptions.length > 0 ? (
        <div className={FILTER_SECTION_CLASS}>
          <p className={FILTER_LABEL_CLASS}>Amenities</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link aria-current={!activeAmenity ? 'true' : undefined} href={buildHref(currentParams, { amenity: undefined })} className={filterPillClass(!activeAmenity)}>
              Any
            </Link>
            {amenityOptions.map((amenity) => {
              const isActive = activeAmenity === amenity;
              return (
                <Link aria-current={isActive ? 'true' : undefined} key={amenity} href={buildHref(currentParams, { amenity: isActive ? undefined : amenity })} className={filterPillClass(isActive)}>
                  {amenity}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );

  const clearAction = (
    <Link href={clearHref} className="cursor-hover inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors duration-300 ease-in-out hover:text-slate-900">
      Clear
    </Link>
  );

  return (
    <>
      {/* Desktop: always-visible, sticky left sidebar — matches the Destinations filter panel exactly. */}
      <aside className="hidden w-full shrink-0 xl:block xl:w-80 xl:shrink-0 xl:sticky xl:top-24 xl:bottom-0">
        <div className={cn(FILTER_PANEL_CLASS, 'space-y-5 p-6')}>
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-slate-900">Filter by</p>
            {activeFilterCount > 0 ? clearAction : null}
          </div>
          <p className="text-sm text-slate-500">{resultCountLabel}</p>
          {desktopBody}
        </div>
      </aside>

      {/* Mobile/tablet: "Filter by" trigger + drawer — untouched by this task. */}
      <MobileFilterDrawer activeFilterCount={activeFilterCount} footer={activeFilterCount > 0 ? clearAction : <span />}>
        <p className="mb-4 text-sm text-slate-500">{resultCountLabel}</p>
        {mobileBody}
      </MobileFilterDrawer>
    </>
  );
}
