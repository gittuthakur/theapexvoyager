# Google Ads WhatsApp Enquiry tracking

## Architecture

- `app/layout.tsx` mounts one inline initialization script and one external Google tag using `next/script` with `afterInteractive`. Next.js retains them across client-side navigation.
- Base ID: `AW-18419258781`.
- `lib/googleAds.ts` exports `trackWhatsAppConversion()`, which sends `gtag('event', 'conversion', { send_to: 'AW-18419258781/1oMOCOWpnvUcEJ2r_s5E' })`.
- The utility is SSR-safe, queues early clicks in the standard `dataLayer`, catches analytics errors, and deduplicates supplied native events with a `WeakSet`.
- `WhatsAppLink` is an explicitly opted-in native anchor with click and middle-click tracking. It preserves href, target, rel, classes, content, and existing click callbacks.
- Programmatic WhatsApp actions call the utility immediately before their existing `window.open`. No timers, navigation overrides, or callback delays were added.
- Form-backed actions fire only at the final WhatsApp handoff. Opening a modal, validation failure, reviewing details, and saving a request that still requires a final WhatsApp click do not fire conversions.
- URL/message builders remain free of tracking side effects. There is no document-wide click listener or window.open monkey patch in the implementation.

## Duplicate audit

Before implementation, the repository's application source, components, utilities, configuration and public assets contained no Google Ads, Google Analytics, GTM, gtag.js, or dataLayer implementation. `components/NavigationTracker.tsx` only records internal navigation locally. The final implementation has one global Google tag loader and one Ads configuration.

This audit covers repository source and the local production build; it cannot inspect independently injected production infrastructure or Google Ads account settings.

## Files changed and CTA ownership

| File | Responsibility / surfaces |
| --- | --- |
| `app/layout.tsx` | Global Google tag |
| `lib/googleAds.ts` (new) | IDs and defensive conversion utility |
| `components/modules/WhatsAppLink.tsx` (new) | Shared tracked anchor |
| `components/layout/Footer.tsx` | Footer/contact WhatsApp Us link |
| `components/modules/WhatsAppButton.tsx` | Home and region floating buttons; inline journey CTA |
| `components/modules/journey-detail/JourneyBookingSidebar.tsx` | Mobile journey WhatsApp button |
| `components/modules/WhatsAppInquiryModal.tsx` | Stay/property/hotel and destination enquiry handoffs reached through WhatsAppEnquireButton |
| `components/modules/BookingRequestModal.tsx` | Shared final WhatsApp link for Plan My Journey, custom quotes, transport, experts, and other booking-request consumers |
| `components/modules/HotelBookingModal.tsx` | Existing legacy stay success link (currently unreachable through its booking trigger) |
| `components/modules/PackageBookingModal.tsx` | Package submission's WhatsApp handoff |
| `components/modules/experiences/ExperienceBookingActions.tsx` | Experience quick-contact link |
| `components/modules/transport/NoInventoryActions.tsx` | Empty-results WhatsApp Travel Expert link |
| `lib/whatsapp.ts` | Shared transport card/detail customise handoff; message builders unchanged |
| `docs/google-ads-tracking.md` (new) | This closure report |

Navbar/header actions are phone calls or internal booking navigation, so they do not fire WhatsApp conversions. `/api/whatsapp` only returns a URL and has no customer-facing caller in the audited source; it remains untracked. Partner registration, phone/email links, ordinary navigation, and unrelated external links remain untracked.

## Verification

- TypeScript: `npx.cmd tsc --noEmit --incremental false` passed.
- Production: `npm.cmd run build` passed, including all 40 generated pages, after authorized read-only database access was available. The first sandboxed attempt timed out generating the database-backed sitemap.
- Lint: `npm.cmd run lint` was attempted but the existing script invokes `next lint`, removed in Next.js 16. No ESLint configuration/dependency exists. Lint setup was left unchanged.
- `git diff --check` passed.
- Chromium browser QA used the real local production server on port 3100. The real Google tag returned HTTP 200, initialized once with the correct ID, and produced zero conversions on page load.
- Conversion tests intercepted the Google script to inspect the real application's dataLayer commands without sending test conversions to Google Ads. Browser POST requests were fulfilled with test responses, preventing database writes and enquiry emails. WhatsApp destinations were intercepted in new tabs without sending messages.
- Exactly one conversion with the exact send_to target and unchanged WhatsApp destination/message/new-tab behavior passed for home floating, footer, experience, journey desktop/mobile, destination form, transport card/detail, shared booking completion, and stay form.
- Page loads on home, experience, journey, destination, transport, and stays produced no conversion. Client-side navigation to Privacy produced no conversion or tag reload. Modal opening, invalid enquiry submission, and shared booking review/save before the final WhatsApp click produced no conversion.
- Utility checks passed for SSR, missing gtag, early queuing, duplicate native events, and a throwing gtag implementation.
- No new browser console/page errors were observed. The server logged an existing Google Places API local-referrer restriction with fallback behavior.
- The legacy hotel success path, complete package wizard, transport empty-results state, and complete Plan My Journey wizard were source-audited; they were not individually driven end to end. Their shared tracking paths were covered as described above.

## Remaining release / Google Ads actions

Release through the normal origin/main and Vercel production deployment process. This implementation does not change Google Ads account settings. In Google Ads, confirm that the supplied conversion label belongs to the action named **WhatsApp Enquiry**. After deployment, use Tag Assistant on `https://www.theapexvoyager.in` to validate that action and check its diagnostics. Browser checks verify implementation behavior, not attribution of a real ad-driven conversion.

## Production cleanup

The temporary `.tmp/ads-fixture` project and tracking QA scripts/logs are removed. No fixture routes, temporary configuration, browser interception code, or debug logging are included in the production change. Other pre-existing local `.tmp` artifacts and `.claude/settings.local.json` are excluded from the focused commit. The QA described above was performed externally by browser automation, not by code shipped to visitors.

Google documentation: https://support.google.com/google-ads/answer/7548399?hl=en-GB
