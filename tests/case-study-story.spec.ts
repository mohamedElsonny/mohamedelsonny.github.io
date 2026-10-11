import { test, expect, type Locator, type Page } from '@playwright/test';
import { SCENARIOS } from '../src/components/case-study/ingestion';

const EN = '/case-studies/mynt/';
const AR = '/ar/case-studies/mynt/';
const CHAPTERS = ['setup', 'cron', 'ack', 'retries', 'duplicates', 'poison', 'breaker', 'backpressure'];

test('truth guards on the built English page', async ({ page }) => {
  await page.goto(EN);
  const html = await page.content();
  expect(html).toContain('5+ blockchains');
  expect(html).not.toMatch(/\b(six|6)\s+(block)?chains\b/i);
  expect(html).not.toMatch(/TBD|TODO/);
  expect(html).not.toMatch(/in production/i);
  expect(html).toContain('owned the architectural decision');
});

test('truth guards on the built Arabic page', async ({ page }) => {
  await page.goto(AR);
  const html = await page.content();
  expect(html).toContain('خمس شبكات blockchain أو أكثر');
  expect(html).not.toContain('ست شبكات');
  expect(html).not.toMatch(/TBD|TODO/);
});

for (const [path, price] of [[EN, 'Price:'], [AR, 'الثمن:']] as const) {
  test(`the story has eight staged chapters, a key lesson and six priced takeaways: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('.cs__body > .story')).toHaveCount(1);
    const chapters = await page.$$eval('.story [data-chapter]', (els) =>
      els.map((el) => [el.getAttribute('data-chapter'), el.getAttribute('data-stage')]),
    );
    expect(chapters).toEqual(CHAPTERS.map((id, i) => [id, String(i)]));
    await expect(page.locator('[data-chapter="ack"]')).toHaveAttribute('data-queue', '2');
    await expect(page.locator('#breaker .story__lesson')).toHaveCount(1);
    const items = page.locator('#takeaways ol.takeaways > li');
    await expect(items).toHaveCount(6);
    for (const item of await items.all()) await expect(item.locator('.takeaways__price strong')).toHaveText(price);
  });
}

const figure = (page: Page, id: string) => page.locator(`[data-chapter="${id}"] .chapter__figure svg.dg`);
/** Nodes drawn for the figure's stage; later stages' nodes are only a faint outline (`is-off`). */
const nodesIn = (svg: Locator) =>
  svg.locator('rect[data-node]:not(.is-off)').evaluateAll((els) => els.map((el) => el.getAttribute('data-node')));
const setState = (svg: Locator, attrs: Record<string, string>) =>
  svg.evaluate((el, a) => { for (const [k, v] of Object.entries(a)) el.setAttribute(`data-${k}`, v); }, attrs);
const ROSE = 'rgb(251, 113, 133)';
const AMBER = 'rgb(251, 191, 36)';

async function labelsFit(svg: Locator) {
  for (const label of await svg.locator('g.dg-label').all()) {
    const id = await label.getAttribute('data-label');
    const box = (await svg.locator(`rect[data-node="${id}"]`).boundingBox())!;
    const text = (await label.locator('.dg-main').boundingBox())!;
    expect(text.x, id!).toBeGreaterThanOrEqual(box.x - 0.5);
    expect(text.x + text.width, id!).toBeLessThanOrEqual(box.x + box.width + 0.5);
    expect(text.y, id!).toBeGreaterThanOrEqual(box.y - 0.5);
    expect(text.y + text.height, id!).toBeLessThanOrEqual(box.y + box.height + 0.5);
  }
}

test.describe('mobile figures', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('each chapter figure renders exactly its stage', async ({ page }) => {
    await page.goto(EN);
    expect(await nodesIn(figure(page, 'setup'))).toEqual(['providers', 'db']);
    await expectGhost(figure(page, 'setup'), 'queue');
    expect(await nodesIn(figure(page, 'cron'))).toEqual(['providers', 'db', 'cron', 'exchange', 'queue', 'consumer']);
    expect(await nodesIn(figure(page, 'retries'))).toEqual(['providers', 'db', 'cron', 'exchange', 'queue', 'consumer', 'retry']);
    expect(await nodesIn(figure(page, 'poison'))).toContain('parking');
    await expect(figure(page, 'retries').locator('rect[data-node="retry"]')).toHaveClass(/\bis-new\b/);
    await expect(figure(page, 'retries').locator('rect[data-node="queue"]')).not.toHaveClass(/\bis-new\b/);
    await expect(figure(page, 'cron').locator('[data-edge="ack"]:not(.is-off)')).toHaveCount(0);
    await expect(figure(page, 'ack').locator('[data-edge="ack"]')).toHaveCount(1);
    await expect(figure(page, 'duplicates').locator('rect[data-chip]')).toHaveCount(1);
    await expect(figure(page, 'backpressure').locator('rect[data-chip]')).toHaveCount(3);
    const dupIds = await page.$$eval('[id]', (els) => {
      const ids = els.map((el) => el.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(dupIds).toEqual([]);
    await expect(page.locator('.chapter__figure .dg__caption').first()).toHaveText(
      'Simplified: one queue, one consumer and one provider stand for many.',
    );
  });

  test('diagram state attributes drive the drawing', async ({ page }) => {
    await page.goto(EN);
    const dg = figure(page, 'backpressure');
    await setState(dg, { queue: '4', parking: '2', rows: '3', dup: 'yes' });
    await expect(dg.locator('.dg-qslot').filter({ visible: true })).toHaveCount(4);
    await expect(dg.locator('.dg-pslot').filter({ visible: true })).toHaveCount(2);
    await expect(dg.locator('.dg-bar').filter({ visible: true })).toHaveCount(3);
    await expect(dg.locator('.dg-bar').nth(2)).toHaveCSS('fill', ROSE);
    await setState(dg, { down: 'consumer', breaker: 'open', stale: 'yes', bell: 'yes' });
    await expect(dg.locator('rect[data-node="consumer"]')).toHaveCSS('stroke', ROSE);
    await expect(dg.locator('rect[data-chip="breaker"]')).toHaveCSS('stroke', ROSE);
    await expect(dg.locator('rect[data-node="db"]')).toHaveCSS('stroke', AMBER);
    await expect(dg.locator('.dg-bell')).toHaveCSS('fill', AMBER);
    // State colours win over the teal highlight of the current stage's new pieces.
    const own = figure(page, 'breaker');
    await expect(own.locator('rect[data-chip="breaker"]')).toHaveClass(/\bis-new\b/);
    await setState(own, { breaker: 'open' });
    await expect(own.locator('rect[data-chip="breaker"]')).toHaveCSS('stroke', ROSE);
    await setState(dg, { naive: 'yes' });
    await expect(dg.locator('rect[data-node="queue"]')).toBeHidden();
    await expect(dg.locator('rect[data-node="cron"]')).toBeVisible();
    await expect(dg.locator('[data-edge="naiveProv"]')).toBeVisible();
    await setState(dg, { naive: 'no' });
    await expect(dg.locator('[data-edge="naiveProv"]')).toBeHidden();
  });

  for (const path of [EN, AR]) {
    test(`node names fit their boxes at 375px: ${path}`, async ({ page }) => {
      await page.goto(path);
      await labelsFit(figure(page, 'backpressure'));
    });
  }

  test('the Arabic figure is mirrored but its labels are not', async ({ page }) => {
    await page.goto(AR);
    const dg = figure(page, 'cron');
    const cron = (await dg.locator('rect[data-node="cron"]').boundingBox())!;
    const exchange = (await dg.locator('rect[data-node="exchange"]').boundingBox())!;
    expect(cron.x).toBeGreaterThan(exchange.x);
    const label = dg.locator('[data-label="db"] .dg-main');
    await expect(label).toHaveText('قاعدة البيانات');
    expect(await label.evaluate((t) => (t as SVGGraphicsElement).getCTM()!.a)).toBeGreaterThan(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('every chapter figure shows its stage with new pieces highlighted', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('.chapter__figure')).toHaveCount(8);
    for (const f of await page.locator('.chapter__figure').all()) await expect(f).toBeVisible();
    await expect(figure(page, 'retries').locator('rect[data-node="retry"]')).toHaveCSS('stroke', 'rgb(94, 234, 212)');
  });

  test('one column with no sticky stage at 1280px', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('.story')).not.toHaveCSS('display', 'grid');
    await expect(page.locator('.story__stage')).toBeHidden();
    await expect(page.locator('.story')).not.toHaveClass(/\bis-live\b/);
  });

  test('every scenario is listed in full and the controls are hidden', async ({ page }) => {
    await page.goto(EN);
    const runs = page.locator('.scn__run');
    await expect(runs).toHaveCount(9);
    for (const r of await runs.all()) {
      await expect(r.locator('.scn__run-title')).toBeVisible();
      for (const li of await r.locator('li').all()) await expect(li).toBeVisible();
    }
    await expect(page.locator('.scn__btns, .scn__alt, .scn__idle').filter({ visible: true })).toHaveCount(0);
  });

  test('the chart shows the plain series with every caption listed', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('.rchart [role="switch"]').filter({ visible: true })).toHaveCount(0);
    expect(await shownSeries(page)).toEqual(['plain']);
    await expect(page.locator('.rchart__cap').filter({ visible: true })).toHaveCount(4);
    await expect(page.locator('.rchart__cap-title').filter({ visible: true })).toHaveCount(4);
  });

  test('the dedup table is hidden', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('table.dt')).toBeHidden();
  });

  test('the prefetch slider and readouts are hidden', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('.pf input[type="range"]')).toBeHidden();
    await expect(page.locator('.pf__rows')).toBeHidden();
    await expect(page.locator('.pf__explain')).toBeVisible();
  });
});

const chapter = (page: Page, id: string) => page.locator(`[data-chapter="${id}"]`);
const sticky = (page: Page) => page.locator('.story__stage svg.dg');
async function centerChapter(page: Page, id: string) {
  await chapter(page, id).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}
/** Visible pieces of the sticky diagram that belong to a later stage than the one shown, not counting the faint outline. */
const piecesAhead = (page: Page) =>
  sticky(page).evaluate((svg) =>
    [...svg.querySelectorAll('[data-from]')].filter((el) => {
      const style = getComputedStyle(el);
      const ghost = el.matches('.dg-node, .dg-edge') && Number(style.opacity) < 0.5;
      return Number(el.getAttribute('data-from')) > Number(svg.getAttribute('data-stage')) && style.display !== 'none' && !ghost;
    }).length,
  );

/** Later stages' boxes and lines are a faint outline without labels, so the first stages do not float in an empty frame. */
async function expectGhost(svg: Locator, node: string) {
  const rect = svg.locator(`rect[data-node="${node}"]`);
  await expect(rect).toBeVisible();
  await expect(rect).toHaveClass(/\bis-off\b/);
  expect(Number(await rect.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.5);
  await expect(svg.locator(`[data-label="${node}"]`).filter({ visible: true })).toHaveCount(0);
}

test('the sticky diagram follows the active chapter', async ({ page }) => {
  await page.goto(EN);
  await expect(sticky(page)).toHaveAttribute('data-stage', '0');
  await centerChapter(page, 'retries');
  await expect(sticky(page)).toHaveAttribute('data-stage', '3');
  const retry = sticky(page).locator('rect[data-node="retry"]');
  await expect(retry).toBeVisible();
  await expect(retry).toHaveClass(/\bis-new\b/);
  await expectGhost(sticky(page), 'parking');
  expect(await sticky(page).locator('.is-new').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('data-from')))])).toEqual(['3']);
  expect(await piecesAhead(page)).toBe(0);
  await centerChapter(page, 'breaker');
  await expect(sticky(page)).toHaveAttribute('data-stage', '6');
  await expect(sticky(page).locator('rect[data-chip="breaker"]')).toHaveClass(/\bis-new\b/);
  expect(await piecesAhead(page)).toBe(0);
  await page.reload();
  await expect(sticky(page)).toHaveAttribute('data-stage', '6');
});

test('the setup stage outlines the pipeline still to come', async ({ page }) => {
  await page.goto(EN);
  await expect(sticky(page)).toHaveAttribute('data-stage', '0');
  for (const node of ['cron', 'exchange', 'queue', 'consumer', 'retry', 'parking']) await expectGhost(sticky(page), node);
  await expect(sticky(page).locator('[data-edge="conProv"]')).toBeVisible();
  await expect(sticky(page).locator('[data-edge="naiveProv"]')).toBeHidden();
  await expect(sticky(page).locator('rect[data-chip]').filter({ visible: true })).toHaveCount(0);
  await centerChapter(page, 'cron');
  await expect(sticky(page)).toHaveAttribute('data-stage', '1');
  await setState(sticky(page), { naive: 'yes' });
  await expect(sticky(page).locator('rect[data-node="retry"]')).toBeHidden();
});

test('a deep link shows the linked chapter\'s stage', async ({ page }) => {
  await page.goto(`${EN}#breaker`);
  await expect(sticky(page)).toHaveAttribute('data-stage', '6');
});

