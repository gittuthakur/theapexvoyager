import { beforeEach, describe, expect, it, vi } from 'vitest';

// D2: Google-sourced stay pages must never publish a Google photo (the /api/places/photo proxy) as a social preview
// image. generateMetadata is exercised with the data layer mocked; no database, Google or network access.
const m = vi.hoisted(() => ({
  getStayByPlaceIdResult: vi.fn(),
  getHotelBySlug: vi.fn(),
  getCuratedDestinationBySlug: vi.fn()
}));

vi.mock('@/lib/stays', () => ({ getStayByPlaceIdResult: m.getStayByPlaceIdResult, getCachedStaysCatalog: vi.fn() }));
vi.mock('@/lib/hotels', () => ({ getHotels: vi.fn(), getHotelBySlug: m.getHotelBySlug }));
vi.mock('@/lib/packages', () => ({ getPackagesByDestinationSlug: vi.fn() }));
vi.mock('@/lib/destinations', () => ({ getCuratedDestinationBySlug: m.getCuratedDestinationBySlug }));
vi.mock('@/lib/experiences', () => ({ primaryDestinationName: vi.fn() }));

const { generateMetadata } = await import('./[...segments]/page');

const PROXY_PHOTO = '/api/places/photo?name=places%2FChIJabc%2Fphotos%2FAVtoken&w=1200';

const googleStay = (photos: string[]) => ({
  placeId: 'ChIJabc',
  name: 'Riverside Hotel',
  slug: 'riverside-hotel',
  stayType: 'hotel',
  formattedAddress: 'Old Manali, Himachal Pradesh',
  photos,
  rating: 4.4,
  userRatingCount: 120,
  source: 'google'
});

const meta = (segments: string[]) => generateMetadata({ params: Promise.resolve({ segments }), searchParams: Promise.resolve({}) });

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Google-sourced property page metadata (D2)', () => {
  it('contains no photo proxy URL and no image at all, even when the stay has photos', async () => {
    m.getStayByPlaceIdResult.mockResolvedValue({ status: 'found', stay: googleStay([PROXY_PHOTO, PROXY_PHOTO.replace('AVtoken', 'AVtoken2')]) });

    const metadata = await meta(['property', 'ChIJabc']);

    expect(JSON.stringify(metadata)).not.toContain('/api/places/photo');
    expect(JSON.stringify(metadata)).not.toContain('places/ChIJabc/photos');
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph).not.toHaveProperty('images');
    expect(metadata.twitter).not.toHaveProperty('images');
  });

  it('uses the Twitter summary card (not summary_large_image)', async () => {
    m.getStayByPlaceIdResult.mockResolvedValue({ status: 'found', stay: googleStay([PROXY_PHOTO]) });

    const metadata = await meta(['property', 'ChIJabc']);

    expect(metadata.twitter).toMatchObject({ card: 'summary', title: 'Riverside Hotel | Apex Stays' });
  });

  it('declares openGraph explicitly even with no photos, so the root layout default image is not inherited (Next.js replaces, not merges)', async () => {
    m.getStayByPlaceIdResult.mockResolvedValue({ status: 'found', stay: googleStay([]) });

    const metadata = await meta(['property', 'ChIJabc']);

    expect(metadata.openGraph).toEqual({
      title: 'Riverside Hotel | Apex Stays',
      description: 'Hotel in Old Manali, Himachal Pradesh.',
      url: '/stays/property/ChIJabc'
    });
    expect(metadata.twitter).toEqual({ card: 'summary', title: 'Riverside Hotel | Apex Stays', description: 'Hotel in Old Manali, Himachal Pradesh.' });
  });

  it('keeps title, description, canonical and the noindex,follow robots directive exactly as before', async () => {
    m.getStayByPlaceIdResult.mockResolvedValue({ status: 'found', stay: googleStay([PROXY_PHOTO]) });

    const metadata = await meta(['property', 'ChIJabc']);

    expect(metadata.title).toBe('Riverside Hotel | Apex Stays');
    expect(metadata.description).toBe('Hotel in Old Manali, Himachal Pradesh.');
    expect(metadata.alternates).toEqual({ canonical: '/stays/property/ChIJabc' });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it('introduces no price, availability or booking wording (Stays stay informational and view-only)', async () => {
    m.getStayByPlaceIdResult.mockResolvedValue({ status: 'found', stay: googleStay([PROXY_PHOTO]) });

    const text = JSON.stringify(await meta(['property', 'ChIJabc']));

    expect(text).not.toMatch(/₹|price|book(ing)?\b|availab|enquir|whatsapp|from \d/i);
  });

  it('unavailable and not-found states are unchanged and carry no image', async () => {
    m.getStayByPlaceIdResult.mockResolvedValueOnce({ status: 'unavailable' });
    expect(await meta(['property', 'ChIJabc'])).toEqual({ title: 'Stay temporarily unavailable | Apex Stays', robots: { index: false, follow: false } });

    m.getStayByPlaceIdResult.mockResolvedValueOnce({ status: 'not-found' });
    expect(await meta(['property', 'ChIJmissing'])).toEqual({ title: 'Stay Not Found | Apex Stays', robots: { index: false, follow: false } });
  });
});

