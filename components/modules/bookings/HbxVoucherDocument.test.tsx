import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HbxVoucherDocument } from './HbxVoucherDocument';
import type { HbxBookingDocument } from '@/models/HbxBooking';

function baseBooking(overrides: Partial<HbxBookingDocument> = {}): HbxBookingDocument {
  return {
    reference: 'HBX-REF-9001',
    clientReference: 'apexcert12345',
    status: 'CONFIRMED',
    environment: 'test',
    providerHotelId: '617065',
    hotelName: 'White Meadows Manali',
    hotelAddress: 'Log Hut Road, Manali',
    hotelCity: 'Manali',
    hotelPostalCode: '175131',
    hotelCategoryDescription: '4 STARS',
    hotelPhone: '+91-1901-252525',
    destinationName: 'Himachal Pradesh',
    voucherAccessToken: 'super-secret-token-should-never-render',
    currency: 'EUR',
    checkIn: '2026-10-05',
    checkOut: '2026-10-07',
    holderName: 'Rohan',
    holderSurname: 'Sharma',
    rooms: [
      {
        code: 'DBL.SU',
        name: 'Double Superior',
        boardCode: 'BB',
        boardName: 'Bed and Breakfast',
        netAmount: '99999.99',
        paxes: [
          { roomId: 1, type: 'AD', name: 'Rohan', surname: 'Sharma' },
          { roomId: 1, type: 'CH', age: 8 }
        ],
        cancellationPolicies: [],
        rateComments: 'Non-refundable. No pets allowed.'
      }
    ],
    totalNetAmount: '99999.99',
    supplierName: 'Real Supplier Ltd',
    supplierVatNumber: 'GB123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as HbxBookingDocument;
}

function renderVoucher(overrides: Partial<HbxBookingDocument> = {}): string {
  return renderToStaticMarkup(<HbxVoucherDocument booking={baseBooking(overrides)} />);
}

describe('HbxVoucherDocument — mandatory fields', () => {
  it('renders the hotel name and address', () => {
    const html = renderVoucher();
    expect(html).toContain('White Meadows Manali');
    expect(html).toContain('Log Hut Road, Manali');
  });

  it('renders recommended hotel details when present: category, destination, phone', () => {
    const html = renderVoucher();
    expect(html).toContain('4 STARS');
    expect(html).toContain('Himachal Pradesh');
    expect(html).toContain('+91-1901-252525');
  });

  it('renders the holder/lead passenger name', () => {
    const html = renderVoucher();
    expect(html).toContain('Rohan');
    expect(html).toContain('Sharma');
  });

  it('renders at least one passenger name per room', () => {
    const html = renderVoucher();
    expect(html).toContain('Rohan Sharma');
  });

  it("renders a child's age", () => {
    const html = renderVoucher();
    expect(html).toContain('age 8');
  });

  it('renders the Hotelbeds booking reference', () => {
    const html = renderVoucher();
    expect(html).toContain('HBX-REF-9001');
  });

  it('renders the agency/client reference when available', () => {
    const html = renderVoucher();
    expect(html).toContain('apexcert12345');
  });

  it('omits the client-reference section entirely when none was recorded, never inventing one', () => {
    const html = renderVoucher({ clientReference: undefined as unknown as string });
    expect(html).not.toContain('Agency / client reference');
  });

  it('renders check-in and check-out dates', () => {
    const html = renderVoucher();
    expect(html).toMatch(/05 October 2026|October.*2026/);
    expect(html).toMatch(/07 October 2026|October.*2026/);
  });

  it('renders the room type and board type', () => {
    const html = renderVoucher();
    expect(html).toContain('Double Superior');
    expect(html).toContain('Bed and Breakfast');
  });

  it('renders applicable rate comments when present', () => {
    const html = renderVoucher();
    expect(html).toContain('Non-refundable. No pets allowed.');
  });

  it('never invents rate comments when none exist for a room', () => {
    const html = renderVoucher({ rooms: [{ ...baseBooking().rooms[0], rateComments: undefined }] });
    expect(html).not.toContain('Rate conditions');
  });

  it('preserves multiple rooms, each with its own independent rate comments — never dropping one', () => {
    const html = renderVoucher({
      rooms: [
        { ...baseBooking().rooms[0], rateComments: 'Room 1 comment' },
        { ...baseBooking().rooms[0], rateComments: 'Room 2 different comment' }
      ]
    });
    expect(html).toContain('Room 1 comment');
    expect(html).toContain('Room 2 different comment');
  });
});

describe('HbxVoucherDocument — supplier wording', () => {
  it('shows the real supplier name and VAT when present — never hardcodes "Hotelbeds"', () => {
    const html = renderVoucher();
    expect(html).toContain('Real Supplier Ltd');
    expect(html).toContain('GB123456789');
    expect(html).not.toContain('Hotelbeds');
  });

  it('falls back to honest wording (never inventing a supplier) when supplier data is absent', () => {
    const html = renderVoucher({ supplierName: undefined, supplierVatNumber: undefined });
    expect(html).not.toContain('Hotelbeds');
    expect(html).not.toContain('undefined');
    expect(html.toLowerCase()).toContain('confirmed');
  });
});

describe('HbxVoucherDocument — never shows price', () => {
  it('never renders the room net amount or total net amount anywhere in the document', () => {
    const html = renderVoucher();
    expect(html).not.toContain('99999.99');
  });
});

describe('HbxVoucherDocument — cancelled bookings', () => {
  it('clearly shows a CANCELLED banner and never presents it as an active voucher', () => {
    const html = renderVoucher({ status: 'CANCELLED', cancellationReference: 'CANCEL-REF-1' });
    expect(html).toContain('This booking has been cancelled');
    expect(html).toContain('CANCEL-REF-1');
    expect(html).toContain('not valid for check-in');
  });

  it('shows no cancellation banner at all for a genuinely confirmed booking', () => {
    const html = renderVoucher({ status: 'CONFIRMED' });
    expect(html).not.toContain('This booking has been cancelled');
  });
});

describe('HbxVoucherDocument — no leaked internals', () => {
  it('never renders the voucherAccessToken secret inside the printable document', () => {
    const html = renderVoucher();
    expect(html).not.toContain('super-secret-token-should-never-render');
  });

  it('never renders the internal providerHotelId', () => {
    const html = renderVoucher();
    expect(html).not.toContain('617065');
  });

  it('never renders any HBX API credential — the component reads only the persisted booking record, never process.env', () => {
    const originalKey = process.env.HOTELBEDS_API_KEY;
    const originalSecret = process.env.HOTELBEDS_SECRET;
    process.env.HOTELBEDS_API_KEY = 'must-never-appear-in-voucher-key';
    process.env.HOTELBEDS_SECRET = 'must-never-appear-in-voucher-secret';
    try {
      const html = renderVoucher();
      expect(html).not.toContain('must-never-appear-in-voucher-key');
      expect(html).not.toContain('must-never-appear-in-voucher-secret');
    } finally {
      process.env.HOTELBEDS_API_KEY = originalKey;
      process.env.HOTELBEDS_SECRET = originalSecret;
    }
  });
});
