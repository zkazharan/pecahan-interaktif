import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/random';
import { CIRCLE, equalSlices, guidePoints, isEqualCut, sliceAngles, unequalSlices, wedgePath } from './circle';

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

describe('equalSlices', () => {
  it('splits the whole into n equal parts', () => {
    expect(equalSlices(4)).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(equalSlices(1)).toEqual([1]);
    expect(isEqualCut(equalSlices(7))).toBe(true);
  });

  it('rejects counts below one or non-integers', () => {
    expect(() => equalSlices(0)).toThrow(RangeError);
    expect(() => equalSlices(2.5)).toThrow(RangeError);
  });
});

describe('unequalSlices', () => {
  it('always gives n visibly unequal slices that add up to one', () => {
    const problems: string[] = [];
    for (let seed = 1; seed <= 1000; seed++) {
      const rng = createRng(seed);
      const n = rng.int(2, 12);
      const slices = unequalSlices(rng, n);
      const ratio = Math.max(...slices) / Math.min(...slices);
      if (slices.length !== n || Math.abs(sum(slices) - 1) > 1e-9 || isEqualCut(slices) || ratio < 1.6) {
        problems.push(`seed ${seed}: ${slices.join(',')}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('rejects fewer than two slices', () => {
    expect(() => unequalSlices(createRng(1), 1)).toThrow(RangeError);
  });
});

describe('sliceAngles', () => {
  it('starts at the top and goes all the way round', () => {
    const arcs = sliceAngles(equalSlices(4));
    expect(arcs[0].start).toBeCloseTo(-Math.PI / 2);
    expect(arcs[3].end).toBeCloseTo((3 * Math.PI) / 2);
    expect(arcs[1].start).toBeCloseTo(arcs[0].end);
  });
});

describe('wedgePath', () => {
  it('draws a quarter wedge with a small arc', () => {
    const [first] = sliceAngles(equalSlices(4));
    const d = wedgePath(first.start, first.end);
    expect(d.startsWith('M 100 100 L 100 10 A 90 90 0 0 1 190 100')).toBe(true);
  });

  it('uses the large-arc flag for slices over half', () => {
    const [big] = sliceAngles([0.75, 0.25]);
    expect(wedgePath(big.start, big.end)).toContain('A 90 90 0 1 1');
  });

  it('draws a full circle for a single slice', () => {
    const [whole] = sliceAngles([1]);
    expect(wedgePath(whole.start, whole.end)).toBe('M 100 10 A 90 90 0 1 1 100 190 A 90 90 0 1 1 100 10 Z');
  });
});

describe('guidePoints', () => {
  it('starts at the top and goes clockwise', () => {
    const [top, right, bottom, left] = guidePoints(4);
    expect(top.x).toBeCloseTo(CIRCLE.cx);
    expect(top.y).toBeCloseTo(CIRCLE.cy - CIRCLE.r);
    expect(right.x).toBeCloseTo(CIRCLE.cx + CIRCLE.r);
    expect(bottom.y).toBeCloseTo(CIRCLE.cy + CIRCLE.r);
    expect(left.x).toBeCloseTo(CIRCLE.cx - CIRCLE.r);
  });

  it('rounds a fractional count down', () => {
    expect(guidePoints(4.9)).toHaveLength(4);
    expect(guidePoints(1.9)).toEqual([]);
  });

  it('gives no guide for a whole circle', () => {
    expect(guidePoints(1)).toEqual([]);
    expect(guidePoints(0)).toEqual([]);
  });
});
