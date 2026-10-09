import { test, expect } from '@playwright/test';

test('/resume.pdf is served as a PDF', async ({ request }) => {
  const res = await request.get('/resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  const body = await res.body();
  expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
});

test('the résumé link downloads the PDF', async ({ page }) => {
  await page.goto('/');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: /View full résumé/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Mohamed-Gamal-CV.pdf');
});
