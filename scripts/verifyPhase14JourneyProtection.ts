/** Read-only Phase 14 evidence. Raw MongoDB reads only; no model initialization or writes. */
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

async function main() {
  const mode = process.argv[2];
  if (!['before', 'after'].includes(mode)) throw new Error('Use before or after; no write/apply mode exists');
  try { process.loadEnvFile('.env.local'); } catch { /* Can use supplied environment. */ }
  await mongoose.connect(process.env.MONGODB_URI!, { autoIndex: false, autoCreate: false });
  try {
    const rows = await mongoose.connection.collection('journeys').find({}).sort({ slug: 1 }).toArray();
    const drafts = rows.filter(row => row.status === 'draft').map(row => row.slug as string);
    const published = rows.filter(row => row.status === 'published');
    if (rows.length !== 40 || drafts.length !== 12 || published.length !== 28) throw new Error('Inventory differs from required 40/28/12 baseline');
    const site = 'https://www.theapexvoyager.in';
    const get = (path: string) => fetch(site + path, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
    const [catalogueResponse, sitemapResponse] = await Promise.all([get('/api/journeys'), get('/sitemap.xml')]);
    if (catalogueResponse.status !== 200 || sitemapResponse.status !== 200) throw new Error('Public catalogue/sitemap unavailable');
    const catalogue = await catalogueResponse.json();
    const sitemap = await sitemapResponse.text();
    const publicSlugs = catalogue.journeys.map((row: { slug: string }) => row.slug).sort();
    const sitemapSlugs = [...sitemap.matchAll(/<loc>[^<]*\/journeys\/([^<]+)<\/loc>/g)].map(match => match[1]).sort();
    const expected = published.map(row => row.slug).sort();
    if (JSON.stringify(publicSlugs) !== JSON.stringify(expected) || JSON.stringify(sitemapSlugs) !== JSON.stringify(expected)) throw new Error('Catalogue/sitemap differs from published inventory');
    const forbidden = /supplierName|supplierCost|hotelCosts|transportCosts|grossProfit|grossMarginPercent|recommendedStartingPrice|journeyCosting/i;
    if (forbidden.test(JSON.stringify(catalogue))) throw new Error('Internal data in public catalogue');
    const draftChecks = await Promise.all(drafts.map(async slug => {
      const [page, api] = await Promise.all([get(`/journeys/${slug}`), get(`/api/journeys/${slug}`)]);
      if (page.status !== 404 || api.status !== 404) throw new Error(`Draft exposed: ${slug}`);
      return { slug, page: page.status, api: api.status };
    }));
    const internalChecks = await Promise.all(['/internal/journey-costing', '/api/internal/journey-costing'].map(async path => {
      const response = await get(path);
      if (response.status !== 404) throw new Error(`Internal route exposed: ${path}`);
      return { path, status: response.status };
    }));
    const deniedPost = await fetch(site + '/api/internal/journey-costing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(45000) });
    if (deniedPost.status !== 404) throw new Error('Public costing write endpoint accessible');
    const fingerprint = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    const evidence = { checkedAt: new Date().toISOString(), total: rows.length, published: published.length, draft: drafts.length, drafts, catalogue: publicSlugs.length, sitemap: sitemapSlugs.length,
      fingerprint, prices: rows.map(row => ({ slug: row.slug, status: row.status, price: row.price ?? null })), draftChecks, internalChecks, costingPost: deniedPost.status, publicCostingLeak: false };
    await mkdir('.tmp/phase14-qa', { recursive: true });
    if (mode === 'after') {
      const before = JSON.parse(await readFile('.tmp/phase14-qa/production-before.json', 'utf8'));
      if (before.fingerprint !== fingerprint || JSON.stringify(before.prices) !== JSON.stringify(evidence.prices)) throw new Error('Journey documents changed since baseline');
    }
    await writeFile(`.tmp/phase14-qa/production-${mode}.json`, JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ mode, total: rows.length, published: published.length, draft: drafts.length, drafts, catalogue: publicSlugs.length, sitemap: sitemapSlugs.length, fingerprint, unchanged: mode === 'after', internalChecks }));
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message.replace(/mongodb[^\s]*/gi, '[connection]') : 'Verification failed'); process.exitCode = 1; });
