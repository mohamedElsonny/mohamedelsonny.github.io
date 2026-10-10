# Mynt Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Mynt.la case study at `/case-studies/mynt/` (English) and `/ar/case-studies/mynt/` (Arabic). It tells the story of the RabbitMQ ingestion pipeline in eight chapters, with one diagram that grows chapter by chapter, five scripted scenario demos, a retry chart, a dedup table and a prefetch slider. Then link it from Home.

**Architecture:** Two new MDX entries in the existing `caseStudies` collection render through the existing routes and `CaseStudyLayout`. A build-time data module, `ingestion.ts`, holds the diagram geometry, the stages, the base state, the scenario scripts and the demo data. Framework-free Astro components render that data into HTML and `data-*` attributes. One shared story script (inside `IngestionStory.astro`) does stage following and runs the scenarios. `RetryChart` and `PrefetchDemo` each carry a tiny script of their own. Every "with JS / without JS" layout rule is keyed on `@media (scripting: …)`, so the first paint is already final.

**Tech Stack:** Astro 7.3.8 (static), TypeScript strict, `@astrojs/mdx` 8.0.2, Playwright 1.64.0, `@axe-core/playwright` 4.13.0, Lighthouse CI 0.15.1. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-10-mynt-case-study-design.md` (approved 2026-10-10). This plan argues from the spec and does not repeat its copy. Every English and Arabic string is taken verbatim from the spec section named in the step.

## Global Constraints

Copied from the spec. Every task's requirements include this section.

**Truth rules (spec §2):**

- "The only source of truth about Mynt is the Career Vault export `mynt-facts.md` (2026-10-10). Every claim about what Mynt did, had or suffered cites a fact ID from it (`A:`, `F:`, `M:` prefixes) or the source `user (2026-10-10)` … the same IDs go into MDX source comments next to the copy, as in the Getridley MDX files." The spec's §5 "Sources:" lines are those comments.
- "General teaching is allowed and encouraged … It is always written as general knowledge: present tense, with no 'Mynt' or 'I' as the subject."
- "First person is used only where a fact supports it: 'I built its backend' (A:0d663337) and 'I owned the architectural decision … and its tradeoff analysis' (F:aaef9a06 …). Ownership is never upgraded: no 'led', 'designed and built the pipeline' or 'I implemented'."
- "The only Mynt numbers are the metrics: '5+ blockchains', '3+ external APIs', and 'an estimated hundreds of updates a day, up to about 1,000, with occasional higher peaks'. The word 'estimated' stays … No latency, retry count, TTL, prefetch value, throughput or duration is claimed for Mynt."
- "Always '5+ blockchains' (Arabic: 'خمس شبكات blockchain أو أكثر'), never an exact count. Examples appear only after 'including' (Arabic: 'منها')."
- "The vault says duplicate processing happened 'in practice' (F:fc2483ec) and 'was observed' (F:6f488b9a). The copy uses exactly that wording and does not say 'in production'."
- "Mechanisms the vault does not record are not described" (the list in spec §2).
- "Every demo shows a visible note that it is scripted and that its numbers and data are illustrative, not Mynt's real settings."
- "The rejected baseline (doing the whole fetch inside cron, F:811392e6) is presented as the baseline the design is measured against, not as something Mynt ran."

**Privacy and languages (spec §2):**

- "The phone number never appears on the page, in metadata, in JSON-LD or in any source file. The email address is not shown on this page." This applies to tests and commit messages too.
- "English and Arabic carry the same content. The Arabic is simplified Fusha (فصحى مبسطة), and technical terms stay in English (glossary in §6)."

**Quality gates (spec §7, §7.9, §9):**

- "Logical properties only (the `rtl-ready` test enforces this)." No `left:`, `right:`, `margin-left`, `padding-right`, `border-left`, `text-align: left|right` or `float`.
- The JS budget is "8KB of JavaScript per case-study page". The test counts "**every** inline script except JSON-LD". This brings two rules:
  - "Scenario scripts, geometry and demo data are rendered into HTML … never shipped as JavaScript or as `<script type="application/json">`."
  - "Client scripts import nothing from `ingestion.ts` except the two timing constants `HOP_MS` and `HOLD_MS`."
- "CLS < 0.02, axe with zero serious or critical violations, Lighthouse ≥ 0.95." "No threshold changes."
- "No new dependencies. Everything uses Astro, the MDX integration and the fonts already installed."
- "Any change to the Getridley page" is out of scope: "Getridley must render identically, and its tests stay unchanged."

**Project conventions (from the shipped Getridley work):**

- The breakpoint is `min-width: 1024px` (`max-width: 1023.98px` below it).
- URLs always carry the trailing slash: `/case-studies/mynt/` and `/ar/case-studies/mynt/`.
- In JS strings inside MDX exports, write typographic quotes and apostrophes directly (`’ “ ”`), so they match the Markdown prose that Astro's smartypants converts. The same applies to test expectations that quote prose or log lines. Frontmatter stays straight-quoted, as Getridley's does.
- Commands run from the repo root. Playwright tests run against `astro preview` serving `dist/`, so **always run `npm run build` before `npx playwright test`**.
- Each task lists a commit step so the history splits into reviewable units. **During implementation, do not commit unless the user says so.** Never push and never use `--no-verify`.

## Review Focus

These are the failure modes most likely to bite a reader that no spec §9 test exercises. Each line names the test that now pins it, inside the task that owns the code.

1. **State leaking between chapters on the shared sticky diagram.** A finished chapter-2 run leaves a duplicate row in the sticky diagram. Scrolling on to chapter 4 must show chapter 4's idle state: one row, no duplicate, "no dedup". Scrolling back must show chapter 2 at idle. Test: Task 5, "a finished run does not leak into another chapter".
2. **Crossing 1024px during a run.** For example, rotating a tablet or resizing a window. The run must cancel, the demo must return to idle, and the sticky stage must not stay locked when the reader is back on desktop. Test: Task 5, "crossing 1024px during a run cancels it and frees the stage".
3. **Pressing the running button again, or flipping a switch mid-run.** Old timers must never write into the new run: one revealed line, then the clean end state of the new run. Tests: Task 5, "pressing the running button again restarts the run cleanly" and "flipping a switch mid-run cancels the run and shows the new idle state".
4. **Arriving on a deep link** such as `/case-studies/mynt/#breaker` (from a shared link or the browser history). The sticky diagram must show stage 6 at once, not stage 0. Test: Task 4, "a deep link shows the linked chapter's stage".
5. **Keyboard users losing focus** when the log reveals lines, the run heading hides, or the demo resets. Focus must stay on the pressed button for the whole run and after it. Test: Task 5, "focus stays on the pressed button through a run".

---

## File Structure

```text
src/components/case-study/ingestion.ts           NEW  T1  geometry, stages, base state, scenario scripts, chart + prefetch data (build time only)
src/components/case-study/IngestionStory.astro   NEW  T2  .story grid wrapper; T4 sticky stage + story script; T5 scenario player
src/components/case-study/StoryChapter.astro     NEW  T2  one chapter (wrapper + Section); T3 mobile figure
src/components/case-study/IngestionDiagram.astro NEW  T3  one pipeline SVG at one stage or at all stages
src/components/case-study/ScenarioDemo.astro     NEW  T5  buttons, switch, step lists, live log
src/components/case-study/RetryChart.astro       NEW  T6  chapter 3 chart + tiny script
src/components/case-study/DedupTable.astro       NEW  T7  chapter 4 table
src/components/case-study/PrefetchDemo.astro     NEW  T8  chapter 7 slider + tiny script
src/content/case-studies/en/mynt.mdx             NEW  T2  prose; T5–T8 add demo props
src/content/case-studies/ar/mynt.mdx             NEW  T2  prose; T5–T8 add demo props
src/styles/case-study.css                        MOD  T2–T8 "Ingestion story" section; T5 shared button/switch selectors
src/content/projects.ts                          MOD  T9  Mynt.la href
lighthouserc.json                                MOD  T9  + two URLs
tests/ingestion-data.spec.ts                     NEW  T1  pure data checks (no page)
tests/case-study-story.spec.ts                   NEW  T2–T8 Mynt page behaviour (spec §9 tests 1–20 + Review Focus)
tests/case-study.spec.ts                         MOD  T2  per-page slug and tags, two Mynt entries
tests/quality.spec.ts                            MOD  T2  Mynt URLs; Getridley-only [data-ex] checks
tests/home-content.spec.ts                       MOD  T9  two linked rows
tests/desktop.spec.ts                            MOD  T9  two linked rows
```

**Order and why it differs from a component-first order.** The data comes first, then both page shells with all their prose, then one component at a time. Components can only be tested in Playwright on a real page. With both pages live from Task 2, the existing axe, CLS, 8KB-JS and internal-link gates in `quality.spec.ts` run on every later task. Each component also lands in English and Arabic together, with its RTL test. The Home link comes last, once the page is complete.

**Spec §9 test → task map:**

