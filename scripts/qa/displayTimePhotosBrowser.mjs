/**
 * Browser-rendering check of the 5 display-time pilot properties on a Preview deployment.
 *
 * NOT RUN BY DEFAULT. Every by-place image request costs 1 Google Place Details + 1 Place Photos media request, so one pass
 * over the 5 pilot properties = 5 + 5 Google requests. The previous validation already used its 5 Details allowance, so a
 * pass needs a fresh, explicit approval of that budget. The script refuses to run unless APPROVED_PILOT_RUN=yes, and even
 * then it fulfils at most MAX_GOOGLE_PHOTO_REQUESTS (default 5) by-place requests and ABORTS every further one in the
 * browser before it reaches the server.
 *
 * Run with the browser-automation skill's runner (patchright/Playwright page):
 *   APPROVED_PILOT_RUN=yes PREVIEW_ORIGIN=https://<preview>.vercel.app PREVIEW_BYPASS_TOKEN=<token> \
 *   node <skill-dir>/browser.mjs https://<preview>.vercel.app/ --script scripts/qa/displayTimePhotosBrowser.mjs
 *
 * PREVIEW_BYPASS_TOKEN is the project's Deployment Protection bypass secret (never printed, only sent as a header).
 *
 * Per property it checks: the card's image really decoded (naturalWidth > 0), rating and review count visible, a Google Maps
 * link, the "Property information sourced from" Google Maps attribution, and that the page HTML and DOM contain no stored
 * Google photo name. It prints counts only; it never prints the token or any photo name.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PILOT = [
  { destination: 'manali', q: 'Club Mahindra White Meadows' },
  { destination: 'manali', q: 'Apple Bud Chalet' },
  { destination: 'manali', q: 'Sun Park Boutique' },
  { destination: 'shimla', q: 'Rock Castle' },
  { destination: 'shimla', q: 'Euphoria Grand' }
];

const MAX = Math.min(Number(process.env.MAX_GOOGLE_PHOTO_REQUESTS ?? 5), 5);
const BY_PLACE = '**/api/places/photo/by-place*';
const LEGACY_NAME = /photo\?name=|places%2F[^"'\s]*%2Fphotos|places\/[^"'\s]*\/photos\//;

export default async function run(page) {
  if (process.env.APPROVED_PILOT_RUN !== 'yes') {
    return { refused: true, reason: 'This run makes up to 5 Google Place Details + 5 Place Photos requests. Set APPROVED_PILOT_RUN=yes only after that budget is approved.' };
  }
  const origin = (process.env.PREVIEW_ORIGIN ?? '').replace(/\/$/, '');
  if (!/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return { refused: true, reason: 'PREVIEW_ORIGIN must be the https://*.vercel.app Preview origin (never Production).' };

  const headers = { 'x-vercel-set-bypass-cookie': 'true' };
  if (process.env.PREVIEW_BYPASS_TOKEN) headers['x-vercel-protection-bypass'] = process.env.PREVIEW_BYPASS_TOKEN;
  await page.context().setExtraHTTPHeaders(headers);

  const outDir = join(process.env.QA_OUT_DIR ?? '.', 'display-time-pilot-shots');
  mkdirSync(outDir, { recursive: true });

  const counters = { allowed: 0, aborted: 0, statuses: [] };
  await page.route(BY_PLACE, async (route) => {
    if (counters.allowed >= MAX) {
      counters.aborted += 1;
      return route.abort();
    }
    counters.allowed += 1;
    return route.continue();
  });
  page.on('response', (response) => {
    if (response.url().includes('/api/places/photo/by-place')) counters.statuses.push(response.status());
  });

  const results = [];
  for (const target of PILOT) {
    if (counters.allowed >= MAX) {
      results.push({ ...target, skipped: 'request cap reached' });
      continue;
    }
    const url = `${origin}/stays/search?destination=${encodeURIComponent(target.destination)}&q=${encodeURIComponent(target.q)}`;
    const doc = await page.goto(url, { waitUntil: 'domcontentloaded' });
    const initialHtml = await doc.text();
    const card = page.locator('article, li, div').filter({ has: page.locator('img[src*="/api/places/photo/by-place"]') }).filter({ hasText: target.q.split(' ')[0] }).last();
    const img = page.locator('img[src*="/api/places/photo/by-place"]').first();
    try {
      await img.scrollIntoViewIfNeeded({ timeout: 10000 });
      await page.waitForFunction(() => { const el = document.querySelector('img[src*="/api/places/photo/by-place"]'); return el && el.complete; }, null, { timeout: 20000 });
    } catch {
      /* reported below as not rendered */
    }
    const info = await page.evaluate(() => {
      const el = document.querySelector('img[src*="/api/places/photo/by-place"]');
      const scope = el?.closest('article') ?? el?.parentElement?.parentElement ?? document.body;
      const text = scope.innerText ?? '';
      const maps = [...scope.querySelectorAll('a[href]')].some((a) => /google\.[a-z.]+\/maps|maps\.google|goo\.gl\/maps/i.test(a.href));
      return {
        imgFound: Boolean(el),
        decoded: Boolean(el && el.complete && el.naturalWidth > 0),
        naturalWidth: el?.naturalWidth ?? 0,
        ratingVisible: /\b\d\.\d\b/.test(text),
        reviewCountVisible: /\(\d[\d,]*\)/.test(text),
        mapsLink: maps,
        mapsButtonText: /View on Google Maps/i.test(text),
        attribution: /Property information sourced from/i.test(document.body.innerText),
        legacyNameInDom: /photo\?name=|places%2F[^"'\s]*%2Fphotos|places\/[^"'\s]*\/photos\//.test(document.documentElement.outerHTML)
      };
    });
    await card.screenshot({ path: join(outDir, `${target.q.replace(/\W+/g, '-')}.png`) }).catch(() => {});
    results.push({ ...target, ...info, legacyNameInInitialHtml: LEGACY_NAME.test(initialHtml) });
  }

  const pass = results.every((r) => r.skipped || (r.decoded && r.ratingVisible && r.reviewCountVisible && r.mapsLink && r.attribution && !r.legacyNameInDom && !r.legacyNameInInitialHtml));
  return {
    pass,
    googleByPlaceRequests: { cap: MAX, allowed: counters.allowed, aborted: counters.aborted, responseStatuses: counters.statuses },
    note: 'Each allowed by-place request = 1 Place Details + 1 Place Photos media request.',
    results
  };
}
