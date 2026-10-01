import { describe, expect, it } from 'vitest';
import {
  add,
  compare,
  equivalent,
  formatFraction,
  frac,
  gcd,
  lcm,
  parseFraction,
  sameForm,
  simplify,
  subtract,
  toMixed,
  toNumber,
  type Fraction,
} from './fraction';

const ALL: Fraction[] = [];
for (let d = 1; d <= 24; d++) {
  for (let n = 0; n <= 3 * d; n++) ALL.push(frac(n, d));
}

const PROPER_UP_TO_12: Fraction[] = ALL.filter((f) => f.d <= 12 && f.n <= f.d);

describe('frac', () => {
  it('rejects zero and negative denominators', () => {
    expect(() => frac(1, 0)).toThrow(RangeError);
    expect(() => frac(1, -2)).toThrow(RangeError);
  });

  it('rejects negative numerators and non-integers', () => {
    expect(() => frac(-1, 2)).toThrow(RangeError);
    expect(() => frac(1.5, 2)).toThrow(RangeError);
    expect(() => frac(1, 2.5)).toThrow(RangeError);
  });
});

describe('gcd and lcm', () => {
  it('computes small cases', () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(7, 0)).toBe(7);
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(8, 12)).toBe(24);
  });
});

describe('simplify', () => {
  it('returns lowest terms with the same value for every fraction up to /24', () => {
    const mismatches: string[] = [];
    for (const f of ALL) {
      const s = simplify(f);
      if (!equivalent(s, f) || (s.n > 0 && gcd(s.n, s.d) !== 1)) mismatches.push(`${f.n}/${f.d}`);
    }
    expect(mismatches).toEqual([]);
  });

  it('maps zero to 0/1', () => {
    expect(simplify(frac(0, 7))).toEqual({ n: 0, d: 1 });
  });
});

describe('compare', () => {
  it('agrees with decimal comparison for every pair up to /24', () => {
    const mismatches: string[] = [];
    for (const a of ALL) {
      for (const b of ALL) {
        const expected = Math.sign(toNumber(a) - toNumber(b));
        if (compare(a, b) !== (expected === 0 ? 0 : expected)) mismatches.push(`${a.n}/${a.d} vs ${b.n}/${b.d}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('says 1/4 is smaller than 1/3', () => {
    expect(compare(frac(1, 4), frac(1, 3))).toBe(-1);
  });
});

describe('equivalent and sameForm', () => {
  it('treats 2/4 and 1/2 as equal value but different form', () => {
    expect(equivalent(frac(2, 4), frac(1, 2))).toBe(true);
    expect(sameForm(frac(2, 4), frac(1, 2))).toBe(false);
    expect(sameForm(frac(2, 4), frac(2, 4))).toBe(true);
  });
});

describe('add and subtract', () => {
  it('adds over the lcm denominator and matches the decimal sum', () => {
    const mismatches: string[] = [];
    for (const a of PROPER_UP_TO_12) {
      for (const b of PROPER_UP_TO_12) {
        const sum = add(a, b);
        const off = sum.d !== lcm(a.d, b.d) || !(Math.abs(toNumber(sum) - (toNumber(a) + toNumber(b))) < 1e-9);
        if (off) mismatches.push(`${a.n}/${a.d} + ${b.n}/${b.d}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('handles the textbook cases', () => {
    expect(add(frac(1, 2), frac(1, 3))).toEqual({ n: 5, d: 6 });
    expect(add(frac(1, 8), frac(1, 12))).toEqual({ n: 5, d: 24 });
    expect(subtract(frac(3, 4), frac(1, 2))).toEqual({ n: 1, d: 4 });
  });

  it('refuses a negative result', () => {
    expect(() => subtract(frac(1, 4), frac(1, 2))).toThrow(RangeError);
  });
});

describe('toMixed', () => {
  it('splits improper fractions', () => {
    expect(toMixed(frac(5, 4))).toEqual({ whole: 1, rest: { n: 1, d: 4 } });
    expect(toMixed(frac(8, 4))).toEqual({ whole: 2, rest: { n: 0, d: 4 } });
    expect(toMixed(frac(3, 4))).toEqual({ whole: 0, rest: { n: 3, d: 4 } });
  });
});

describe('parseFraction and formatFraction', () => {
  it('round-trips valid text', () => {
    expect(parseFraction('2/5')).toEqual({ n: 2, d: 5 });
    expect(parseFraction(' 3/7 ')).toEqual({ n: 3, d: 7 });
    expect(formatFraction(frac(2, 5))).toBe('2/5');
  });

  it('returns null for broken text', () => {
    for (const text of ['5/0', 'abc', '1/', '/2', '-1/2', '1.5/2', '', '1/2/3', '1234/5']) {
      expect(parseFraction(text)).toBeNull();
    }
  });
});
