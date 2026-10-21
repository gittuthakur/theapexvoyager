# C4-B2-3 Stage A: photo-media shadow integration

Base: origin/main 58ac165080b2d8b9d66755903ac9f135fe893b7e (PR #36 merged).
Branch/worktree: c4-b2-3-shadow-integration, D:/githob/The-Apex-Voyager/c4-b2-3-shadow-integration.
Local implementation only. No commit, push, PR, deployment or environment activation authorized.

## Caller audit

Repository-wide production search found exactly three Places HTTP boundaries: lib/googlePlaces.ts searchTextOnce,
lib/googlePhotoFetch.ts createFreshPhotoFetcher, and app/api/places/photo/route.ts GET.
Client-facing proxy URLs are not additional Google boundaries. Google Maps links and local destination-search helpers
do not call Places. No separate legacy Places, Nearby Search, Axios or Google SDK request boundary was found.

| Source/function and trigger | Endpoint / outbound behavior | Cache and deduplication | Bucket | Guards and retry behavior | Stage A / double-count risk |
| --- | --- | --- | --- | --- | --- |
| lib/destinations.ts getDestinationsForLocationResult, getDestinationsWithFallbackResult; app/api/destinations GET without type=stays | searchDestinations -> searchPlaces -> searchTextOnce; POST /v1/places:searchText, one page per location; fallback can query six default locations | DestinationSearchCache hit bypasses Google (30-day updatedAt TTL, removal monitor governs freshness); 10-minute in-process negative failure cache; Next fetch revalidate=86400; no explicit in-flight search coalescing found | text-search-visitor | Authored-location allowlist, owner exclusions fail closed, API key, liveSearch option, GOOGLE_DESTINATION_LIVE_SEARCH, development mock; 8 s timeout, no retry | Deferred: framework cache makes invocation counting inaccurate. Do not count at both service and shared fetch. |
| services/providers/google/googlePlaces.attractions.ts getRegionAttractions; services/regions/regionHub.service.ts getRegionHubData; region page and /api/regions/[slug]/hub | searchPlaces -> searchTextOnce; same POST endpoint | Shared Next Data Cache hint; region profile React cache does not itself coalesce Google fetches; no explicit provider lock | text-search-visitor | GOOGLE_REGION_ATTRACTIONS_MODE disabled returns before any work; development mock, API key, fallback to empty; no retry, 8 s timeout | Deferred. Preserve owner's deployed disabled setting: zero region attraction Google requests. |
| lib/staysRefresh.ts refreshSearchGroup / refreshAllConfiguredStays; authorized app/api/cron/refresh-stays GET | searchStays -> searchPlacesAllPages -> searchTextOnce; one POST per pagination attempt | Due-group rotation, groups deduplicated by location/state/type, run lock with 30 min stale recovery; Next revalidate=86400 | text-search-cron | CRON_SECRET authorization; API key; daily refresh request budget default 20; refresh max pages default 1 (environment override is a positive integer without a clamp); shared helper default MAX_PAGES=3; concurrency 5; no automatic request retry; page 2+ failure preserves earlier results | Deferred. Distinguish cron context explicitly before wiring common Text Search boundary; count each actual attempted page, not only pagesFetched successes or reserved worst-case pages. |
| lib/stays.ts getStaysForDestination, getCachedStaysCatalog, detail lookup, enrichHotelsWithPlaces; stays pages/search and API type=stays | No production Google call; reads PlaceCache. Development searchStays returns mocks | Mongo cache reads, location eligibility, deduplication of returned rows; no live miss fallback | No reservation; a future public live search would be text-search-visitor | Owner exclusions fail closed, authored published destinations/location checks | No wiring. Never count inventory reads or returned properties. Historical comments mentioning live search/enrichment are not execution paths. |
| lib/googlePhotoFetch.ts createFreshPhotoFetcher / fetchFreshPlacePhotos; components/modules/stays/StayPhotoSection.tsx via lib/stayPhotoGallery.ts and eligible stay detail | GET /v1/places/{id}, photos-only field mask; real call only in fresh mode | Explicit no-store, no shared in-flight response, no response caching | place-details-metadata (actual SKU/cost not assumed) | EligiblePlaceId from found Google stay; prior owner/published/cache checks; legacy/disabled/local gates, key and ID validation, 30/client/min, 300/instance/min, max 4 concurrent, 3 s timeout, no retry | Deferred to keep initial change to one caller group. Count only after all guards and concurrency acquisition if later approved. |
| app/api/places/photo/route.ts GET | GET /v1/{photo name}/media; one no-store fetch invocation per eligible handler execution | Browser/CDN success cache 30 days plus stale-while-revalidate; cached responses bypass handler. Error cache 10-300 s; canonical width redirects reduce keys. No route-level in-flight coalescing | photo-media | Query/name validation, canonical width redirect, development mock, GOOGLE_PHOTO_PROXY_MODE disabled, API key, per-client then exclusions then per-instance limiter; default 240/client/min, 1500/instance/min; upstream 8 s, no retry | Instrumented exactly once around final fetch. No service-level counting; simultaneous handler misses really make separate fetches and each counts. |
| lib/googlePlaces.ts searchPlacesAllPages/searchPlaces/searchStays exported helpers | Shared Text Search primitives, not extra callers | Next revalidate and up to 3 pages; searchStays development mocks | Depends on trigger: visitor vs cron; no default bucket guessed | Original timeouts and pagination/error handling unchanged | Deferred. Arbitrary future helper consumers require explicit classification. |
| lib/googlePlaces.ts toProxiedPhotoUrl/placePhotoUrls; lib/googleMapsLink.ts; lib/search/destinationSearch.ts | URL generation or local matching only; photo URL may later cause proxy request | No Google network work here | No reservation here | Existing validation unchanged | Counting here would multiply spend estimates across renders, cache reads and repeated URL generation. |

No observed caller is classified from its function name alone. Text Search's shared primitive cannot distinguish visitor
from cron without an explicit context parameter. Its Next.js cache cannot be treated as an actual network attempt.
Both are deferred design work, not silently guessed classifications.
Google Photo Media may follow an HTTP redirect to an image host under existing fetch behavior; the counter represents
the Places media API invocation, not a second Places charge for each image-host transfer.

## Architecture and evidence

Only the photo proxy imports withGoogleBudgetShadow. The adapter reuses the existing mode parser, core, limit/timeout parsers,
Mongo store factory and GoogleApiBudget model. No new counter collection, billing logic or cache layer.
The store is lazy, shared per server instance, and loads inside tryReserve under the core timeout.
Only explicit shadow activates accounting; off, unset, invalid and enforce execute the outbound callback immediately and
return its original promise. Enforce support is deliberately not wired in this stage.

All existing photo guards run first. Only a no-store outbound attempt reserves one photo-media unit.
Await the reservation before Google; ignore every decision/failure. Construct Google's AbortSignal inside the callback
after accounting, preserving its full 8-second allowance. Google response bytes, statuses, error handling, retry count and
cache headers are untouched. The adapter never receives a URL, key, Place ID, photo name or query.
Core-generated enum/count diagnostics are logged only for store errors or wouldHaveBlocked, never returned to the client.
Logger failures are swallowed. No success-per-attempt logging.

Unit tests prove immediate off promise identity, zero store loading, independent buckets, missing limits fail open,
safe logs, exact Google error propagation and a deterministic fake-clock 250 ms timeout.
Route tests prove one reservation before one fetch, unchanged success bytes/cache headers, and no reservation/fetch for
disabled, excluded, malformed, local, missing-key and rate-limited requests.
The cache/coalescing test is a synthetic placement contract, not a claim of new caching in the photo route.
Existing photo cache behavior is external to this handler; CDN/browser hits cannot reach its only reservation site.
No existing coalescing is moved or bypassed.

Existing dark-island tests are updated to allow only this adapter while retaining model, fake-store and deferred-caller
restrictions. Production core, mode parser, store, model and all kill switches are unchanged.

## Risks and limitations

Shadow is observability, never a spending cap. Missing limits flag wouldHaveBlocked but do not prevent Google.
Each eligible photo attempt adds normally one atomic increment. First bucket/month use per instance adds an ensure upsert;
concurrent cold instances can issue redundant idempotent ensures, and duplicate-key recovery/missing documents can add work.
The store shares the application's cached Atlas pool. Photo exclusions already use Mongo; budget writes add pressure on the
same cluster and a single bucket/month document can become a contention hotspot under serverless concurrency.
The existing model declares a TTL index; first activation can also trigger Mongoose collection/index initialization under existing defaults.
No such initialization was performed here; review that setup before a later activation.

The core default remains 250 ms, store operation maxTimeMS remains 200 ms. No test-only 2000 ms allowance is copied into
production. Cold imports, connections and several round trips may exceed 250 ms; Google still proceeds after that wait.
A core timeout does not cancel Mongo work. A timed-out write may later count successfully or be lost if the instance ends.
There are no detached fire-and-forget writes, but underlying timed-out work can still finish later.
The original Google deadline begins after accounting; shadow can add up to the configured accounting deadline plus event-loop
delay to end-to-end latency. Platform request termination can interrupt Google after a reservation; these are attempts, not
proof of billing or completed requests. No accounting retry, Google retry or new Google call is introduced.
Anomaly logs can be high volume during missing-limit configuration or an Atlas outage; configure approved limits and monitor
log volume before any activation. Exact retry/timeout accounting and deployment termination prevent invoice-grade reconciliation.

## Environment variable names (no values or invented production limits)

For the implemented caller:
- GOOGLE_API_BUDGET_MODE
- GOOGLE_API_BUDGET_PHOTO_MEDIA_DAILY
- GOOGLE_API_BUDGET_PHOTO_MEDIA_MONTHLY
- GOOGLE_API_BUDGET_STORE_TIMEOUT_MS (existing optional override)
- MONGODB_URI (existing)
- GOOGLE_PLACES_API_KEY (existing)

Other existing bucket configuration, not activated by this implementation:
- GOOGLE_API_BUDGET_TEXT_SEARCH_VISITOR_DAILY
- GOOGLE_API_BUDGET_TEXT_SEARCH_VISITOR_MONTHLY
- GOOGLE_API_BUDGET_TEXT_SEARCH_CRON_DAILY
- GOOGLE_API_BUDGET_TEXT_SEARCH_CRON_MONTHLY
- GOOGLE_API_BUDGET_PLACE_DETAILS_METADATA_DAILY
- GOOGLE_API_BUDGET_PLACE_DETAILS_METADATA_MONTHLY

Preserve existing switches:
- GOOGLE_REGION_ATTRACTIONS_MODE
- GOOGLE_PHOTO_PROXY_MODE
- GOOGLE_DESTINATION_LIVE_SEARCH
- GOOGLE_PHOTO_METADATA_MODE

## Rollout and rollback recommendation

1. Owner review of this local diff and offline evidence; separate approval for commit, PR and deployment.
2. Deploy with budget off and preserve the Region Hub disabled setting; compare photo behavior and latency.
3. Obtain owner-approved photo-media daily/monthly limits and review Atlas capacity, indexes, retention and log volume.
4. Separately approve a controlled preview shadow trial; verify counts versus uncached photo attempts and cache hits,
   store errors, wouldHaveBlocked, p95 latency and Atlas writes. No live trial was run in Stage A.
5. Separately approve any production shadow activation with monitoring and rollback thresholds. Do not enable enforce;
   its runtime design and activation require a new approval and tests.
6. Add fresh metadata and explicitly classified/cache-aware Text Search callers only in later reviewed changes.

Rollback: set GOOGLE_API_BUDGET_MODE off or unset it through the owner's normal deployment process.
The direct outbound path resumes with no budget import, connection, writes or accounting delay.
Already-started Mongo operations may finish; counters need not be deleted. Keep all Google kill switches unchanged.
A source rollback may alternatively remove the adapter call; no data migration is required.

## Offline validation results

- Final full suite: node node_modules/vitest/vitest.mjs run --maxWorkers=2: 209 files passed; 3505 tests passed, 29 skipped, 0 failed; 126.28 s.
- Focused Google/Places, Region Hub, stays, photo and owner-exclusion selection: 66 files passed; 1583 tests passed, 29 skipped, 0 failed; 39.42 s.
- Final TypeScript: node node_modules/typescript/bin/tsc --noEmit --incremental false: passed.
- ESLint on all six changed/new TypeScript files: passed without warnings. Repository-wide ESLint: exit 0, 0 errors and 36 warnings in unchanged files.
- git diff --check: passed. Secret-pattern scan of all seven changed/new files plus manual added-content review: passed.
- Live contract variables, MONGODB_URI and GOOGLE_PLACES_API_KEY were removed in each Vitest validation process; GOOGLE_API_BUDGET_MODE was off except scoped mocked test overrides.
- No environment files loaded by the Vitest config, no real Atlas connection, no real Google call, no live contract execution. Test services use mocks/fakes.
- The initial default-worker full run had one unrelated adminPassword scrypt test exceed its 5000 ms test timeout (3502 passed, 29 skipped, 1 failed). Both subsequent two-worker full runs passed without changing any existing test timeout. Final count includes the two last-added route tests.
- Existing Mongoose validateSync deprecation warnings were emitted by model tests.

Changed files (only these seven):
- app/api/places/photo/route.ts
- app/api/places/photo/route.budgetShadow.test.ts
- lib/googleApiBudgetShadow.ts
- lib/googleApiBudgetShadow.test.ts
- lib/googleApiBudget.test.ts
- lib/googleApiBudgetStore.mongo.test.ts
- docs/c4-b2-3-shadow-integration.md

The existing core/mode/store/model, Region Hub kill switch, Vercel configuration, CRM, HBX, Agoda and booking modules are unchanged.
No commit, push, PR, deployment, live service call or production configuration change was made. Await owner review.
