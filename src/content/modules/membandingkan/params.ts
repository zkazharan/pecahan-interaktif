import { formatFraction, frac, parseFraction, type Fraction } from '../../../lib/fraction';
import { withinLimits, type FractionLimits } from '../../../lib/limits';

export type CompareParams = { a: Fraction; b: Fraction };

export const COMPARE_DEFAULTS: CompareParams = { a: frac(1, 3), b: frac(1, 4) };

export const COMPARE_LIMITS: FractionLimits = { dMin: 1, dMax: 12, nMin: 1, nMax: (d) => d };

function readField(raw: string | undefined, fallback: Fraction): Fraction {
  const parsed = parseFraction(raw ?? '');
  return parsed && withinLimits(parsed, COMPARE_LIMITS) ? parsed : fallback;
}

export function parseCompareParams(raw: Record<string, string>): CompareParams {
  return { a: readField(raw.a, COMPARE_DEFAULTS.a), b: readField(raw.b, COMPARE_DEFAULTS.b) };
}

export function formatCompareParams(params: CompareParams): Record<string, string> {
  return { a: formatFraction(params.a), b: formatFraction(params.b) };
}
