import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// D1-1 placement rules, checked on the source (the repo's existing style for Stays rules): Google-sourced surfaces show
// the shared attribution once; curated surfaces never show it; the disclosure is no longer duplicated.
const ROOT = process.cwd();
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
const page = read('app/stays/[...segments]/page.tsx');
const grid = read('components/modules/StaysGrid.tsx');

const googleDetail = page.slice(page.indexOf('async function GooglePropertyDetail'));
const curatedDetail = page.slice(page.indexOf('async function PropertyDetail'), page.indexOf('async function GooglePropertyDetail'));

describe('Google Maps attribution placement', () => {
  it('the Google property detail page shows the shared attribution exactly once', () => {
    expect(googleDetail.match(/<GoogleMapsAttribution\b/g)).toHaveLength(1);
  });

  it('the disclosure is shown once on the Google property page (it was repeated in the sidebar) and still says Apex is not the owner or booking provider', () => {
    const normalized = googleDetail.replace(/\s+/g, ' ');
    const occurrences = normalized.match(/This is an independent informational listing\. Property information is sourced from Google\. The Apex Voyager India is not the property owner or booking provider\./g) ?? [];
    expect(occurrences).toHaveLength(1);
    expect(googleDetail).not.toMatch(/Property information sourced from Google/);
  });

  it('the sidebar keeps the Maps button but no longer repeats the disclosure or the attribution', () => {
    const aside = googleDetail.slice(googleDetail.indexOf('<aside'), googleDetail.indexOf('</aside>'));
    expect(aside).toContain('GoogleMapsButton');
    expect(aside).not.toContain('GoogleMapsAttribution');
    expect(aside.replace(/\s+/g, ' ')).not.toContain('independent informational listing');
  });

  it('the curated property detail page shows no Google branding and keeps its own disclosure', () => {
    expect(curatedDetail).not.toContain('GoogleMapsAttribution');
    expect(curatedDetail.replace(/\s+/g, ' ')).toContain('This is an independent informational listing. The Apex Voyager India is not the property owner or booking provider.');
  });

  it('the stay card renders the attribution once, only for Google-sourced stays that have a Maps link', () => {
    expect(grid.match(/<GoogleMapsAttribution\b/g)).toHaveLength(1);
    expect(grid).toMatch(/mapsUrl\s*&&\s*stay\.source === 'google'\s*\?\s*<GoogleMapsAttribution/);
    expect(grid).not.toContain('text-[11px] text-slate-400');
  });

  it('curated cards and the Booking.com-sourced card never use the Google attribution', () => {
    for (const file of ['components/modules/HotelCard.tsx', 'components/modules/PropertyCard.tsx', 'components/modules/regions/RegionBookingStayCard.tsx']) {
      expect(read(file), file).not.toContain('GoogleMapsAttribution');
    }
  });

  it('the change adds no price, availability, booking or WhatsApp wording to the attribution component', () => {
    const source = read('components/ui/GoogleMapsAttribution.tsx');
    expect(source).not.toMatch(/₹|price|availab|book(ing)? now|whatsapp|wa\.me|enquir/i);
  });
});
