import { test, expect } from '@playwright/test';

const EN = '/case-studies/getridley/';
const AR = '/ar/case-studies/getridley/';
const SCENARIOS = ['normal', 'large', 'fail', 'dup'];

test('each scenario button presses itself and shows only its caption', async ({ page }) => {
  await page.goto(EN);
  const ex = page.locator('[data-ex]');
  const buttons = ex.locator('.ex__btns button');
  await expect(buttons).toHaveText(['A short question', 'A large attachment', 'Parsing fails', 'It arrives twice']);
  await expect(ex.locator('.ex__title')).toHaveText('Try it: what happens when');
  for (const [i, id] of SCENARIOS.entries()) {
    await buttons.nth(i).click();
    await expect(buttons.nth(i)).toHaveAttribute('aria-pressed', 'true');
    await expect(ex.locator('.ex__btns button[aria-pressed="true"]')).toHaveCount(1);
    await expect(ex.locator('.ex__cap').filter({ visible: true })).toHaveCount(1);
    await expect(ex.locator(`.ex__cap[data-cap="${id}"]`)).toBeVisible();
    await expect(ex.locator(`.ex__pk[data-only~="${id}"]`)).toBeVisible();
  }
});

test('the switch shows only in "large", turns on the queue-it state and resets', async ({ page }) => {
  await page.goto(EN);
  const ex = page.locator('[data-ex]');
  const sw = ex.getByRole('switch', { name: 'What if the file went in the queue instead?' });
  await expect(sw).toBeHidden();
  await ex.getByRole('button', { name: 'A large attachment' }).click();
  await expect(sw).toBeVisible();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(ex).toHaveAttribute('data-alt', 'on');
  await expect(ex.locator('.ex__cap[data-cap="queueit"]')).toBeVisible();
  await expect(ex.locator('.ex__cap').filter({ visible: true })).toHaveCount(1);
  await expect(ex.locator('.ex__pk[data-only~="queueit"]')).toBeVisible();
  await expect(ex.locator('.ex__pk[data-only~="large"]')).toBeHidden();
  await ex.getByRole('button', { name: 'Parsing fails' }).click();
  await expect(sw).toBeHidden();
  await ex.getByRole('button', { name: 'A large attachment' }).click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(ex.locator('.ex__cap[data-cap="large"]')).toBeVisible();
});

test('keyboard: Tab reaches the buttons and the switch, Enter and Space work, focus is visible', async ({ page }) => {
  await page.goto(EN);
  const ex = page.locator('[data-ex]');
  await ex.getByRole('button', { name: 'A short question' }).focus();
  await page.keyboard.press('Tab');
  const large = ex.getByRole('button', { name: 'A large attachment' });
  await expect(large).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(large).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const sw = ex.getByRole('switch');
  await expect(sw).toBeFocused();
  await expect(sw).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
});

test('the Arabic explainer is mirrored, labelled in Arabic, and its text is not mirrored', async ({ page }) => {
  await page.goto(AR);
  const ex = page.locator('[data-ex]');
  await expect(ex.locator('.ex__btns button')).toHaveText(['سؤال قصير', 'مرفق كبير', 'فشل التحليل', 'وصلت مرتين']);
  await expect(ex.locator('.ex__title')).toHaveText('جرّب: ماذا يحدث عندما');
  const ses = (await ex.locator('rect[data-node="ses"]').boundingBox())!;
  const s3 = (await ex.locator('rect[data-node="s3"]').boundingBox())!;
  expect(ses.x).toBeGreaterThan(s3.x);
  const scaleX = await ex.locator('text.ex__label').first().evaluate((t) => (t as SVGGraphicsElement).getCTM()!.a);
  expect(scaleX).toBeGreaterThan(0);
  await ex.getByRole('button', { name: 'مرفق كبير' }).click();
  await expect(ex.getByRole('switch', { name: 'ماذا لو وُضع الملف في الـ queue؟' })).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all five captions are listed with headings and the controls are hidden', async ({ page }) => {
    await page.goto(EN);
    const ex = page.locator('[data-ex]');
    const caps = ex.locator('.ex__cap');
    await expect(caps).toHaveCount(5);
    for (let i = 0; i < 5; i++) await expect(caps.nth(i)).toBeVisible();
    await expect(ex.locator('.ex__cap-title')).toHaveText([
      'A short question',
      'A large attachment',
      'What if the file went in the queue instead?',
      'Parsing fails',
      'It arrives twice',
    ]);
    await expect(ex.locator('.ex__btns')).toBeHidden();
    await expect(ex.locator('.ex__alt')).toBeHidden();
    await expect(ex.locator('[data-only~="normal"]').first()).toBeVisible();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no packets in any scenario', async ({ page }) => {
    await page.goto(EN);
    const ex = page.locator('[data-ex]');
    for (const name of ['A short question', 'A large attachment', 'Parsing fails', 'It arrives twice']) {
      await ex.getByRole('button', { name }).click();
      await expect(ex.locator('.ex__pk').filter({ visible: true })).toHaveCount(0);
    }
  });
});
