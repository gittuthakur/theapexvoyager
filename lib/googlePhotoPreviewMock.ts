/**
 * C4-B2-3 Preview-only Photo Media route mock gate. This is deliberately a pure
 * environment parser: it has no network, database, logging, or request input.
 *
 * The route owns the mock response and imports this module only from its server-side
 * route handler. There is no client-facing flag or query parameter. An explicit mock
 * request is accepted only in an actual Vercel Preview runtime; every other runtime
 * refuses it so a mistaken production setting cannot fall through to Google.
 */
export const GOOGLE_PHOTO_PREVIEW_MOCK_ENV = 'GOOGLE_PHOTO_PREVIEW_MOCK';

export type GooglePhotoPreviewMockMode = 'off' | 'enabled' | 'refused';

export function googlePhotoPreviewMockMode(env: Record<string, string | undefined>): GooglePhotoPreviewMockMode {
  const raw = env[GOOGLE_PHOTO_PREVIEW_MOCK_ENV];
  if (typeof raw !== 'string' || raw.trim().toLowerCase() !== 'enabled') return 'off';
  return env.VERCEL === '1' && env.VERCEL_ENV === 'preview' ? 'enabled' : 'refused';
}

/**
 * Minimal valid 1x1 baseline JPEG (265 bytes), embedded locally so the Preview mock
 * serves a displayable image. Nothing is fetched to produce or serve it.
 */
export const PREVIEW_MOCK_JPEG_BASE64 =
  '/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AAA//2Q==';

export const PREVIEW_MOCK_JPEG = new Uint8Array(Buffer.from(PREVIEW_MOCK_JPEG_BASE64, 'base64'));
