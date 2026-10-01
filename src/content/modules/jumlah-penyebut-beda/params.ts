import { formatFraction, frac, lcm, parseFraction, type Fraction } from '../../../lib/fraction';
import { withinLimits, type FractionLimits } from '../../../lib/limits';
import { MAX_PARTS } from '../../../manipulatives/bar';

export type DiffParams = { a: Fraction; b: Fraction };

export const DIFF_DEFAULTS: DiffParams = { a: frac(1, 2), b: frac(1, 3) };

export const DIFF_LIMITS: FractionLimits = { dMin: 2, dMax: 6, nMin: 1, nMax: (d) => d - 1 };

export const PERAGA_MAX_COMMON = MAX_PARTS;

export function fitsCommon(a: Fraction, b: Fraction): boolean {
  return lcm(a.d, b.d) <= PERAGA_MAX_COMMON;
}

export function parseDiffParams(raw: Record<string, string>): DiffParams {
  const a = parseFraction(raw.a ?? '');
  const b = parseFraction(raw.b ?? '');
  if (!a || !b || !withinLimits(a, DIFF_LIMITS) || !withinLimits(b, DIFF_LIMITS) || !fitsCommon(a, b)) return DIFF_DEFAULTS;
  return { a, b };
}

export function formatDiffParams(params: DiffParams): Record<string, string> {
  return { a: formatFraction(params.a), b: formatFraction(params.b) };
}
