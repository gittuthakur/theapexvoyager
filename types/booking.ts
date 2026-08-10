export interface BookingForm {
  name: string;
  email: string;
  phone?: string;
  destination?: string;
  tour?: string;
  dates?: string;
  guests?: number;
  message: string;
}

export type ContactFormStatus = 'idle' | 'sending' | 'success' | 'error';
