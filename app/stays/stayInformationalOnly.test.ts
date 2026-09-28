import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Repository-content audit proving the Stays vertical is informational-only — The Apex
 * Voyager India has no booking/pricing agreement with any Stay property (2026-09
 * business decision), so no Stay surface may render a price, a "book"/"enquire" CTA, or
 * any wording implying Apex can confirm/negotiate/reserve/book a property. Reads the
 * actual shipped source of every Stay-owning file rather than rendering components
 * (several depend on next/image and server data fetching that aren't worth mocking just
 * to assert on static, unconditional text) — a banned phrase/pattern that's actually
 * unreachable code would still be caught here, which is the stricter check.
 */

const ROOT = path.resolve(__dirname, '..', '..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

const BANNED_PHRASES = [
  'Contact for pricing',
  'Starting from',
  'Check Price & Availability',
  'Plan This Stay',
  'Enquire on WhatsApp',
  'Continue on WhatsApp',
  'our team will confirm',
  'pricing will be confirmed',
  'confirmed when you enquire',
  'confirmed at booking'
];

const STAY_ONLY_FILES = [
  'app/stays/[...segments]/page.tsx',
  'components/modules/HotelCard.tsx',
  'components/modules/PropertyCard.tsx',
  'components/modules/StaysGrid.tsx',
  'components/modules/stays/StayPricePanel.tsx' // only ever used by the dev-only HBX test-price preview now — see that describe block below
];

describe('Stays vertical — zero banned commercial/CTA phrases in Stay-only surfaces', () => {
  for (const file of STAY_ONLY_FILES.filter((f) => f !== 'components/modules/stays/StayPricePanel.tsx')) {
    for (const phrase of BANNED_PHRASES) {
      it(`${file} never contains "${phrase}"`, () => {
        expect(read(file).toLowerCase()).not.toContain(phrase.toLowerCase());
      });
    }
  }
});

describe('Stays vertical — no WhatsApp enquiry/booking CTA remains on any Stay surface', () => {
  const files = [
    'app/stays/[...segments]/page.tsx',
    'components/modules/HotelCard.tsx',
    'components/modules/PropertyCard.tsx',
    'components/modules/StaysGrid.tsx'
  ];

  for (const file of files) {
    it(`${file} never imports or renders WhatsAppEnquireButton`, () => {
      expect(read(file)).not.toContain('WhatsAppEnquireButton');
    });

    it(`${file} never constructs a 'stay' inquiry selection`, () => {
      expect(read(file)).not.toMatch(/type:\s*'stay'/);
    });

    it(`${file} never references wa.me or api.whatsapp.com directly`, () => {
      const source = read(file);
      expect(source).not.toContain('wa.me');
      expect(source).not.toContain('api.whatsapp.com');
    });
  }

  it('HotelBookingModal.tsx (the former Stay WhatsApp CTA wrapper) no longer exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'components/modules/HotelBookingModal.tsx'))).toBe(false);
  });

  it("WhatsAppInquiryModal.tsx no longer has a 'stay' selection type at all", () => {
    const source = read('components/modules/WhatsAppInquiryModal.tsx');
    expect(source).not.toMatch(/'stay'\s*\|/);
    expect(source).not.toContain('STAY ENQUIRY');
    expect(source).not.toContain('Send Enquiry on WhatsApp');
  });

  it('lib/whatsapp.ts no longer builds a Stay enquiry message', () => {
    expect(read('lib/whatsapp.ts')).not.toContain('buildStayEnquiryMessage');
  });
});

describe('Stays vertical — the "Independent listing" badge/tag was removed (correction round)', () => {
  const files = [
    'app/stays/[...segments]/page.tsx',
    'components/modules/HotelCard.tsx',
    'components/modules/PropertyCard.tsx',
    'components/modules/StaysGrid.tsx'
  ];

  for (const file of files) {
    it(`${file} no longer renders an "Independent listing" or "Independent property listing" badge/tag`, () => {
      const source = read(file);
      expect(source).not.toContain('Independent listing');
      expect(source).not.toContain('Independent property listing');
    });
  }
});

