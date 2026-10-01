export type Fraction = { readonly n: number; readonly d: number };

export function frac(n: number, d: number): Fraction {
  if (!Number.isInteger(n) || !Number.isInteger(d)) throw new RangeError(`not integers: ${n}/${d}`);
  if (d <= 0) throw new RangeError(`denominator must be positive: ${d}`);
  if (n < 0) throw new RangeError(`numerator must be non-negative: ${n}`);
  return { n, d };
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

export function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

export function simplify(f: Fraction): Fraction {
  if (f.n === 0) return { n: 0, d: 1 };
  const g = gcd(f.n, f.d);
  return { n: f.n / g, d: f.d / g };
}

export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
}

export function equivalent(a: Fraction, b: Fraction): boolean {
  return compare(a, b) === 0;
}

export function sameForm(a: Fraction, b: Fraction): boolean {
  return a.n === b.n && a.d === b.d;
}

export function add(a: Fraction, b: Fraction): Fraction {
  const d = lcm(a.d, b.d);
  return { n: a.n * (d / a.d) + b.n * (d / b.d), d };
}

export function subtract(a: Fraction, b: Fraction): Fraction {
  if (compare(a, b) < 0) throw new RangeError('negative result');
  const d = lcm(a.d, b.d);
  return { n: a.n * (d / a.d) - b.n * (d / b.d), d };
}

export function toMixed(f: Fraction): { whole: number; rest: Fraction } {
  return { whole: Math.floor(f.n / f.d), rest: { n: f.n % f.d, d: f.d } };
}

export function toNumber(f: Fraction): number {
  return f.n / f.d;
}

export function formatFraction(f: Fraction): string {
  return `${f.n}/${f.d}`;
}

export function parseFraction(text: string): Fraction | null {
  const match = /^(\d{1,3})\/(\d{1,3})$/.exec(text.trim());
  if (!match) return null;
  const n = Number(match[1]);
  const d = Number(match[2]);
  if (d === 0) return null;
  return { n, d };
}
