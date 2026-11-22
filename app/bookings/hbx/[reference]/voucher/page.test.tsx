import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
}));

const getVoucherBookingMock = vi.fn();
vi.mock('@/lib/hbxVoucher', () => ({ getVoucherBooking: getVoucherBookingMock }));

const { default: HbxVoucherPage } = await import('./page');

const CONFIRMED_BOOKING = {
  reference: 'HBX-REF-9001',
  status: 'CONFIRMED',
  hotelName: 'White Meadows Manali',
  holderName: 'Rohan',
  holderSurname: 'Sharma',
  rooms: []
};

describe('HbxVoucherPage — security (no arbitrary reference enumeration)', () => {
  beforeEach(() => getVoucherBookingMock.mockReset());

  it('calls getVoucherBooking with the exact reference and token from the URL', async () => {
    getVoucherBookingMock.mockResolvedValue(CONFIRMED_BOOKING);
    await HbxVoucherPage({
      params: Promise.resolve({ reference: 'HBX-REF-9001' }),
      searchParams: Promise.resolve({ token: 'the-real-token' })
    });
    expect(getVoucherBookingMock).toHaveBeenCalledWith('HBX-REF-9001', 'the-real-token');
  });

  it('renders the voucher when the reference+token match a real booking', async () => {
    getVoucherBookingMock.mockResolvedValue(CONFIRMED_BOOKING);
    const result = await HbxVoucherPage({
      params: Promise.resolve({ reference: 'HBX-REF-9001' }),
      searchParams: Promise.resolve({ token: 'the-real-token' })
    });
    expect(result).toBeTruthy();
  });

  it('renders without throwing for a PENDING booking', async () => {
    getVoucherBookingMock.mockResolvedValue({ ...CONFIRMED_BOOKING, status: 'PENDING' });
    const result = await HbxVoucherPage({
      params: Promise.resolve({ reference: 'HBX-REF-9001' }),
      searchParams: Promise.resolve({ token: 'the-real-token' })
    });
    expect(result).toBeTruthy();
  });

  it('calls notFound() — never renders anything — when the token is wrong', async () => {
    getVoucherBookingMock.mockResolvedValue(null);
    await expect(
      HbxVoucherPage({
        params: Promise.resolve({ reference: 'HBX-REF-9001' }),
        searchParams: Promise.resolve({ token: 'wrong-token' })
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('calls notFound() when no token is supplied at all — reference alone is never sufficient', async () => {
    getVoucherBookingMock.mockResolvedValue(null);
    await expect(
      HbxVoucherPage({
        params: Promise.resolve({ reference: 'HBX-REF-9001' }),
        searchParams: Promise.resolve({})
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(getVoucherBookingMock).toHaveBeenCalledWith('HBX-REF-9001', undefined);
  });

  it('calls notFound() for a reference that does not exist at all, the same way as a wrong token', async () => {
    getVoucherBookingMock.mockResolvedValue(null);
    await expect(
      HbxVoucherPage({
        params: Promise.resolve({ reference: 'HBX-DOES-NOT-EXIST' }),
        searchParams: Promise.resolve({ token: 'anything' })
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