test('new pieces play the appear animation', async ({ page }) => {
  await page.goto(EN);
  await centerChapter(page, 'poison');
  await expect(sticky(page).locator('rect[data-node="parking"]')).toHaveCSS('animation-name', 'dg-in');
});

test('the sticky stage sits mid-screen from 1024px and hides below', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(EN);
  const stage = page.locator('.story__stage');
  await expect(stage).toHaveCSS('position', 'sticky');
  await expect(stage).toHaveCSS('top', '270px'); // calc(50vh - 130px) at 800px tall
  await expect(page.locator('.chapter__figure').filter({ visible: true })).toHaveCount(0);
  await page.setViewportSize({ width: 1023, height: 800 });
  await expect(stage).toBeHidden();
  await expect(page.locator('.chapter__figure').filter({ visible: true })).toHaveCount(8);
});

test('two columns at 1280px, with section titles inside the text column', async ({ page }) => {
  await page.goto(EN);
  await expect(page.locator('.story')).toHaveCSS('display', 'grid');
  const column = (await page.locator('.story__chapters').boundingBox())!;
  expect(Math.round(column.width)).toBe(524);
  const title = (await page.locator('#retries-title').boundingBox())!;
  expect(title.x + title.width).toBeLessThanOrEqual(column.x + column.width + 0.5);
  const stage = (await page.locator('.story__stage').boundingBox())!;
  expect(stage.x).toBeGreaterThan(column.x + column.width);
});

