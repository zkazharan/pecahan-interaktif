import { describe, expect, it } from 'vitest';
import { COMPARE_DEFAULTS, formatCompareParams, parseCompareParams } from './params';

describe('parseCompareParams', () => {
  it('uses 1/3 and 1/4 when nothing is given', () => {
    expect(parseCompareParams({})).toEqual(COMPARE_DEFAULTS);
    expect(COMPARE_DEFAULTS).toEqual({ a: { n: 1, d: 3 }, b: { n: 1, d: 4 } });
  });

  it('reads valid fractions', () => {
    expect(parseCompareParams({ a: '2/5', b: '3/7' })).toEqual({ a: { n: 2, d: 5 }, b: { n: 3, d: 7 } });
  });

  it('replaces each broken field with its default', () => {
    for (const bad of ['abc', '5/0', '13/12', '0/3', '4/3', '1/13', '']) {
      expect(parseCompareParams({ a: bad, b: '3/7' })).toEqual({ a: { n: 1, d: 3 }, b: { n: 3, d: 7 } });
      expect(parseCompareParams({ a: '2/5', b: bad })).toEqual({ a: { n: 2, d: 5 }, b: { n: 1, d: 4 } });
    }
  });

  it('round-trips through formatCompareParams', () => {
    const params = { a: { n: 2, d: 5 }, b: { n: 3, d: 7 } };
    expect(formatCompareParams(params)).toEqual({ a: '2/5', b: '3/7' });
    expect(parseCompareParams(formatCompareParams(params))).toEqual(params);
  });
});
