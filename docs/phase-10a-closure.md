# Phase 10A — stability, trust, legal copy and UX closure

Audit date: 24–25 September 2026 (Asia/Calcutta). This document records the verified implementation and remaining work. The final delivery message supplies the commit SHA, push result and post-deployment observations, which necessarily occur after this document is committed.

## A. Baseline

- Branch: `main`; HEAD and freshly fetched `origin/main`: `457163b46e9d8c7edd52fd99b36d808c0e212c4f`; ahead/behind: `0/0`.
- Existing work: only untracked `.claude/settings.local.json`; preserved and excluded from the phase.
- Recent commits: `457163b` general changes; `f935f32` journey booking quote API; `7f12523` secure quote foundation; `e440ef5` HBX pricing safeguards; `2e2ba06` mapping review tool; `b44fcb3` mapping registry.
- Structure: App Router pages/API handlers in `app`, UI in `components`, catalog/configuration in `config`, shared helpers in `lib`, MongoDB schemas in `models`, booking/pricing/provider services in `services`, migration utilities in `scripts`, assets in `public`.
- Installed runtime/framework: Node 22.21.1, Next 16.3.0, React 19.0.0, TypeScript 5.9.3, Mongoose 9.9.2, Vitest 5.0.1.
- Scripts inspected: `dev`, `build`, `start`, `lint`, `test`, database seed, destination sync batches A–D, region/transport/brand/Spiti backfills. No seed or backfill was run.
- Repository `AGENTS.md` and installed Next route-handler, `after`, page and ESLint guidance reviewed.

| Baseline command | Result |
| --- | --- |
| `git fetch origin` | Passed with sandbox escalation for `.git/FETCH_HEAD` |
| `npm.cmd test` | 25 files, 353 tests passed |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Passed |
| `npm.cmd run lint` | Failed: removed `next lint` command treated `lint` as a directory |
| `npm.cmd run build` | Compilation/type checking passed; About/sitemap prerender failed after MongoDB DNS timeouts |

PowerShell blocked unsigned `npm.ps1`/`npx.ps1`; the Windows `.cmd` launchers and direct Node executable worked. Web browsing could not open the production origin, but Node HTTP fetch and Chromium could. No environment-variable values were read into the report.

## B. Confirmed findings

| ID | Priority / flow | Evidence and root cause | Resolution |
| --- | --- | --- | --- |
| F1 | P1 Contact success | On production, intercepting `/api/contact` with HTTP 200 still displayed an error. React's `event.currentTarget` was read after `await`, then `.reset()` threw. | Capture the form before awaiting; automated browser success/reset and error-retention checks. |
| F2 | P1 Contact delivery | Route saved `Enquiry`, then awaited rejecting SMTP promises inside the same catch that returned 500. Mocked SMTP failures prove the false failure/retry path. | Both sends attempted with bounded SMTP timeouts; saved enquiry remains a success; raw errors omitted from logs. |
| F3 | P1 Privacy contradiction | Production `/privacy` denied advertising tracking while root layout shipped Google Ads and Meta Pixel. `lib/googleAds.ts` measures WhatsApp handoffs; layout records Meta PageView. | Disclose those technologies, potential cookies, browser metadata and local-storage favourites; distinguish a click from a sent message/booking. Tracking behavior unchanged. |
| F4 | P1 Public legal placeholders | Production Privacy, Terms and Cancellation pages contained bracketed date/policy placeholders. | Replace placeholders with dated, manual-confirmation language; no invented refund percentage, deadline or legal immunity. |
| F5 | P1 Unsupported trust assertions | Rendered claims included 24/7 support, universal property vetting, universal assistance-animal access, and every employee having visited every route. No operational verification supplied; provider-backed listings do not establish these guarantees. | Narrow claims to planning/support and provider-specific confirmation. This is not a finding that staff lack expertise. |
| F6 | P1 DB recovery | `connectDB` retained a rejected connection promise indefinitely. Failure-then-success mock proves a fresh connection must be attempted after a transient failure. | Clear rejected promise; tests also verify concurrent connection coalescing. |
| F7 | P1 Stay/destination lead notification | UI → `/api/inquiries` → `Inquiry.create` had no team notification; a saved lead could remain unnoticed if the visitor never sent WhatsApp. | Schedule existing best-effort mailer after persistence. No customer email is collected in this flow, so no email acknowledgement is invented. |
| F8 | P1 Public intake abuse surface | Contact, inquiries, newsletter and partner routes buffered unrestricted JSON; booking requests had a byte cap but no throttle. Phone text was accepted as contact information; contact email allowed address-parser punctuation rejected by the existing booking validator. | Shared streamed 20 KB cap for older routes, 10/minute per-instance endpoint/IP throttle, stricter email reuse and international phone-shape checks. Existing booking cap and authority checks retained. |
| F9 | P2 Newsletter concurrency | Find-then-create can race against the unique email index and return 500 for an existing subscriber; duplicate-key fixture reproduces it. | Treat unique-email collision as already subscribed. |
| F10 | P2 Responsive legal/footer | Browser measured 421px document width at 320–390px on Privacy/Accessibility. Footer email generated 1327px at a 1280px viewport and 1457px at 1440px. | Allow legal flex children to shrink and email text to wrap; remove footer `nowrap`. All seven requested widths now pass on touched static pages. |
| F11 | P1 Spiti origin mismatch | Live API has Day 1 Shimla→Kalpa, Day 7 Kaza→Manali; detail headline advertised Chandigarh. | Headline/metadata now say Shimla, with separate Chandigarh transfer and seasonal route confirmation. No live itinerary changed. |
| F12 | P2 Build/lint gate | Baseline build depended on live MongoDB during static prerender; lint command did not run a linter. | About/sitemap use runtime data; restore ESLint CLI/config with matching Next config. |
| F13 | P1 Catalog contractual ambiguity | Live Kashmir includes private-cab sightseeing but defaults to Shared Sumo; Spiti says private vehicle throughout but defaults to Shared Tempo Traveller; honeymoon includes private transfers but defaults to Shared Sedan. Honeymoon dinner appears in highlights while dinner is excluded. | Deferred for owner/supplier decisions; no production data migration authorized. Confirm inclusions and option basis in the written quotation before accepting a booking. |