test('sticky notes and chip texts show at desktop size', async ({ page }) => {
  await page.goto(EN);
  await centerChapter(page, 'backpressure');
  await setState(sticky(page), { lost: 'yes', breaker: 'open' });
  await expect(sticky(page).locator('[data-note="lost"]')).toBeVisible();
  await expect(sticky(page).locator('[data-chip-text="breaker"] text').filter({ visible: true })).toHaveText(['open']);
  await expect(sticky(page).locator('[data-chip-text="prefetch"]')).toHaveText('prefetch 3');
});

for (const path of [EN, AR]) {
  test(`node names fit their boxes at 1280px: ${path}`, async ({ page }) => {
    await page.goto(path);
    await centerChapter(page, 'backpressure');
    await expect(sticky(page)).toHaveAttribute('data-stage', '7');
    await labelsFit(sticky(page));
  });
}

test('the Arabic sticky diagram is mirrored but its labels are not', async ({ page }) => {
  await page.goto(AR);
  await centerChapter(page, 'cron');
  await expect(sticky(page)).toHaveAttribute('data-stage', '1');
  const cron = (await sticky(page).locator('rect[data-node="cron"]').boundingBox())!;
  const exchange = (await sticky(page).locator('rect[data-node="exchange"]').boundingBox())!;
  expect(cron.x).toBeGreaterThan(exchange.x);
  const label = sticky(page).locator('[data-label="db"] .dg-main');
  expect(await label.evaluate((t) => (t as SVGGraphicsElement).getCTM()!.a)).toBeGreaterThan(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('new pieces appear without animation', async ({ page }) => {
    await page.goto(EN);
    await centerChapter(page, 'retries');
    await expect(sticky(page)).toHaveAttribute('data-stage', '3');
    await expect(sticky(page).locator('rect[data-node="retry"]')).toHaveCSS('animation-name', 'none');
  });
});

test.describe('mobile figures appear once', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('a figure is marked seen when it scrolls into view', async ({ page }) => {
    await page.goto(EN);
    const dg = figure(page, 'poison');
    await expect(dg).not.toHaveClass(/\bis-seen\b/);
    await dg.scrollIntoViewIfNeeded();
    await expect(dg).toHaveClass(/\bis-seen\b/);
  });
});

