import { describe, expect, it } from 'vitest';
import { frac } from '../../../lib/fraction';
import { MIXED_DEFAULTS, formatMixedParams, parseMixedParams, plateCountFor } from './params';

describe('parseMixedParams', () => {
  it('defaults to five quarters', () => {
    expect(parseMixedParams({})).toEqual(MIXED_DEFAULTS);
    expect(MIXED_DEFAULTS).toEqual({ f: { n: 5, d: 4 } });
  });

  it('accepts improper fractions up to three wholes and rejects the rest', () => {
    expect(parseMixedParams({ f: '7/3' })).toEqual({ f: { n: 7, d: 3 } });
    expect(parseMixedParams({ f: '12/4' })).toEqual({ f: { n: 12, d: 4 } });
    for (const bad of ['3/4', '4/4', '13/4', '9/9', 'abc', '', '5/0']) expect(parseMixedParams({ f: bad })).toEqual(MIXED_DEFAULTS);
  });

  it('round-trips and counts plates', () => {
    expect(formatMixedParams({ f: frac(7, 3) })).toEqual({ f: '7/3' });
    expect(plateCountFor(frac(5, 4))).toBe(2);
    expect(plateCountFor(frac(8, 4))).toBe(2);
    expect(plateCountFor(frac(9, 4))).toBe(3);
  });
});
