import { formatFraction, frac, type Fraction } from '../../../lib/fraction';
import type { FractionLimits } from '../../../lib/limits';
import { readFraction } from '../common';

export type ReadParams = { f: Fraction };

export const READ_DEFAULTS: ReadParams = { f: frac(3, 4) };

export const READ_LIMITS: FractionLimits = { dMin: 2, dMax: 12, nMin: 1, nMax: (d) => d - 1 };

export function parseReadParams(raw: Record<string, string>): ReadParams {
  return { f: readFraction(raw.f, READ_LIMITS, READ_DEFAULTS.f) };
}

export function formatReadParams(params: ReadParams): Record<string, string> {
  return { f: formatFraction(params.f) };
}
