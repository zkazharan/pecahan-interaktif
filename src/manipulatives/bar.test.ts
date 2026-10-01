import { describe, expect, it } from 'vitest';
import { frac } from '../lib/fraction';
import { BAR, hitBox, normalizeStacking, pieceWidth, piecePosition, rowY, stackNote, viewHeight, type BarRow } from './bar';

const ROWS: BarRow[] = [
  { id: 'a', value: frac(1, 3), color: 'var(--frac-1)' },
  { id: 'b', value: frac(1, 4), color: 'var(--frac-2)' },
];

describe('bar geometry', () => {
  it('stacks rows top to bottom', () => {
    expect(rowY(0)).toBe(BAR.top);
    expect(rowY(1)).toBe(BAR.top + BAR.rowHeight + BAR.gap);
    expect(viewHeight(2)).toBe(rowY(1) + BAR.rowHeight + 20);
  });

  it('sizes pieces by value', () => {
    expect(pieceWidth(frac(1, 4))).toBe(205);
    expect(pieceWidth(frac(2, 4))).toBe(410);
  });

  it('keeps unstacked pieces at home', () => {
    expect(piecePosition(ROWS, 'a', null)).toEqual({ x: BAR.x0, y: rowY(0) });
  });

  it('lifts a stacked piece onto the other row', () => {
    expect(piecePosition(ROWS, 'a', { pieceOf: 'a', onto: 'b' })).toEqual({ x: BAR.x0 + 8, y: rowY(1) - 18 });
    expect(piecePosition(ROWS, 'b', { pieceOf: 'a', onto: 'b' })).toEqual({ x: BAR.x0, y: rowY(1) });
  });

  it('ignores stacking onto a missing row', () => {
    expect(piecePosition(ROWS, 'a', { pieceOf: 'a', onto: 'zzz' })).toEqual({ x: BAR.x0, y: rowY(0) });
  });
});

describe('normalizeStacking', () => {
  it('turns a drop on the own row into no stacking', () => {
    expect(normalizeStacking({ pieceOf: 'a', onto: 'a' })).toBeNull();
    expect(normalizeStacking({ pieceOf: 'a', onto: 'b' })).toEqual({ pieceOf: 'a', onto: 'b' });
  });
});

describe('stackNote', () => {
  it('says how the stacked piece compares', () => {
    expect(stackNote(ROWS, { pieceOf: 'a', onto: 'b' })).toBe('lebih panjang!');
    expect(stackNote(ROWS, { pieceOf: 'b', onto: 'a' })).toBe('lebih pendek!');
    const equal: BarRow[] = [ROWS[0], { id: 'c', value: frac(2, 6), color: 'x' }];
    expect(stackNote(equal, { pieceOf: 'a', onto: 'c' })).toBe('pas sama!');
    expect(stackNote(ROWS, null)).toBe('');
  });
});

describe('hitBox', () => {
  it('equals the piece box when there is no scaling', () => {
    expect(hitBox(frac(1, 4), 1000)).toEqual({ x: 0, y: 0, width: 205, height: BAR.rowHeight });
    expect(hitBox(frac(1, 4), 0)).toEqual({ x: 0, y: 0, width: 205, height: BAR.rowHeight });
  });

  it('grows to a 48 px touch target on a small screen', () => {
    const box = hitBox(frac(1, 12), 360);
    expect(box.width).toBeGreaterThanOrEqual(48 / 0.36 - 0.001);
    expect(box.height).toBeGreaterThanOrEqual(48 / 0.36 - 0.001);
    expect(box.x + box.width / 2).toBeCloseTo(pieceWidth(frac(1, 12)) / 2);
    expect(box.y + box.height / 2).toBeCloseTo(BAR.rowHeight / 2);
  });

  it('keeps pieces that are already large enough', () => {
    expect(hitBox(frac(1, 2), 360)).toMatchObject({ x: 0, width: 410 });
  });
});