const CONTROLS = '.scn__btns button, .scn__alt [role="switch"], .rchart [role="switch"], .pf input[type="range"]';
const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
const target = (page: Page, id: string) => (isDesktop(page) ? sticky(page) : figure(page, id));

/** Scenario tests install the fake clock before goto; the stage check runs on animation frames, so let one pass. */
async function showDemo(page: Page, id: string) {
  await chapter(page, id).locator('[data-demo]').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.clock.runFor(100);
}
async function run(page: Page, id: string, button: string) {
  await showDemo(page, id);
  await chapter(page, id).getByRole('button', { name: button, exact: true }).click();
  await page.clock.runFor(60_000);
}
const shownLines = (page: Page, id: string, scn: string) => chapter(page, id).locator(`[data-scn="${scn}"] li`).filter({ visible: true });

for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
  test.describe(`crash after save at ${viewport.width}px`, () => {
    test.use({ viewport });

    test('crash after save leaves a duplicate row', async ({ page }) => {
      await page.clock.install();
      await page.goto(EN);
      await run(page, 'ack', 'Crash after save');
      const ch = chapter(page, 'ack');
      await expect(ch).toHaveAttribute('data-done', 'crash-after-save');
      await expect(ch).not.toHaveAttribute('data-run');
      await expect(target(page, 'ack')).toHaveAttribute('data-rows', '3');
      await expect(target(page, 'ack')).toHaveAttribute('data-dup', 'yes');
      await expect(ch).toHaveAttribute('data-rows', '3');
      await expect(shownLines(page, 'ack', 'crash-after-save')).toHaveCount(6);
      await expect(ch.locator('[data-live]')).toHaveText('Now it is acked, and the database holds a duplicate. Remember that second row.');
      await expect(ch.locator('.scn__btns [aria-pressed="true"]')).toHaveText(['Crash after save']);
    });
  });
}

