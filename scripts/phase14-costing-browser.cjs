// DEMO / SYNTHETIC. Exercises only loopback dev UI and its local file store; no Journey writes.
// node scripts/phase14-costing-browser.cjs /absolute/path/to/playwright-core [chromium executable] [initial width]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.argv[2] || 'playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) });
  let page;
  try {
    const initialWidth = Number(process.argv[4] || 1440);
    page = await browser.newPage({ viewport: { width: initialWidth, height: 1000 } });
    page.setDefaultTimeout(60000);
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error('Page error:', error.message); });
    await page.goto('http://127.0.0.1:3100/internal/journey-costing', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Journey', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('Journey', { exact: true }).locator('option').filter({ hasText: '· draft' }).count(), 12);
    const select = page.getByLabel('Journey', { exact: true });
    const options = await select.locator('option').allTextContents(); assert.equal(options.length, 40);
    await select.selectOption({ label: options.find(text => text.startsWith('Auli Tour')) });
    await page.getByRole('button', { name: '4 adults / 2 rooms', exact: true }).click(); assert.equal(await page.getByLabel('Rooms', { exact: true }).inputValue(), '2');
    await page.getByRole('button', { name: '6 adults / 3 rooms', exact: true }).click(); assert.equal(await page.getByLabel('Adults', { exact: true }).inputValue(), '6');
    await page.getByRole('button', { name: '2 adults / 1 room', exact: true }).click();
    await page.getByLabel('Scenario name', { exact: true }).fill('DEMO / SYNTHETIC — Phase 14 browser QA');
    await page.getByLabel('Season', { exact: true }).fill('DEMO / SYNTHETIC');
    await page.getByLabel('Valid from', { exact: true }).fill('2026-01-01'); await page.getByLabel('Valid to', { exact: true }).fill('2099-12-31');
    async function add(sectionName, label, basis, quantity, cost) {
      const section = page.locator('section').filter({ has: page.getByRole('heading', { name: sectionName, exact: true }) });
      await section.getByRole('button', { name: `Add ${sectionName.toLowerCase()}`, exact: true }).click();
      const line = section.locator('fieldset').last();
      await line.getByLabel('Label', { exact: true }).fill(label); await line.getByLabel('Cost basis', { exact: true }).selectOption(basis);
      await line.getByLabel(basis === 'ROOM_NIGHT' ? 'Nights' : 'Quantity / meal occurrences', { exact: true }).fill(String(quantity));
      await line.getByLabel('Unit cost (INR)', { exact: true }).fill(String(cost)); await line.getByLabel('Supplier confirmation', { exact: true }).selectOption('CONFIRMED');
      return line;
    }
    await add('Hotels', 'DEMO / SYNTHETIC room', 'ROOM_NIGHT', 3, 2000);
    await add('Transport', 'DEMO / SYNTHETIC cab', 'FIXED_ROUTE', 1, 4000);
    await add('Meals', 'DEMO / SYNTHETIC dinner', 'PER_PERSON', 3, 200);
    await add('Activities', 'DEMO / SYNTHETIC optional activity', 'FIXED', 1, 500);
    const misc = await add('Miscellaneous', 'Remove this test line', 'FIXED', 1, 1); await misc.getByRole('button', { name: 'Remove line', exact: true }).click();
    await page.getByLabel('Contingency basis', { exact: true }).selectOption('PERCENT'); await page.getByLabel('contingency value', { exact: true }).fill('5');
    await page.getByLabel('Markup / target margin %', { exact: true }).fill('20');
    assert.match(await page.locator('aside').innerText(), /7,999/);
    await page.getByLabel('Pricing mode', { exact: true }).selectOption('TARGET_GROSS_MARGIN'); assert.match(await page.locator('aside').innerText(), /14,700/);
    await page.getByLabel('Markup / target margin %', { exact: true }).fill('100'); await page.locator('aside').getByRole('alert').waitFor(); assert.match(await page.locator('aside').getByRole('alert').innerText(), /below 100/);
    await page.getByLabel('Markup / target margin %', { exact: true }).fill('20'); await page.getByLabel('Pricing mode', { exact: true }).selectOption('MARKUP_ON_COST');
    await page.getByLabel('Rounding', { exact: true }).selectOption('NONE'); assert.match(await page.locator('aside').innerText(), /7,056/); await page.getByLabel('Rounding', { exact: true }).selectOption('UP_TO_999');
    await page.getByRole('button', { name: 'Save draft revision', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Saved revision' }).waitFor();
    await page.getByRole('button', { name: 'Request owner review', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'READY_FOR_OWNER_REVIEW' }).waitFor();
    await page.getByLabel('Owner reviewer (local audit note, not authentication)', { exact: true }).fill('DEMO / SYNTHETIC reviewer');
    await page.getByLabel('I approve this exact saved commercial basis for later preparation. This does not publish a Journey.', { exact: true }).check();
    await page.getByRole('button', { name: 'Record owner approval', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'OWNER_APPROVED' }).waitFor();
    await page.getByLabel('Type APPLY auli-tour to preview', { exact: true }).fill('APPLY auli-tour'); await page.getByRole('button', { name: 'Apply approved commercial price — preview only', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'No Journey update executed' }).waitFor();
    fs.mkdirSync('.tmp/phase14-qa', { recursive: true });
    const widths = [];
    for (const width of [1440, 390, 320]) { await page.setViewportSize({ width, height: 950 }); await page.waitForTimeout(300); const actual = await page.evaluate(() => document.documentElement.scrollWidth); assert.ok(actual <= width + 1, `Overflow: ${actual} > ${width}`); widths.push({ width, scrollWidth: actual }); await page.screenshot({ path: `.tmp/phase14-qa/${width}.png`, fullPage: true }); }
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByLabel('Journey', { exact: true }).waitFor();
    assert.ok(await page.getByLabel('Load saved scenario', { exact: true }).locator('option').count() >= 2);
    assert.deepEqual(errors, []);
    fs.writeFileSync(`.tmp/phase14-qa/result-${initialWidth}.json`, JSON.stringify({ label: 'DEMO / SYNTHETIC', initialWidth, journeyOptions: 40, draftOptions: 12, widths, controls: ['selector', 'add/remove', 'quantity', '2/4/6 scenarios', 'markup', 'margin', 'rounding', 'validation', 'save/reload', 'owner approval', 'apply preview only'], pageErrors: errors, productionWrites: 0 }, null, 2));
    console.log('PASS: desktop/mobile, calculation controls, local saving, owner review and apply preview; no Journey writes.');
  } catch (error) {
    fs.mkdirSync('.tmp/phase14-qa', { recursive: true });
    if (page) { await page.screenshot({ path: '.tmp/phase14-qa/failure.png', fullPage: true }); fs.writeFileSync('.tmp/phase14-qa/failure.txt', await page.locator('body').innerText()); }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
