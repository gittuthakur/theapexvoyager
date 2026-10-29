// A conversational reply written by the model may only ask questions or give light, non-factual guidance.
// Package facts (names, links, prices, inclusions) come exclusively from server-built cards, so a reply that
// tries to carry a price, a link, or a booking/availability claim is replaced rather than shown.
const FORBIDDEN = [
  /₹/,
  /\brs\.?\s*\d/i,
  /\binr\b/i,
  /[$€£]\s?\d/,
  /\d\s?(?:per person|pp|\/-)/i,
  /https?:\/\//i,
  /\bwww\./i,
  /\bguarantee[sd]?\b/i,
  /\b(?:is|are|been|be)\s+confirmed\b/i,
  /\b(?:booked|sold out)\b/i,
  /\bavailable on\b/i
];

export const SAFE_ASK_FALLBACK = 'Could you tell me a little more about the trip you have in mind, such as where you would like to go?';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeReply(text: string, fallback: string = SAFE_ASK_FALLBACK): string {
  const cleaned = text.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
  if (!cleaned || FORBIDDEN.some((pattern) => pattern.test(cleaned))) return fallback;
  return cleaned;
}