test('the naive cron loses work; the queued cron does not', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await run(page, 'cron', 'Crash the naive cron');
  await expect(sticky(page)).toHaveAttribute('data-naive', 'yes');
  await expect(sticky(page)).toHaveAttribute('data-lost', 'yes');
  await expect(sticky(page).locator('rect[data-node="queue"]')).toBeHidden();
  await run(page, 'cron', 'Crash the cron + queue');
  await expect(sticky(page)).toHaveAttribute('data-down', 'cron');
  await expect(sticky(page)).toHaveAttribute('data-rows', '1');
  await expect(sticky(page).locator('rect[data-node="queue"]')).toBeVisible();
});

test('the dedup switch picks the run and shows its state at once', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'duplicates');
  const ch = chapter(page, 'duplicates');
  const sw = ch.getByRole('switch', { name: 'Dedup by event ID' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(sticky(page)).toHaveAttribute('data-dedup', 'off');
  await run(page, 'duplicates', 'Deliver the message again');
  await expect(ch).toHaveAttribute('data-done', 'redeliver');
  await expect(sticky(page)).toHaveAttribute('data-dup', 'yes');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(sticky(page)).toHaveAttribute('data-dedup', 'on');
  await expect(ch.locator('.scn__idle')).toBeVisible();
  await run(page, 'duplicates', 'Deliver the message again');
  await expect(ch).toHaveAttribute('data-done', 'redeliver-dedup');
  await expect(sticky(page)).toHaveAttribute('data-dup', 'no');
  await expect(sticky(page)).toHaveAttribute('data-dedup', 'on');
  await expect(sticky(page)).toHaveAttribute('data-rows', '2');
  await sw.click();
  await expect(sticky(page)).toHaveAttribute('data-dedup', 'off');
});

test('a poison message ends in the parking lot with the alert', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await run(page, 'poison', 'Send a poison message');
  await expect(sticky(page)).toHaveAttribute('data-parking', '1');
  await expect(sticky(page)).toHaveAttribute('data-bell', 'yes');
});

test('the breaker pauses and recovers without parking anything; the DLQ variant parks everything', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'breaker');
  const ch = chapter(page, 'breaker');
  await ch.getByRole('button', { name: 'Take the provider down' }).click();
  const seen: string[] = [];
  for (let t = 0; t < 30_000; t += 200) {
    const [breaker, parking] = await sticky(page).evaluate((svg) => [svg.getAttribute('data-breaker'), svg.getAttribute('data-parking')]);
    if (seen.at(-1) !== breaker) seen.push(breaker!);
    expect(parking).toBe('0');
    await page.clock.runFor(200);
  }
  expect(seen).toEqual(['closed', 'open', 'half-open', 'closed']);
  await expect(ch).toHaveAttribute('data-done', 'provider-down');
  await expect(sticky(page)).toHaveAttribute('data-queue', '0');
  await expect(sticky(page)).toHaveAttribute('data-stale', 'no');
  await ch.getByRole('switch', { name: 'What if failures went to the DLQ instead?' }).click();
  await run(page, 'breaker', 'Take the provider down');
  await expect(ch).toHaveAttribute('data-done', 'provider-down-dlq');
  await expect(sticky(page)).toHaveAttribute('data-parking', '6');
  await expect(sticky(page)).toHaveAttribute('data-bell', 'yes');
  await expect(sticky(page)).toHaveAttribute('data-breaker', 'off');
});

