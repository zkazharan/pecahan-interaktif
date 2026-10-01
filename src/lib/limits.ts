import type { Fraction } from './fraction';

export type FractionLimits = {
  dMin: number;
  dMax: number;
  nMin: number;
  nMax: (d: number) => number;
};

export function withinLimits(f: Fraction, limits: FractionLimits): boolean {
  return f.d >= limits.dMin && f.d <= limits.dMax && f.n >= limits.nMin && f.n <= limits.nMax(f.d);
}

export function parseField(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  return Number(trimmed);
}
