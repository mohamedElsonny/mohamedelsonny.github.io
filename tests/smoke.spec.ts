import { test, expect } from '@playwright/test';

test('home responds with English LTR HTML and the right title', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page).toHaveTitle('Mohamed Gamal · Senior Full Stack Engineer');
});

test('skip link points at main', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main');
  await expect(page.locator('main#main')).toHaveCount(1);
});
