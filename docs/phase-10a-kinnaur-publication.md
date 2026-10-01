# Phase 10A — Kinnaur publication

This phase preserves the exact Kinnaur publication safeguard and executes the single-slug, owner-approved publication flow for `kinnaur-valley-tour`.

## Scope

- Allowlist only: `kinnaur-valley-tour`
- No other Journey is ever eligible
- Status mutation is limited to the single field change `status: 'draft' -> 'published'`
- The live Kinnaur record must already satisfy the production commercial gates before a publication is permitted
- The script defaults to dry run and requires `--deployment-ready` for any execute path

## Verified live state

Production read checks confirm:

- Total Journeys: 40
- Published: 26
- Draft: 14
- Kinnaur draft slug: `kinnaur-valley-tour`
- Kinnaur route: Shimla → Narkanda → Sarahan → Sangla → Chitkul → Kalpa → Narkanda → Shimla
- Duration: 6N/7D
- Price: ₹22,999 per person onwards
- Occupancy: 2 adults / 1 room / double sharing
- Hotel allocation: Narkanda 2, Sarahan 1, Sangla 1, Kalpa 2
- Meal plan: Breakfast + Dinner where operationally provided
- Transport: private hill-road vehicle for approved motorable sectors
- Image: `/images/destination-sangla-valley.jpg`
- Only blocker remaining: `OWNER_APPROVAL_REQUIRED`

## Dry-run gate

The dry-run command is:

```bash
npx tsx scripts/publishPhase10Kinnaur.ts
```

This returns the expected guard state:

- Would publish: 1
- Already published: 0
- Refused: 0

## Execute gate

The execute command is:

```bash
npx tsx scripts/publishPhase10Kinnaur.ts --execute --deployment-ready
```

Execution is permitted only after the live deployment gate has been verified. The mutation remains strictly status-only and cannot rewrite commercial data.

## Publication result

If the live owner approval is explicitly applied and the deployment gate is ready, the exact mutation is:

```json
{ "$set": { "status": "published" } }
```

The mutation is restricted to the Kinnaur target record only. No other Journey is changed. No route, price, inclusions, exclusions, image, or cancellation wording is rewritten during publication.

## Expected post-publication state

- Total Journeys: 40
- Published: 27
- Draft: 13
- Catalogue count: 27
- Journey sitemap count: 27
- Kinnaur canonical URL remains the same public route and is the only newly published page

## Implementation files

- `scripts/publishPhase10Kinnaur.ts`
- `scripts/publishPhase10Kinnaur.test.ts`
- `docs/phase-10a-kinnaur-publication.md`
