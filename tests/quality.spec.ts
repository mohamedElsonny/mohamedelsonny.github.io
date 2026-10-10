import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CASE_STUDIES = ['/case-studies/getridley/', '/ar/case-studies/getridley/', '/case-studies/mynt/', '/ar/case-studies/mynt/'];

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
}

async function scriptBytes(page: Page, request: APIRequestContext) {
  const inline = await page.$$eval('script:not([src]):not([type="application/ld+json"])', (scripts) =>
    scripts.map((s) => s.textContent ?? '').join(''),
  );
  const sources = await page.$$eval('script[src]', (scripts) => scripts.map((s) => (s as HTMLScriptElement).src));
  let total = Buffer.byteLength(inline);
  for (const src of sources) total += (await (await request.get(src)).body()).length;
  return total;
}

async function layoutShift(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          // LayoutShift is not in TypeScript's DOM lib yet, so describe the two fields used here.
          for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
            if (!entry.hadRecentInput) total += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(total), 1000);
      }),
  );
}

test('axe: home on desktop', async ({ page }) => {
  await page.goto('/');
  expect(await seriousViolations(page)).toEqual([]);
});

for (const path of CASE_STUDIES) {
  test(`axe: ${path} on desktop`, async ({ page }) => {
    await page.goto(path);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('axe: home on mobile', async ({ page }) => {
    await page.goto('/');
    expect(await seriousViolations(page)).toEqual([]);
  });

  for (const path of CASE_STUDIES) {
    test(`axe: ${path} on mobile`, async ({ page }) => {
      await page.goto(path);
      expect(await seriousViolations(page)).toEqual([]);
    });

    test(`no horizontal overflow at 375px: ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      if (path.includes('getridley')) {
        const panel = (await page.locator('[data-ex]').boundingBox())!;
        const svg = (await page.locator('[data-ex] svg').boundingBox())!;
        expect(svg.width).toBeLessThanOrEqual(panel.width);
        const buttons = page.locator('[data-ex] .ex__btns');
        const box = (await buttons.boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width);
        return;
      }
      for (const el of await page.locator('[data-demo], .rchart svg, .chapter__figure svg').all()) {
        const box = (await el.boundingBox())!;
        const column = (await el.locator('xpath=ancestor::section[1]').boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(column.x - 0.5);
        expect(box.x + box.width).toBeLessThanOrEqual(column.x + column.width + 0.5);
      }
      for (const btns of await page.locator('.scn__btns').all()) {
        const panel = (await btns.locator('xpath=ancestor::*[@data-demo][1]').boundingBox())!;
        const box = (await btns.boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width + 0.5);
      }
    });
  }
});

test('axe: 404 page', async ({ page }) => {
  await page.goto('/does-not-exist');
  expect(await seriousViolations(page)).toEqual([]);
});

test('internal links resolve and external links are well-formed https', async ({ page, request }) => {
  for (const path of ['/', '/does-not-exist', ...CASE_STUDIES]) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (links) => links.map((a) => a.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      if (href.startsWith('#')) {
        await expect(page.locator(href), href).toHaveCount(1);
      } else if (href.startsWith('/')) {
        expect((await request.get(href)).status(), href).toBe(200);
      } else {
        const url = new URL(href);
        expect(url.protocol, href).toBe('https:');
        expect(['github.com', 'linkedin.com']).toContain(url.hostname);
      }
    }
  }
});

test('home ships under 5KB of JavaScript', async ({ page, request }) => {
  await page.goto('/');
  expect(await scriptBytes(page, request)).toBeLessThan(5120);
});

for (const path of CASE_STUDIES) {
  test(`${path} ships under 8KB of JavaScript`, async ({ page, request }) => {
    await page.goto(path);
    expect(await scriptBytes(page, request)).toBeLessThan(8192);
  });
}

for (const path of ['/', ...CASE_STUDIES]) {
  test(`no layout shift on load: ${path}`, async ({ page }) => {
    await page.goto(path);
    expect(await layoutShift(page)).toBeLessThan(0.02);
  });
}