No P0 incident was reproduced. No claim of exhaustive security certification is made.

### Journey-by-journey inspection

Read-only `/api/journeys` returned six records. Each duration matches its number of itinerary entries and stated accommodation nights. All six explicitly exclude GST/applicable taxes. Pricing formula remains unchanged: seasonal per-person base × adults/children count, plus configured stay/transport/add-ons, then pace multiplier. Existing booking/quote tests exercise server authority, limits, dates, tampered totals and quote/idempotency behavior. Supplier prices and GST amounts were not independently validated.

| Slug | Duration | Base INR | Published route / observations |
| --- | --- | ---: | --- |
| `manali-premium-escape` | 5D/4N | 12,999 | Starts Manali; Chandigarh transfer marketing needs owner confirmation of timing/cost. Rohtang is marked seasonal in highlights. |
| `kashmir-signature-journey` | 6D/5N | 24,999 | Srinagar with Gulmarg/Pahalgam excursions; gondola explicitly excluded; private/shared transport conflict above. |
| `spiti-valley-adventure` | 7D/6N | 18,999 | Shimla→Kalpa→Nako→Kaza→Manali. Chandratal is conditional; its Day 6 return/overnight routing and Kunzum access require operational confirmation. |
| `himachal-himalayan-explorer` | 8D/7N | 22,999 | Shimla→Manali→Manikaran/Kasol→Manali; Chandigarh transfer, dinner and shared/private choices need clarification. |
| `dharamshala-dalhousie-escape` | 5D/4N | 15,999 | Dharamshala→Dalhousie/Khajjiar; no configurable transport option, private transfers listed. |
| `uttarakhand-explorer` | 6D/5N | 20,999 | Haridwar→Rishikesh/Mussoorie→Dehradun/Haridwar; rafting conditional on river conditions. |

Stay upgrades range from zero to INR 11,000; configured transport increments range from zero to INR 7,000. Three journeys have pace modifiers, including a discounted first/default relaxed option. These are existing business rules, not supplier-verified live prices; no amounts were changed.

### Flow and investigation coverage

