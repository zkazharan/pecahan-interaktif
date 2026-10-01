import { formatFraction, frac, type Fraction } from '../../../lib/fraction';
import type { FractionLimits } from '../../../lib/limits';
import { readFraction } from '../common';

export type MixedParams = { f: Fraction };

export const MIXED_DEFAULTS: MixedParams = { f: frac(5, 4) };

export const MIXED_LIMITS: FractionLimits = { dMin: 2, dMax: 8, nMin: (d) => d + 1, nMax: (d) => 3 * d };

export function plateCountFor(f: Fraction): number {
  return Math.ceil(f.n / f.d);
}

export function parseMixedParams(raw: Record<string, string>): MixedParams {
  return { f: readFraction(raw.f, MIXED_LIMITS, MIXED_DEFAULTS.f) };
}

export function formatMixedParams(params: MixedParams): Record<string, string> {
  return { f: formatFraction(params.f) };
}
