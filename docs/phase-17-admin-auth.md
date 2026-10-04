# Phase 17 — Production admin authentication (Lead CRM)

## What it is
Email + password login for the OWNER, a server-side session, and server-side authorization on every
protected page and API. No signup page, no password reset, no new dependency, **no new secret/env var**.

| Piece | Choice | Why |
|---|---|---|
| Password hashing | Node `crypto.scrypt`, N=2^16, r=8, p=1, 16-byte random salt, params stored in the hash string | Established memory-hard KDF, built in (no custom crypto, no dependency) |
| Session | Random 256-bit token in an HttpOnly cookie; DB stores only its SHA-256 (`adminsessions`, 8 h absolute expiry, TTL-cleaned) | Revocable on logout / deactivation; nothing forgeable; **no signing secret to leak or rotate** |
| Cookie | `__Host-apex_admin` (prod) / `apex_admin` (local http); `HttpOnly; SameSite=Strict; Path=/; Max-Age; Secure` (prod) | `__Host-` forces Secure + no Domain |
| Authorization | `requireAdmin()` in every handler + `getAdminFromCookies()` in pages; role read from DB each request | Not middleware-only, not client-trusted |
| CSRF | State-changing requests need `Origin` == `Host` (https in prod), or `Sec-Fetch-Site: same-origin`; plus SameSite=Strict, JSON-only bodies | |
| Login throttle | `adminloginattempts`: ≤20 failures / 15 min per IP and ≤10 / 15 min per account (hashed keys), shared by all serverless instances; plus a per-instance in-memory cap | Durable without a paid/external service |
| Enumeration | Unknown email, wrong password, inactive user → identical 401 and identical scrypt work | |

### Throttle limitations (be aware)
* The per-account cap can be used to lock the owner out for ≤15 minutes (availability, not confidentiality).
* IP comes from `x-forwarded-for` (Vercel overwrites it). If it were ever missing, all such clients share one `unknown` bucket.
* Fixed windows: an attacker can get up to 2× the limit across a window boundary.
* Not a substitute for a strong password (policy: ≥14 chars, not repetitive, not containing the email name).

## Data (created lazily on first real use — nothing is created by tests)
`adminusers` (email, passwordHash [select:false], role OWNER|EMPLOYEE, isActive, lastLoginAt; unique email; at most one OWNER),
`adminsessions`, `adminloginattempts`. Tests use in-memory fakes only.

## Route access state in production
| Route | State |
|---|---|
| `/internal/login`, `POST /api/internal/auth/login`, `POST /api/internal/auth/logout` | public surface of the auth system (login is throttled, same-origin only) |
| `/internal/leads`, `/api/internal/leads`, `/api/internal/leads/[id]` | OWNER session required (page → redirect to login, API → 401/403) |
| every other `/internal/*` and `/api/internal/*` tool (journey-costing, suppliers, hotel-mappings, property-exclusions, hbx previews/diagnostic) | **unchanged: development-only, 404 in production** — a test fails if any is wired to admin auth |

## Creating the first OWNER (do this only after deploy; never run against an unconfirmed database)
```
npx tsx scripts/bootstrapOwner.ts --email=owner@example.com --confirm-database=<exact db name> --dry-run
npx tsx scripts/bootstrapOwner.ts --email=owner@example.com --confirm-database=<exact db name>
```
Password is typed at a hidden prompt (never an argument, never printed/stored in plaintext). The script refuses if the
connected database name differs from `--confirm-database`, and refuses if an OWNER already exists.

## Environment variables
None added. Required in production (already present): `MONGODB_URI`. (`.env.example` was intentionally not touched.)

## Release sequence (not executed in Phase 17)
1. Stage by name only the Phase 16/16A/17 files; commit; push.
2. Deploy (Vercel). No new variables.
3. Verify unauthenticated protection: `/internal/leads` → 307 `/internal/login`; `/api/internal/leads` → 401; other `/internal/*` → 404.
4. Bootstrap the OWNER (dry-run first), confirming the database name.
5. Sign in at `/internal/login`; verify the CRM loads, an action works, then log out and confirm the old cookie is dead.
6. Only later (separate approval): the 82-record historical lead backfill (`--execute`).
