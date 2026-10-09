import { test, expect } from '@playwright/test';

const SITE = 'https://mohamedelsonny.github.io';
const EN_PATH = '/case-studies/getridley/';
const AR_PATH = '/ar/case-studies/getridley/';

const PAGES = [
  {
    lang: 'en',
    dir: 'ltr',
    path: EN_PATH,
    title: 'A real-time inbox for property sellers · Mohamed Gamal',
    h1: 'A real-time inbox for property sellers',
    description:
      "How I built Getridley's serverless seller inbox with SES, S3, SQS, Lambda, DynamoDB and WebSockets, and why large attachments never travel through the queue.",
    kicker: 'Case study · Real estate',
    sections: ['Context', 'Why a claim check', 'What it cost', 'Reliability', 'Delivery'],
    current: 'EN',
    other: { text: 'عربي', href: AR_PATH },
    back: 'Mohamed Gamal',
    foot: 'Designed and built by me.',
  },
];

for (const p of PAGES) {
  test.describe(p.path, () => {
    test('renders with the right language, title and heading', async ({ page }) => {
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
      await expect(page.locator('html')).toHaveAttribute('dir', p.dir);
      await expect(page).toHaveTitle(p.title);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
      await expect(page.locator('.cs__kicker')).toHaveText(p.kicker);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', p.description);
      await expect(page.locator('.cs__head .tag')).toHaveText(['AWS SES', 'S3', 'SQS', 'Lambda', 'DynamoDB', 'WebSockets']);
      await expect(page.locator('.cs .section__title')).toHaveText(p.sections);
    });

    test('canonical and hreflang alternates', async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${p.path}`);
      const alternates = await page.$$eval('link[rel="alternate"][hreflang]', (links) =>
        links.map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]),
      );
      expect(alternates).toEqual([
        ['en', `${SITE}${EN_PATH}`],
        ['ar', `${SITE}${AR_PATH}`],
        ['x-default', `${SITE}${EN_PATH}`],
      ]);
    });

    test('JSON-LD TechArticle without email or phone', async ({ page }) => {
      await page.goto(p.path);
      const raw = await page.locator('script[type="application/ld+json"]').textContent();
      const data = JSON.parse(raw ?? '{}');
      expect(data['@type']).toBe('TechArticle');
      expect(data.headline).toBe(p.h1);
      expect(data.description).toBe(p.description);
      expect(data.inLanguage).toBe(p.lang);
      expect(data.url).toBe(`${SITE}${p.path}`);
      expect(data.author).toEqual({ '@type': 'Person', name: 'Mohamed Gamal', url: `${SITE}/` });
      expect(raw).not.toMatch(/email|telephone/i);
    });

    test('language switcher marks the current language and links the other', async ({ page }) => {
      await page.goto(p.path);
      const nav = page.locator('nav.cs__lang');
      await expect(nav.locator('[aria-current="page"]')).toHaveText(p.current);
      const other = nav.getByRole('link');
      await expect(other).toHaveCount(1);
      await expect(other).toHaveText(p.other.text);
      await expect(other).toHaveAttribute('href', p.other.href);
    });

    test('back links and footer', async ({ page }) => {
      await page.goto(p.path);
      const back = page.locator('a.cs__back');
      await expect(back).toHaveCount(2);
      for (const link of await back.all()) {
        await expect(link).toHaveAttribute('href', '/');
        await expect(link).toContainText(p.back);
      }
      await expect(page.locator('.cs__foot')).toContainText(p.foot);
    });

    test('loads without the trailing slash too', async ({ page }) => {
      const res = await page.goto(p.path.replace(/\/$/, ''));
      expect(res?.ok()).toBe(true);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
    });

    test('is listed in the sitemap', async ({ request }) => {
      const sitemap = await (await request.get('/sitemap-0.xml')).text();
      expect(sitemap).toContain(`<loc>${SITE}${p.path}</loc>`);
    });
  });
}