test('starting another run cancels the first', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'ack');
  const ch = chapter(page, 'ack');
  await ch.getByRole('button', { name: 'Crash before save' }).click();
  await page.clock.runFor(1000);
  await ch.getByRole('button', { name: 'Crash after save' }).click();
  await page.clock.runFor(50);
  await expect(ch.locator('.scn__run').filter({ visible: true })).toHaveCount(1);
  await expect(shownLines(page, 'ack', 'crash-after-save')).toHaveCount(1);
  await page.clock.runFor(60_000);
  await expect(ch).toHaveAttribute('data-done', 'crash-after-save');
  await expect(shownLines(page, 'ack', 'crash-before-save')).toHaveCount(0);
  await expect(ch.locator('[data-live]')).toHaveText('Now it is acked, and the database holds a duplicate. Remember that second row.');
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
  test(`a new run after a finished one clears it at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.clock.install();
    await page.goto(EN);
    await run(page, 'ack', 'Crash before save');
    const ch = chapter(page, 'ack');
    await expect(ch).toHaveAttribute('data-done', 'crash-before-save');
    await ch.getByRole('button', { name: 'Crash after save' }).click();
    await page.clock.runFor(50);
    await expect(ch).not.toHaveAttribute('data-done');
    await expect(ch.locator('.scn__run').filter({ visible: true })).toHaveCount(1);
    await expect(shownLines(page, 'ack', 'crash-before-save')).toHaveCount(0);
    await page.clock.runFor(60_000);
    await expect(ch).toHaveAttribute('data-done', 'crash-after-save');
    await expect(shownLines(page, 'ack', 'crash-after-save')).toHaveCount(6);
  });
}

test('scrolling a running demo out of view cancels it', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'poison');
  const ch = chapter(page, 'poison');
  await ch.getByRole('button', { name: 'Send a poison message' }).click();
  await page.clock.runFor(1000);
  await expect(ch).toHaveAttribute('data-run', 'poison');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(ch).not.toHaveAttribute('data-run');
  await expect(ch.locator('.scn__idle')).toBeVisible();
});

test('a running demo holds the sticky stage until it ends', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'ack');
  await chapter(page, 'ack').getByRole('button', { name: 'Crash before save' }).click();
  await page.clock.runFor(500);
  // Chapter 3's top passes the middle while the chapter-2 demo is still on screen.
  await chapter(page, 'retries').evaluate((el) =>
    window.scrollBy({ top: el.getBoundingClientRect().top - window.innerHeight * 0.4, behavior: 'instant' }),
  );
  await page.clock.runFor(100);
  await expect(chapter(page, 'ack').locator('[data-demo]')).toBeInViewport();
  await expect(sticky(page)).toHaveAttribute('data-stage', '2');
  await page.clock.runFor(60_000);
  // The finished result stays up while its demo is on screen.
  await expect(chapter(page, 'ack')).toHaveAttribute('data-done', 'crash-before-save');
  await expect(sticky(page)).toHaveAttribute('data-stage', '2');
  await expect(shownLines(page, 'ack', 'crash-before-save')).toHaveCount(6);
  // Once the demo scrolls away the stage follows the reader, and leaving a stage resets that chapter's demo (spec §7.4 item 2).
  await centerChapter(page, 'duplicates');
  await page.clock.runFor(100);
  await expect(sticky(page)).toHaveAttribute('data-stage', '4');
  await expect(chapter(page, 'ack')).not.toHaveAttribute('data-done');
});

test('a finished run does not leak into another chapter', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await run(page, 'ack', 'Crash after save');
  await expect(sticky(page)).toHaveAttribute('data-dup', 'yes');
  await showDemo(page, 'duplicates');
  await expect(sticky(page)).toHaveAttribute('data-stage', '4');
  await expect(sticky(page)).toHaveAttribute('data-rows', '1');
  await expect(sticky(page)).toHaveAttribute('data-dup', 'no');
  await expect(sticky(page)).toHaveAttribute('data-dedup', 'off');
  await expect(chapter(page, 'ack')).not.toHaveAttribute('data-done');
  await expect(chapter(page, 'ack').locator('.scn__idle')).toBeVisible();
  await showDemo(page, 'ack');
  await expect(sticky(page)).toHaveAttribute('data-stage', '2');
  await expect(sticky(page)).toHaveAttribute('data-rows', '1');
});

test('crossing 1024px during a run cancels it and frees the stage', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'ack');
  await chapter(page, 'ack').getByRole('button', { name: 'Crash after save' }).click();
  await page.clock.runFor(1000);
  await page.setViewportSize({ width: 800, height: 800 });
  await expect(chapter(page, 'ack')).not.toHaveAttribute('data-run');
  await expect(chapter(page, 'ack').locator('.scn__idle')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await centerChapter(page, 'retries');
  await page.clock.runFor(100);
  await expect(sticky(page)).toHaveAttribute('data-stage', '3');
});

test('pressing the running button again restarts the run cleanly', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'ack');
  const button = chapter(page, 'ack').getByRole('button', { name: 'Crash after save' });
  await button.click();
  await page.clock.runFor(3000);
  await button.click();
  await page.clock.runFor(50);
  await expect(shownLines(page, 'ack', 'crash-after-save')).toHaveCount(1);
  await page.clock.runFor(60_000);
  await expect(chapter(page, 'ack')).toHaveAttribute('data-done', 'crash-after-save');
  await expect(sticky(page)).toHaveAttribute('data-rows', '3');
  await expect(shownLines(page, 'ack', 'crash-after-save')).toHaveCount(6);
});

test('clicking inside a running demo does not restart it', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'ack');
  const ch = chapter(page, 'ack');
  const button = ch.getByRole('button', { name: 'Crash after save' });
  await button.click();
  await page.clock.runFor(3000);
  const shown = await shownLines(page, 'ack', 'crash-after-save').count();
  await ch.locator('.scn').click({ position: { x: 4, y: 4 } });
  await page.clock.runFor(50);
  await expect(shownLines(page, 'ack', 'crash-after-save')).toHaveCount(shown);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
});

test('flipping a switch mid-run cancels the run and shows the new idle state', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'duplicates');
  const ch = chapter(page, 'duplicates');
  await ch.getByRole('button', { name: 'Deliver the message again' }).click();
  await page.clock.runFor(1500);
  await ch.getByRole('switch', { name: 'Dedup by event ID' }).click();
  await expect(ch).not.toHaveAttribute('data-run');
  await expect(ch.locator('.scn__idle')).toBeVisible();
  await expect(sticky(page)).toHaveAttribute('data-dedup', 'on');
  await expect(sticky(page)).toHaveAttribute('data-rows', '1');
  await page.clock.runFor(60_000);
  await expect(ch).not.toHaveAttribute('data-done');
});

for (const path of [EN, AR]) {
  test(`every log matches its script: ${path}`, async ({ page }) => {
    await page.goto(path);
    for (const [id, s] of Object.entries(SCENARIOS)) {
      await expect(page.locator(`[data-scn="${id}"] ol > li`), id).toHaveCount(s.steps.length);
    }
  });
}

test('every demo control is reachable and works from the keyboard', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  const total = await page.locator(CONTROLS).count();
  const reached = new Set<number>();
  for (let i = 0; i < 400 && reached.size < total; i++) {
    await page.keyboard.press('Tab');
    const index = await page.evaluate((sel) => [...document.querySelectorAll(sel)].indexOf(document.activeElement!), CONTROLS);
    if (index >= 0) reached.add(index);
  }
  expect(reached.size).toBe(total);
  await showDemo(page, 'ack');
  const button = chapter(page, 'ack').getByRole('button', { name: 'Crash before save' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(chapter(page, 'ack')).toHaveAttribute('data-run', 'crash-before-save');
  await expect(button).toHaveCSS('outline-style', 'solid');
  await showDemo(page, 'duplicates');
  const sw = chapter(page, 'duplicates').getByRole('switch');
  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
});

test('focus stays on the pressed button through a run', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  await showDemo(page, 'poison');
  const button = chapter(page, 'poison').getByRole('button', { name: 'Send a poison message' });
  await button.focus();
  await page.keyboard.press('Enter');
  for (let t = 0; t < 20_000; t += 2_000) {
    await page.clock.runFor(2_000);
    await expect(button).toBeFocused();
  }
});

for (const [path, word] of [[EN, /illustrative/i], [AR, /للتوضيح/]] as const) {
  test(`every demo shows its illustrative note: ${path}`, async ({ page }) => {
    await page.goto(path);
    const notes = page.locator('[data-demo] .scn__note, .rchart .rchart__note, .pf .pf__note');
    await expect(notes).toHaveCount(await page.locator('[data-demo], .rchart, .pf').count());
    for (const note of await notes.all()) {
      await expect(note).toBeVisible();
      await expect(note).toHaveText(word);
    }
  });
}

test.describe('reduced motion dot', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the dot jumps to the end of each edge', async ({ page }) => {
    await page.clock.install();
    await page.goto(EN);
    await showDemo(page, 'ack');
    await chapter(page, 'ack').getByRole('button', { name: 'Crash before save' }).click();
    await page.clock.runFor(100);
    await expect(sticky(page).locator('.dg-dot animateMotion')).toHaveCount(0);
    const [dot, end] = await sticky(page).evaluate((svg) => {
      const d = svg.querySelector('.dg-dot')!;
      const p = svg.querySelector<SVGPathElement>('[data-edge="qCon"]')!;
      const e = p.getPointAtLength(p.getTotalLength());
      return [[Number(d.getAttribute('cx')), Number(d.getAttribute('cy'))], [e.x, e.y]];
    });
    expect(Math.abs(dot[0] - end[0])).toBeLessThanOrEqual(1);
    expect(Math.abs(dot[1] - end[1])).toBeLessThanOrEqual(1);
  });
});

const shownSeries = (page: Page) =>
  page.locator('.rchart g[data-series]').filter({ visible: true }).evaluateAll((els) => els.map((e) => e.getAttribute('data-series')));

test('the retry chart switches series with its two switches', async ({ page }) => {
  await page.goto(EN);
  const chart = page.locator('.rchart');
  const jitter = chart.getByRole('switch', { name: 'Jitter', exact: true });
  const r429 = chart.getByRole('switch', { name: 'Provider answers 429 with Retry-After: 5 s' });
  const cap = () => chart.locator('.rchart__cap').filter({ visible: true });
  await expect.poll(() => shownSeries(page)).toEqual(['plain']);
  await expect(cap()).toHaveAttribute('data-cap', 'plain');
  await jitter.click();
  await expect(jitter).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => shownSeries(page)).toEqual(['jitter']);
  await expect(cap()).toHaveAttribute('data-cap', 'jitter');
  await r429.click();
  await expect.poll(() => shownSeries(page)).toEqual(['jitter429']);
  await expect(cap()).toHaveAttribute('data-cap', 'jitter429');
  await jitter.click();
  await expect.poll(() => shownSeries(page)).toEqual(['plain429']);
  await expect(cap().locator('.rchart__cap-title')).toHaveText('429, no jitter.');
});

test('the chart bars carry the demo data', async ({ page }) => {
  await page.goto(EN);
  const v = async (series: string, t: number) =>
    Number(await page.locator(`.rchart g[data-series="${series}"] [data-t="${t}"]`).getAttribute('data-v'));
  for (const t of [1, 3, 7]) expect(await v('plain', t)).toBeGreaterThan(6);
  for (let t = 1; t < 20; t++) expect(await v('jitter', t)).toBeLessThanOrEqual(6);
  for (const s of ['plain429', 'jitter429']) for (let t = 1; t <= 4; t++) expect(await v(s, t)).toBe(0);
});

test('the Arabic chart is not mirrored and its labels are Arabic', async ({ page }) => {
  await page.goto(AR);
  const x = (t: number) =>
    page.locator(`.rchart g[data-series="plain"] [data-t="${t}"]`).evaluate((el) => el.getBoundingClientRect().x);
  expect(await x(0)).toBeLessThan(await x(19));
  await expect(page.locator('.rchart svg')).toContainText('الثواني');
});

test('the dedup table follows the run', async ({ page }) => {
  await page.clock.install();
  await page.goto(EN);
  const table = chapter(page, 'duplicates').locator('table.dt');
  const rows = table.locator('tbody tr').filter({ visible: true });
  await expect(table.locator('caption')).toHaveText('Demo table: one row per stored event');
  await showDemo(page, 'duplicates');
  await expect(rows).toHaveCount(1);
  await run(page, 'duplicates', 'Deliver the message again');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(2).locator('.dt__dup')).toBeVisible();
  await expect(rows.nth(2).locator('.dt__dup')).toHaveText('(duplicate)');
  await expect(rows.nth(2)).toHaveCSS('background-color', 'rgba(251, 113, 133, 0.15)');
  await expect(table.locator('code').first()).toHaveAttribute('dir', 'ltr');
  await chapter(page, 'duplicates').getByRole('switch', { name: 'Dedup by event ID' }).click();
  await run(page, 'duplicates', 'Deliver the message again');
  await expect(rows).toHaveCount(2);
  await expect(table.locator('.dt__dup')).toBeHidden();
});

test('the Arabic dedup table marks the duplicate in Arabic', async ({ page }) => {
  await page.clock.install();
  await page.goto(AR);
  await run(page, 'duplicates', 'سلّم الرسالة مرة أخرى');
  const table = chapter(page, 'duplicates').locator('table.dt');
  await expect(table.locator('caption')).toHaveText('جدول توضيحي: صف لكل حدث مخزّن');
  await expect(table.locator('.dt__dup')).toHaveText('(مكرر)');
});

async function showPrefetch(page: Page) {
  await page.locator('.pf').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

test('the prefetch slider drives the readouts and the chip', async ({ page }) => {
  await page.goto(EN);
  await showPrefetch(page);
  await expect(sticky(page)).toHaveAttribute('data-stage', '7');
  const pf = page.locator('.pf');
  const slider = pf.getByRole('slider', { name: 'Prefetch' });
  await expect(slider).toHaveValue('3');
  await slider.fill('8');
  await expect(sticky(page).locator('[data-chip-text="prefetch"]')).toHaveText('prefetch 8');
  await expect(sticky(page).locator('[data-chip-text="prefetch"] text')).toBeVisible();
  await expect(pf.locator('[data-row="calls"] output')).toHaveText('8');
  await expect(pf.locator('[data-row="throughput"] output')).toHaveText('6');
  await expect(pf.locator('.pf__status')).toHaveText('Over the limit: the provider answers 429, and throughput stops rising.');
  await expect(slider).toHaveAttribute('aria-valuetext', 'prefetch 8');
  await slider.fill('3');
  await expect(pf.locator('.pf__status')).toHaveText('Under the provider’s limit. Raise prefetch and throughput rises with it.');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('4');
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveValue('3');
});

test('the chip keeps the slider value when the reader comes back to chapter 7', async ({ page }) => {
  await page.goto(EN);
  await showPrefetch(page);
  await page.locator('.pf').getByRole('slider').fill('7');
  await centerChapter(page, 'breaker');
  await expect(sticky(page)).toHaveAttribute('data-stage', '6');
  await expect(sticky(page)).toHaveAttribute('data-prefetch', '3');
  await showPrefetch(page);
  await expect(sticky(page)).toHaveAttribute('data-stage', '7');
  await expect(sticky(page).locator('[data-chip-text="prefetch"]')).toHaveText('prefetch 7');
});

test.describe('prefetch on mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the slider writes to the chapter figure', async ({ page }) => {
    await page.goto(EN);
    await showPrefetch(page);
    await page.locator('.pf').getByRole('slider').fill('8');
    await expect(figure(page, 'backpressure')).toHaveAttribute('data-prefetch', '8');
  });
});