| Surface | Trace / checks | Limits |
| --- | --- | --- |
| Contact | ContactForm → contact route → Enquiry → admin/customer SMTP; browser-mocked success/failure and unit failures/escaping | No real SMTP send or production enquiry |
| Journey `?book=1` | PackageBookingModal → booking-requests → authoritative catalog pricing → BookingRequest → mailer → WhatsApp handoff | No supplier booking; browser dialog focus/Escape checked |
| Eight-step planner | Wizard → ChoiceCard/shared request modal → normalized trip-planner branch → BookingRequest/mailer | All eight steps reached; no real submission |
| Stay/destination | WhatsAppInquiryModal → inquiries → Inquiry → scheduled admin mail → WhatsApp | No customer email field; occupancy is currently WhatsApp-only, not durable in Inquiry |
| Experience | Shared request modal/planner navigation → booking-requests experience branch → server-resolved Experience | Listing/detail and source traced; not every experience individually browser-tested |
| Transport/custom route | Existing shared booking-request path, server `REQUESTED` status convention and manual provider confirmation | Quote/availability remains manual; generic transport details are customer requests, not authoritative supplier prices |
| Partner intake | Partner form → partners route → pending TransportPartner | Tests validate fields/status; no real partner application |
| Newsletter | Banner → newsletter route → unique NewsletterSubscriber | UI acknowledgement only; no newsletter delivery/opt-in service introduced |
| Signed booking API | Feature-gated `/api/bookings` → signed quote → idempotent Booking service | Existing 353-test baseline covers this foundation; payment/fulfilment not enabled by this phase |
| WhatsApp/tracking | Button/link/modal call sites; Google helper deduplicates the same native event | No real message or conversion deliberately sent; ad-account receipt not externally verified |
| Navigation/search/footer | Source inspection, live navigation, shared footer responsive reproduction | Not a full combinatorial dropdown/filter/pagination/comparison audit |
| Destinations/regions/journeys | Listings, representative detail routes, three real region slugs, catalog inspection, redirects and 404 HTTP responses | Not every destination/filter combination exercised |
| Stays | Listing/search/internal Manali page, Coming soon count labels and explicit enquiry-only modal language | No instantaneous supplier inventory or checkout is claimed; external inventory not validated |
| About/Why Us/Careers/FAQs/legal/photo credits | HTTP smoke checks and source/content review | Image licences not legally re-certified; business policy sign-off remains with owner |
| Accessibility/performance | Seven widths, reduced-motion context, dialog focus/trap/Escape, semantic contact status, image helper/font loading source | No screen-reader hardware testing, Lighthouse score or exhaustive image network crawl |

## C. Exact implementation inventory

