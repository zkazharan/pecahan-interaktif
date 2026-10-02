import { MAX_MARBLES } from '../../../manipulatives/collection';
import { readCount } from '../common';

export type ShareParams = { n: number; k: number; take: number };

export const SHARE_DEFAULTS: ShareParams = { n: 12, k: 3, take: 2 };
export const SHARE_K_MIN = 2;
export const SHARE_K_MAX = 6;

export function maxTotal(k: number): number {
  return k * Math.floor(MAX_MARBLES / k);
}

export function parseShareParams(raw: Record<string, string>): ShareParams {
  const k = readCount(raw.k, SHARE_K_MIN, SHARE_K_MAX, -1);
  if (k < 0) return { ...SHARE_DEFAULTS };
  const n = readCount(raw.n, k, maxTotal(k), -1);
  const take = readCount(raw.take, 1, k, -1);
  if (n < 0 || take < 0 || n % k !== 0) return { ...SHARE_DEFAULTS };
  return { n, k, take };
}

export function formatShareParams(params: ShareParams): Record<string, string> {
  return { n: String(params.n), k: String(params.k), take: String(params.take) };
}

function clampTotal(n: number, k: number): number {
  return Math.min(maxTotal(k), Math.max(k, n));
}

export function withBags(params: ShareParams, k: number): ShareParams {
  return { n: clampTotal(Math.round(params.n / k) * k, k), k, take: Math.min(params.take, k) };
}

export function stepTotal(params: ShareParams, value: number): ShareParams {
  const n = value > params.n ? params.n + params.k : params.n - params.k;
  return { ...params, n: clampTotal(n, params.k) };
}
