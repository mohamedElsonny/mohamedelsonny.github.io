import { test, expect } from '@playwright/test';

const SITE = 'https://mohamedelsonny.github.io';

test('home meta, canonical, Open Graph and Twitter', async ({ page }) => {
  await page.goto('/');
  const lead = 'I design and ship scalable web apps, serverless pipelines, and real-time systems.';
  const meta = (selector: string) => page.locator(selector).getAttribute('content');
  expect(await meta('meta[name="description"]')).toBe(lead);
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE}/`);
  expect(await meta('meta[property="og:title"]')).toBe('Mohamed Gamal · Senior Full Stack Engineer');
  expect(await meta('meta[property="og:description"]')).toBe(lead);
  expect(await meta('meta[property="og:type"]')).toBe('website');
  expect(await meta('meta[property="og:url"]')).toBe(`${SITE}/`);
  expect(await meta('meta[property="og:image"]')).toBe(`${SITE}/og.png`);
  expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).toBe('/favicon.svg');
});

test('JSON-LD Person without email or phone', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? '{}');
  expect(data['@type']).toBe('Person');
  expect(data.name).toBe('Mohamed Gamal');
  expect(data.jobTitle).toBe('Senior Full Stack Engineer');
  expect(data.address.addressLocality).toBe('Cairo');
  expect(data.sameAs).toEqual(['https://github.com/mohamedElsonny', 'https://linkedin.com/in/mohamedelsonny8']);
  expect(raw).not.toMatch(/email|telephone/i);
});

test('sitemap lists home and not 404', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain(`<loc>${SITE}/</loc>`);
  expect(sitemap).not.toContain('404');
});

test('robots.txt points at the sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});

test('favicon is an SVG', async ({ request }) => {
  const res = await request.get('/favicon.svg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/svg+xml');
});

test('og.png is a 1200×630 PNG', async ({ request }) => {
  const res = await request.get('/og.png');
  expect(res.status()).toBe(200);
  const png = await res.body();
  expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

for (const path of ['/case-studies/mynt/', '/case-studies/getridley/', '/ar/case-studies/mynt/', '/ar/case-studies/getridley/']) {
  test(`${path} shares its own 1200×630 card`, async ({ page, request }) => {
    await page.goto(path);
    const image = `/og${path.replace('/case-studies', '').replace(/\/$/, '')}.png`;
    expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe(`${SITE}${image}`);
    expect(await page.locator('meta[name="twitter:image"]').getAttribute('content')).toBe(`${SITE}${image}`);
    const res = await request.get(image);
    expect(res.status()).toBe(200);
    const png = await res.body();
    expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
}

test('unknown paths render the 404 page', async ({ page }) => {
  const res = await page.goto('/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/');
});
