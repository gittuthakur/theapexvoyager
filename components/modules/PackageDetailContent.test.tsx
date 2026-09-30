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
  it('renders no "Good to Know" section for an existing journey with none of the new optional fields set — no fabricated content', () => {
    const html = renderToStaticMarkup(<PackageDetailContent pkg={basePkg()} />);
    expect(html).not.toContain('Good to Know');
    expect(html).not.toContain('Ideal for');
    expect(html).not.toContain('Best time to visit');
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

  it('uses pkg.priceBasis in the sidebar when set, and falls back to "person" (unchanged behavior) when not', () => {
    const withoutBasis = renderToStaticMarkup(<PackageDetailContent pkg={basePkg()} />);
    expect(withoutBasis).toContain('/ person');

    const withBasis = renderToStaticMarkup(<PackageDetailContent pkg={basePkg({ priceBasis: 'couple' })} />);
    expect(withBasis).toContain('/ couple');
  });
});
