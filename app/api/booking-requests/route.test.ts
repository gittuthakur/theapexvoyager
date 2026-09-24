import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TravelPackage } from '@/types/package';

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  // Next's real `after()` requires an active request-scope AsyncLocalStorage context
  // that only exists inside a real Next.js server — calling it directly in a unit test
  // throws. This stub just invokes the callback immediately (synchronously), which is
  // enough to prove *what* gets scheduled (see the "mail dispatch" tests below) without
  // needing Next's own runtime. `NextResponse` itself is the real implementation.
  return { ...actual, after: (callback: () => unknown) => callback() };
});

vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/bookingId', () => ({ generateBookingId: vi.fn().mockResolvedValue('TAP-99999') }));

const bookingRequestCreateMock = vi.fn();
vi.mock('@/models/BookingRequest', () => ({ BookingRequest: { create: bookingRequestCreateMock } }));

const sendBookingConfirmationEmailsMock = vi.fn();
vi.mock('@/lib/mailer', () => ({ sendBookingConfirmationEmails: sendBookingConfirmationEmailsMock }));

const getPackageBySlugMock = vi.fn<(slug: string) => Promise<TravelPackage | undefined>>();
vi.mock('@/lib/packages', () => ({ getPackageBySlug: getPackageBySlugMock }));

const getExperienceBySlugMock = vi.fn();
vi.mock('@/lib/experiences', () => ({ getExperienceBySlug: getExperienceBySlugMock }));

const getExpertBySlugMock = vi.fn();
vi.mock('@/lib/experts', () => ({ getExpertBySlug: getExpertBySlugMock }));

const { POST } = await import('./route');

const TEST_JOURNEY: TravelPackage = {
  slug: 'test-journey',
  name: 'Test Journey',
  destination: 'Test Destination',
  image: '/images/test.jpg',
  duration: '5 Days / 4 Nights',
  price: 10000,
  category: 'Adventure',
  shortDescription: 'A test journey',
  highlights: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  stayOptions: [{ id: 'standard', label: 'Standard', extraPrice: 0 }],
  addOns: [{ id: 'addon-cab', label: 'Private Cab', price: 1500 }]
};

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/booking-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function journeyBody(overrides: Record<string, unknown> = {}) {
  return {
    type: 'journey',
    name: 'Test Customer',
    phone: '9876543210',
    itemName: 'ignored — server re-derives this from the resolved journey',
    details: {
      source: 'catalog',
      slug: 'test-journey',
      travelDate: '2026-11-10',
      adults: 2,
      children: 0,
      addOnIds: [],
      // A client-fabricated total — the whole point of these tests is proving this is discarded.
      total: 1,
      ...overrides
    }
  };
}

beforeEach(() => {
  bookingRequestCreateMock.mockReset();
  bookingRequestCreateMock.mockImplementation(async (doc) => ({ ...doc, referenceId: doc.referenceId ?? 'TAP-99999' }));
  sendBookingConfirmationEmailsMock.mockReset();
  getPackageBySlugMock.mockReset();
  getPackageBySlugMock.mockResolvedValue(TEST_JOURNEY);
  getExperienceBySlugMock.mockReset();
  getExpertBySlugMock.mockReset();
});

