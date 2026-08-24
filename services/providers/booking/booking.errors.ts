/** Mirrors services/providers/google/google.errors.ts's secret-free logging convention.
 *  No live Booking.com call exists yet, but this locks the discipline in before one does. */
export function logBookingError(label: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[booking] ${label} failed: ${message}`);
}