| Test | Task |
| --- | --- |
| 1 | T4 |
| 2 | T4 |
| 3 | T3 |
| 4 | T5 |
| 5 | T5 |
| 6 | T5 (diagram), T7 (table) |
| 7 | T5 |
| 8 | T5 |
| 9 | T5 |
| 10 | T5 |
| 11 | T5 |
| 12 | T6 |
| 13 | T8 |
| 14 | T5 (the selector covers the T6 and T8 controls as they arrive) |
| 15 | T3, T4, T5, T6, T7, T8 (one test each, inside one `without JavaScript` block) |
| 16 | T4 (animation), T5 (dot) |
| 17 | T3 (figure), T4 (sticky), T6 (chart) |
| 18 | T3 (375px), T4 (1280px) |
| 19 | T5 (the selector covers the T6 and T8 notes as they arrive) |
| 20 | T2 |

---

### Task 1: `ingestion.ts` data and its checks

**Files:**
- Create: `src/components/case-study/ingestion.ts`
- Test: `tests/ingestion-data.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (later tasks import these exact names):
  - Everything in the spec §7.1 code block, with the same names and types: `VIEW_W`, `VIEW_H`, `HOP_MS`, `HOLD_MS`, `Stage`, `NodeId`, `EdgeId`, `ChipId`, `Hop`, `Tone`, `DiagramNode`, `DiagramEdge`, `DiagramChip`, `DiagramState`, `BASE_STATE`, `ScenarioStep`, `ScenarioId`, `Scenario`, `SCENARIOS`, `stateAttr`, `mx`, `ChartSeries`, `RETRY_CHART`, `PREFETCH_DEMO`.
  - `DiagramLabels`, the interface from spec §7.2, exported from this file so the components and the MDX share it.
  - `NODES: DiagramNode[]`, in the spec's node table order: providers, db, cron, exchange, queue, consumer, retry, parking.
  - `EDGES: DiagramEdge[]`, in the edge table order.
  - `CHIPS: DiagramChip[]`, in the chip table order: prefetch, breaker, dedup.
  - `QUEUE_SLOT_X = [265, 275, 285, 295, 305, 315]`, `QUEUE_SLOT_Y = 172`, `PARKING_SLOT_X = [421, 431, 441, 451, 461, 471]`, `PARKING_SLOT_Y = 285`, `SLOT_R = 3`.
  - `DB_BAR_X = [577, 603, 629]` and `DB_BAR = { y: 262, w: 22, h: 5 }`.
  - `BELL_AT = { x: 480, y: 250 }` (a 12 × 12 icon, stage 5).
  - `NOTE_AT = { lost: { x: 180, y: 166 }, stale: { x: 614, y: 292 }, ack: { x: 368, y: 102 } }`.
  - `labelY(node: DiagramNode, hasSub: boolean): number`. It returns `y + 17` when `hasSub`, `y + 16` for queue and db, `y + 14` for parking, and otherwise `y + h / 2`. The sub-label sits at `y + 32` (no helper needed).
  - `stateData(state: Partial<DiagramState>): Record<string, string>`. It maps each key to `data-<key>`, in `DiagramState` key order, for spreading onto elements in Astro.

- [ ] **Step 1: Write the failing test**

Create `tests/ingestion-data.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import {
  BASE_STATE, CHIPS, EDGES, NODES, PREFETCH_DEMO, RETRY_CHART, SCENARIOS, VIEW_W,
  labelY, mx, stateAttr, stateData,
  type DiagramNode, type DiagramState, type EdgeId, type NodeId, type ScenarioId,
} from '../src/components/case-study/ingestion';

// Pure data checks: no page is opened.

type P = { x: number; y: number };

/** State after the first `upto` steps: base, then the run's initial state, then each step's pre and set. */
function fold(id: ScenarioId, upto = Infinity): DiagramState {
  const s = SCENARIOS[id];
  let state: DiagramState = { ...BASE_STATE, ...s.initial };
  for (const step of s.steps.slice(0, upto)) state = { ...state, ...step.pre, ...step.set };
  return state;
}

/** Segments of an absolute M/H/V/C path, the only commands the diagram uses. */
function parse(d: string) {
  const t = d.match(/[MHVC]|-?\d+(?:\.\d+)?/g)!;
  let i = 0;
  let at: P = { x: 0, y: 0 };
  const segs: P[][] = [];
  const num = () => Number(t[i++]);
  while (i < t.length) {
    const c = t[i++];
    if (c === 'M') at = { x: num(), y: num() };
    else if (c === 'H') { const to = { x: num(), y: at.y }; segs.push([at, to]); at = to; }
    else if (c === 'V') { const to = { x: at.x, y: num() }; segs.push([at, to]); at = to; }
    else { const pts = [at, { x: num(), y: num() }, { x: num(), y: num() }, { x: num(), y: num() }]; segs.push(pts); at = pts[3]; }
  }
  return { start: segs[0][0], end: at, segs };
}

const node = (id: NodeId) => NODES.find((n) => n.id === id)!;
const onBox = (p: P, n: DiagramNode) =>
  ((p.x === n.x || p.x === n.x + n.w) && p.y >= n.y && p.y <= n.y + n.h) ||
  ((p.y === n.y || p.y === n.y + n.h) && p.x >= n.x && p.x <= n.x + n.w);
const mid = (seg: P[]) =>
  seg.length === 2
    ? { x: (seg[0].x + seg[1].x) / 2, y: (seg[0].y + seg[1].y) / 2 }
    : { x: (seg[0].x + 3 * seg[1].x + 3 * seg[2].x + seg[3].x) / 8, y: (seg[0].y + 3 * seg[1].y + 3 * seg[2].y + seg[3].y) / 8 };

test('scenario step counts and stages match the spec', () => {
  const shape = Object.fromEntries(Object.entries(SCENARIOS).map(([id, s]) => [id, [s.stage, s.steps.length]]));
  expect(shape).toEqual({
    'naive-crash': [1, 4], 'queued-crash': [1, 5], 'crash-before-save': [2, 6], 'crash-after-save': [2, 6],
    redeliver: [4, 5], 'redeliver-dedup': [4, 5], poison: [5, 7], 'provider-down': [6, 8], 'provider-down-dlq': [6, 6],
  });
});

test('scenario end states match spec §9', () => {
  expect(fold('naive-crash')).toMatchObject({ naive: 'yes', lost: 'yes', rows: '1', down: 'cron' });
  expect(fold('queued-crash')).toMatchObject({ naive: 'no', down: 'cron', rows: '1', queue: '3' });
  expect(fold('crash-before-save')).toMatchObject({ rows: '2', dup: 'no', down: 'none', queue: '1' });
  expect(fold('crash-after-save')).toMatchObject({ rows: '3', dup: 'yes', down: 'none' });
  expect(fold('redeliver')).toMatchObject({ rows: '3', dup: 'yes', dedup: 'off' });
  expect(fold('redeliver-dedup')).toMatchObject({ rows: '2', dup: 'no', dedup: 'on' });
  expect(fold('poison')).toMatchObject({ parking: '1', bell: 'yes', queue: '1' });
  expect(fold('provider-down')).toMatchObject({ breaker: 'closed', queue: '0', stale: 'no', rows: '3', parking: '0' });
  expect(fold('provider-down-dlq')).toMatchObject({ parking: '6', bell: 'yes', breaker: 'off', down: 'none' });
});

test('provider-down walks the breaker closed → open → half-open → closed and never parks', () => {
  const seen: string[] = [];
  for (let i = 0; i <= SCENARIOS['provider-down'].steps.length; i++) {
    const st = fold('provider-down', i);
    if (seen.at(-1) !== st.breaker) seen.push(st.breaker);
    expect(st.parking).toBe('0');
  }
  expect(seen).toEqual(['closed', 'open', 'half-open', 'closed']);
});

test('redeliver-dedup shares steps 1–3 with redeliver', () => {
  expect(SCENARIOS['redeliver-dedup'].steps.slice(0, 3)).toEqual(SCENARIOS.redeliver.steps.slice(0, 3));
});

test('dot tones follow the spec', () => {
  const tones = (id: ScenarioId) => SCENARIOS[id].steps.map((s) => s.tone ?? 'teal');
  expect(tones('poison')).toEqual(['teal', 'amber', 'amber', 'amber', 'amber', 'amber', 'rose']);
  expect(tones('provider-down')).toEqual(['teal', 'rose', 'teal', 'teal', 'teal', 'teal', 'teal', 'teal']);
  expect(tones('provider-down-dlq')).toEqual(['teal', 'rose', 'rose', 'rose', 'rose', 'teal']);
  for (const id of ['naive-crash', 'queued-crash', 'crash-before-save', 'crash-after-save', 'redeliver', 'redeliver-dedup'] as const) {
    expect(new Set(tones(id))).toEqual(new Set(['teal']));
  }
});

test('every hop names a known edge', () => {
  const ids = new Set(EDGES.map((e) => e.id));
  for (const s of Object.values(SCENARIOS))
    for (const step of s.steps) for (const hop of step.move ?? []) expect(ids.has(hop.replace(/^-/, '') as EdgeId), hop).toBe(true);
});

