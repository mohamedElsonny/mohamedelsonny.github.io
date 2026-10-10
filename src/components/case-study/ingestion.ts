// Data for the Mynt ingestion story (spec §7.1). Build time only: client scripts import nothing but HOP_MS and HOLD_MS.

export const VIEW_W = 680;
export const VIEW_H = 320;
export const HOP_MS = 700; // one dot travelling one edge
export const HOLD_MS = 1200; // pause after a step's movement, before the next step

export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type NodeId = 'providers' | 'db' | 'cron' | 'exchange' | 'queue' | 'consumer' | 'retry' | 'parking';
export type EdgeId =
  | 'cronEx' | 'exQ' | 'qCon' | 'conProv' | 'conDb' | 'ack' | 'qRetry' | 'retryEx' | 'qPark'
  | 'naiveProv' | 'naiveDb';
export type ChipId = 'dedup' | 'breaker' | 'prefetch';
export type Hop = EdgeId | `-${EdgeId}`; // a leading '-' means the dot travels the edge backwards
export type Tone = 'teal' | 'amber' | 'rose';

export interface DiagramNode { id: NodeId; x: number; y: number; w: number; h: number; stage: Stage; dashed?: boolean }
export interface DiagramEdge { id: EdgeId; d: string; stage: Stage; naive?: boolean; dashed?: boolean }
export interface DiagramChip { id: ChipId; x: number; y: number; w: number; h: number; stage: Stage }

/** Labels reach both languages through props; see the tables in spec §7.2. */
export interface DiagramLabels {
  nodes: Record<NodeId, { main: string; sub?: string }>;
  ack: string;
  dedup: { on: string; off: string; hit: string };
  breaker: { closed: string; open: string; 'half-open': string; off: string };
  prefetch: string; // the number is appended: "prefetch 3"
  crashed: string; down: string; lost: string; stale: string;
  caption: string; // the "Simplified: …" line (§4)
}

export const NODES: DiagramNode[] = [
  { id: 'providers', x: 560, y: 48, w: 108, h: 44, stage: 0 },
  { id: 'db', x: 560, y: 232, w: 108, h: 44, stage: 0 },
  { id: 'cron', x: 12, y: 140, w: 84, h: 44, stage: 1 },
  { id: 'exchange', x: 124, y: 140, w: 92, h: 44, stage: 1 },
  { id: 'queue', x: 244, y: 140, w: 92, h: 44, stage: 1 },
  { id: 'consumer', x: 400, y: 140, w: 92, h: 44, stage: 1 },
  { id: 'retry', x: 240, y: 256, w: 100, h: 40, stage: 3, dashed: true },
  { id: 'parking', x: 396, y: 256, w: 100, h: 40, stage: 5, dashed: true },
];

export const EDGES: DiagramEdge[] = [
  { id: 'cronEx', d: 'M96 162 H124', stage: 1 },
  { id: 'exQ', d: 'M216 162 H244', stage: 1 },
  { id: 'qCon', d: 'M336 162 H400', stage: 1 },
  { id: 'conProv', d: 'M492 152 C526 152 526 70 560 70', stage: 1 },
  { id: 'conDb', d: 'M492 172 C526 172 526 254 560 254', stage: 1 },
  { id: 'naiveProv', d: 'M54 140 V70 H560', stage: 1, naive: true },
  { id: 'naiveDb', d: 'M54 184 V254 H560', stage: 1, naive: true },
  { id: 'ack', d: 'M446 140 C446 108 290 108 290 140', stage: 2, dashed: true },
  { id: 'qRetry', d: 'M290 184 V256', stage: 3 },
  { id: 'retryEx', d: 'M240 276 H170 V184', stage: 3, dashed: true },
  { id: 'qPark', d: 'M336 176 C366 176 366 276 396 276', stage: 5 },
];

/** Chips are centred on their edge's midpoint; the edge they sit on is a component concern. */
export const CHIPS: DiagramChip[] = [
  { id: 'prefetch', x: 338, y: 153, w: 60, h: 18, stage: 7 },
  { id: 'breaker', x: 494, y: 102, w: 64, h: 18, stage: 6 },
  { id: 'dedup', x: 498, y: 204, w: 56, h: 18, stage: 4 },
];

export const QUEUE_SLOT_X = [265, 275, 285, 295, 305, 315];
export const QUEUE_SLOT_Y = 172;
export const PARKING_SLOT_X = [421, 431, 441, 451, 461, 471];
export const PARKING_SLOT_Y = 285;
export const SLOT_R = 3;

export const DB_BAR_X = [577, 603, 629];
export const DB_BAR = { y: 262, w: 22, h: 5 };

