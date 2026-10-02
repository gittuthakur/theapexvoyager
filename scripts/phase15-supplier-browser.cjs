// DEMO / SYNTHETIC. UI + local file storage only. No MongoDB writes or price application.
// node scripts/phase15-supplier-browser.cjs /path/to/playwright-core /path/to/chromium [local base URL]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.argv[2]);
const base = process.argv[4] || 'http://localhost:3000';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base)) throw new Error('Loopback dev URL required');
(async () => {
  fs.mkdirSync('.tmp/phase15-qa', { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.argv[3] });
  const results = []; let page;
  try {
    for (const width of [1440, 390, 320]) {
      page = await browser.newPage({ viewport: { width, height: 1000 } }); page.setDefaultTimeout(60000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const suffix = `${width}-${Date.now()}`; const hotelName = `DEMO Hotel Supplier ${suffix}`; const transportName = `DEMO Transport Supplier ${suffix}`;
      await page.goto(`${base}/internal/suppliers`, { waitUntil: 'domcontentloaded' });
      const suppliers = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Suppliers', exact: true }) });
      const entry = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Rate entry', exact: true }) });
      await suppliers.getByRole('button', { name: 'New supplier', exact: true }).waitFor();
      async function saved(section, label) {
        const [response] = await Promise.all([page.waitForResponse(r => r.url().endsWith('/api/internal/supplier-library') && r.request().method() === 'POST'), section.getByRole('button', { name: label, exact: true }).click()]);
        const data = await response.json(); assert.equal(response.status(), 200, JSON.stringify(data));
        await page.waitForTimeout(400); return data.record;
      }
      async function createSupplier(name, type) {
        await suppliers.getByRole('button', { name: 'New supplier', exact: true }).click();
        await suppliers.getByLabel('Data Classification', { exact: true }).selectOption('DEMO_SYNTHETIC');
        await suppliers.getByLabel('Name', { exact: true }).fill(name); await suppliers.getByLabel('Supplier Type', { exact: true }).selectOption(type); await suppliers.getByLabel('Status', { exact: true }).selectOption('ACTIVE');
        await suppliers.getByLabel('Email', { exact: true }).fill('demo@example.invalid'); await suppliers.getByLabel('Phone', { exact: true }).fill('+91 0000000000');
        await suppliers.getByLabel('Service Destinations', { exact: true }).fill('auli, joshimath'); return saved(suppliers, 'Save supplier');
      }
      const hotelSupplier = await createSupplier(hotelName, 'HOTEL');
      await suppliers.getByLabel('Verification state', { exact: true }).selectOption('VERIFIED'); await suppliers.getByLabel('Verification notes', { exact: true }).fill('DEMO / SYNTHETIC acknowledgement for UI test only'); await suppliers.getByLabel('Verification acknowledgement', { exact: true }).fill(`VERIFY ${hotelSupplier.id}`); await saved(suppliers, 'Record verification');
      async function commonRate(supplierId, category, from = '2026-01-01', to = '2099-12-31') {
        await entry.getByRole('button', { name: 'New rate', exact: true }).click(); await entry.getByLabel('Rate supplier', { exact: true }).selectOption(supplierId); await entry.getByLabel('Rate category', { exact: true }).selectOption(category);
        await entry.getByLabel('Destination', { exact: true }).fill('auli'); await entry.getByLabel('Valid From', { exact: true }).fill(from); await entry.getByLabel('Valid To', { exact: true }).fill(to); await entry.getByLabel('Season Label', { exact: true }).fill('DEMO / SYNTHETIC Winter'); await entry.getByLabel('Confirmation Status', { exact: true }).selectOption('QUOTED');
      }
      async function hotelFields(rate) {
        await entry.getByLabel('Property Name', { exact: true }).fill('DEMO Property'); await entry.getByLabel('Room Category', { exact: true }).fill('Demo double'); await entry.getByLabel('Double Occupancy Rate', { exact: true }).fill(String(rate));
        await entry.getByLabel('Meal Plan', { exact: true }).fill('CP'); await entry.getByLabel('Meal Plan Meaning', { exact: true }).fill('Room plus breakfast'); await entry.getByLabel('Included Meals', { exact: true }).fill('breakfast');
      }
      await commonRate(hotelSupplier.id, 'HOTEL_ROOM'); await hotelFields(2000); const hotelRate = await saved(entry, 'Save new rate');
      await commonRate(hotelSupplier.id, 'HOTEL_ROOM', '2027-01-01', '2027-12-31'); await hotelFields(2200); await saved(entry, 'Save new rate');
      await page.getByLabel('Filter validity', { exact: true }).selectOption('FUTURE'); assert.match(await page.getByRole('heading', { name: 'Rate comparison and history' }).locator('..').innerText(), /FUTURE/); await page.getByLabel('Filter validity', { exact: true }).selectOption('');
      await page.getByLabel('Filter supplierId', { exact: true }).selectOption(hotelSupplier.id); await page.getByLabel('Filter destination', { exact: true }).selectOption('auli'); await page.getByLabel('Filter category', { exact: true }).selectOption('HOTEL_ROOM'); await page.getByLabel('Filter status', { exact: true }).selectOption('QUOTED');
      const comparison = page.locator('article').filter({ hasText: hotelName }); assert.equal(await comparison.count(), 2); await comparison.filter({ hasText: '2099-12-31' }).getByRole('button', { name: 'Edit / create revision', exact: true }).click(); await entry.getByLabel('Double Occupancy Rate', { exact: true }).fill('2500'); const masterV2 = await saved(entry, 'Save rate revision');
      assert.equal(masterV2.version, 2);
      const transportSupplier = await createSupplier(transportName, 'TRANSPORT'); await commonRate(transportSupplier.id, 'TRANSPORT_PER_KM'); await entry.getByLabel('Vehicle Type', { exact: true }).fill('DEMO Sedan'); await entry.getByLabel('Rate Per Km', { exact: true }).fill('10'); await entry.getByLabel('Minimum Km Per Day', { exact: true }).fill('100'); await entry.getByLabel('Driver Allowance', { exact: true }).fill('200'); await entry.getByLabel('Dead Km Policy', { exact: true }).selectOption('INCLUDED'); await saved(entry, 'Save new rate');
      const libraryScroll = await page.evaluate(() => document.documentElement.scrollWidth); assert.ok(libraryScroll <= width + 1); await page.screenshot({ path: `.tmp/phase15-qa/library-${width}.png`, fullPage: true });
      await page.getByRole('link', { name: 'Open Journey costing', exact: true }).click(); await page.getByLabel('Journey', { exact: true }).waitFor();
      const options = await page.getByLabel('Journey', { exact: true }).locator('option').allTextContents(); assert.equal(options.length, 40); assert.equal(options.filter(s => s.endsWith('· draft')).length, 12);
      await page.getByLabel('Journey', { exact: true }).selectOption({ label: options.find(s => s.startsWith('Auli Tour')) });
      await page.getByLabel('Scenario name', { exact: true }).fill(`DEMO / SYNTHETIC Phase15 ${suffix}`); await page.getByLabel('Season', { exact: true }).fill('DEMO / SYNTHETIC'); await page.getByLabel('Valid from', { exact: true }).fill('2026-10-10'); await page.getByLabel('Valid to', { exact: true }).fill('2026-10-13');
      const picker = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Add from Supplier Rate', exact: true }) });
      await picker.getByLabel('Supplier destination', { exact: true }).selectOption('auli'); await picker.getByLabel('Supplier choice', { exact: true }).selectOption(hotelSupplier.id); await picker.getByLabel('Travel From', { exact: true }).fill('2026-10-10'); await picker.getByLabel('Travel To', { exact: true }).fill('2026-10-13'); await picker.getByLabel('Quantity', { exact: true }).fill('3'); await picker.getByLabel('Supplier rate choice', { exact: true }).selectOption(hotelRate.id);
      await picker.getByRole('button', { name: 'Preview selected supplier rate', exact: true }).click(); await picker.getByRole('button', { name: 'Add rate snapshot to costing', exact: true }).waitFor(); assert.match(await picker.innerText(), /7,500/); await picker.getByRole('button', { name: 'Add rate snapshot to costing', exact: true }).click();
      const hotelSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Hotels', exact: true }) }); assert.equal(await hotelSection.getByLabel('Unit cost (INR)', { exact: true }).inputValue(), '2500'); assert.equal(await hotelSection.getByLabel('Unit cost (INR)', { exact: true }).isDisabled(), true);
      const [saveResponse] = await Promise.all([page.waitForResponse(r => r.url().endsWith('/api/internal/journey-costing') && r.request().method() === 'POST'), page.getByRole('button', { name: 'Save draft revision', exact: true }).click()]); const savedCosting = (await saveResponse.json()).record; assert.equal(saveResponse.status(), 200); assert.equal(savedCosting.calculation.subtotal, 7500);
      const helper = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Supplier quote request helper', exact: true }) }); await helper.getByLabel('Destination', { exact: true }).fill('auli'); await helper.getByLabel('Nights', { exact: true }).fill('3'); assert.match(await helper.getByLabel('Generated supplier quote request', { exact: true }).inputValue(), /tax inclusion/); await helper.getByLabel('Quote request type', { exact: true }).selectOption('TRANSPORT'); await helper.getByLabel('Vehicle', { exact: true }).fill('DEMO Sedan'); assert.match(await helper.getByLabel('Generated supplier quote request', { exact: true }).inputValue(), /dead km/);
      const costingScroll = await page.evaluate(() => document.documentElement.scrollWidth); assert.ok(costingScroll <= width + 1); await page.screenshot({ path: `.tmp/phase15-qa/costing-${width}.png`, fullPage: true });
      // Later master edit via UI; saved costing must remain ₹2,500 per room-night and ₹7,500 base.
      await page.getByRole('link', { name: 'Supplier rate library and coverage', exact: true }).click(); await page.getByLabel('Filter supplierId', { exact: true }).waitFor(); await page.getByLabel('Filter supplierId', { exact: true }).selectOption(hotelSupplier.id); await page.locator('article').filter({ hasText: hotelName }).filter({ hasText: '2099-12-31' }).getByRole('button', { name: 'Edit / create revision', exact: true }).click();
      const newEntry = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Rate entry', exact: true }) }); await newEntry.getByLabel('Double Occupancy Rate', { exact: true }).fill('3000'); await saved(newEntry, 'Save rate revision');
      const check = await page.evaluate(async id => { const data = await (await fetch('/api/internal/journey-costing')).json(); return data.revisions.find(r => r.id === id); }, savedCosting.id); assert.equal(check.input.hotelCosts[0].unitCost, 2500); assert.equal(check.calculation.subtotal, 7500);
      const finalSuppliers = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Suppliers', exact: true }) }); await finalSuppliers.getByRole('button', { name: new RegExp(`^${transportName} · ACTIVE`) }).click(); await saved(finalSuppliers, 'Deactivate supplier');
      assert.deepEqual(errors, []); results.push({ width, libraryScroll, costingScroll, controls: ['supplier create/edit/detail/verification/deactivation', 'hotel/transport rate forms', 'filters/validity/seasonality', 'immutable revisions', 'explicit costing selection/preview', 'save snapshot', 'master edit leaves costing unchanged', 'coverage', 'hotel/transport quote helper'], productionWrites: 0, pageErrors: errors });
      await page.close();
    }
    fs.writeFileSync('.tmp/phase15-qa/browser-result.json', JSON.stringify({ label: 'DEMO / SYNTHETIC', results }, null, 2)); console.log('PASS: Phase15 controls and snapshot history at 1440/390/320; no production writes.');
  } catch (e) { if (page && !page.isClosed()) { await page.screenshot({ path: '.tmp/phase15-qa/failure.png', fullPage: true }); fs.writeFileSync('.tmp/phase15-qa/failure.txt', await page.locator('body').innerText()); } throw e; }
  finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
