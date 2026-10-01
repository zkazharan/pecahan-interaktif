import { describe, expect, it } from 'vitest';
import { frac } from './fraction';
import { spokenFraction, spokenMixed, terbilang } from './spoken';

describe('terbilang', () => {
  it('names numbers in Indonesian', () => {
    expect(terbilang(0)).toBe('nol');
    expect(terbilang(1)).toBe('satu');
    expect(terbilang(10)).toBe('sepuluh');
    expect(terbilang(11)).toBe('sebelas');
    expect(terbilang(12)).toBe('dua belas');
    expect(terbilang(19)).toBe('sembilan belas');
    expect(terbilang(20)).toBe('dua puluh');
    expect(terbilang(21)).toBe('dua puluh satu');
    expect(terbilang(72)).toBe('tujuh puluh dua');
    expect(terbilang(99)).toBe('sembilan puluh sembilan');
  });

  it('rejects numbers outside 0–99', () => {
    expect(() => terbilang(100)).toThrow(RangeError);
    expect(() => terbilang(-1)).toThrow(RangeError);
  });
});

describe('spokenFraction', () => {
  it('reads fractions the way teachers say them', () => {
    expect(spokenFraction(frac(1, 2))).toBe('setengah');
    expect(spokenFraction(frac(1, 3))).toBe('sepertiga');
    expect(spokenFraction(frac(1, 4))).toBe('seperempat');
    expect(spokenFraction(frac(2, 5))).toBe('dua perlima');
    expect(spokenFraction(frac(1, 12))).toBe('seperdua belas');
    expect(spokenFraction(frac(5, 24))).toBe('lima perdua puluh empat');
  });
});

describe('spokenMixed', () => {
  it('reads whole and rest together', () => {
    expect(spokenMixed(1, frac(1, 4))).toBe('satu seperempat');
    expect(spokenMixed(2, frac(3, 5))).toBe('dua tiga perlima');
  });

  it('drops an empty part', () => {
    expect(spokenMixed(3, frac(0, 4))).toBe('tiga');
    expect(spokenMixed(0, frac(1, 2))).toBe('setengah');
  });
});
