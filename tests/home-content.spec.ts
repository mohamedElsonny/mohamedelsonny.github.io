import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('hero shows name, title and lead', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mohamed Gamal');
  await expect(page.locator('.hero__title')).toHaveText('Senior Full Stack Engineer');
  await expect(page.locator('.hero__lead')).toHaveText(
    'I design and ship scalable web apps, serverless pipelines, and real-time systems.',
  );
});

test('sections appear in order', async ({ page }) => {
  await expect(page.locator('main h2')).toHaveText(['About', 'Experience', 'Projects']);
});

test('about copy matches the spec', async ({ page }) => {
  const about = page.locator('#about');
  await expect(about.locator('strong')).toHaveText([
    '7+ years',
    'React and Next.js',
    'Node.js, Go, and PostgreSQL',
    'AWS, GCP, and Kubernetes',
  ]);
  await expect(about).toContainText("Lately I've been building as an independent engineer for clients.");
});

test('experience rows match the spec', async ({ page }) => {
  const rows = page.locator('#experience .row');
  await expect(rows).toHaveCount(3);
  await expect(rows.locator('.row__label')).toHaveText(['2024 — Present', '2023 — 2024', '2018 — 2023']);
  await expect(rows.locator('.row__title')).toHaveText([
    /^Independent Software Engineer$/,
    /^Backend Engineer\s*· Mozare3$/,
    /^Software Engineer\s*· Syft$/,
  ]);
  await expect(rows.nth(2).locator('.tag')).toHaveText(['NestJS', 'GraphQL', 'Prisma', 'Redis', 'Pub/Sub', 'GKE']);
});

test('projects appear in the spec order with their labels', async ({ page }) => {
  const rows = page.locator('#projects .row');
  await expect(rows.locator('.row__title')).toHaveText([
    'Syft App',
    'Mynt.la',
    // The linked row's title also holds its decorative ↗ arrow (aria-hidden).
    'Getridley↗',
    'Mozare3',
    'Yoga Digital Library',
    'Meenda.com',
    'RandomMath',
  ]);
  await expect(rows.locator('.row__label')).toHaveText([
    'Influencer marketing',
    'Web3 & NFTs',
    'Real estate',
    'AgriTech',
    'Digital library',
    'Influencer bios',
    'EdTech',
  ]);
  await expect(rows.nth(0)).toContainText('an estimated 50%+');
  await expect(rows.nth(0).locator('.tag')).toHaveText(['NestJS', 'GraphQL', 'Stripe', 'Redis']);
});

test('only the Getridley row links to its case study', async ({ page }) => {
  const links = page.locator('.row a');
  await expect(links).toHaveCount(1);
  await expect(links).toHaveAttribute('href', '/case-studies/getridley/');
  await expect(links).toContainText('Getridley');
  await expect(page.locator('.row__arrow')).toHaveCount(1);
});

test('the Getridley row shows a visible case-study call to action', async ({ page }) => {
  const cta = page.locator('#projects .row--link .row__cta');
  await expect(cta).toHaveCount(1);
  await expect(cta).toBeVisible();
  await expect(cta).toHaveText('Read the case study →');
  await expect(cta).toHaveCSS('color', 'rgb(94, 234, 212)');
  await expect(page.locator('.row__cta')).toHaveCount(1);
});

test('résumé link downloads the PDF', async ({ page }) => {
  const link = page.getByRole('link', { name: /View full résumé/ });
  await expect(link).toHaveAttribute('href', '/resume.pdf');
  await expect(link).toHaveAttribute('download', 'Mohamed-Gamal-CV.pdf');
});

test('footer copy', async ({ page }) => {
  await expect(page.locator('footer.foot')).toHaveText(
    'Designed and built by me.',
  );
});
