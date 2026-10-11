import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findOneMock, connectDBMock } = vi.hoisted(() => ({
  findOneMock: vi.fn(),
  connectDBMock: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@/lib/mongodb', () => ({ connectDB: connectDBMock }));
vi.mock('@/models/HbxBooking', () => ({
  HbxBooking: { findOne: findOneMock }
}));

const { getVoucherBooking } = await import('./hbxVoucher');

describe('getVoucherBooking — no arbitrary booking-reference enumeration', () => {
  beforeEach(() => {
    findOneMock.mockReset().mockReturnValue({ lean: vi.fn().mockResolvedValue({ reference: 'HBX-REF-1', status: 'CONFIRMED' }) });
    connectDBMock.mockClear();
  });

  it('returns null (never queries Mongo) when the token is missing — never even a lookup by reference alone', async () => {
    const result = await getVoucherBooking('HBX-REF-1', undefined);
    expect(result).toBeNull();
    expect(findOneMock).not.toHaveBeenCalled();
  });

  it('returns null (never queries Mongo) when the token is an empty string', async () => {
    const result = await getVoucherBooking('HBX-REF-1', '');
    expect(result).toBeNull();
    expect(findOneMock).not.toHaveBeenCalled();
  });

  it('returns null when the reference is missing, even with a token present', async () => {
    const result = await getVoucherBooking('', 'some-token');
    expect(result).toBeNull();
    expect(findOneMock).not.toHaveBeenCalled();
  });

  it('queries by reference AND voucherAccessToken together in a single filter — never reference alone', async () => {
    await getVoucherBooking('HBX-REF-1', 'the-real-token');
    expect(findOneMock).toHaveBeenCalledWith({ reference: 'HBX-REF-1', voucherAccessToken: 'the-real-token' });
    expect(findOneMock).toHaveBeenCalledTimes(1);
  });

  it('returns the booking document when the reference+token match', async () => {
    const result = await getVoucherBooking('HBX-REF-1', 'the-real-token');
    expect(result).toEqual({ reference: 'HBX-REF-1', status: 'CONFIRMED' });
  });

  it('returns null the same way for a wrong token as for a nonexistent reference — indistinguishable outcomes', async () => {
    findOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    const wrongToken = await getVoucherBooking('HBX-REF-1', 'wrong-token');
    const nonexistentRef = await getVoucherBooking('HBX-DOES-NOT-EXIST', 'wrong-token');
    expect(wrongToken).toBeNull();
    expect(nonexistentRef).toBeNull();
  });
});
