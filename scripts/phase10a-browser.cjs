// Read-only browser QA. All form submissions are intercepted; no messages or DB writes.
// node scripts/phase10a-browser.cjs http://localhost:3100 /path/to/playwright
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.argv[3] || 'playwright');
const base = process.argv[2] || 'http://localhost:3100';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.route('**/api/**', route => route.request().method() === 'GET' ? route.continue() : route.abort());
    const results = [];
    for (const path of ['/privacy', '/terms', '/cancellation-policy', '/accessibility-policy', '/contact']) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      const widths = [];
      for (const width of [320, 360, 390, 430, 768, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(500);
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(scrollWidth <= width + 1, `${path}: overflow ${scrollWidth} at ${width}`);
        widths.push(width);
      }
      assert.equal(/TO BE CONFIRMED/.test(await page.locator('body').innerText()), false);
      assert.deepEqual(errors, []);
      results.push({ path, widths, pageErrors: errors });
      await page.close();
    }
    const page = await context.newPage();
    let submissions = 0;
    await page.route('**/api/contact', route => {
      submissions++;
      return submissions === 1
        ? route.fulfill({ json: { success: true } })
        : route.fulfill({ status: 500, json: { error: 'Test-only failure' } });
    });
    await page.goto(base + '/contact', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name=name]').fill('QA Fixture');
    await page.locator('input[name=email]').fill('qa@example.invalid');
    await page.locator('textarea[name=message]').fill('Browser-intercepted fixture');
    await page.getByRole('button', { name: 'Send Message', exact: true }).click();
    await page.getByRole('status').waitFor();
    assert.match(await page.getByRole('status').innerText(), /received your message/);
    assert.equal(await page.locator('input[name=name]').inputValue(), '');
    assert.equal(submissions, 1);
    await page.locator('input[name=name]').fill('QA Fixture');
    await page.locator('input[name=email]').fill('qa@example.invalid');
    await page.locator('textarea[name=message]').fill('Retain this on failure');
    await page.getByRole('button', { name: 'Send Message', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.locator('textarea[name=message]').inputValue(), 'Retain this on failure');
    assert.equal(submissions, 2);
    results.push({ contact: 'success/reset and failure/input retention passed; two intercepted requests, no writes' });
    fs.mkdirSync('.tmp', { recursive: true });
    fs.writeFileSync('.tmp/phase10a-browser-results.json', JSON.stringify({ base, results }, null, 2));
    console.log(JSON.stringify({ base, results }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
