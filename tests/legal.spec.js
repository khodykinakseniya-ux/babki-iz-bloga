const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const base = 'http://127.0.0.1:4175/babki-iz-bloga/';
const extract = `import sys,json,xml.etree.ElementTree as E
from zipfile import ZipFile
n={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(sys.argv[1]) as z: r=E.fromstring(z.read('word/document.xml'))
print(json.dumps([''.join(e.text or '' if e.tag=='{'+n['w']+'}t' else '\\n' if e.tag=='{'+n['w']+'}br' else '\\t' if e.tag=='{'+n['w']+'}tab' else '' for e in p.iter()) for p in r.findall('./w:body/w:p',n)],ensure_ascii=False))`;

test('legal pages preserve original DOCX text, direct URLs, links and mobile layout', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  for (const slug of ['offer', 'privacy']) {
    const original = JSON.parse(execFileSync('python3', ['-c', extract, path.resolve(`public/legal/${slug}.docx`)], { encoding: 'utf8' }));
    for (const width of [320, 375, 430, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(`${base}legal/${slug}.html`, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      expect(await page.locator('.doc-paragraph').allInnerTexts()).toEqual(original);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      for (const paragraph of await page.locator('.doc-paragraph').all()) await expect(paragraph).toHaveCSS('color', 'rgb(17, 17, 17)');
      await expect(page.locator('article')).not.toContainText('khodykinakseniya');
      await expect(page.locator('article')).toContainText('Nadezhdasheyko@yandex.ru');
    }
  }
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto(base, { waitUntil: 'networkidle' });
    await expect(page.locator('#legal-links a')).toHaveCount(2);
    await expect(page.locator('#business')).toContainText('ИНН 380124809330');
    await expect(page.locator('#business a')).toHaveAttribute('href', 'mailto:Nadezhdasheyko@yandex.ru');
    await expect(page.locator('body')).not.toContainText('khodykinakseniya');
    await expect(page.locator('body')).not.toContainText('ещё не предоставлены');
    for (const location of ['#legal-links', '.hero .legal-note', '.methods .legal-note', '.review-cta .legal-note', '.final .legal-note']) {
      await expect(page.locator(`${location} a`)).toHaveCount(2);
      for (const link of await page.locator(`${location} a`).all()) {
        const target = new URL(await link.getAttribute('href'), base).href;
        expect((await page.request.get(target)).status()).toBe(200);
      }
    }
    await page.locator('.footer').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
