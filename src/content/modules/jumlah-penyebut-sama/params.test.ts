import { describe, expect, it } from 'vitest';
import { SAME_DEFAULTS, formatSameParams, parseSameParams, withDenominator } from './params';

describe('parseSameParams', () => {
  it('defaults to 2/5 and 1/5', () => {
    expect(parseSameParams({})).toEqual(SAME_DEFAULTS);
    expect(SAME_DEFAULTS).toEqual({ d: 5, a: 2, b: 1 });
  });

  it('reads valid counts and keeps the parts within the denominator', () => {
    expect(parseSameParams({ d: '8', a: '3', b: '7' })).toEqual({ d: 8, a: 3, b: 7 });
    expect(parseSameParams({ d: '3', a: '5', b: '9' })).toEqual({ d: 3, a: 2, b: 1 });
    expect(parseSameParams({ d: '99', a: 'x', b: '' })).toEqual(SAME_DEFAULTS);
  });

  it('round-trips and clamps when the denominator shrinks', () => {
    expect(formatSameParams({ d: 6, a: 4, b: 5 })).toEqual({ d: '6', a: '4', b: '5' });
    expect(withDenominator({ d: 6, a: 4, b: 5 }, 3)).toEqual({ d: 3, a: 3, b: 3 });
  });
});
