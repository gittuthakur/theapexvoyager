/** Mirrors services/providers/google/google.errors.ts's secret-free logging convention
 *  and lib/api.ts's ApiError shape. Never construct or log a message that could contain
 *  HOTELBEDS_API_KEY, HOTELBEDS_SECRET, a full X-Signature, or a full rateKey. */
export class HbxApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function logHbxError(label: string, error: unknown): void {
  const message = error instanceof HbxApiError ? `HTTP ${error.status}: ${error.message}` : error instanceof Error ? error.message : String(error);
  console.error(`[hbx] ${label} failed: ${message}`);
}