| Files | Reason / impact |
| --- | --- |
| `app/api/contact/route.ts`; `app/api/contact/route.test.ts` | Bound/validate intake; retain successful persistence on SMTP failure; escape email fixtures; safe logs. |
| `components/modules/ContactForm.tsx` | Capture form before await, avoid active resubmission, required/optional labels, autocomplete/length bounds, announced status/error. |
| `app/api/inquiries/route.ts`; `app/api/inquiries/route.test.ts` | Bound intake, usable phone validation, notify after save; existing response/persistence shape preserved. |
| `app/api/newsletter/route.ts`; `app/api/newsletter/route.test.ts` | Bound intake, shared strict email validation, handle unique-index race without false failure. |
| `app/api/transport/partners/route.ts`; `app/api/transport/partners/route.test.ts` | Bound intake, validate contacts and integer fleet count; pending status remains authoritative. |
| `app/api/booking-requests/route.ts`; `app/api/booking-requests/route.test.ts` | Add throttle/phone validation and safe logging; isolate limiter in pre-existing pricing tests. |
| `lib/publicFormRequest.ts`; `lib/publicFormRequest.test.ts` | Shared byte-counted reader, request throttle and international phone-shape validator. |
| `lib/rateLimit.ts`; `lib/rateLimit.test.ts` | Cap active in-memory keys at 10,000, expire old keys; fail closed when full. |
| `lib/mongodb.ts`; `lib/mongodb.test.ts` | Retry transient connection failures while retaining shared connection attempts. |
| `lib/mailer.ts`; `lib/mailer.test.ts` | Remove raw mail errors from logs; verify HTML escaping, notes isolation and best-effort delivery. |
| `lib/googleAds.test.ts` | Verify event deduplication and non-blocking analytics failure; tracking implementation unchanged. |
| `components/modules/PrivacyPolicyContent.tsx` | Accurate tracking/storage disclosure, actual update date, shrink/wrap fixes. |
| `components/modules/TermsAndConditionsContent.tsx` | Remove pending business policies; written quotation/manual confirmation and non-excludable rights wording; wrap fixes. |
| `components/modules/CancellationPolicyContent.tsx` | Replace unfinished refund terms with booking-specific written confirmation; no invented fees/time limits; wrap fixes. |
| `components/modules/AccessibilityPolicyContent.tsx`; `app/accessibility-policy/page.tsx` | Provider-specific accessibility coordination instead of universal guarantees; metadata and mobile layout match. |
| `components/modules/WhyChooseUs.tsx` | Remove unsubstantiated universal vetting/24-hour support claims. |
| `components/modules/AboutContent.tsx`; `app/about/page.tsx` | Indicative pricing and support language; database-backed About rendered at request time. |
| `components/modules/CareersContent.tsx` | Remove universal employee route-visit assertion. |
| `components/modules/FaqsContent.tsx` | Replace blanket property certification/reinspection claim; FAQ schema derives from the same copy. |
| `components/modules/experiences/ExperienceTrust.tsx` | Curated, confirmation-based experience wording and support label. |
| `components/modules/journeys/JourneysTrustSection.tsx`; `app/stays/page.tsx` | Remove unsupported round-the-clock promise. |
| `app/journeys/[slug]/page.tsx` | Align Spiti origin/metadata with published route; explain separate transfer and seasonal limitations. |
| `components/layout/Footer.tsx` | Wrap email instead of forcing desktop document overflow. |
| `components/modules/GlobalSearch.tsx`; `components/modules/PopularDestinationsSection.tsx`; `components/modules/StaysGrid.tsx` | Escape JSX punctuation reported by restored lint; identical rendered text. |
| `app/sitemap.ts` | Query current catalog at request time instead of requiring database during build. |
| `package.json`; `package-lock.json`; `eslint.config.mjs` | Restore supported ESLint CLI with Next rules. Development dependencies only; no existing application dependency version changed. Compiler-migration diagnostics remain visible warnings. ESLint 9 is retained because the bundled React plugin fails under ESLint 10. |
| `next-env.d.ts` | Next-generated production route-type imports from the successful build. |
| `scripts/phase10a-browser.cjs` | Re-runnable seven-width legal/contact checks and intercepted success/failure submissions; no production writes. |
| `docs/phase-10a-closure.md` | Evidence, file inventory, verification limits and next-phase scope. |

No persisted schema, price, supplier integration, URL, credential, payment service or admin portal was changed. Throttles are best-effort per process and assume the hosting proxy overwrites forwarded-IP headers; they are not distributed abuse prevention.

## D. UX changes

- Contact success stays successful; API failure retains input. Required fields and optional phone are explicit, with accessible status/error announcements.
- Legal content and contact email fit at 320px and desktop widths without horizontal scrolling.
- Manual confirmation, provider-specific facilities and itinerary origin are clearer.
- No broad redesign, navigation replacement, animation addition or typography/palette change.

## E. Verification matrix

| Check | Result before release |
| --- | --- |
| Full Vitest suite | 34 files / 373 tests passed, including all original 353 |
| TypeScript, incremental disabled | Passed |
| ESLint CLI | 0 errors, 40 warnings; includes 18 state-in-effect, 1 compiler immutability/hoisting, 6 effect-dependency, 2 ARIA and existing image/unused-directive warnings |
| Production build | Passed; 38 static pages generated; About/sitemap dynamic |
| Model/quote/pricing/idempotency tests | Passed within full suite; model/DB dependencies mocked, not a real Mongo integration environment |
| Email escaping/failure tests | Passed with mocked SMTP; no external mail |
| Browser automation | Privacy, Terms, Cancellation, Accessibility, Contact at 320/360/390/430/768/1280/1440; no page exceptions; width checks pass |
| Contact browser success | One intercepted request, announced success, cleared form |
| Contact browser error | Intercepted failure, announced error, original input retained |
| Production read-only interaction | Eight wizard steps reached; Spiti `?book=1` dialog initial focus, Shift+Tab containment and Escape close passed |
| Public HTTP/SEO checks | Homepage, listings, representative details, legal/info pages, robots and sitemap returned 200; missing page/destination returned 404; both legacy journey redirects returned 308, preserving `?book=1` |
| Placeholders | No bracketed legal placeholders remain in public source/rendered touched pages; planner's legitimate “Dates to be confirmed” state retained |
| Git diff | Reviewed; whitespace check passed; unrelated `.claude` file excluded |

