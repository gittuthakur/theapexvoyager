import { getAttribution } from '@/lib/leadAttribution';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(body.error ?? 'Request failed', response.status);
  }
  return response.json() as Promise<T>;
}

export async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, method: 'GET' });
  return handleResponse<T>(response);
}

// Public enquiry endpoints that mirror into the internal Lead CRM; only these receive
// campaign attribution (UTM/landing/referrer) alongside the form payload.
const LEAD_ENDPOINTS = new Set(['/api/booking-requests', '/api/contact', '/api/inquiries', '/api/lead-events']);

export async function postJSON<T>(url: string, payload: unknown, init?: RequestInit): Promise<T> {
  const body = LEAD_ENDPOINTS.has(url) && payload && typeof payload === 'object' && !Array.isArray(payload)
    ? { ...payload, attribution: getAttribution() }
    : payload;
  const response = await fetch(url, {
    ...init,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    body: JSON.stringify(body)
  });
  return handleResponse<T>(response);
}
