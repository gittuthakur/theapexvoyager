import { BookingRequest } from '@/models/BookingRequest';

const PREFIX = 'TAP-';
const MIN = 10000;
const MAX = 99999;

function randomSuffix(): string {
  return String(Math.floor(MIN + Math.random() * (MAX - MIN + 1)));
}

/**
 * Generates a human-readable reference like "TAP-10284", retrying on the rare
 * collision. Callers must have already called connectDB() — this only queries.
 */
export async function generateBookingId(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${PREFIX}${randomSuffix()}`;
    const exists = await BookingRequest.exists({ referenceId: candidate });
    if (!exists) return candidate;
  }
  // Astronomically unlikely with a 90,000-value space, but stay correct under it.
  return `${PREFIX}${randomSuffix()}${randomSuffix()}`;
}
