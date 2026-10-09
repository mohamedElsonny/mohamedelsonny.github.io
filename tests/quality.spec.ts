import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
}

test('axe: home on desktop', async ({ page }) => {
  await page.goto('/');
  expect(await seriousViolations(page)).toEqual([]);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('axe: home on mobile', async ({ page }) => {
    await page.goto('/');
    expect(await seriousViolations(page)).toEqual([]);
  });
});

test('axe: 404 page', async ({ page }) => {
  await page.goto('/does-not-exist');
  expect(await seriousViolations(page)).toEqual([]);
});

test('internal links resolve and external links are well-formed https', async ({ page, request }) => {
  for (const path of ['/', '/does-not-exist']) {
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
  const inline = await page.$$eval('script:not([src]):not([type="application/ld+json"])', (scripts) =>
    scripts.map((s) => s.textContent ?? '').join(''),
  );
  const sources = await page.$$eval('script[src]', (scripts) => scripts.map((s) => (s as HTMLScriptElement).src));
  let total = Buffer.byteLength(inline);
  for (const src of sources) total += (await (await request.get(src)).body()).length;
  expect(total).toBeLessThan(5120);
});

test('no layout shift on load', async ({ page }) => {
  await page.goto('/');
  const cls = await page.evaluate(
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
  expect(cls).toBeLessThan(0.02);
});
