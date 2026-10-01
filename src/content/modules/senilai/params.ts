import { formatFraction, frac, type Fraction } from '../../../lib/fraction';
import type { FractionLimits } from '../../../lib/limits';
import { readFraction } from '../common';

export type EquivParams = { f: Fraction };

export const EQUIV_DEFAULTS: EquivParams = { f: frac(1, 2) };

export const EQUIV_LIMITS: FractionLimits = { dMin: 2, dMax: 8, nMin: 1, nMax: (d) => d - 1 };

export const MAX_PARTS = 24;

export function maxCut(d: number): number {
  return Math.min(6, Math.floor(MAX_PARTS / d));
}

export function parseEquivParams(raw: Record<string, string>): EquivParams {
  return { f: readFraction(raw.f, EQUIV_LIMITS, EQUIV_DEFAULTS.f) };
}

export function formatEquivParams(params: EquivParams): Record<string, string> {
  return { f: formatFraction(params.f) };
}