/** Top-start corner of the 12 × 12 bell icon. */
export const BELL_AT = { x: 480, y: 250 };

/** Anchor points of the state notes; "crashed"/"down" replace the node's sub-label instead. */
export const NOTE_AT = { lost: { x: 180, y: 166 }, stale: { x: 614, y: 292 }, ack: { x: 368, y: 102 } };

/** Main-label y. A sub-label, drawn at y + 32, pushes the main label up. */
export function labelY(node: DiagramNode, hasSub: boolean): number {
  if (hasSub) return node.y + 17;
  if (node.id === 'queue' || node.id === 'db') return node.y + 16;
  if (node.id === 'parking') return node.y + 14;
  return node.y + node.h / 2;
}

/** Every key is rendered as data-<key> on the diagram root and on the chapter element. */
export interface DiagramState {
  naive: 'yes' | 'no';
  queue: '0' | '1' | '2' | '3' | '4' | '5' | '6';
  rows: '0' | '1' | '2' | '3';
  dup: 'yes' | 'no';
  parking: '0' | '1' | '2' | '3' | '4' | '5' | '6';
  down: 'none' | 'cron' | 'consumer' | 'providers';
  breaker: 'closed' | 'open' | 'half-open' | 'off';
  bell: 'yes' | 'no';
  lost: 'yes' | 'no';
  stale: 'yes' | 'no';
  dedup: 'on' | 'off' | 'hit';
  prefetch: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
}

export const BASE_STATE: DiagramState = {
  naive: 'no', queue: '2', rows: '1', dup: 'no', parking: '0', down: 'none',
  breaker: 'closed', bell: 'no', lost: 'no', stale: 'no', dedup: 'on', prefetch: '3',
};

const KEYS = Object.keys(BASE_STATE) as (keyof DiagramState)[];

/** State as the string written into data-base / data-pre / data-set: "queue:2 rows:1". */
export function stateAttr(state: Partial<DiagramState>): string {
  return KEYS.filter((key) => state[key] !== undefined).map((key) => `${key}:${state[key]}`).join(' ');
}

/** The same state as data-* attributes, for spreading onto elements in Astro. */
export function stateData(state: Partial<DiagramState>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of KEYS) if (state[key] !== undefined) out[`data-${key}`] = state[key]!;
  return out;
}

/** Labels are drawn outside the mirrored group, so in RTL their x is mirrored by hand. */
export function mx(x: number, rtl: boolean): number {
  return rtl ? VIEW_W - x : x;
}

export interface ScenarioStep {
  move?: Hop[]; // travelled in order, HOP_MS each
  tone?: Tone; // dot colour; default teal
  pre?: Partial<DiagramState>; // applied when the step starts
  set?: Partial<DiagramState>; // applied when the movement ends
}
export type ScenarioId =
  | 'naive-crash' | 'queued-crash' | 'crash-before-save' | 'crash-after-save'
  | 'redeliver' | 'redeliver-dedup' | 'poison' | 'provider-down' | 'provider-down-dlq';
export interface Scenario { stage: Stage; initial: Partial<DiagramState>; steps: ScenarioStep[] }

/** Steps 1–5 of `redeliver`; `redeliver-dedup` reuses the first three (spec §7.4). */
const REDELIVER_STEPS: ScenarioStep[] = [
  { move: ['qCon', 'conProv', 'conDb'], pre: { queue: '1' }, set: { rows: '2' } },
  { pre: { down: 'consumer' } },
  { move: ['-qCon'], set: { queue: '2' } },
  { move: ['qCon', 'conProv', 'conDb'], pre: { down: 'none', queue: '1' }, set: { rows: '3', dup: 'yes' } },
  { move: ['ack'] },
];

