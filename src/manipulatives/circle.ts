import type { Rng } from '../lib/random';

export const CIRCLE = { view: 200, cx: 100, cy: 100, r: 90 } as const;

export type Arc = { start: number; end: number };

const TOP = -Math.PI / 2;
const FULL = Math.PI * 2;

export function equalSlices(n: number): number[] {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`slice count must be a positive integer: ${n}`);
  return Array.from({ length: n }, () => 1 / n);
}

export function isEqualCut(slices: readonly number[]): boolean {
  return slices.every((size) => Math.abs(size - slices[0]) < 1e-9);
}

export function unequalSlices(rng: Rng, n: number): number[] {
  if (!Number.isInteger(n) || n < 2) throw new RangeError(`unequal cut needs at least two slices: ${n}`);
  for (let attempt = 0; attempt < 1000; attempt++) {
    const weights = Array.from({ length: n }, () => rng.int(1, 5));
    const total = weights.reduce((a, b) => a + b, 0);
    const slices = weights.map((w) => w / total);
    if (!isEqualCut(slices) && Math.max(...slices) / Math.min(...slices) >= 1.6) return slices;
  }
  throw new Error('could not generate an unequal cut');
}

export function sliceAngles(slices: readonly number[]): Arc[] {
  const arcs: Arc[] = [];
  let start = TOP;
  for (const size of slices) {
    const end = start + size * FULL;
    arcs.push({ start, end });
    start = end;
  }
  return arcs;
}

function round(value: number): number {
  const rounded = Number(value.toFixed(3));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function wedgePath(start: number, end: number): string {
  const { cx, cy, r } = CIRCLE;
  if (end - start >= FULL - 1e-9) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }
  const x1 = round(cx + r * Math.cos(start));
  const y1 = round(cy + r * Math.sin(start));
  const x2 = round(cx + r * Math.cos(end));
  const y2 = round(cy + r * Math.sin(end));
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function guidePoints(count: number): { x: number; y: number }[] {
  if (count < 2) return [];
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count;
    return { x: CIRCLE.cx + CIRCLE.r * Math.sin(angle), y: CIRCLE.cy - CIRCLE.r * Math.cos(angle) };
  });
}
