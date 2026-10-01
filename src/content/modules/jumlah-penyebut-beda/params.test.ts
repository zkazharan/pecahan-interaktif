import { describe, expect, it } from 'vitest';
import { frac } from '../../../lib/fraction';
import { DIFF_DEFAULTS, fitsCommon, formatDiffParams, parseDiffParams } from './params';

describe('parseDiffParams', () => {
  it('defaults to 1/2 and 1/3', () => {
    expect(parseDiffParams({})).toEqual(DIFF_DEFAULTS);
    expect(DIFF_DEFAULTS).toEqual({ a: { n: 1, d: 2 }, b: { n: 1, d: 3 } });
  });

  it('reads valid pairs and falls back for broken ones', () => {
    expect(parseDiffParams({ a: '3/4', b: '1/6' })).toEqual({ a: { n: 3, d: 4 }, b: { n: 1, d: 6 } });
    expect(parseDiffParams({ a: '1/7', b: '1/3' })).toEqual(DIFF_DEFAULTS);
    expect(parseDiffParams({ a: '2/5', b: '1/6' })).toEqual(DIFF_DEFAULTS);
  });

  it('knows which pairs fit 24 small parts', () => {
    expect(fitsCommon(frac(1, 4), frac(1, 6))).toBe(true);
    expect(fitsCommon(frac(1, 5), frac(1, 6))).toBe(false);
    expect(formatDiffParams({ a: frac(2, 3), b: frac(1, 4) })).toEqual({ a: '2/3', b: '1/4' });
  });
});