/** The scripts in spec §7.4, one ScenarioStep per table row. */
export const SCENARIOS: Record<ScenarioId, Scenario> = {
  'naive-crash': {
    stage: 1,
    initial: { naive: 'yes', queue: '0', rows: '0' },
    steps: [
      { move: ['naiveProv'] },
      { move: ['naiveDb'], set: { rows: '1' } },
      { pre: { down: 'cron' } },
      { pre: { lost: 'yes' } },
    ],
  },
  'queued-crash': {
    stage: 1,
    initial: { queue: '0', rows: '0' },
    steps: [
      { move: ['cronEx', 'exQ'], set: { queue: '4' } },
      { pre: { down: 'cron' } },
      { move: ['qCon', 'conProv'], pre: { queue: '3' } },
      { move: ['conDb'], set: { rows: '1' } },
      {},
    ],
  },
  'crash-before-save': {
    stage: 2,
    initial: { queue: '2', rows: '1' },
    steps: [
      { move: ['qCon'], pre: { queue: '1' } },
      { move: ['conProv'] },
      { pre: { down: 'consumer' } },
      { move: ['-qCon'], set: { queue: '2' } },
      { move: ['qCon', 'conProv', 'conDb'], pre: { down: 'none', queue: '1' }, set: { rows: '2' } },
      { move: ['ack'] },
    ],
  },
  'crash-after-save': {
    stage: 2,
    initial: { queue: '2', rows: '1' },
    steps: [
      { move: ['qCon'], pre: { queue: '1' } },
      { move: ['conProv', 'conDb'], set: { rows: '2' } },
      { pre: { down: 'consumer' } },
      { move: ['-qCon'], set: { queue: '2' } },
      { move: ['qCon', 'conProv', 'conDb'], pre: { down: 'none', queue: '1' }, set: { rows: '3', dup: 'yes' } },
      { move: ['ack'] },
    ],
  },
  redeliver: {
    stage: 4,
    initial: { queue: '2', rows: '1', dedup: 'off' },
    steps: REDELIVER_STEPS,
  },
  'redeliver-dedup': {
    stage: 4,
    initial: { queue: '2', rows: '1', dedup: 'on' },
    steps: [
      ...REDELIVER_STEPS.slice(0, 3),
      { move: ['qCon', 'conDb'], pre: { down: 'none', queue: '1', dedup: 'hit' } },
      { move: ['ack'], pre: { dedup: 'on' } },
    ],
  },
  poison: {
    stage: 5,
    initial: { queue: '2', rows: '1', parking: '0' },
    steps: [
      { move: ['qCon'], pre: { queue: '1' } },
      { move: ['-qCon', 'qRetry'], tone: 'amber' },
      { move: ['retryEx', 'exQ'], tone: 'amber', set: { queue: '2' } },
      { move: ['qCon', '-qCon', 'qRetry'], tone: 'amber', pre: { queue: '1' } },
      { move: ['retryEx', 'exQ'], tone: 'amber', set: { queue: '2' } },
      { move: ['qCon'], tone: 'amber', pre: { queue: '1' } },
      { move: ['-qCon', 'qPark'], tone: 'rose', set: { parking: '1', bell: 'yes' } },
    ],
  },
  'provider-down': {
    stage: 6,
    initial: { queue: '1', rows: '1', breaker: 'closed' },
    steps: [
      { pre: { down: 'providers' } },
      { move: ['conProv', '-conProv'], tone: 'rose' },
      { pre: { breaker: 'open' } },
      { move: ['cronEx', 'exQ'], set: { queue: '3' } },
      { pre: { stale: 'yes' } },
      { pre: { down: 'none', breaker: 'half-open' } },
      { move: ['qCon', 'conProv', 'conDb'], pre: { queue: '2' }, set: { rows: '2' } },
      { move: ['qCon', 'conProv', 'conDb'], set: { breaker: 'closed', stale: 'no', queue: '0', rows: '3' } },
    ],
  },
  'provider-down-dlq': {
    stage: 6,
    initial: { queue: '2', rows: '1', breaker: 'off', parking: '0' },
    steps: [
      { pre: { down: 'providers' } },
      { move: ['qCon', 'conProv', '-conProv'], tone: 'rose', pre: { queue: '0' } },
      { move: ['-qCon', 'qPark'], tone: 'rose', set: { parking: '2', bell: 'yes' } },
      { move: ['cronEx', 'exQ', 'qPark'], tone: 'rose', set: { parking: '4' } },
      { move: ['cronEx', 'exQ', 'qPark'], tone: 'rose', set: { parking: '6' } },
      { pre: { down: 'none' } },
    ],
  },
};

export type ChartSeries = 'plain' | 'jitter' | 'plain429' | 'jitter429';

/** 20 one-second buckets per series; the values are in spec §7.5. */
export const RETRY_CHART: { limit: 6; retryAfter: 5; series: Record<ChartSeries, number[]> } = {
  limit: 6,
  retryAfter: 5,
  series: {
    plain: [8, 8, 0, 8, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    jitter: [8, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    plain429: [8, 0, 0, 0, 0, 8, 0, 8, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0],
    jitter429: [8, 0, 0, 0, 0, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1],
  },
};

/** p = 1…8; the rule is in spec §7.7. */
export const PREFETCH_DEMO: { limit: 6; rows: { p: number; calls: number; throughput: number; over: boolean }[] } = {
  limit: 6,
  rows: [1, 2, 3, 4, 5, 6, 7, 8].map((p) => ({ p, calls: p, throughput: Math.min(p, 6), over: p > 6 })),
};
