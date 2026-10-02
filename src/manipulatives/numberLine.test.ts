import { describe, expect, it } from 'vitest';
import { frac } from '../lib/fraction';
import { LINE, staggerRows, tickCount, tickFor, tickIds, tickIndexOf, tickValue, tickX } from './numberLine';

describe('ticks', () => {
  it('counts and names every tick including both ends', () => {
    expect(tickCount(1, 4)).toBe(5);
    expect(tickCount(3, 2)).toBe(7);
    expect(tickIds(1, 2)).toEqual(['t0', 't1', 't2']);
  });

  it('parses tick ids', () => {
    expect(tickIndexOf('t12')).toBe(12);
    expect(tickIndexOf('pile')).toBe(-1);
    expect(tickIndexOf('t')).toBe(-1);
  });

  it('places ticks evenly between the ends', () => {
    expect(tickX(0, 1, 4)).toBe(LINE.x0);
    expect(tickX(4, 1, 4)).toBe(LINE.x0 + LINE.width);
    expect(tickX(3, 3, 2)).toBe(LINE.x0 + LINE.width / 2);
  });

  it('maps values to ticks and back', () => {
    expect(tickValue(3, 4)).toEqual({ n: 3, d: 4 });
    expect(tickFor(frac(3, 4), 4)).toBe(3);
    expect(tickFor(frac(1, 3), 12)).toBe(4);
    expect(tickFor(frac(7, 4), 4)).toBe(7);
    expect(tickFor(frac(1, 3), 4)).toBe(-1);
  });
});

describe('staggerRows', () => {
  it('lifts a card that sits close to its neighbour', () => {
    expect(staggerRows([3, 4], 12)).toEqual([0, 1]);
    expect(staggerRows([4, 3], 12)).toEqual([1, 0]);
  });

  it('keeps far-apart cards on the first row', () => {
    expect(staggerRows([0, 12], 12)).toEqual([0, 0]);
    expect(staggerRows([2], 4)).toEqual([0]);
    expect(staggerRows([], 4)).toEqual([]);
  });

  it('alternates rows along a crowded run', () => {
    expect(staggerRows([1, 2, 3], 12)).toEqual([0, 1, 0]);
  });
});

describe('tick guards', () => {
  it('rejects a line with no length or no divisions', () => {
    expect(() => tickCount(0, 4)).toThrow(RangeError);
    expect(() => tickCount(1, 0)).toThrow(RangeError);
    expect(() => tickX(0, 0, 4)).toThrow(RangeError);
    expect(() => tickX(0, 1, 0)).toThrow(RangeError);
    expect(() => tickIds(0, 2)).toThrow(RangeError);
  });
});
