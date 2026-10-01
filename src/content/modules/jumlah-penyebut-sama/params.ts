import { readCount } from '../common';

export type SameParams = { d: number; a: number; b: number };

export const SAME_DEFAULTS: SameParams = { d: 5, a: 2, b: 1 };
export const SAME_D_MIN = 2;
export const SAME_D_MAX = 12;

export function parseSameParams(raw: Record<string, string>): SameParams {
  const d = readCount(raw.d, SAME_D_MIN, SAME_D_MAX, SAME_DEFAULTS.d);
  return {
    d,
    a: readCount(raw.a, 1, d, Math.min(SAME_DEFAULTS.a, d)),
    b: readCount(raw.b, 1, d, Math.min(SAME_DEFAULTS.b, d)),
  };
}

export function formatSameParams(params: SameParams): Record<string, string> {
  return { d: String(params.d), a: String(params.a), b: String(params.b) };
}

export function withDenominator(params: SameParams, d: number): SameParams {
  return { d, a: Math.min(params.a, d), b: Math.min(params.b, d) };
}