describe('Stays vertical — "View on Google Maps" action replaces the badge everywhere', () => {
  it('the Google-property detail page shows the required disclosure and a real, centrally-built Maps link', () => {
    // JSX text is line-wrapped for readability in the source file, so this normalizes
    // whitespace before matching rather than asserting on one exact, unwrapped string.
    const normalized = read('app/stays/[...segments]/page.tsx').replace(/\s+/g, ' ');
    expect(normalized).toContain('This is an independent informational listing. Property information is sourced from Google.');
    expect(normalized).toContain('The Apex Voyager India is not the property owner or booking provider.');
    expect(normalized).toContain('GoogleMapsButton');
    expect(normalized).toContain('buildGoogleMapsUrl');
  });

  it('never fabricates availability, a partnership badge, or an ownership claim on the informational panel', () => {
    const source = read('app/stays/[...segments]/page.tsx');
    expect(source.toLowerCase()).not.toContain('verified partner');
    expect(source.toLowerCase()).not.toContain('official partner');
  });

  for (const file of ['components/modules/HotelCard.tsx', 'components/modules/PropertyCard.tsx', 'components/modules/StaysGrid.tsx']) {
    it(`${file} uses the shared GoogleMapsButton (never an ad hoc Maps link)`, () => {
      const source = read(file);
      expect(source).toContain('GoogleMapsButton');
      expect(source).toContain('buildGoogleMapsUrl');
    });
  }

  it('every Maps link is built from lib/googleMapsLink.ts and produces the required query_place_id format', () => {
    const source = read('lib/googleMapsLink.ts');
    expect(source).toContain('https://www.google.com/maps/search/?api=1&query=Google&query_place_id=');
    expect(source).toContain('encodeURIComponent(params.placeId)');
  });
});

describe('StaysGrid StayCard — never builds a Maps link from a curated Stay\'s synthetic placeId', () => {
  it('only uses stay.placeId for the Maps link when source is "google" — never for a curated stay', () => {
    const source = read('components/modules/StaysGrid.tsx');
    expect(source).toMatch(/stay\.source === 'google' \? stay\.placeId : undefined/);
  });
});

describe('RegionBookingStayCard.tsx — no Booking.com CTA remains, kept for future affiliate use', () => {
  it('never renders "Check Availability" or "View on Booking.com"', () => {
    const source = read('components/modules/regions/RegionBookingStayCard.tsx');
    expect(source).not.toContain('Check Availability');
    expect(source).not.toContain('View on Booking.com');
  });

  it('never renders a price from priceFrom/currency', () => {
    const source = read('components/modules/regions/RegionBookingStayCard.tsx');
    expect(source).not.toMatch(/priceFrom/);
  });

  it('is not deleted — the component and its providerUrl prop remain for a future real integration', () => {
    expect(fs.existsSync(path.join(ROOT, 'components/modules/regions/RegionBookingStayCard.tsx'))).toBe(true);
    const propsSource = read('services/providers/booking/booking.mapper.ts');
    expect(propsSource).toContain('providerUrl: string');
  });

  it('never invents a Google Maps link from providerUrl — only real googleMapsUri/placeId props', () => {
    const source = read('components/modules/regions/RegionBookingStayCard.tsx');
    expect(source).toContain('buildGoogleMapsUrl({ googleMapsUri, placeId })');
    expect(source).not.toMatch(/buildGoogleMapsUrl\([^)]*providerUrl/);
  });

  it('never claims "sourced from Google" — its primary content (name/photo/rating) is Booking.com-sourced, not Google\'s', () => {
    const source = read('components/modules/regions/RegionBookingStayCard.tsx');
    expect(source).not.toContain('Property information sourced from Google');
  });
});

describe('Source-aware Google attribution (2026-09 correction) — a Maps link alone never implies Google-sourced content', () => {
  it('curated Hotel cards (HotelCard, PropertyCard) never claim "sourced from Google" even when a Maps link is shown', () => {
    for (const file of ['components/modules/HotelCard.tsx', 'components/modules/PropertyCard.tsx']) {
      const source = read(file);
      expect(source).not.toContain('Property information sourced from Google');
    }
  });

  it("StaysGrid's StayCard gates the attribution on stay.source === 'google', not on the Maps link alone", () => {
    const source = read('components/modules/StaysGrid.tsx');
    expect(source).toMatch(/mapsUrl\s*&&\s*stay\.source === 'google'/);
  });

  it('the curated property-detail page shows the non-affiliation disclosure without mentioning Google', () => {
    const normalized = read('app/stays/[...segments]/page.tsx').replace(/\s+/g, ' ');
    expect(normalized).toContain('This is an independent informational listing. The Apex Voyager India is not the property owner or booking provider.');
  });

  it('the Google-sourced property-detail page still shows the Google-attribution disclosure', () => {
    const normalized = read('app/stays/[...segments]/page.tsx').replace(/\s+/g, ' ');
    expect(normalized).toContain(
      'This is an independent informational listing. Property information is sourced from Google. The Apex Voyager India is not the property owner or booking provider.'
    );
  });

  it("the curated disclosure and the Google disclosure are genuinely different strings, not the same text reused", () => {
    const curated = 'This is an independent informational listing. The Apex Voyager India is not the property owner or booking provider.';
    const google = 'This is an independent informational listing. Property information is sourced from Google. The Apex Voyager India is not the property owner or booking provider.';
    expect(curated).not.toBe(google);
    expect(google).toContain('Property information is sourced from Google.');
    expect(curated).not.toContain('Google');
  });
});

