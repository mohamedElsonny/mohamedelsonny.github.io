import { test, expect } from '@playwright/test';

test.describe('mobile 375×812', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('one column, side nav hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav.nav')).toBeHidden();
    const intro = (await page.locator('header.intro').boundingBox())!;
    const content = (await page.locator('.content').boundingBox())!;
    expect(intro.y + intro.height).toBeLessThanOrEqual(content.y + 1);
    expect(Math.abs(intro.x - content.x)).toBeLessThan(1);
  });

  test('section title sticks to the top inside its section', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const section = document.getElementById('experience')!;
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + 200, behavior: 'instant' });
    });
    const title = (await page.locator('#experience-title').boundingBox())!;
    expect(Math.abs(title.y)).toBeLessThan(1);
  });

  test('no pointer spotlight, static glow present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/has-spotlight/);
    await expect(page.locator('.spotlight')).toHaveCSS('background-image', /radial-gradient/);
  });
});

test.describe('320px phone', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });
});

test('1023px is mobile, 1024px is desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1023, height: 800 });
  await page.goto('/');
  await expect(page.locator('nav.nav')).toBeHidden();
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.locator('nav.nav')).toBeVisible();
});

test('desktop spotlight follows the pointer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/has-spotlight/);
  await page.mouse.move(400, 300);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--mx')))
    .toBe('400px');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--my')))
    .toBe('300px');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no spotlight and no smooth scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/has-spotlight/);
    await page.mouse.move(400, 300);
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--mx'))).toBe('');
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  });
});