describe('metadata of the other stay pages is unchanged', () => {
  it('a curated first-party property keeps its own image in Open Graph and a large Twitter card', async () => {
    m.getCuratedDestinationBySlug.mockResolvedValue(undefined);
    m.getHotelBySlug.mockResolvedValue({ slug: 'apex-lodge', title: 'Apex Lodge', description: 'A curated lodge.', images: ['/images/apex-lodge.jpg'] });

    const metadata = await meta(['apex-lodge']);

    expect(metadata.title).toBe('Apex Lodge | Apex Stays');
    expect(metadata.alternates).toEqual({ canonical: '/stays/apex-lodge' });
    expect(metadata.openGraph).toEqual({ title: 'Apex Lodge | Apex Stays', description: 'A curated lodge.', images: [{ url: '/images/apex-lodge.jpg', alt: 'Apex Lodge' }] });
    expect(metadata.twitter).toEqual({ card: 'summary_large_image', title: 'Apex Lodge | Apex Stays', description: 'A curated lodge.', images: ['/images/apex-lodge.jpg'] });
    expect(metadata.robots).toBeUndefined();
  });

  it('a curated property without an image keeps openGraph undefined and a summary card', async () => {
    m.getCuratedDestinationBySlug.mockResolvedValue(undefined);
    m.getHotelBySlug.mockResolvedValue({ slug: 'apex-lodge', title: 'Apex Lodge', description: 'A curated lodge.', images: [] });

    const metadata = await meta(['apex-lodge']);

    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toEqual({ card: 'summary', title: 'Apex Lodge | Apex Stays', description: 'A curated lodge.', images: undefined });
  });

  it('a stay-type listing page is unchanged', async () => {
    const metadata = await meta(['hotels']);

    expect(metadata.title).toBe('Hotels in the Himalayas | Apex Stays');
    expect(metadata.alternates).toEqual({ canonical: '/stays/hotels' });
    expect(metadata.openGraph).toEqual({ title: 'Hotels in the Himalayas | Apex Stays', description: 'Comfortable stays with modern amenities in every town.', url: '/stays/hotels' });
    expect(metadata.twitter).toEqual({ card: 'summary', title: 'Hotels in the Himalayas | Apex Stays', description: 'Comfortable stays with modern amenities in every town.' });
  });

  it('a destination listing page is unchanged (noindex, follow)', async () => {
    m.getCuratedDestinationBySlug.mockResolvedValue({ slug: 'manali', title: 'Manali' });

    const metadata = await meta(['manali']);

    expect(metadata.title).toBe('Stays in Manali | Apex Stays');
    expect(metadata.openGraph).toEqual({ title: 'Stays in Manali | Apex Stays', description: 'Hotels, homestays, resorts and unique stays in Manali.', url: '/stays/manali' });
    expect(metadata.twitter).toEqual({ card: 'summary', title: 'Stays in Manali | Apex Stays', description: 'Hotels, homestays, resorts and unique stays in Manali.' });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it('a destination plus stay-type page is unchanged (noindex, follow)', async () => {
    m.getCuratedDestinationBySlug.mockResolvedValue({ slug: 'manali', title: 'Manali' });

    const metadata = await meta(['manali', 'hotels']);

    expect(metadata.title).toBe('Hotels in Manali | Apex Stays');
    expect(metadata.alternates).toEqual({ canonical: '/stays/manali/hotels' });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
