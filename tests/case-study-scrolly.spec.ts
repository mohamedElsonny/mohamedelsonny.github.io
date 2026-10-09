import { test, expect, type Page } from '@playwright/test';

const EN = '/case-studies/getridley/';
const AR = '/ar/case-studies/getridley/';

async function centerStep(page: Page, n: number) {
  await page
    .locator(`.scrolly__step[data-step="${n}"]`)
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

function litNodes(page: Page) {
  return page.$$eval('.scrolly rect.scrolly__node.is-on', (els) => els.map((el) => el.getAttribute('data-node')));
}

const activeStep = (page: Page) => page.locator('.scrolly__step.is-on');

test('step 4 in the middle is the only active step and lights SQS and the DLQ', async ({ page }) => {
  await page.goto(EN);
  await centerStep(page, 4);
  await expect(activeStep(page)).toHaveCount(1);
  await expect(activeStep(page)).toHaveAttribute('data-step', '4');
  await expect.poll(() => litNodes(page)).toEqual(['sqs', 'dlq']);
  await expect(page.locator('.scrolly mpath')).toHaveAttribute('href', '#ps-e3');
});

test('step 6 lights WebSocket and the seller inbox', async ({ page }) => {
  await page.goto(EN);
  await centerStep(page, 6);
  await expect(activeStep(page)).toHaveAttribute('data-step', '6');
  await expect.poll(() => litNodes(page)).toEqual(['websocket', 'inbox']);
  await expect(page.locator('.scrolly mpath')).toHaveAttribute('href', '#ps-e9');
});

test('jumping past several steps leaves exactly one active step', async ({ page }) => {
  await page.goto(EN);
  // Land with the middle of the viewport in the padding under the last step: no step crosses the middle.
  await page.evaluate(() => {
    const steps = document.querySelector('.scrolly__steps')!;
    const bottom = steps.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: bottom - window.innerHeight * 0.6, behavior: 'instant' });
  });
  await expect(activeStep(page)).toHaveCount(1);
  await expect(activeStep(page)).toHaveAttribute('data-step', '6');
  await page.keyboard.press('Home');
  await expect(activeStep(page)).toHaveAttribute('data-step', '1');
  await expect(activeStep(page)).toHaveCount(1);
});

test('reloading mid-pipeline restores the matching step', async ({ page }) => {
  await page.goto(EN);
  await centerStep(page, 5);
  await expect(activeStep(page)).toHaveAttribute('data-step', '5');
  await page.reload();
  await expect(activeStep(page)).toHaveAttribute('data-step', '5');
});

test('the stage moves at the 1024px breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1023, height: 800 });
  await page.goto(EN);
  const stage = page.locator('.scrolly__stage');
  await expect(stage).toHaveCSS('position', 'sticky');
  await expect(stage).toHaveCSS('top', '48px');
  await expect(stage).toHaveCSS('height', '240px');
  await page.setViewportSize({ width: 1024, height: 800 });
  // calc(50vh - 190px) at 800px tall.
  await expect(stage).toHaveCSS('top', '210px');
  await expect(stage).toHaveCSS('height', '380px');
});

test('the Arabic diagram is mirrored but its labels are not', async ({ page }) => {
  await page.goto(AR);
  const buyer = (await page.locator('.scrolly rect[data-node="buyer"]').boundingBox())!;
  const ses = (await page.locator('.scrolly rect[data-node="ses"]').boundingBox())!;
  expect(buyer.x).toBeGreaterThan(ses.x);
  const label = page.locator('.scrolly [data-label="buyer"] text').first();
  await expect(label).toHaveText('المشتري');
  const scaleX = await label.evaluate((t) => (t as SVGGraphicsElement).getCTM()!.a);
  expect(scaleX).toBeGreaterThan(0);
});

test('Latin code inside Arabic text stays left-to-right', async ({ page }) => {
  await page.goto(AR);
  const code = page.locator('.scrolly__step code').first();
  await expect(code).toHaveText('inbox.getridley.com');
  await expect(code).toHaveCSS('direction', 'ltr');
  await expect(code).toHaveCSS('unicode-bidi', 'isolate');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every step is readable at full strength and no packet is drawn', async ({ page }) => {
    await page.goto(EN);
    const steps = page.locator('.scrolly__step');
    await expect(steps).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await expect(steps.nth(i)).toBeVisible();
      await expect(steps.nth(i)).toHaveCSS('opacity', '1');
      await expect(steps.nth(i).locator('h3')).toHaveCSS('color', 'rgb(230, 237, 248)');
    }
    await expect(page.locator('.scrolly__pkt')).toBeHidden();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no packet, but highlighting still follows the scroll', async ({ page }) => {
    await page.goto(EN);
    await centerStep(page, 4);
    await expect(activeStep(page)).toHaveAttribute('data-step', '4');
    await expect(page.locator('.scrolly__pkt')).toBeHidden();
  });
});