test('nodes, edges and chips appear at their spec stages', () => {
  expect(NODES.map((n) => [n.id, n.stage])).toEqual([
    ['providers', 0], ['db', 0], ['cron', 1], ['exchange', 1], ['queue', 1], ['consumer', 1], ['retry', 3], ['parking', 5],
  ]);
  expect(Object.fromEntries(EDGES.map((e) => [e.id, e.stage]))).toEqual({
    cronEx: 1, exQ: 1, qCon: 1, conProv: 1, conDb: 1, naiveProv: 1, naiveDb: 1, ack: 2, qRetry: 3, retryEx: 3, qPark: 5,
  });
  expect(CHIPS.map((c) => [c.id, c.stage])).toEqual([['prefetch', 7], ['breaker', 6], ['dedup', 4]]);
  expect(EDGES.filter((e) => e.naive).map((e) => e.id)).toEqual(['naiveProv', 'naiveDb']);
  expect(EDGES.filter((e) => e.dashed).map((e) => e.id)).toEqual(['ack', 'retryEx']);
  expect(NODES.filter((n) => n.dashed).map((n) => n.id)).toEqual(['retry', 'parking']);
});

test('every edge starts and ends on the boxes it connects', () => {
  const ENDS: Record<EdgeId, [NodeId, NodeId]> = {
    cronEx: ['cron', 'exchange'], exQ: ['exchange', 'queue'], qCon: ['queue', 'consumer'],
    conProv: ['consumer', 'providers'], conDb: ['consumer', 'db'], ack: ['consumer', 'queue'],
    qRetry: ['queue', 'retry'], retryEx: ['retry', 'exchange'], qPark: ['queue', 'parking'],
    naiveProv: ['cron', 'providers'], naiveDb: ['cron', 'db'],
  };
  for (const e of EDGES) {
    const { start, end } = parse(e.d);
    expect(onBox(start, node(ENDS[e.id][0])), `${e.id} start`).toBe(true);
    expect(onBox(end, node(ENDS[e.id][1])), `${e.id} end`).toBe(true);
  }
});

test('chips sit centred on their edge midpoint', () => {
  const ON = { prefetch: 'qCon', breaker: 'conProv', dedup: 'conDb' } as const;
  for (const chip of CHIPS) {
    const { segs } = parse(EDGES.find((e) => e.id === ON[chip.id])!.d);
    expect(segs).toHaveLength(1);
    const m = mid(segs[0]);
    expect(chip.x + chip.w / 2).toBeCloseTo(m.x, 1);
    expect(chip.y + chip.h / 2).toBeCloseTo(m.y, 1);
  }
});

test('label positions', () => {
  expect(labelY(node('providers'), true)).toBe(65);
  expect(labelY(node('queue'), false)).toBe(156);
  expect(labelY(node('db'), false)).toBe(248);
  expect(labelY(node('parking'), false)).toBe(270);
  expect(labelY(node('consumer'), false)).toBe(162);
  expect(VIEW_W).toBe(680);
  expect(mx(180, false)).toBe(180);
  expect(mx(180, true)).toBe(500);
});

test('state strings', () => {
  expect(stateAttr(BASE_STATE)).toBe(
    'naive:no queue:2 rows:1 dup:no parking:0 down:none breaker:closed bell:no lost:no stale:no dedup:on prefetch:3',
  );
  expect(stateAttr({ rows: '2', queue: '1' })).toBe('queue:1 rows:2');
  expect(stateAttr({})).toBe('');
  expect(stateData({ dedup: 'hit', queue: '1' })).toEqual({ 'data-queue': '1', 'data-dedup': 'hit' });
});

