// Geometry of the pipeline diagram (spec §7.1). Coordinates are in the SVG's 620 × 330 viewBox.

export const VIEW_W = 620;
export const VIEW_H = 330;

export type NodeId = 'buyer' | 'ses' | 's3' | 'sqs' | 'dlq' | 'lambda' | 'dynamodb' | 'websocket' | 'inbox';

export interface PipelineNode {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Steps (1–6) in which the node is lit. */
  steps: number[];
  dashed?: boolean;
}

export interface PipelineEdge {
  id: string;
  d: string;
  steps: number[];
  dashed?: boolean;
}

export type PipelineLabels = Record<NodeId, { main: string; sub?: string }>;

export const NODES: PipelineNode[] = [
  { id: 'buyer', x: 16, y: 140, w: 88, h: 44, steps: [1] },
  { id: 'ses', x: 134, y: 140, w: 88, h: 44, steps: [1, 2] },
  { id: 's3', x: 252, y: 40, w: 88, h: 44, steps: [3, 5] },
  { id: 'sqs', x: 252, y: 140, w: 88, h: 44, steps: [4] },
  { id: 'dlq', x: 252, y: 240, w: 88, h: 40, steps: [4], dashed: true },
  { id: 'lambda', x: 370, y: 140, w: 88, h: 44, steps: [5] },
  { id: 'dynamodb', x: 370, y: 240, w: 88, h: 44, steps: [5] },
  { id: 'websocket', x: 370, y: 40, w: 88, h: 44, steps: [6] },
  { id: 'inbox', x: 500, y: 40, w: 104, h: 44, steps: [6] },
];

export const EDGES: PipelineEdge[] = [
  { id: 'e1', d: 'M104 162 H134', steps: [1] },
  { id: 'e2', d: 'M222 152 C238 152 236 62 252 62', steps: [3] },
  { id: 'e3', d: 'M222 162 H252', steps: [4] },
  { id: 'e4', d: 'M296 184 V240', steps: [4], dashed: true },
  { id: 'e5', d: 'M340 162 H370', steps: [5] },
  { id: 'e6', d: 'M370 152 C354 152 356 62 340 62', steps: [5], dashed: true },
  { id: 'e7', d: 'M414 184 V240', steps: [5] },
  { id: 'e8', d: 'M414 140 V84', steps: [6] },
  { id: 'e9', d: 'M458 62 H500', steps: [6] },
];

/** The edge the packet travels in each step, steps 1–6 in order. */
export const PACKET_PATH = ['e1', 'e1', 'e2', 'e3', 'e5', 'e9'];

/** Labels are drawn outside the mirrored group, so in RTL their x is mirrored by hand. */
export function labelX(node: PipelineNode, rtl: boolean): number {
  const center = node.x + node.w / 2;
  return rtl ? VIEW_W - center : center;
}
