import { frac, type Fraction } from '../lib/fraction';

export const LINE = {
  x0: 50,
  width: 900,
  y: 52,
  viewWidth: 1000,
  viewHeight: 110,
  tickHalf: 16,
  majorHalf: 28,
  markGap: 2,
  markLength: 24,
} as const;

const CROWDED = 0.22;

export function tickCount(max: number, perUnit: number): number {
  return max * perUnit + 1;
}

export function tickId(k: number): string {
  return `t${k}`;
}

export function tickIds(max: number, perUnit: number): string[] {
  return Array.from({ length: tickCount(max, perUnit) }, (_, k) => tickId(k));
}

export function tickIndexOf(id: string): number {
  const match = /^t(\d+)$/.exec(id);
  return match ? Number(match[1]) : -1;
}

export function tickX(k: number, max: number, perUnit: number): number {
  return LINE.x0 + (LINE.width * k) / (max * perUnit);
}

export function tickValue(k: number, perUnit: number): Fraction {
  return frac(k, perUnit);
}

export function tickFor(value: Fraction, perUnit: number): number {
  const k = (value.n * perUnit) / value.d;
  return Number.isInteger(k) ? k : -1;
}

export function staggerRows(ticks: readonly number[], total: number): number[] {
  const order = ticks.map((tick, index) => ({ tick, index })).sort((a, b) => a.tick - b.tick);
  const rows = new Array<number>(ticks.length).fill(0);
  for (let i = 1; i < order.length; i++) {
    const previous = order[i - 1];
    const current = order[i];
    if ((current.tick - previous.tick) / total < CROWDED) rows[current.index] = 1 - rows[previous.index];
  }
  return rows;
}
