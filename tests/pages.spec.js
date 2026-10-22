const { test, expect } = require('@playwright/test');
const url = 'http://127.0.0.1:4175/babki-iz-bloga/';

test('built Pages site loads its styles, fonts, photos and slider under repository path', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => {
    const resource = new URL(request.url());
    if (resource.origin === new URL(url).origin) expect(resource.pathname).toMatch(/^\/babki-iz-bloga\//);
  });
  for (const width of [320, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('[data-photo] img,.review img')].map(async img => { img.loading = 'eager'; await img.decode(); }));
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await expect(page.locator('.hero .cta')).toHaveCSS('background-color', 'rgb(74, 31, 36)');
    expect(await page.evaluate(() => document.fonts.check('40px "Dela Gothic One"', 'БАБКИ') && document.fonts.check('16px Montserrat', 'Отзывы'))).toBeTruthy();
    for (const img of await page.locator('[data-photo] img,.review img').all()) expect(await img.evaluate(el => el.naturalWidth > 0)).toBeTruthy();
  }
  await page.setViewportSize({ width: 375, height: 812 });
  const track = page.locator('.review-track');
  await track.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const box = await track.boundingBox(); const y = Math.round(box.y + 120);
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y }] });
  for (let x = 280; x >= 65; x -= 25) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await page.waitForTimeout(20); }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => track.evaluate(el => el.scrollLeft)).toBeGreaterThan(100);
  await page.locator('.review').nth(1).click(); await expect(page.locator('#lightbox')).toBeVisible();
  await expect(page.locator('#lightbox img')).toHaveAttribute('src', '/babki-iz-bloga/assets/review-anisya.jpg');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]); await context.close();
});
