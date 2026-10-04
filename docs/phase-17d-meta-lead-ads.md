# Phase 17D — Meta Lead Ads (Instant Forms) → Internal CRM

**Status: implemented and tested, NOT released, NOT configured.** No Meta credential exists in this project yet, so nothing is
connected and no Meta lead has been fetched or imported.

## Lead Ads vs everything else Meta
| Thing | What it is | Customer data? | In this project |
|---|---|---|---|
| **Lead Ads / Instant Form** | A person submits a form inside Facebook/Instagram | **Yes** (name/phone/email/answers) | **This phase** |
| Pixel (browser events) | Anonymous tracking beacon | No | Live: base snippet in `app/layout.tsx`, ID in `lib/metaPixel.ts` |
| Conversions API (CAPI) | Server-side copy of tracking events | No | Uncommitted, not deployed (`app/api/meta-capi/`, `lib/fpixel.ts`) – untouched here |
| WhatsApp ad conversations | Chats started from a click-to-WhatsApp ad | In WhatsApp only | Not retrievable via this integration |
| Website enquiry attributed to Meta | Our own form + UTM tags | Yes | Already in the CRM (`source=meta` via UTM) |

## Architecture
```
Meta Instant Form submit
  → Meta POSTs a `leadgen` notification  →  POST /api/webhooks/meta-leads
      1 configured? (else 404)   2 body ≤ 64 KB   3 HMAC-SHA256 of RAW body with App Secret == X-Hub-Signature-256 (else 403)
      4 JSON + schema (only object=page, field=leadgen, numeric leadgen_id)   5 optional Page / Form allow-list
  → server-side Graph call  GET /{leadgen_id}  (token in Authorization header + appsecret_proof; never in a URL)
  → normalizeMetaLead → validateLeadInput(allowMeta) → existing createLead()
  → MongoDB `leads`  →  /internal/leads
```
* GET `/api/webhooks/meta-leads` is Meta's subscription handshake (`hub.mode/hub.verify_token/hub.challenge`).
* Transient failures (Graph 5xx/429/network/DB) → HTTP 502 so Meta redelivers; permanent ones (Graph 4xx, no contact detail) → 200 (no retry storm).
* Nothing from the request is trusted before the signature check. No customer data, tokens or Graph response bodies are logged.

## Data model (minimum change)
* `Lead.captureKind` gains `META_LEAD_AD`; `Lead.source = 'meta'`, `sourceDetail = 'meta-instant-form'` (website/WhatsApp values unchanged).
* `Lead.meta` (optional sub-document): `leadId, pageId, formId, formName, campaignId/Name, adSetId/Name, adId/Name, platform, isOrganic, createdTime, answers[{name, values[]}]`.
* `name` is optional for Meta leads (a form may not ask for it); a phone **or** email is still required.
* Sensitive/unnecessary questions (date of birth, gender, marital/relationship status, address/zip, ID numbers, health, income, etc.) are **never stored**.
* No new index: idempotency uses the existing unique `legacyRef` index with `{ model: 'MetaLeadAd', id: <leadgen_id> }`.

## Idempotency & duplicates
* Same `leadgen_id` delivered any number of times → exactly one Lead (retries, double notifications, historical re-import).
* A *different* leadgen_id from the same person is a genuine new enquiry: it is kept, and — if it matches an existing contact within the CRM's 24 h duplicate rule — linked with `duplicateOf`. Nothing is merged or deleted.

## Credentials / configuration (variable names only)
| Variable | Purpose | Secret? |
|---|---|---|
| `META_APP_SECRET` | verifies webhook signatures; `appsecret_proof` | **yes** |
| `META_PAGE_ACCESS_TOKEN` | long-lived Page (or System User) token with `leads_retrieval` | **yes** |
| `META_LEADS_WEBHOOK_VERIFY_TOKEN` | any long random string you choose, entered in Meta's webhook setup | **yes** |
| `META_PAGE_ID` | optional allow-list: ignore other Pages | no |
| `META_LEADS_FORM_IDS` | optional comma list: ignore other forms | no |
| `META_GRAPH_API_VERSION` | optional, default `v26.0` (check Meta's current version) | no |

Existing (unrelated, public by design): the Pixel ID. `META_CAPI_ACCESS_TOKEN` belongs to the separate, uncommitted CAPI work.
**None of the Lead Ads variables is set in `.env.local` or `.env.example` today.** `.env.example` is deliberately not edited here.

## Owner actions in Meta (summary — see the report for the full list)
1. Business Manager: have **full control of the Facebook Page** that runs the Lead Ads; create/choose a Meta **App** (Business type) in Meta for Developers.
2. App: add **Webhooks** (object *Page*, field **leadgen**) with Callback URL `https://www.theapexvoyager.in/api/webhooks/meta-leads` and the verify token.
3. Permissions: `leads_retrieval`, `pages_show_list`, `pages_manage_metadata`, `pages_read_engagement` (+ `ads_management` / `pages_manage_ads` for ad/campaign names). Live-mode access to `leads_retrieval` may need **App Review / Advanced Access** + Business Verification.
4. Create a **long-lived Page access token** (or System User token) and subscribe the app to the Page's `leadgen` field.
5. Send Meta's *Lead Ads Testing Tool* lead before relying on it.
6. Configure the variables above in Vercel (Production), then redeploy.

## Historical leads
`scripts/metaLeadsHistoricalImport.ts` — **dry-run by default** (read-only, aggregate output, no PII):
* `--source=api` uses the Graph API (needs the variables above). Meta only serves leads for a limited window (~90 days) — older ones are not retrievable this way.
* `--source=csv --csv=<file>` reads a **Leads Center CSV export** (UTF-16/tab or UTF-8/comma) — the safe route for the owner's ~42 leads if the API window/permissions don't cover them.
* `--execute` (separate owner approval) is idempotent, keeps Meta's `created_time`, never edits/deletes existing leads or auto-merges.

## Not done / out of scope
No webhook subscription exists yet; no Meta data has been requested; the uncommitted Pixel/CAPI files were not modified or adopted.