Production URLs checked before release: `/`, `/destinations`, `/destinations/manali`, `/regions/himachal-pradesh`, `/regions/kashmir`, `/regions/uttarakhand`, `/journeys`, `/journeys/spiti-valley-adventure`, `/journeys/himachal-himalayan-explorer`, `/plan-my-journey`, `/stays`, `/stays/search`, `/stays/manali`, `/experiences`, `/experiences/spiti-valley-village-homestay`, `/transport`, `/contact`, `/about`, `/why-the-apex-voyager`, `/careers`, `/faqs`, `/privacy`, `/terms`, `/cancellation-policy`, `/accessibility-policy`, `/photo-credits`, `/robots.txt`, `/sitemap.xml`. The real Kashmir region slug is `kashmir`; guessed alternatives correctly returned 404.

Browser page exceptions were absent on the nine completed baseline page probes. Some initial browser navigations timed out while waiting for third-party load completion; DOM-ready navigation and blocking advertising requests allowed targeted interaction checks. This is not evidence of a universal network-clean/performance pass. Local dynamic pages remain untestable against the configured MongoDB because DNS access fails here; static production-build pages and mocked route/service tests were used locally instead.

## F. Git and deployment

One focused phase commit is intended after the local gate. Its SHA, push result, fresh local/remote equality and observed production markers are recorded in the final delivery response. A deployment-provider SHA is only asserted if supplied by the provider; matching live content alone verifies served fixes, not an authenticated provider release record.

## G. Remaining backlog

### P0/P1 and owner decisions

- No reproduced P0. F13 supplier/catalog conflicts remain P1 business-content decisions: private versus shared transport, honeymoon dinner inclusion, exact transfer durations and Chandratal overnight/return route. No production catalog was edited.
- Owner must approve definitive booking-specific cancellation charges, refund processing commitments, applicable taxes and provider accessibility arrangements. The site now asks for these in writing rather than displaying unfinished promises.
- Confirm an operational process for monitoring saved enquiries and retrying failed email. Persistence is protected; SMTP delivery and inbox receipt were not tested externally.

### P2 improvements

- Distributed rate limiting and durable idempotency for legacy enquiry/contact/booking-request submissions; the newer signed Booking API already has durable idempotency tests.
- Persist stay occupancy requirements currently only included in the WhatsApp message; requires a deliberate additive data contract.
- Review consent and advertising controls for target markets with the owner. Current policy now discloses actual behavior; this phase does not certify jurisdictional compliance or invent a consent system.
- Address the 40 lint warnings and migrate the ESLint/React-plugin combination when compatible. No security or validation rule was weakened to pass tests.
- Add a safe staging MongoDB/SMTP sink and broader browser coverage for all filter/sort/pagination/comparison combinations, supplier availability, network failures, screen readers and performance budgets.

### P3 / future

- Destination map mode is intentionally Coming soon; do not present it as implemented.
- Add operationally verified supplier/service badges only when evidence and maintenance processes exist.

### External verification gaps

- Real database writes, admin inbox delivery, customer acknowledgements, campaign conversion receipt, supplier availability and paid bookings were deliberately not exercised against production.
- No authenticated deployment dashboard/CLI was available at baseline. Public content markers can verify served changes after push; provider commit attribution may remain unavailable.
- No secrets were added or exposed in report/source. No customer messages, supplier bookings, charges, migration scripts or manual production database changes were made. Normal page reads may exercise existing application/provider caches.

## H. Recommended next phase

**Phase 10B — supplier-confirmed catalog and durable lead delivery.** Resolve the six-journey contractual ambiguities with owner-approved source data; define a reviewed, reversible catalog update; add a staging MongoDB/SMTP sink, durable legacy-request idempotency and notification retry/monitoring; verify stay occupancy retention and delivery without real customer traffic. Preserve this phase's URLs and visual design. Do not begin automatically.

Reference material used for narrow factual checks: [Google partner-site data use](https://www.google.com/policies/privacy/partners/), [Google cookies](https://policies.google.com/technologies/cookies/embedded?hl=en-US), [Meta description of partner tools including its pixel](https://www.facebook.com/privacy/policies/uso/), [India Code RPWD Act](https://www.indiacode.nic.in/handle/123456789/2155?locale=en). These sources do not establish supplier compliance or constitute business policy approval.
