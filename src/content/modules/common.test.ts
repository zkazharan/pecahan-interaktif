import { describe, expect, it } from 'vitest';
import { frac } from '../../lib/fraction';
import { range, readCount, readFraction } from './common';

describe('range', () => {
  it('includes both ends', () => {
    expect(range(2, 5)).toEqual([2, 3, 4, 5]);
  });
});

describe('readCount', () => {
  it('accepts whole numbers inside the range', () => {
    expect(readCount('5', 2, 12, 3)).toBe(5);
    expect(readCount('12', 2, 12, 3)).toBe(12);
  });

  it('falls back for anything else', () => {
    for (const raw of [undefined, '', '0', '1', '13', '99', 'abc', '2.5', '-4']) expect(readCount(raw, 2, 12, 3)).toBe(3);
  });
});

describe('readFraction', () => {
  const limits = { dMin: 2, dMax: 12, nMin: 1, nMax: (d: number) => d };

  it('accepts fractions inside the limits', () => {
    expect(readFraction('3/4', limits, frac(1, 2))).toEqual({ n: 3, d: 4 });
  });

  it('falls back for broken or out-of-range text', () => {
    for (const raw of [undefined, '', 'abc', '5/0', '5/3', '1/13', '0/4']) expect(readFraction(raw, limits, frac(1, 2))).toEqual({ n: 1, d: 2 });
  });
});
