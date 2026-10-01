import { readCount } from '../common';

export type FairParams = { n: number };

export const FAIR_DEFAULTS: FairParams = { n: 3 };
export const PEOPLE_MIN = 2;
export const PEOPLE_MAX = 12;

export function parseFairParams(raw: Record<string, string>): FairParams {
  return { n: readCount(raw.n, PEOPLE_MIN, PEOPLE_MAX, FAIR_DEFAULTS.n) };
}

export function formatFairParams(params: FairParams): Record<string, string> {
  return { n: String(params.n) };
}
