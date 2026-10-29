// Contact details never go to the AI model. Every message is passed through this before it is placed in a
// model request; the enquiry form (which does not involve the model) is the only place contact details are collected.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
// A run of digits (optionally separated by spaces, dots, dashes or brackets, optionally with a leading +) that
// holds at least 7 digits in total reads as a phone number. Short numbers (prices, nights, dates) are left alone.
const PHONE_LIKE = /(?<![\w])\+?\(?\d[\d\s().-]{5,}\d(?![\w])/g;

export const REDACTED = '[redacted]';

export function redactContactDetails(text: string): string {
  return text
    .replace(EMAIL, REDACTED)
    .replace(PHONE_LIKE, (match) => (match.replace(/\D/g, '').length >= 7 ? REDACTED : match));
}
