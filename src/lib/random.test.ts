import { describe, expect, it } from 'vitest';
import { createRng } from './random';

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('stays in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('int covers both bounds and nothing outside', () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 10_000; i++) seen.add(rng.int(2, 12));
    expect([...seen].sort((x, y) => x - y)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('int rejects an empty range', () => {
    expect(() => createRng(1).int(5, 4)).toThrow(RangeError);
  });

  it('shuffle returns a permutation without touching the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = createRng(9).shuffle(input);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('pick rejects an empty list', () => {
    expect(() => createRng(1).pick([])).toThrow(RangeError);
  });
});
