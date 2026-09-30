import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import PackageDetailContent from './PackageDetailContent';
import type { TravelPackage } from '@/types/package';

// BackButton (rendered unconditionally at the top of PackageDetailContent) calls
// next/navigation's useRouter(), which throws outside a mounted App Router — these tests
// only care about the AI-readable content sections further down the tree, so the router
// itself is stubbed rather than pulled into a full Next.js router test harness.
vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));

function basePkg(overrides: Partial<TravelPackage> = {}): TravelPackage {
  return {
    slug: 'test-journey',
    name: 'Test Journey',
    destination: 'Manali, Himachal Pradesh',
    image: '/images/test.jpg',
    duration: '5 Days / 4 Nights',
    price: 12999,
    category: 'Adventure',
    shortDescription: 'A test journey.',
    highlights: ['Highlight one', 'Highlight two'],
    itinerary: [{ day: 1, title: 'Arrival', description: 'Arrive and settle in.' }],
    inclusions: ['Stay', 'Breakfast'],
    exclusions: ['Flights'],
    stayOptions: [],
    addOns: [],
    ...overrides
  };
}

describe('PackageDetailContent — AI-readable content fields (Phase 1)', () => {
  it('"Good to Know" always renders for a journey with a real price (Price* + Cancellation, Phase 4B) — but none of the OTHER optional fields, when unset', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg()} />);
    expect(html).toContain('Good to Know');
    expect(html).toContain('Price*');
    expect(html).toContain('Starting price is indicative and based on selected occupancy/package configuration');
    expect(html).toContain('Cancellation');
    expect(html).not.toContain('Ideal for');
    expect(html).not.toContain('Best time to visit');
  });

  it('never renders the Price* row for a journey with no valid price', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ price: 0 })} />);
    expect(html).not.toContain('Price*');
    expect(html).not.toContain('indicative');
  });

  it('renders only the populated optional fields, and none of the unpopulated ones', () => {
    const html = renderToStaticMarkup(
      <PackageDetailContent
        pkg={basePkg({
          idealTraveller: 'Couples and honeymooners',
          bestTimeToVisit: 'March to June'
          // hotelCategoryDescription, bookingProcess, importantNotes, startingCity/endingCity intentionally left unset
        })}
      />
    );
    expect(html).toContain('Good to Know');
    expect(html).toContain('Couples and honeymooners');
    expect(html).toContain('March to June');
    expect(html).not.toContain('Hotel category');
    expect(html).not.toContain('How booking works');
    expect(html).not.toContain('Important notes');
    expect(html).not.toContain('Route');
  });

  it('renders the route line only when BOTH startingCity and endingCity are set, never from just one', () => {
    const oneOnly = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ startingCity: 'Chandigarh' })} />);
    expect(oneOnly).not.toContain('Route');

    const both = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ startingCity: 'Chandigarh', endingCity: 'Manali' })} />);
    expect(both).toContain('Chandigarh');
    expect(both).toContain('Manali');
  });

  it('always renders a real link to the cancellation policy page once the section renders at all', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ idealTraveller: 'Families' })} />);
    expect(html).toContain('href="/cancellation-policy"');
  });

  it('renders a visible last-updated date only when pkg.updatedAt is present', () => {
    const withoutDate = renderToStaticMarkup(<PackageDetailContent pkg={basePkg()} />);
    expect(withoutDate).not.toContain('Last updated');

    const withDate = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ updatedAt: '2026-09-15T00:00:00.000Z' })} />);
    expect(withDate).toContain('Last updated');
  });

  it('links to real Destination pages only for genuinely matched linkedDestinations, never fabricating one', () => {
    const noLinks = renderToStaticMarkup(<PackageDetailContent pkg={basePkg()} linkedDestinations={[]} />);
    expect(noLinks).not.toContain('Explore the Destination');

    const withLinks = renderToStaticMarkup(
      <PackageDetailContent pkg={basePkg()} linkedDestinations={[{ slug: 'manali', title: 'Manali' }]} />
    );
    expect(withLinks).toContain('Explore the Destination');
    expect(withLinks).toContain('href="/destinations/manali"');
    expect(withLinks).toContain('Manali');
  });

  it('renders the Phase 4A "Starting From ₹X per person*" contract in the sidebar for any valid price, with the disclaimer directly below it', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ price: 13999 })} />);
    expect(html).toContain('Starting From ₹13,999 per person*');
    expect(html).toContain('Starting price is indicative and based on selected occupancy/package configuration');
  });

  it('falls back to the custom-quote label, with no disclaimer, when the package has no valid price', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ price: 0 })} />);
    expect(html).toContain('Get Your Custom Quote');
    expect(html).not.toContain('Starting From');
    expect(html).not.toContain('indicative');
  });

  it('Phase 4B: the mobile price line carries a visible path from the asterisk to the disclaimer (the "Good to Know" section), without any page redesign', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ price: 13999 })} />);
    expect(html).toContain('Indicative price');
    expect(html).toContain('Good to Know');
  });
});

describe('PackageDetailContent — Phase 6 visible breadcrumbs', () => {
  it('renders a real Home > Journeys > [journey] breadcrumb trail', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ name: 'Test Journey' })} />);
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('>Home<');
    expect(html).toContain('>Journeys<');
    expect(html).toContain('>Test Journey<');
    expect(html).toContain('href="/journeys"');
  });

  it('uses the SEO H1 override for the final breadcrumb item when one is set, matching the visible H1 and the page\'s own BreadcrumbList JSON-LD', () => {
    const html = renderToStaticMarkup(
      <PackageDetailContent pkg={basePkg({ name: 'Internal Name' })} heroTitleOverride="Manali Tour Package from Chandigarh" />
    );
    expect(html).toContain('>Manali Tour Package from Chandigarh<');
    expect(html).not.toMatch(/<a[^>]*>Manali Tour Package from Chandigarh<\/a>/);
  });

  it('the final breadcrumb item never links to itself', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ name: 'Test Journey' })} />);
    expect(html).not.toMatch(/<a[^>]*>Test Journey<\/a>/);
  });
});

describe('PackageDetailContent — Phase 4A commercial fields (Accommodation/Meals/Transport/Pickup/Drop)', () => {
  it('renders each commercial field only when actually populated, under its own "Good to Know" label', () => {
    const html = renderToStaticMarkup(
      <PackageDetailContent
        pkg={basePkg({
          hotelCategoryDescription: 'Deluxe hotel/equivalent',
          mealPlan: 'Daily breakfast and dinner (MAP)',
          transportType: 'Private cab throughout',
          pickupInfo: 'Pickup from Chandigarh',
          dropInfo: 'Drop at Chandigarh'
        })}
      />
    );
    expect(html).toContain('Accommodation');
    expect(html).toContain('Deluxe hotel/equivalent');
    expect(html).toContain('Meals');
    expect(html).toContain('Daily breakfast and dinner (MAP)');
    expect(html).toContain('Transport');
    expect(html).toContain('Private cab throughout');
    expect(html).toContain('Pickup');
    expect(html).toContain('Pickup from Chandigarh');
    expect(html).toContain('Drop');
    expect(html).toContain('Drop at Chandigarh');
  });

  it('renders none of these five rows for a journey with none of the fields set — no fabricated content', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg()} />);
    expect(html).not.toContain('Meals</dt>');
    expect(html).not.toContain('Transport</dt>');
    expect(html).not.toContain('Pickup</dt>');
    expect(html).not.toContain('Drop</dt>');
  });
});
