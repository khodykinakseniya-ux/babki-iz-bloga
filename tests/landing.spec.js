const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
test('responsive layout, content, accordion, payment destination and previews', async ({ page }) => {
  const errors = []; page.on('pageerror', err => errors.push(err.message));
  fs.mkdirSync('previews', { recursive: true });
  for (const width of [320, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/', { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    const headings = await page.locator('h1,h2,h3').evaluateAll(nodes => nodes.map(n => ({ text: n.textContent, left: n.getBoundingClientRect().left, right: n.getBoundingClientRect().right, scroll: n.scrollWidth, width: n.clientWidth })));
    for (const h of headings) { expect(h.left, h.text).toBeGreaterThanOrEqual(0); expect(h.right, h.text).toBeLessThanOrEqual(width + 1); expect(h.scroll, h.text).toBeLessThanOrEqual(h.width + 1); }
    await expect(page.locator('.case-total')).toContainText('+65 920 ₽');
    await expect(page.locator('.date')).toContainText('10:28 МСК');
    if (width === 1440 || width === 375) await page.screenshot({ path: `previews/${width === 1440 ? 'desktop' : 'mobile'}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto('/', { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
  await page.locator('summary').first().click(); await expect(page.locator('details').first()).toHaveAttribute('open', '');
  await page.route('https://payform.ru/aecRmSc/', route => route.fulfill({ body: 'Payment destination verified' }));
  await page.locator('.hero .payment').click(); await expect(page).toHaveURL('https://payform.ru/aecRmSc/');
  await page.goto('/', { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
  await page.locator('#case').screenshot({ path: 'previews/case-evgenia.png' });
  await page.locator('#reviews').screenshot({ path: 'previews/mobile-reviews.png' });
  await page.locator('#join').screenshot({ path: 'previews/final-cta.png' });
  await page.locator('#reviews').scrollIntoViewIfNeeded(); const track = page.locator('.review-track');
  await expect(page.locator('#prev')).toBeDisabled(); await page.locator('#next').click(); await expect.poll(() => track.evaluate(el => el.scrollLeft)).toBeGreaterThan(100);
  await page.locator('#prev').click(); await expect.poll(() => track.evaluate(el => Math.round(el.scrollLeft))).toBe(0);
  await track.focus(); await page.keyboard.press('ArrowRight'); await expect.poll(() => track.evaluate(el => el.scrollLeft)).toBeGreaterThan(100);
  await page.locator('.review').nth(1).click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await expect(page.locator('#lightbox img')).toHaveAttribute('src', '/assets/review-anisya.jpg');
  await page.keyboard.press('Escape'); await expect(page.locator('#lightbox')).not.toBeVisible();
  for (const img of await page.locator('[data-photo] img,.review img').all()) expect(await img.evaluate(el => el.complete && el.naturalWidth > 0)).toBeTruthy();
  expect(errors).toEqual([]);
});
test('brand styles and local fonts load even without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage(); await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await expect(page.locator('.hero .cta')).toHaveCSS('background-color', 'rgb(74, 31, 36)');
  await expect(page.locator('nav a').first()).not.toHaveCSS('color', 'rgb(0, 0, 238)');
  await expect(page.locator('h1')).toHaveCSS('font-family', 'Symbols, "Dela Gothic One", Arial, sans-serif');
  await context.close();
});
test('native touch swipe scrolls reviews on mobile', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }); const page = await context.newPage();
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('.review-track').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await expect.poll(() => page.locator('.review img').first().evaluate(el => el.complete && el.naturalWidth > 0)).toBeTruthy();
  const box = await page.locator('.review-track').boundingBox(); const client = await context.newCDPSession(page);
  const y = Math.round(box.y + 120);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 320, y }] });
  for (let x = 300; x >= 65; x -= 25) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await page.waitForTimeout(20); }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.locator('.review-track').evaluate(el => el.scrollLeft)).toBeGreaterThan(100); await context.close();
});
