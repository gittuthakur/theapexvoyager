/**
 * Explicitly approved HBX production origins — same "never guess a supplier value,
 * only add one once directly confirmed" rule as config/hbxDestinations.config.ts's own
 * doc comment.
 *
 * Empty today, on purpose. The 2026-09-24 production-readiness audit found the
 * project's HBX production API endpoint has not been confirmed with HBX/Hotelbeds
 * (see that audit's commercial-access checklist) — inventing one here to unblock
 * testing would be exactly the kind of guess this file exists to prevent.
 *
 * Origin-matching against this set is only HALF of hbx.client.ts's getHbxEnvironment()
 * production gate — see that function's own doc comment. Even once a real, confirmed
 * origin is added here, production classification ALSO requires the independent
 * HBX_PRODUCTION_CONFIRMED=true environment flag to be set. Neither signal is ever
 * sufficient alone; that is deliberate, fail-closed design, not an oversight — do not
 * "simplify" this to a single check.
 *
 * When HBX confirms the real production origin, add it here as an exact
 * `scheme://host` string (e.g. "https://api.hotelbeds.com") — never a guess, never a
 * pattern/substring match, and never with a trailing slash or path segment (origins
 * don't have one; see hbx.client.ts's normalizeOrigin()).
 */
export const HBX_APPROVED_PRODUCTION_ORIGINS = new Set<string>([]);
