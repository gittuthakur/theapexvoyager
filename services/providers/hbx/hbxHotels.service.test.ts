import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getHotelContentDetail } from './hbxHotels.service';

const ORIGINAL_ENV = { ...process.env };

// Shape confirmed against a real captured Hotelbeds Content API detail response
// (2026-09-28 certification-readiness verification, hotel 617065/White Meadows Manali).
const DETAIL_RESPONSE = {
  hotel: {
    code: 617065,
    name: { content: 'White Meadows Manali' },
    address: { content: 'Prini Village, Manali nagar highway, Kullu' },
    city: { content: 'MANALI' },
    postalCode: '175131',
    category: { description: { content: '3 STARS' } },
    destination: { name: { content: 'Manali' } },
    phones: [
      { phoneNumber: '+9118004252737', phoneType: 'PHONEBOOKING' },
      { phoneNumber: '+9118004252737', phoneType: 'PHONEHOTEL' },
      { phoneNumber: '+9118004252737', phoneType: 'FAXNUMBER' }
    ]
  }
};

describe('getHotelContentDetail', () => {
  beforeEach(() => {
    process.env.HOTELBEDS_API_KEY = 'test-key';
    process.env.HOTELBEDS_SECRET = 'test-secret';
    process.env.HOTELBEDS_API_BASE_URL = 'https://api.test.hotelbeds.com';
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it('returns null when HBX credentials are missing, never calls fetch', async () => {
    delete process.env.HOTELBEDS_API_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await getHotelContentDetail(617065);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls GET /hotel-content-api/1.0/hotels/{code}/details', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify(DETAIL_RESPONSE), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    await getHotelContentDetail(617065);
    const [url] = fetchSpy.mock.calls[0];
    expect(url).toContain('/hotel-content-api/1.0/hotels/617065/details');
  });

  it('extracts address, city, postal code, category, destination and a preferred phone', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(DETAIL_RESPONSE), { status: 200 })));
    const result = await getHotelContentDetail(617065);
    expect(result).toEqual({
      hbxCode: 617065,
      name: 'White Meadows Manali',
      address: 'Prini Village, Manali nagar highway, Kullu',
      city: 'MANALI',
      postalCode: '175131',
      categoryDescription: '3 STARS',
      destinationName: 'Manali',
      phone: '+9118004252737'
    });
  });

  it('prefers a PHONEHOTEL/PHONEBOOKING number over a FAXNUMBER when multiple are listed', async () => {
    const response = { hotel: { ...DETAIL_RESPONSE.hotel, phones: [{ phoneNumber: 'FAX-1', phoneType: 'FAXNUMBER' }, { phoneNumber: 'HOTEL-1', phoneType: 'PHONEHOTEL' }] } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200 })));
    const result = await getHotelContentDetail(617065);
    expect(result?.phone).toBe('HOTEL-1');
  });

  it('leaves optional fields undefined (never invented) when HBX omits them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ hotel: { code: 1, name: { content: 'Bare Hotel' } } }), { status: 200 })));
    const result = await getHotelContentDetail(1);
    expect(result).toEqual({ hbxCode: 1, name: 'Bare Hotel', address: undefined, city: undefined, postalCode: undefined, categoryDescription: undefined, destinationName: undefined, phone: undefined });
  });

  it('degrades to null (never throws) on an HBX 5xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));
    const result = await getHotelContentDetail(617065);
    expect(result).toBeNull();
  });
});