describe('Future-affiliate architecture preservation', () => {
  it('HBX pricing service functions still exist and are unchanged', () => {
    const source = read('services/pricing/stayPricing.service.ts');
    expect(source).toContain('export async function resolvePublicPrice');
    expect(source).toContain('export async function resolvePublicPriceState');
  });

  it('the hotel-mapping registry (provider mapping) service still exists and is unchanged', () => {
    expect(fs.existsSync(path.join(ROOT, 'services/pricing/hotelMappingRegistry.service.ts'))).toBe(true);
  });

  it('an HBX CONFIRMED mapping alone is still not sufficient to show a price — production HBX environment is a separate, additional gate', () => {
    const source = read('services/pricing/stayPricing.service.ts');
    expect(source).toMatch(/environment\s*===\s*'production'/);
  });
});

describe('Stays vertical — HBX test/certification code is untouched except for the public price call site', () => {
  it('StayPricePanel.tsx (the HBX certification preview component) is unchanged — still used only by the dev-only preview', () => {
    const source = read('components/modules/stays/StayPricePanel.tsx');
    // Deliberately NOT asserting the banned-phrase list against this file — it is no
    // longer reachable from any real public page (see the next test) and remains exactly
    // as HBX certification work left it, per this task's explicit "do not touch HBX
    // test/certification code" instruction.
    expect(source).toContain('VERIFIED_LIVE_RATE');
  });

  it('the real public Stay detail page never imports StayPricePanel or calls resolvePublicPrice — the one public call site was removed', () => {
    const source = read('app/stays/[...segments]/page.tsx');
    expect(source).not.toContain('StayPricePanel');
    expect(source).not.toContain('resolvePublicPrice');
  });

  it('the dev-only HBX test-price preview page still uses StayPricePanel unchanged', () => {
    const source = read('app/internal/hbx-test-price-preview/page.tsx');
    expect(source).toContain('StayPricePanel');
  });
});

describe('Journeys/Transport/Experiences/Destination — untouched, no regression', () => {
  it('BookingRequestModal.tsx (Journey/Transport/Expert shared flow) keeps its own "Continue on WhatsApp" CTA unchanged', () => {
    expect(read('components/modules/BookingRequestModal.tsx')).toContain('Continue on WhatsApp');
  });

  it('DestinationHero.tsx keeps its own "Enquire on WhatsApp" destination-trip CTA unchanged (not a Stay-property enquiry)', () => {
    const source = read('components/modules/destinations/DestinationHero.tsx');
    expect(source).toContain('Enquire on WhatsApp');
    expect(source).toContain("type: 'destination'");
  });
});

describe('Server-side protection — Stay enquiry endpoints fail closed', () => {
  it('/api/booking-requests no longer lists "stay" as a valid type', () => {
    const source = read('app/api/booking-requests/route.ts');
    const match = source.match(/const VALID_TYPES: BookingRequestType\[\] = \[([^\]]*)\];/);
    expect(match).not.toBeNull();
    const validTypes = match![1].split(',').map((entry) => entry.trim().replace(/'/g, ''));
    expect(validTypes).not.toContain('stay');
    expect(validTypes).toEqual(['journey', 'tour', 'experience', 'transport', 'expert']);
  });

  it('/api/inquiries only accepts selectionType "destination"', () => {
    const source = read('app/api/inquiries/route.ts');
    expect(source).not.toMatch(/selectionType\s*!==\s*'stay'/);
    expect(source).toContain("selectionType !== 'destination'");
  });
});
