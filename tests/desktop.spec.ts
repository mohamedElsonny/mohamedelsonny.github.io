import { test, expect, type Page } from '@playwright/test';

// Default project viewport is 1280×800 (desktop).

async function activeElementText(page: Page) {
  return page.evaluate(() => (document.activeElement?.textContent ?? '').trim());
}

test('two columns: intro on the start side, content on the end side', async ({ page }) => {
  await page.goto('/');
  const intro = (await page.locator('header.intro').boundingBox())!;
  const content = (await page.locator('.content').boundingBox())!;
  expect(intro.x + intro.width).toBeLessThanOrEqual(content.x);
  await expect(page.locator('nav.nav')).toBeVisible();
});

test('intro column stays put while the page scrolls', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
  const intro = (await page.locator('header.intro').boundingBox())!;
  expect(Math.abs(intro.y)).toBeLessThan(1);
});

test('About is current on load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-nav="about"]')).toHaveAttribute('aria-current', 'true');
});

test('clicking a nav item scrolls to its section and marks it current', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav="projects"]').click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.locator('#projects-title')).toBeInViewport();
  await expect(page.locator('[data-nav="projects"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-nav="about"]')).not.toHaveAttribute('aria-current', 'true');
});

test('deep link to a section shows it and marks it current', async ({ page }) => {
  await page.goto('/#experience');
  await expect(page.locator('#experience-title')).toBeInViewport();
  await expect(page.locator('[data-nav="experience"]')).toHaveAttribute('aria-current', 'true');
});

test('hovering a row dims its siblings', async ({ page }) => {
  await page.goto('/');
  const rows = page.locator('#projects .row');
  await rows.nth(1).hover();
  await expect(rows.nth(0)).toHaveCSS('opacity', '0.45');
  await expect(rows.nth(1)).toHaveCSS('opacity', '1');
  await expect(rows.nth(1)).toHaveCSS('background-color', 'rgba(30, 41, 59, 0.5)');
});

test('unlinked rows keep the white title on hover', async ({ page }) => {
  await page.goto('/');
  const row = page.locator('#projects .row').first();
  await row.hover();
  await expect(row.locator('.row__title')).toHaveCSS('color', 'rgb(230, 237, 248)');
});

test('keyboard: tab order and skip link', async ({ page }) => {
  await page.goto('/');
  const order: string[] = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    order.push(await activeElementText(page));
  }
  // textContent includes the aria-hidden arrow, so the résumé entry ends with →.
  expect(order).toEqual([
    'Skip to content',
    'About',
    'Experience',
    'Projects',
    'GitHub',
    'LinkedIn',
    'Email',
    'View full résumé →',
  ]);
});

test('keyboard: skip link moves focus to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('a.skip-link')).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('keyboard: Enter on a nav item scrolls to its section', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav="experience"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#experience$/);
  await expect(page.locator('#experience-title')).toBeInViewport();
});

test('only the linked rows are in the tab order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.row a')).toHaveCount(2);
  await expect(page.locator('.row [tabindex]')).toHaveCount(0);
});

test('linked rows turn teal on hover', async ({ page }) => {
  await page.goto('/');
  for (const row of await page.locator('#projects .row--link').all()) {
    await row.hover();
    await expect(row.locator('.row__title')).toHaveCSS('color', 'rgb(94, 234, 212)');
  }
});

test('dir="rtl" mirrors the columns without extra CSS', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  const intro = (await page.locator('header.intro').boundingBox())!;
  const content = (await page.locator('.content').boundingBox())!;
  expect(content.x + content.width).toBeLessThanOrEqual(intro.x);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('nav anchors still jump to sections', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-nav="projects"]').click();
    await expect(page).toHaveURL(/#projects$/);
    await expect(page.locator('#projects-title')).toBeInViewport();
  });
});
