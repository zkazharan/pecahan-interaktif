import { describe, expect, it } from 'vitest';
import { frac } from './fraction';
import { parseField, withinLimits, type FractionLimits } from './limits';

const LIMITS: FractionLimits = { dMin: 1, dMax: 12, nMin: 1, nMax: (d) => d };

describe('parseField', () => {
  it('accepts up to three digits', () => {
    expect(parseField('7')).toBe(7);
    expect(parseField(' 12 ')).toBe(12);
  });

  it('rejects anything else', () => {
    for (const text of ['', 'abc', '2.5', '-1', '1000', '1e2', ' ']) {
      expect(parseField(text)).toBeNull();
    }
  });
});

describe('withinLimits', () => {
  it('checks both numerator and denominator', () => {
    expect(withinLimits(frac(1, 3), LIMITS)).toBe(true);
    expect(withinLimits(frac(12, 12), LIMITS)).toBe(true);
    expect(withinLimits(frac(1, 13), LIMITS)).toBe(false);
    expect(withinLimits(frac(0, 3), LIMITS)).toBe(false);
    expect(withinLimits(frac(4, 3), LIMITS)).toBe(false);
  });
});