test('retry chart data follows the demo rule', () => {
  const { limit, retryAfter, series } = RETRY_CHART;
  expect([limit, retryAfter]).toEqual([6, 5]);
  expect(series).toEqual({
    plain: [8, 8, 0, 8, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    jitter: [8, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    plain429: [8, 0, 0, 0, 0, 8, 0, 8, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0],
    jitter429: [8, 0, 0, 0, 0, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1],
  });
  for (const values of Object.values(series)) expect(values.reduce((a, b) => a + b)).toBe(32);
  expect([1, 3, 7].every((t) => series.plain[t] > limit)).toBe(true);
  expect(series.jitter.slice(1).every((v) => v <= limit)).toBe(true);
  expect(series.jitter429.slice(1).every((v) => v <= limit)).toBe(true);
});

test('prefetch demo data follows the demo rule', () => {
  expect(PREFETCH_DEMO.limit).toBe(6);
  expect(PREFETCH_DEMO.rows).toEqual(
    [1, 2, 3, 4, 5, 6, 7, 8].map((p) => ({ p, calls: p, throughput: Math.min(p, 6), over: p > 6 })),
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run build && npx playwright test tests/ingestion-data.spec.ts`
Expected: FAIL. TypeScript cannot resolve `../src/components/case-study/ingestion`.

- [ ] **Step 3: Implement `src/components/case-study/ingestion.ts`**

- Open the file with a one-line header comment in the style of `pipeline.ts`: "Data for the Mynt ingestion story (spec §7.1). Build time only: client scripts import nothing but HOP_MS and HOLD_MS."
- Copy the declarations from spec §7.1 and the `DiagramLabels` interface from §7.2.
- Fill `NODES`, `EDGES` and `CHIPS` from the three tables in §7.1. Set `naive: true` on the two naive edges.
- Transcribe each script table in §7.4 into `SCENARIOS`, one `ScenarioStep` per row:
  - `move` is the hops split on spaces.
  - `pre` and `set` are parsed from `key:value` pairs.
  - `tone` is set only where the table's header line says a step is amber or rose.
  - `initial` comes from the header line.
  - `redeliver-dedup` reuses `SCENARIOS.redeliver.steps.slice(0, 3)` for its steps 1–3.
- Fill `RETRY_CHART.series` with the four arrays from the test above, which are the §7.5 table.
- Build `PREFETCH_DEMO.rows` from the §7.7 rule.
- `stateAttr` and `stateData` iterate the `DiagramState` key order: `const KEYS = Object.keys(BASE_STATE) as (keyof DiagramState)[]`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx playwright test tests/ingestion-data.spec.ts && npm run check`
Expected: 13 passed. `astro check` reports 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/case-study/ingestion.ts tests/ingestion-data.spec.ts
git commit -m "Add the Mynt ingestion story data with geometry and scenario checks"
```

**Done when:** `npx playwright test tests/ingestion-data.spec.ts` passes 13/13 and `npm run check` is clean.

---

### Task 2: Both page shells: prose, chapters, takeaways and quality gates

**Files:**
- Create: `src/content/case-studies/en/mynt.mdx`, `src/content/case-studies/ar/mynt.mdx`, `src/components/case-study/IngestionStory.astro`, `src/components/case-study/StoryChapter.astro`, `tests/case-study-story.spec.ts`
- Modify: `src/styles/case-study.css` (new section at the end), `tests/case-study.spec.ts`, `tests/quality.spec.ts`

**Interfaces:**
- Consumes: `BASE_STATE`, `stateAttr`, `stateData`, `Stage`, `DiagramLabels` from Task 1; the existing `Section.astro` (`id`, `title`, default slot).
- Produces:
  - `IngestionStory.astro` takes the props `{ labels: DiagramLabels; dir: 'ltr' | 'rtl' }`. It renders `<div class="story" data-story data-base={stateAttr(BASE_STATE)}><div class="story__chapters"><slot /></div></div>`. Task 4 adds the stage and the script.
  - `StoryChapter.astro` takes the props `{ id: string; title: string; stage: Stage; labels: DiagramLabels; dir: 'ltr' | 'rtl' }`. It renders `<div class="chapter" data-chapter={id} data-stage={stage} {...stateData(BASE_STATE)}>`, wrapping `<Section id={id} title={title}><slot /><slot name="demo" /></Section>`.
    - Why a wrapper: `Section` accepts only `id` and `title`, and it stays unchanged.
    - "The chapter element" in the spec and in every later task is this `.chapter` div.
    - Task 3 inserts the figure between the two slots.
  - Each MDX file exports `diagramLabels: DiagramLabels`.
  - CSS classes: `.story`, `.story__chapters`, `.chapter`, `.story__lesson`, `.takeaways`, `.takeaways__price`, and the utility `.cs-sr` (exact rule in spec §7.4).
  - `tests/case-study-story.spec.ts` defines `const EN = '/case-studies/mynt/'` and `const AR = '/ar/case-studies/mynt/'`. Later tasks append to this file.

- [ ] **Step 1: Write the failing tests**

In `tests/case-study.spec.ts`, make the table per page:
- Remove `EN_PATH` and `AR_PATH`.
- Add `slug` and `tags` to the two Getridley entries: `slug: 'getridley'`, and `tags: ['AWS SES', 'S3', 'SQS', 'Lambda', 'DynamoDB', 'WebSockets']` on both.
- Give each entry its `path` as `/case-studies/getridley/` or `/ar/case-studies/getridley/`.
- Set each `other.href` to the other language's path.
- In the first test, replace the hard-coded tag list with `p.tags`.
- In the alternates test, build the expected URLs from `p.slug`:

```ts
      const en = `${SITE}/case-studies/${p.slug}/`;
      const ar = `${SITE}/ar/case-studies/${p.slug}/`;
      expect(alternates).toEqual([['en', en], ['ar', ar], ['x-default', en]]);
```

Append the two Mynt entries to `PAGES`:

```ts
  {
    slug: 'mynt',
    lang: 'en',
    dir: 'ltr',
    path: '/case-studies/mynt/',
    title: 'Keeping scheduled ingestion alive when upstreams fail · Mohamed Gamal',
    h1: 'Keeping scheduled ingestion alive when upstreams fail',
    description:
      "Mynt's scheduled ingestion from 5+ blockchains and 3+ APIs, one problem at a time: RabbitMQ, acks after the write, jittered retries, idempotent consumers, a parking-lot DLQ, circuit breakers and backpressure, and what each fix cost.",
    kicker: 'Case study · Web3 & NFTs',
    tags: ['RabbitMQ', 'Cron', 'Retries', 'Dead-letter queue', 'Circuit Breaker', 'Idempotency'],
    sections: [
      'The setup', 'The naive cron', 'Ack at the right time', 'Retries', 'What actually went wrong',
      'Poison messages', 'The provider that is down', 'Backpressure', 'Takeaways',
    ],
    current: 'EN',
    other: { text: 'عربي', href: '/ar/case-studies/mynt/' },
    back: 'Mohamed Gamal',
    foot: 'Designed and built by me.',
  },
  {
    slug: 'mynt',
    lang: 'ar',
    dir: 'rtl',
    path: '/ar/case-studies/mynt/',
    title: 'جمع بيانات مجدول يصمد حين تتعطل المصادر · محمد جمال',
    h1: 'جمع بيانات مجدول يصمد حين تتعطل المصادر',
    description:
      'جمع Mynt المجدول للبيانات من خمس شبكات blockchain أو أكثر وثلاث APIs أو أكثر، مشكلةً بعد مشكلة: RabbitMQ، والـ ack بعد الكتابة، وretries مع jitter، وconsumers من نوع idempotent، وparking-lot DLQ، وcircuit breakers، وbackpressure، وثمن كل حل.',
    kicker: 'دراسة حالة · Web3 وNFTs',
    tags: ['RabbitMQ', 'Cron', 'Retries', 'Dead-letter queue', 'Circuit Breaker', 'Idempotency'],
    sections: [
      'السياق', 'الـ cron الساذج', 'الـ ack في الوقت الصحيح', 'الـ retries', 'ما الذي حدث خطأً فعلًا',
      'رسائل poison', 'المصدر المتوقف', 'الـ backpressure', 'الخلاصة',
    ],
    current: 'عربي',
    other: { text: 'EN', href: '/case-studies/mynt/' },
    back: 'محمد جمال',
    foot: 'صمّمتُه وبنيتُه بنفسي.',
  },
```

Turn the three font and skip-link tests at the bottom into a loop over `for (const slug of ['getridley', 'mynt'])`. Name them `` `${slug}: the Arabic page loads Readex Pro and the English page does not` `` and so on, with the paths built from `slug`.

In `tests/quality.spec.ts`, set:

```ts
const CASE_STUDIES = ['/case-studies/getridley/', '/ar/case-studies/getridley/', '/case-studies/mynt/', '/ar/case-studies/mynt/'];
```

In the 375px overflow test, keep the page-overflow assertion for every path. Run the existing `[data-ex]` checks only when `path.includes('getridley')` (wrap them in `if (...) { …; return; }`). For Mynt, add the generic check below. It loops over whatever exists, so it holds from now on and tightens as Tasks 3–8 add figures and demos:

```ts
      for (const el of await page.locator('[data-demo], .rchart svg, .chapter__figure svg').all()) {
        const box = (await el.boundingBox())!;
        const column = (await el.locator('xpath=ancestor::section[1]').boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(column.x - 0.5);
        expect(box.x + box.width).toBeLessThanOrEqual(column.x + column.width + 0.5);
      }
      for (const btns of await page.locator('.scn__btns').all()) {
        const panel = (await btns.locator('xpath=ancestor::*[@data-demo][1]').boundingBox())!;
        const box = (await btns.boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width + 0.5);
      }
```

Create `tests/case-study-story.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

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
```

Task 3 widens the import when its helpers need the types.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/case-study.spec.ts tests/case-study-story.spec.ts tests/quality.spec.ts`
Expected: the Mynt entries in `case-study.spec.ts` fail with 404s, the story tests fail, and the Mynt rows in `quality.spec.ts` fail. The Getridley rows still pass.

- [ ] **Step 3: Write `StoryChapter.astro` and `IngestionStory.astro`**

Write both with the props and markup in Interfaces above. `labels` and `dir` are accepted now. Task 3 starts passing them to the figure.

- [ ] **Step 4: Write `en/mynt.mdx`**

- Frontmatter: copy it from spec §3. Above it, add the comment `# Lead sources: …` with the IDs from the §5 Lead line.
- Imports: `Section`, `IngestionStory` and `StoryChapter`.
- `export const diagramLabels` from the spec §7.2 table:

```js
export const diagramLabels = {
  nodes: {
    providers: { main: 'Providers', sub: 'chains + APIs' }, db: { main: 'Database' },
    cron: { main: 'Cron', sub: 'schedules' }, exchange: { main: 'Exchange', sub: 'RabbitMQ' },
    queue: { main: 'Queue' }, consumer: { main: 'Consumer', sub: 'fetch + save' },
    retry: { main: 'Retry', sub: 'TTL queues' }, parking: { main: 'Parking lot' },
  },
  ack: 'ack after save',
  dedup: { on: 'dedup', off: 'no dedup', hit: 'dedup ✓' },
  breaker: { closed: 'closed', open: 'open', 'half-open': 'half-open', off: 'no breaker' },
  prefetch: 'prefetch',
  crashed: 'crashed', down: 'down', lost: 'work lost ✕', stale: 'stale',
  caption: 'Simplified: one queue, one consumer and one provider stand for many.',
};
```

- The body follows the §7.8 MDX shape: one `<IngestionStory labels={diagramLabels} dir="ltr">` holding eight `<StoryChapter>` blocks with the ids, titles and stages from the §7.8 table. Then comes `<Section id="takeaways" title="Takeaways">`.
- Each chapter holds that chapter's §5 paragraphs, in order, as Markdown.
  - Each paragraph's "Sources:" line becomes an MDX comment `{/* Sources: … */}` just above it.
  - Skip the "Demo: §…" lines.
- In chapter `breaker`, put the key lesson where §5 places it:

```mdx
<aside class="story__lesson">
  <p>Retries and a dead-letter queue are for a bad message. A circuit breaker is for a dependency that is down. Don’t mix them.</p>
</aside>
```

- Takeaways: the framing paragraph, then `<ol class="takeaways">` with the six §5 items. Each item is `<li><p><strong>{lead sentence}</strong> {body}</p><p class="takeaways__price"><strong>Price:</strong> {price}</p></li>`, with the item's fact IDs in a comment. Then the closing paragraph with its source comment.

- [ ] **Step 5: Write `ar/mynt.mdx`**

This is the same structure with the §6 Arabic copy:
- The frontmatter values come from §6 Meta, H1 and Lead, plus `lang: ar`, `label: "Web3 وNFTs"` and the same English tags.
- `dir="rtl"` on `IngestionStory` and every `StoryChapter`.
- The chapter titles come from the §7.8 Arabic column, and the price label is "الثمن:".
- Use the same source comments as the English file.
- `diagramLabels` comes from the Arabic column of §7.2:
  - providers `{ main: 'المصادر', sub: 'شبكات + APIs' }`, db `{ main: 'قاعدة البيانات' }`, cron `{ main: 'Cron', sub: 'يجدول العمل' }`;
  - exchange, queue, retry and parking are as in English; consumer is `{ main: 'Consumer', sub: 'جلب + حفظ' }`;
  - ack is `'ack بعد الحفظ'`, dedup off is `'بلا dedup'` and breaker off is `'بلا breaker'`;
  - crashed is `'تعطّل'`, down `'متوقف'`, lost `'ضاع العمل ✕'` and stale `'قديمة'`;
  - caption is the §4 Arabic caption.

- [ ] **Step 6: Add the base story CSS**

Add a section `/* ---------- Ingestion story (Mynt, spec §4, §7.9) ---------- */` at the end of `case-study.css`:
- `.cs-sr`: the rule from spec §7.4.
- `.story__lesson`: a teal inline-start border (`border-inline-start: 3px solid var(--teal)`) and `padding-inline-start`.
- `.takeaways`: list spacing.
- `.takeaways__price`: muted colour.

Use logical properties only.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/case-study.spec.ts tests/case-study-story.spec.ts tests/quality.spec.ts tests/contact-scan.spec.ts tests/content-rules.spec.ts tests/rtl-ready.spec.ts && npm run check`
Expected: all pass. Mynt now has axe (desktop and 375px), internal links, the 8KB budget, CLS and overflow, in both languages.

- [ ] **Step 8: Read both pages once in the browser** (`npm run preview`)

Check that every §5 and §6 paragraph is present, in order, with no stray Markdown. Check that the Arabic reads right-to-left with the English terms inline.

- [ ] **Step 9: Commit**

```bash
git add src/content/case-studies/en/mynt.mdx src/content/case-studies/ar/mynt.mdx src/components/case-study/IngestionStory.astro src/components/case-study/StoryChapter.astro src/styles/case-study.css tests/case-study.spec.ts tests/case-study-story.spec.ts tests/quality.spec.ts
git commit -m "Add the English and Arabic Mynt case-study pages with their story prose"
```

**Done when:** `npx playwright test tests/case-study.spec.ts tests/case-study-story.spec.ts tests/quality.spec.ts` passes after `npm run build`.

---

### Task 3: `IngestionDiagram` and the chapter figures

**Files:**
- Create: `src/components/case-study/IngestionDiagram.astro`
- Modify: `src/components/case-study/StoryChapter.astro`, `src/styles/case-study.css`, `tests/case-study-story.spec.ts`

**Interfaces:**
- Consumes: all the geometry exports, `labelY`, `mx`, `stateData`, `BASE_STATE` and `DiagramLabels` from Task 1; `StoryChapter` from Task 2.
- Produces (Tasks 4–8 and their tests rely on this DOM):
  - Props: `{ stage: Stage | 'all'; uid: string; labels: DiagramLabels; dir: 'ltr' | 'rtl' }`.
  - Root: `<svg class="dg" viewBox="0 0 680 320" aria-hidden="true" focusable="false" data-uid={uid} data-stage={stage === 'all' ? 0 : stage} {...stateData(BASE_STATE)}>`, followed by the sibling `<p class="dg__caption">{labels.caption}</p>`.
  - Every drawn piece carries `data-from="<stage>"`. With a number `stage`, only pieces with `from ≤ stage` are rendered, and `is-new` goes on those with `from === stage`. With `'all'`, everything is rendered, with `is-off` on `from > 0` and `is-new` on `from === 0`.
  - Inside `<g class="dg-shapes">`, which carries `transform="matrix(-1 0 0 1 680 0)"` in RTL:
    - nodes are `rect.dg-node[data-node=<id>]` (`rx 8`; `.dg-node--dash` when dashed);
    - edges are `path.dg-edge[data-edge=<id>][id="dg-<uid>-<id>"]` (`.dg-edge--dash`);
    - chips are `rect.dg-chip[data-chip=<id>]` (`rx 9`);
    - queue slots are `g.dg-qslots > circle.dg-qslot` × 6 and parking slots are `g.dg-pslots > circle.dg-pslot` × 6 (each group holds only its circles, so `:nth-of-type` counts work);
    - the DB bars are `rect.dg-bar` × 3, the bell is `path.dg-bell`, and the dot is `circle.dg-dot` (`r 5`, `cx 0`, `cy 0`).
  - The dot holds `<animateMotion begin="indefinite" dur="0.7s" fill="freeze" calcMode="linear" keyPoints="0;1" keyTimes="0;1"><mpath href="#dg-<uid>-qCon"/></animateMotion>`.
  - Outside the shapes group (x through `mx`):
    - node labels are `g.dg-label[data-label=<id>]` holding `text.dg-main`, `text.dg-sub` when the label has `sub`, and the notes `text.dg-note[data-note="crashed"]` (cron and consumer) or `[data-note="down"]` (providers);
    - `text.dg-note[data-note="lost"]` and `[data-note="stale"]` sit at `NOTE_AT`, and `text.dg-ack` sits at `NOTE_AT.ack`;
    - chip texts are `g.dg-chiptext[data-chip-text=<id>]`. Dedup has `text[data-v="on|off|hit"]` and breaker has `text[data-v="closed|open|half-open|off"]`. Prefetch has a single `text[data-prefix=<labels.prefetch>]` whose static content is `"<prefix> 3"`.
  - Notes take their node's stage: crashed is 1, down is 0, stale is 0, and lost is 1.
  - `data-naive-keep` goes on everything that stays in naive mode: the cron, providers and db nodes; their labels; the DB bars; both naive edges; the lost note; and the dot.
  - `StoryChapter` renders `<figure class="chapter__figure"><IngestionDiagram stage={stage} uid={id} labels={labels} dir={dir} /></figure>` between its two slots.

- [ ] **Step 1: Write the failing tests**

Change the import at the top of `tests/case-study-story.spec.ts` to `import { test, expect, type Locator, type Page } from '@playwright/test';`, then append:

```ts
const figure = (page: Page, id: string) => page.locator(`[data-chapter="${id}"] .chapter__figure svg.dg`);
const nodesIn = (svg: Locator) =>
  svg.locator('rect[data-node]').evaluateAll((els) => els.map((el) => el.getAttribute('data-node')));
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
    expect(await nodesIn(figure(page, 'cron'))).toEqual(['providers', 'db', 'cron', 'exchange', 'queue', 'consumer']);
    expect(await nodesIn(figure(page, 'retries'))).toEqual(['providers', 'db', 'cron', 'exchange', 'queue', 'consumer', 'retry']);
    expect(await nodesIn(figure(page, 'poison'))).toContain('parking');
    await expect(figure(page, 'retries').locator('rect[data-node="retry"]')).toHaveClass(/\bis-new\b/);
    await expect(figure(page, 'retries').locator('rect[data-node="queue"]')).not.toHaveClass(/\bis-new\b/);
    await expect(figure(page, 'cron').locator('[data-edge="ack"]')).toHaveCount(0);
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
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts -g "figure|drawing|fit their boxes"`
Expected: FAIL. No `.chapter__figure` exists yet.

- [ ] **Step 3: Implement `IngestionDiagram.astro`**

Use the props and DOM in Interfaces, the geometry from Task 1, the label positions from `labelY` and the RTL technique from `PipelineScrolly.astro`. Text uses `text-anchor: middle`. In `StoryChapter.astro`, add the figure between the two slots.

- [ ] **Step 4: Add the diagram CSS**

Add it to the "Ingestion story" section, keyed on the root's own attributes (`.dg[data-queue="2"] …`), never on an ancestor's, because the chapter element carries the same attribute names. Implement the spec §7.3 "State → drawing" table:
- Slots and bars are `display: none` by default. Each count value shows the first n through `:nth-of-type(-n+N)`.
- `dup="yes"` turns the last shown bar rose (`#fb7185`).
- `down` turns that node's stroke rose and swaps its `.dg-sub` for its `.dg-note`.
- The breaker chip is teal when closed, rose when open, amber (`#fbbf24`) when half-open, and muted with a dashed stroke when off. Show only the matching `[data-chip-text="breaker"] text[data-v]`.
- The dedup chip is teal when on, muted when off, and teal-filled on hit. Show only the matching text.
- `bell="yes"` gives the bell an amber fill. `stale="yes"` shows the stale note and turns the db stroke amber. `lost="yes"` shows the lost note.
- `naive="yes"` hides `[data-from]:not([data-naive-keep])`. `naive="no"` hides `[data-edge="naiveProv"], [data-edge="naiveDb"]`.
- `.is-off` is `display: none`. `.is-new` has a teal stroke (`var(--teal)`), with its label text in teal.
- State colours take precedence over the `.is-new` teal: write the state rules after the `.is-new` rules, with equal or higher specificity. Otherwise the breaker chip, which is new at stage 6, would stay teal while its demo turns it open.
- `.dg-dot` is hidden unless `.dg.is-running` (Task 5 sets that class).
- Below 1024px, main labels are 15px, and `.dg-sub`, `.dg-chiptext`, `.dg-ack` and `.dg-note` are hidden. A main label that sat above a sub-label moves to the node's middle with `dominant-baseline: central`, positioned through a CSS `y`. Copy the technique from the scrolly's mobile block.
- Arabic: `font-family: inherit` on the sub-labels, as Getridley does.

Leave the appear animation for Task 4.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts tests/quality.spec.ts tests/rtl-ready.spec.ts && npm run check`
Expected: all pass, including 375px overflow for the eight figures on both pages.

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/IngestionDiagram.astro src/components/case-study/StoryChapter.astro src/styles/case-study.css tests/case-study-story.spec.ts
git commit -m "Draw the Mynt pipeline diagram in every chapter at its stage"
```

**Done when:** `npx playwright test tests/case-study-story.spec.ts -g "figure|drawing|fit their boxes"` passes after `npm run build`.

---

### Task 4: Sticky stage, two-column layout and stage following

**Files:**
- Modify: `src/components/case-study/IngestionStory.astro` (stage and script), `src/styles/case-study.css`, `tests/case-study-story.spec.ts`

**Interfaces:**
- Consumes: `IngestionDiagram` (Task 3), with `stage="all"` and `uid="s"`.
- Produces:
  - `IngestionStory` renders `<div class="story__stage"><IngestionDiagram stage="all" uid="s" labels={labels} dir={dir} /></div>` after `.story__chapters`, as in spec §7.8.
  - **The story script** (one `<script>` in `IngestionStory.astro`; Task 5 extends this same script) defines these functions, which Task 5 calls:
    - `apply(el: Element, state: string): void` writes each `key:value` pair as `data-<key>`; an empty string does nothing.
    - `idleState(chapter: HTMLElement): string` returns the `.story` element's `data-base`. Task 5 appends the selected run's `data-initial`.
    - `desktop: MediaQueryList` is `matchMedia('(min-width: 1024px)')`.
    - `setStage(n: number): void` implements spec §7.4 item 2: it sets `data-stage`, toggles `is-off` and `is-new`, and applies chapter n's idle state to the sticky diagram. The demo-reset half arrives in Task 5.
    - `sync(): void` applies the active-chapter rule.
    - `let locked = false`. When `locked` is true, `sync` changes nothing. Task 5 sets and clears it, calling `sync()` on release.
  - Classes: `.story.is-live` (set by the script) and `.dg.is-seen` (on figures, once each, through an IntersectionObserver with `threshold: 0.4`).
  - Test helpers in the story spec: `chapter(page, id)`, `sticky(page)` and `centerChapter(page, id)`.

- [ ] **Step 1: Write the failing tests**

Append:

```ts
const chapter = (page: Page, id: string) => page.locator(`[data-chapter="${id}"]`);
const sticky = (page: Page) => page.locator('.story__stage svg.dg');
async function centerChapter(page: Page, id: string) {
  await chapter(page, id).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}
/** Visible pieces of the sticky diagram that belong to a later stage than the one shown. */
const piecesAhead = (page: Page) =>
  sticky(page).evaluate((svg) =>
    [...svg.querySelectorAll('[data-from]')].filter(
      (el) => Number(el.getAttribute('data-from')) > Number(svg.getAttribute('data-stage')) && getComputedStyle(el).display !== 'none',
    ).length,
  );

test('the sticky diagram follows the active chapter', async ({ page }) => {
  await page.goto(EN);
  await expect(sticky(page)).toHaveAttribute('data-stage', '0');
  await centerChapter(page, 'retries');
  await expect(sticky(page)).toHaveAttribute('data-stage', '3');
  const retry = sticky(page).locator('rect[data-node="retry"]');
  await expect(retry).toBeVisible();
  await expect(retry).toHaveClass(/\bis-new\b/);
  await expect(sticky(page).locator('rect[data-node="parking"]')).toBeHidden();
  expect(await sticky(page).locator('.is-new').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('data-from')))])).toEqual(['3']);
  expect(await piecesAhead(page)).toBe(0);
  await centerChapter(page, 'breaker');
  await expect(sticky(page)).toHaveAttribute('data-stage', '6');
  await expect(sticky(page).locator('rect[data-chip="breaker"]')).toHaveClass(/\bis-new\b/);
  expect(await piecesAhead(page)).toBe(0);
  await page.reload();
  await expect(sticky(page)).toHaveAttribute('data-stage', '6');
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
```

Inside the existing `test.describe('without JavaScript')` block, add:

```ts
  test('one column with no sticky stage at 1280px', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('.story')).not.toHaveCSS('display', 'grid');
    await expect(page.locator('.story__stage')).toBeHidden();
    await expect(page.locator('.story')).not.toHaveClass(/\bis-live\b/);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts -g "sticky|deep link|appear|two columns|1280px|seen|one column"`
Expected: FAIL. `.story__stage` doesn't exist yet.

- [ ] **Step 3: Implement the stage and the script**

- Add `.story__stage` to `IngestionStory.astro`.
- Write the script with the functions in Interfaces:
  - It adds `is-live` to `.story`, then applies each chapter's idle state to its own figure and to the chapter element.
  - It calls `sync()` once, then on the first animation frame after `scroll` or `resize`. Write `sync` the same way as `PipelineScrolly` writes it.
  - When the active chapter's stage differs from the sticky diagram's `data-stage`, it calls `setStage`.
  - Figure observer: add `is-seen` once, then unobserve.
  - The chip text: `setStage(7)` writes `prefetch` like any other key. The text node `[data-prefix]` gets `` `${prefix} ${value}` `` whenever `apply` writes `prefetch`. The slider value read arrives in Task 8; until then stage 7 uses base.

- [ ] **Step 4: Add the layout CSS**

- `@media (scripting: enabled) and (min-width: 1024px)`:
  - `.story` uses the grid from spec §4.
  - `.story__chapters` sits in column 1. `.story__stage` takes `grid-column: 2; grid-row: 1; align-self: start; position: sticky; inset-block-start: calc(50vh - 130px)`.
  - `.chapter__figure` is `display: none`.
  - `.story .section__title` gets `margin-inline: 0; padding-inline: 0`.
- `.story__stage` is `display: none` outside that query, so it is hidden without JS and below 1024px.
- The appear animation `@keyframes dg-in` (450ms): nodes and chips fade in and scale from 0.92 with `transform-box: fill-box; transform-origin: center`. Edges draw in with `stroke-dasharray`/`stroke-dashoffset`. It applies to `.story.is-live .story__stage .is-new` and `.story.is-live .dg.is-seen .is-new`.
- `@media (prefers-reduced-motion: reduce)`: `animation: none` on those, and no transitions on `.dg *`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts tests/quality.spec.ts tests/rtl-ready.spec.ts && npm run check`
Expected: all pass, including CLS < 0.02 and the 8KB budget for both Mynt pages.

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/IngestionStory.astro src/styles/case-study.css tests/case-study-story.spec.ts
git commit -m "Add the Mynt sticky diagram that grows with the active chapter"
```

**Done when:** `npx playwright test tests/case-study-story.spec.ts -g "sticky|deep link|appear|two columns|1280px|seen|one column"` passes after `npm run build`, and so does `tests/quality.spec.ts`.

---

### Task 5: `ScenarioDemo`, the scenario player and the five chapter demos

**Files:**
- Create: `src/components/case-study/ScenarioDemo.astro`
- Modify: `src/components/case-study/IngestionStory.astro` (the player in the same script), `src/styles/case-study.css` (the scn section, and the new selectors added to the `.ex__btns button`, `.ex__switch` and `html[lang='ar'] .ex__btns button` rule lists), both MDX files, `tests/case-study-story.spec.ts`

**Interfaces:**
- Consumes: `SCENARIOS`, `stateAttr`, `ScenarioId`, `HOP_MS` and `HOLD_MS` from Task 1; `apply`, `idleState`, `setStage`, `sync`, `locked` and `desktop` from Task 4.
- Produces:
  - `ScenarioDemo` props are exactly the spec §7.4 `Props`. At build time it throws `Error('ScenarioDemo: <id> has <n> log lines, the script has <m> steps')` on a count mismatch, and `Error('ScenarioDemo: button runs <id>, which has no log')` on a missing run.
  - The markup is the spec §7.4 HTML, plus:
    - `button[data-run=<id>]`, with `data-alt=<alt>` when the button has one;
    - `li` steps with `data-move` (space-separated hops), `data-pre`, `data-set` (from `stateAttr`) and `data-tone`;
    - `.scn__run[data-initial]`, from `stateAttr(SCENARIOS[id].initial)`.
  - Player classes: `.scn__run.is-current` (the run on show), `li.is-shown` (revealed steps), `.dg.is-running` (the dot visible), and `.dg-dot.is-amber` / `.dg-dot.is-rose` (the tone; teal is the default). The chapter element gets `data-run` and `data-done`.
  - `idleState(chapter)` now returns the base state plus the `data-initial` of the run the chapter's buttons select: `data-alt` when the chapter's switch is `aria-checked="true"`, otherwise `data-run`. The first button decides. Chapters without a switch idle at base.
  - Every state write (base, idle, `data-initial`, `pre`, `set`) goes to both the target diagram and the chapter element (spec §7.4 item 1). On desktop the target is the sticky diagram, and below 1024px it is the chapter's own figure.
  - **The switch writes to the sticky diagram only while its `data-stage` equals the chapter's stage.** The chapter element always gets the write. This keeps one chapter's state off another chapter's stage (Review Focus 1).
  - `setStage(n)` now also resets every chapter demo except chapter n to idle (spec §7.4 item 2). Resetting means: cancel the run if one is going, remove `data-run` and `data-done`, set `aria-pressed="false"` on every button, show the idle line, and hide the runs. The chapter element and its own figure go back to the chapter's idle state.
  - The switch also returns its demo to idle.
  - Test helpers: `target(page, id)`, `showDemo(page, id)`, `run(page, id, button)` and `CONTROLS`.

- [ ] **Step 1: Write the failing tests**

Append:

```ts
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
  await expect(sticky(page)).toHaveAttribute('data-stage', '3');
  // Leaving a stage resets that chapter's demo (spec §7.4 item 2).
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
```

Add `import { SCENARIOS } from '../src/components/case-study/ingestion';` to the top of the file. Inside the `without JavaScript` block, add:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts`
Expected: the Task 2–4 tests still pass. The new scenario, keyboard and note tests fail, because there is no `[data-demo]` yet.

- [ ] **Step 3: Implement `ScenarioDemo.astro`**

Use the props, markup, ids and build-time checks from Interfaces. Ids within one demo are prefixed with the chapter id (`scn-<chapter>-title`, `scn-<chapter>-<run>`, …), so they stay unique on the page.

- [ ] **Step 4: Extend the story script with the player**

Implement spec §7.4 items 4–8 exactly, with the additions in Interfaces:
- **Run token.** A counter increments on every run and every cancel. The run loop awaits `wait(ms)` (a `setTimeout` promise) and stops when the token has changed.
- **Run(id) on desktop.** It calls `setStage(chapter stage)` and sets `locked = true`. On the end, or on a cancel, it sets `locked = false` and calls `sync()`.
- **The hop.** It sets the tone class and points `mpath` at `#dg-<uid>-<edge>`. `keyPoints` is `1;0` for a `-edge` hop. Then it calls `beginElement()` and waits `HOP_MS`.
  - Under `matchMedia('(prefers-reduced-motion: reduce)')`, it removes the `animateMotion` once when a run starts. Each hop then sets the dot's `cx`/`cy` from `getPointAtLength` (the start for a `-edge` hop, which is where a reversed hop ends) and waits `HOP_MS`.
- **Cancel triggers.** Clicking any `button[data-run]`. The switch. A `change` on `desktop`. An IntersectionObserver (threshold 0) on every `[data-demo]`, which cancels when its running demo stops intersecting.
- Focus is never moved by the script.

- [ ] **Step 5: Add the scenario CSS**

- Keyed on `@media (scripting: none)`: hide `.scn__btns`, `.scn__alt`, `.scn__idle` and `[data-live]`.
- Keyed on `@media (scripting: enabled)`:
  - `.scn__run:not(.is-current)` is `display: none`.
  - `.scn__run.is-current .scn__run-title` uses the `.cs-sr` rule.
  - `.scn__run.is-current li:not(.is-shown)` is `visibility: hidden`.
  - Hide `.scn__idle` while a run is current, using a `data-state="idle|run"` attribute that the player sets on `.scn`.
- Append `.scn__btns button` to the `.ex__btns button` rule list (and its `:hover`, `[aria-pressed='true']` and `html[lang='ar']` variants).
- Append `.scn__alt [role='switch']` and `.rchart [role='switch']` to every `.ex__switch` rule (base, `::after`, checked, and the RTL checked rule).
- `.dg-dot` is teal by default, with `.is-amber` and `.is-rose`.
- The `.scn` panel copies the `.ex` panel's box styling.

- [ ] **Step 6: Add the demos to both MDX files**

In each file, add `import ScenarioDemo …` and `export const demos = { cron, ack, duplicates, poison, breaker }`. Each entry follows the `ScenarioDemo` props minus `chapter`:
- English: titles, buttons and switches from the §5 demo table, and run headings from the §5 run-heading table. The `steps` are the English column of each §7.4 script table. The `note` and `idle` are the shared §5 strings.
- Arabic: the same structure from the §6 tables and the Arabic column of §7.4.

Put `<ScenarioDemo slot="demo" chapter="<id>" {...demos.<id>} />` at the end of chapters `cron`, `ack`, `duplicates`, `poison` and `breaker`. Write the English `’` in strings such as "Mynt’s" and "can’t".

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts tests/quality.spec.ts tests/case-study-explainer.spec.ts tests/case-study-scrolly.spec.ts tests/rtl-ready.spec.ts && npm run check`
Expected: all pass. The Getridley explainer and scrolly tests stay green after the shared-selector edit. The Mynt pages stay under 8KB of JavaScript.

- [ ] **Step 8: Commit**

```bash
git add src/components/case-study/ScenarioDemo.astro src/components/case-study/IngestionStory.astro src/styles/case-study.css src/content/case-studies/en/mynt.mdx src/content/case-studies/ar/mynt.mdx tests/case-study-story.spec.ts
git commit -m "Add the Mynt scenario demos with a scripted, cancellable player"
```

**Done when:** after `npm run build`, `npx playwright test tests/case-study-story.spec.ts` passes in full, `tests/quality.spec.ts` passes (8KB, CLS, axe), and the Getridley explainer and scrolly specs are unchanged and green.

---

### Task 6: `RetryChart` (chapter 3)

**Files:**
- Create: `src/components/case-study/RetryChart.astro`
- Modify: `src/styles/case-study.css`, both MDX files, `tests/case-study-story.spec.ts`

**Interfaces:**
- Consumes: `RETRY_CHART` and `ChartSeries` from Task 1. The switch look comes from the shared rule that Task 5 extended.
- Produces:
  - Props as in spec §7.5: `title`, `note`, `jitterLabel`, `r429Label`, `axis: { x: string; y: string }`, `limitLabel`, `retryAfterLabel`, `firstLabel` and `captions: Record<ChartSeries, { heading: string; text: string }>`.
  - DOM:
    - root `div.rchart[data-jitter="off"][data-r429="off"]`, holding `p.rchart__title`, `p.rchart__note`, and two `button[role="switch"][aria-checked="false"]`, each `aria-labelledby` a visible `span`, with `data-key="jitter"` and `data-key="r429"`;
    - `svg[viewBox="0 0 480 220"][aria-hidden="true"]` with `direction: ltr`;
    - one `g[data-series=<series>]` per series, each holding 20 `rect[data-t][data-v]`;
    - `div.rchart__caps[aria-live="polite"]` holding four `div.rchart__cap[data-cap=<series>]`, each with `p.rchart__cap-title` and `p`.
  - Bar geometry: `x = 40 + t * 21.5 + 3.75`, `width = 14`, `y = 180 - v * 20`, `height = v * 20`. The limit line is at y 60, dashed and labelled `limitLabel`. Ticks at t = 0, 5, 10 and 15 sit at the bucket centres. The t0 bar is muted and labelled `firstLabel`. In the 429 series, the amber band spans x 61.5 → 147.5 (t1–t4) and is labelled `retryAfterLabel`.

- [ ] **Step 1: Write the failing tests**

Append:

```ts
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
```

Inside the `without JavaScript` block, add:

```ts
  test('the chart shows the plain series with every caption listed', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('.rchart [role="switch"]').filter({ visible: true })).toHaveCount(0);
    expect(await shownSeries(page)).toEqual(['plain']);
    await expect(page.locator('.rchart__cap').filter({ visible: true })).toHaveCount(4);
    await expect(page.locator('.rchart__cap-title').filter({ visible: true })).toHaveCount(4);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts -g "chart"`
Expected: FAIL. There is no `.rchart` yet.

- [ ] **Step 3: Implement `RetryChart.astro`**

Use the props, DOM and geometry from Interfaces:
- CSS shows the one `g[data-series]` that matches the root's `data-jitter`/`data-r429` (off/off is plain, on/off jitter, off/on plain429, on/on jitter429), and the matching caption.
- The amber band shows only with `data-r429="on"`.
- The tiny script loops over every `.rchart`. On a switch click it flips `aria-checked` and the matching root attribute (`data-key` names it). It imports nothing.
- Under `@media (scripting: none)`, the switches are hidden, `plain` is shown, and every caption is shown.
- With reduced motion, the bars have no transitions.

- [ ] **Step 4: Add the props and the component to both MDX files**

Add `export const chart`, built from the §7.5 copy table (EN and AR columns). Each caption's bold lead sentence becomes `heading` and the rest becomes `text`. Put `<RetryChart slot="demo" {...chart} />` at the end of chapter `retries`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts tests/quality.spec.ts tests/rtl-ready.spec.ts && npm run check`
Expected: all pass. That includes the keyboard test, which now also reaches the two chart switches, and the note test for `.rchart`.

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/RetryChart.astro src/styles/case-study.css src/content/case-studies/en/mynt.mdx src/content/case-studies/ar/mynt.mdx tests/case-study-story.spec.ts
git commit -m "Add the Mynt retry-storm chart with jitter and Retry-After switches"
```

**Done when:** `npx playwright test tests/case-study-story.spec.ts -g "chart|keyboard|illustrative"` passes after `npm run build`.

---

### Task 7: `DedupTable` (chapter 4)

**Files:**
- Create: `src/components/case-study/DedupTable.astro`
- Modify: `src/styles/case-study.css`, both MDX files, `tests/case-study-story.spec.ts`

**Interfaces:**
- Consumes: the chapter element's `data-rows` and `data-dup`, written by the Task 5 player.
- Produces:
  - Props `{ caption: string; columns: [string, string, string]; duplicate: string }`. `duplicate` is "(duplicate)" or "(مكرر)".
  - DOM: `table.dt` with a `caption`, a `thead` (the columns, as `code`) and a `tbody` holding the three demo rows from spec §7.6.
    - The ID cells are `code` with `dir="ltr"`.
    - Row 3's last cell ends with `<span class="dt__dup">{duplicate}</span>`.
  - CSS:
    - row n shows when `[data-chapter][data-rows]` is n or more (`:nth-child(-n+N)`);
    - with `[data-dup="yes"]`, row 3's background is `rgba(251, 113, 133, 0.15)` and `.dt__dup` takes the `.cs-sr` rule; otherwise `.dt__dup` is `display: none`;
    - under `@media (scripting: none)`, `.dt` is `display: none`.

- [ ] **Step 1: Write the failing tests**

Append:

```ts
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
```

Inside the `without JavaScript` block, add:

```ts
  test('the dedup table is hidden', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('table.dt')).toBeHidden();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts -g "dedup table"`
Expected: FAIL. There is no `table.dt` yet.

- [ ] **Step 3: Implement `DedupTable.astro` and its CSS**

Use the props, DOM and CSS from Interfaces. The `evt_…` codes use `direction: ltr; unicode-bidi: isolate`, as the Getridley code does.

- [ ] **Step 4: Add the table to both MDX files**

Add `<DedupTable slot="demo" caption="…" columns={['event_id', 'type', 'nft']} duplicate="…" />` right after the chapter-4 `ScenarioDemo`, with the §7.6 caption in each language.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts tests/quality.spec.ts tests/rtl-ready.spec.ts && npm run check`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/DedupTable.astro src/styles/case-study.css src/content/case-studies/en/mynt.mdx src/content/case-studies/ar/mynt.mdx tests/case-study-story.spec.ts
git commit -m "Add the Mynt dedup table that shows the duplicate row"
```

**Done when:** `npx playwright test tests/case-study-story.spec.ts -g "dedup"` passes after `npm run build`.

---

### Task 8: `PrefetchDemo` (chapter 7)

**Files:**
- Create: `src/components/case-study/PrefetchDemo.astro`
- Modify: `src/components/case-study/IngestionStory.astro` (`setStage(7)` reads the slider), `src/styles/case-study.css`, both MDX files, `tests/case-study-story.spec.ts`

**Interfaces:**
- Consumes: `PREFETCH_DEMO` from Task 1; the sticky and figure DOM from Tasks 3–4; `setStage` from Task 4.
- Produces:
  - Props as in spec §7.7: `title`, `note`, `label`, `explain`, `readouts: { throughput: string; calls: string; limit: string }`, `under` and `over`.
  - DOM:
    - root `div.pf[data-calls="1 2 … 8"][data-throughput="1 2 3 4 5 6 6 6"][data-over="no no no no no no yes yes"]`, built from `PREFETCH_DEMO.rows`;
    - `p.pf__title`, `p.pf__note` and `p.pf__explain`;
    - `label[for]` and `input[type=range][min=1][max=8][step=1][value=3][aria-valuetext="prefetch 3"]`, plus `output.pf__value`;
    - inside `div.pf__rows`, the rows `div.pf__row[data-row="throughput"]` and `div.pf__row[data-row="calls"]`. Each holds a label, `span.pf__bar` (`inline-size: calc(var(--v) / 8 * 100%)`) and an `output`. The calls row also holds a dashed `span.pf__limit` at 6/8, with `readouts.limit`;
    - `p.pf__status[aria-live="polite"][data-under][data-over]`, whose static text is `under`.
  - The script, on `input`, sets:
    - `--v` on both rows, both outputs and `.pf__value`;
    - `aria-valuetext` to `prefetch <p>`;
    - the status text, from `data-over` on the root and the matching `data-under`/`data-over` text;
    - `data-prefetch` on the chapter element.
  - It also writes `prefetch:<p>` (the `data-prefetch` attribute and the `[data-prefix]` chip text) to the target diagram. Below 1024px that is the backpressure figure. On desktop it is the sticky diagram, but only while its `data-stage` is `"7"`.
  - `setStage(7)` in the story script reads `document.querySelector('.pf input')?.value`, falling back to `'3'`.

- [ ] **Step 1: Write the failing tests**

Append:

```ts
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
```

Inside the `without JavaScript` block, add:

```ts
  test('the prefetch slider and readouts are hidden', async ({ page }) => {
    await page.goto(EN);
    await expect(page.locator('.pf input[type="range"]')).toBeHidden();
    await expect(page.locator('.pf__rows')).toBeHidden();
    await expect(page.locator('.pf__explain')).toBeVisible();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts -g "prefetch"`
Expected: FAIL. There is no `.pf` yet.

- [ ] **Step 3: Implement `PrefetchDemo.astro` and its CSS**

Use the props, DOM and script from Interfaces:
- The range track and thumb use the site tokens.
- Under `@media (scripting: none)`, the input, `.pf__value`, `.pf__rows` and `.pf__status` are hidden.
- With reduced motion, the bars have no transitions.
- In `IngestionStory.astro`, make `setStage(7)` read the slider as described.

- [ ] **Step 4: Add the props and the component to both MDX files**

Add `export const prefetch`, built from the §7.7 props and copy table (EN and AR). Put `<PrefetchDemo slot="demo" {...prefetch} />` at the end of chapter `backpressure`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/case-study-story.spec.ts tests/quality.spec.ts tests/rtl-ready.spec.ts && npm run check`
Expected: all pass. The keyboard test now also reaches the slider, the note test now covers `.pf`, and the 8KB budget still holds with every script in place.

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/PrefetchDemo.astro src/components/case-study/IngestionStory.astro src/styles/case-study.css src/content/case-studies/en/mynt.mdx src/content/case-studies/ar/mynt.mdx tests/case-study-story.spec.ts
git commit -m "Add the Mynt prefetch slider that drives the diagram chip"
```

**Done when:** `npx playwright test tests/case-study-story.spec.ts` passes in full after `npm run build`, and so does `tests/quality.spec.ts`.

---

### Task 9: Home link, existing test updates and Lighthouse URLs

**Files:**
- Modify: `src/content/projects.ts`, `tests/home-content.spec.ts`, `tests/desktop.spec.ts`, `lighthouserc.json`

**Interfaces:**
- Consumes: the existing `Row` behaviour for any project with an `href` (link, ↗ arrow, teal hover, "Read the case study →").
- Produces: the Mynt.la row links to `/case-studies/mynt/`.

- [ ] **Step 1: Update the tests (they now fail)**

In `tests/home-content.spec.ts`:
- In "projects appear in the spec order with their labels", the second title becomes `'Mynt.la↗'`.
- Replace the two Getridley-only tests with:

```ts
test('the Mynt.la and Getridley rows link to their case studies', async ({ page }) => {
  const links = page.locator('.row a');
  await expect(links).toHaveCount(2);
  expect(await links.evaluateAll((els) => els.map((a) => a.getAttribute('href')))).toEqual([
    '/case-studies/mynt/',
    '/case-studies/getridley/',
  ]);
  await expect(page.locator('.row__arrow')).toHaveCount(2);
});

test('linked rows show a visible case-study call to action', async ({ page }) => {
  const cta = page.locator('.row__cta');
  await expect(cta).toHaveCount(2);
  for (const c of await cta.all()) {
    await expect(c).toBeVisible();
    await expect(c).toHaveText('Read the case study →');
    await expect(c).toHaveCSS('color', 'rgb(94, 234, 212)');
  }
  await expect(page.locator('#projects .row--link .row__cta')).toHaveCount(2);
});
```

In `tests/desktop.spec.ts`, replace the two Getridley tests with:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npx playwright test tests/home-content.spec.ts tests/desktop.spec.ts`
Expected: FAIL. The tests find 1 link where they expect 2.

- [ ] **Step 3: Link the row and add the Lighthouse URLs**

- In `src/content/projects.ts`, add `href: '/case-studies/mynt/'` to the Mynt.la row. Next to it, add the comment `// Case study: docs/superpowers/specs/2026-10-10-mynt-case-study-design.md.` Change nothing else on the row.
- In `lighthouserc.json`, append `"http://localhost/case-studies/mynt/index.html"` and `"http://localhost/ar/case-studies/mynt/index.html"` to `ci.collect.url`. Leave the assertions unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run build && npx playwright test tests/home-content.spec.ts tests/desktop.spec.ts tests/quality.spec.ts && npm run lhci`
Expected: all tests pass. Lighthouse reports ≥ 0.95 in all four categories for all five URLs.

- [ ] **Step 5: Commit**

```bash
git add src/content/projects.ts tests/home-content.spec.ts tests/desktop.spec.ts lighthouserc.json
git commit -m "Link the Mynt case study from Home and add it to Lighthouse"
```

**Done when:** after `npm run build`, `npx playwright test tests/home-content.spec.ts tests/desktop.spec.ts` passes and `npm run lhci` passes.

---

### Task 10: Final verification

**Files:** none changed, unless a check fails. Fix any failure in the task that owns the code, then rerun this task.

- [ ] **Step 1: Run the full gate**

Run: `npm run verify`
Expected: `astro check` reports 0 errors, the build succeeds, and every Playwright test passes. That covers the 13 data checks, the whole story spec, the Getridley specs unchanged, quality, the contact and content scanners, and rtl-ready.

- [ ] **Step 2: Run Lighthouse**

Run: `npm run lhci`
Expected: all assertions pass (≥ 0.95, five URLs).

- [ ] **Step 3: Confirm that Getridley was not touched beyond the shared selectors**

`9de4137` is the last Getridley commit, the tree this plan starts from.

Run: `git diff --stat 9de4137 -- src/components/case-study/PipelineScrolly.astro src/components/case-study/ClaimCheckExplainer.astro src/components/case-study/pipeline.ts src/content/case-studies/en/getridley.mdx src/content/case-studies/ar/getridley.mdx src/components/Section.astro src/layouts tests/case-study-scrolly.spec.ts tests/case-study-explainer.spec.ts`
Expected: no output. Then `git diff 9de4137 -- src/styles/case-study.css` shows the Getridley rules gaining selectors only: no changed declarations, and only additions in the new "Ingestion story" section.

- [ ] **Step 4: Check the truth and privacy rules on the source**

- Run `git grep --untracked -nP "\bled\b|designed and built|I implemented|in production|six chains|6 chains|ست شبكات" -- src/content/case-studies/*/mynt.mdx`. Expected: no output. (`\bled\b` so that "called" and "settled" do not match. `--untracked` because the work is uncommitted, and plain `git grep` skips untracked files.)
- Run `git grep --untracked -cE "Sources:" -- src/content/case-studies/en/mynt.mdx src/content/case-studies/ar/mynt.mdx`. Expected: the two files report the same count.

- [ ] **Step 5: Check by hand in the browser** (`npm run preview`)

On both languages, at 1280px and 375px:
- Read the story top to bottom.
- Run every demo once.
- Turn on reduced motion in DevTools (Rendering → Emulate CSS prefers-reduced-motion) and run one demo.
- Disable JavaScript and reload.

Confirm that:
- the sticky diagram never shows a later stage's piece;
- dots travel on desktop and jump with reduced motion;
- the Arabic diagram is mirrored while its labels read correctly;
- the chart reads left to right in Arabic;
- without JS, every scenario list and every chart caption is readable.

**Done when:** `npm run verify` and `npm run lhci` both pass on the final tree, and Steps 3–5 show nothing unexpected. Report the results with the output, then hand over for one focused review of the whole diff.