describe('POST /api/booking-requests — journey path', () => {
  it('a normal journey enquiry within the traveller limit succeeds', async () => {
    const res = await POST(jsonRequest(journeyBody()));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.referenceId).toBe('TAP-99999');
  });

  it('an over-limit journey enquiry is rejected', async () => {
    const res = await POST(jsonRequest(journeyBody({ adults: 25 })));
    expect(res.status).toBe(400);
    expect(bookingRequestCreateMock).not.toHaveBeenCalled();
  });

  it('an unknown journey slug remains rejected with 404', async () => {
    getPackageBySlugMock.mockResolvedValue(undefined);
    const res = await POST(jsonRequest(journeyBody()));
    expect(res.status).toBe(404);
    expect(bookingRequestCreateMock).not.toHaveBeenCalled();
  });

  it('an invalid travel date remains rejected with the existing error wording', async () => {
    const res = await POST(jsonRequest(journeyBody({ travelDate: '2026-02-30' })));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('travelDate must be a valid date (YYYY-MM-DD)');
  });

  it('a past travel date is rejected with the existing error wording', async () => {
    const res = await POST(jsonRequest(journeyBody({ travelDate: '2020-01-01' })));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('travelDate cannot be in the past');
  });

  it('the client-supplied total is ignored; the server-calculated price is persisted instead', async () => {
    await POST(jsonRequest(journeyBody({ total: 1, adults: 2, addOnIds: ['addon-cab'] })));
    expect(bookingRequestCreateMock).toHaveBeenCalledTimes(1);
    const createdDoc = bookingRequestCreateMock.mock.calls[0][0];
    // 2 adults * 10000 + 1500 add-on = 21500, NOT the client's fabricated `total: 1`.
    expect(createdDoc.details.total).toBe(21500);
    expect(createdDoc.itemName).toBe('Test Journey'); // server-derived, not the client's itemName
  });

  it('existing BookingRequest payload shape remains compatible', async () => {
    await POST(jsonRequest(journeyBody()));
    const createdDoc = bookingRequestCreateMock.mock.calls[0][0];
    expect(createdDoc).toMatchObject({
      type: 'journey',
      name: 'Test Customer',
      phone: '9876543210',
      itemName: 'Test Journey',
      destination: 'Test Destination'
    });
    expect(createdDoc.details).toMatchObject({ source: 'catalog', slug: 'test-journey', adults: 2, children: 0 });
  });

  it('mail dispatch is scheduled with the server-recalculated total, and no real email is sent (mailer is mocked)', async () => {
    await POST(jsonRequest(journeyBody({ addOnIds: ['addon-cab'] })));
    expect(sendBookingConfirmationEmailsMock).toHaveBeenCalledTimes(1);
    const emailArgs = sendBookingConfirmationEmailsMock.mock.calls[0][0];
    expect(emailArgs.total).toBe(2 * 10000 + 1500);
    expect(emailArgs.referenceId).toBe('TAP-99999');
  });
});

describe('POST /api/booking-requests — unrelated types are unaffected by the journey traveller limit', () => {
  it('a stay-type request with no adults/children fields at all still succeeds', async () => {
    const res = await POST(
      jsonRequest({ type: 'stay', name: 'Test Customer', phone: '9876543210', itemName: 'Some Hotel', details: { slug: 'some-hotel' } })
    );
    expect(res.status).toBe(201);
    expect(getPackageBySlugMock).not.toHaveBeenCalled();
  });

  it('an experience-type request is unaffected by the journey traveller cap', async () => {
    getExperienceBySlugMock.mockResolvedValue({ slug: 'test-experience', title: 'Test Experience', location: 'Test Location', price: 500 });
    const res = await POST(
      jsonRequest({ type: 'experience', name: 'Test Customer', phone: '9876543210', itemName: 'ignored', details: { slug: 'test-experience' } })
    );
    expect(res.status).toBe(201);
  });

  it('an expert-type request is unaffected by the journey traveller cap', async () => {
    getExpertBySlugMock.mockResolvedValue({ slug: 'test-expert', name: 'Test Expert', role: 'Advisor', travelStyles: [], expertise: [] });
    const res = await POST(
      jsonRequest({ type: 'expert', name: 'Test Customer', phone: '9876543210', itemName: 'ignored', details: { slug: 'test-expert' } })
    );
    expect(res.status).toBe(201);
  });

  it('a transport-type request (no journey slug at all) still succeeds unaffected', async () => {
    const res = await POST(
      jsonRequest({ type: 'transport', name: 'Test Customer', phone: '9876543210', itemName: 'Some Vehicle', details: { pickup: 'A', destination: 'B' } })
    );
    expect(res.status).toBe(201);
    expect(getPackageBySlugMock).not.toHaveBeenCalled();
  });
});
