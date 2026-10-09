import { test, expect } from '@playwright/test';
import { pdfText } from '../scripts/lib/pdf-text.mjs';

test('/resume.pdf is the general CV', async ({ request }) => {
  const res = await request.get('/resume.pdf');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  const body = await res.body();
  expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  const { text, pages } = await pdfText(body);
  expect(pages).toBeGreaterThan(0);
  expect(text).toMatch(/mohamed gamal/i);
  expect(text).toMatch(/senior full stack/i);
  expect(text).toContain('linkedin.com/in/mohamedelsonny8');
});

test('the résumé link downloads the PDF', async ({ page }) => {
  await page.goto('/');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: /View full résumé/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Mohamed-Gamal-CV.pdf');
});
