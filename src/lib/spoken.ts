import type { Fraction } from './fraction';

const ONES = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

export function terbilang(x: number): string {
  if (!Number.isInteger(x) || x < 0 || x > 99) throw new RangeError(`out of range: ${x}`);
  if (x < 12) return ONES[x];
  if (x < 20) return `${ONES[x - 10]} belas`;
  const head = `${ONES[Math.floor(x / 10)]} puluh`;
  const ones = x % 10;
  return ones === 0 ? head : `${head} ${ONES[ones]}`;
}

export function spokenFraction(f: Fraction): string {
  if (f.n === 0) return terbilang(0);
  if (f.d === 1) return terbilang(f.n);
  if (f.n === 1 && f.d === 2) return 'setengah';
  const denominator = terbilang(f.d);
  if (f.n === 1) return `seper${denominator}`;
  return `${terbilang(f.n)} per${denominator}`;
}

export function spokenMixed(whole: number, rest: Fraction): string {
  if (rest.n === 0) return terbilang(whole);
  if (whole === 0) return spokenFraction(rest);
  return `${terbilang(whole)} ${spokenFraction(rest)}`;
}
