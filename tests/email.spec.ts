import { test, expect } from '@playwright/test';
import { profile } from '../src/content/profile';

// Built at runtime from the split parts, so the whole address is not written in this file either.
const address = `${profile.emailParts.user}@${profile.emailParts.domain}`;

test('the whole address is not in the raw HTML', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html.includes(address)).toBe(false);
});

test('social links point at GitHub and LinkedIn', async ({ page }) => {
  await page.goto('/');
  const social = page.locator('ul.social');
  await expect(social.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', profile.links.github);
  await expect(social.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', profile.links.linkedin);
});

test('focusing Email builds the mailto link', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Email' });
  await link.focus();
  await expect(link).toHaveAttribute('href', `mailto:${address}`);
});

test('clicking Email builds the mailto link', async ({ page }) => {
  await page.goto('/');
  // Cancel the navigation after the element's own click handler has run.
  await page.evaluate(() => document.addEventListener('click', (event) => event.preventDefault()));
  const link = page.getByRole('link', { name: 'Email' });
  await link.click();
  await expect(link).toHaveAttribute('href', `mailto:${address}`);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Email falls back to LinkedIn and content is readable', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Email' })).toHaveAttribute('href', profile.links.linkedin);
    await expect(page.locator('main h2')).toHaveText(['About', 'Experience', 'Projects']);
    await expect(page.locator('#projects .row')).toHaveCount(7);
  });
});
