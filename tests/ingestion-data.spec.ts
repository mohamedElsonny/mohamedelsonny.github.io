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
