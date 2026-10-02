import { describe, expect, it } from 'vitest';
import { frac } from '../lib/fraction';
import {
  BAR,
  barUnits,
  cutOf,
  dividerXs,
  hitBox,
  labelMetrics,
  maxCut,
  MAX_PARTS,
  normalizeStacking,
  notePlacement,
  pieceDividerXs,
  pieceWidth,
  piecePosition,
  rowY,
  shownValue,
  stackNote,
  unitWidth,
  viewHeight,
  visibleTranslate,
  wholeXs,
  wholesOf,
  type BarRow,
} from './bar';

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
  const sized = (width: number, height: number, rows = 1) => ({ width, height, rows });

  it('equals the piece box when there is no scaling', () => {
    expect(hitBox(frac(1, 4), sized(1000, 1000))).toEqual({ x: 0, y: 0, width: 205, height: BAR.rowHeight });
    expect(hitBox(frac(1, 4), sized(0, 0))).toEqual({ x: 0, y: 0, width: 205, height: BAR.rowHeight });
  });

  it('grows to a 48 px touch target on a small screen', () => {
    const box = hitBox(frac(1, 12), sized(360, 1000));
    expect(box.width).toBeGreaterThanOrEqual(48 / 0.36 - 0.001);
    expect(box.height).toBeGreaterThanOrEqual(48 / 0.36 - 0.001);
    expect(box.x + box.width / 2).toBeCloseTo(pieceWidth(frac(1, 12)) / 2);
    expect(box.y + box.height / 2).toBeCloseTo(BAR.rowHeight / 2);
  });

  it('keeps pieces that are already large enough', () => {
    expect(hitBox(frac(1, 2), sized(360, 1000))).toMatchObject({ x: 0, width: 410 });
  });

  it('uses the smaller scale when the svg is letterboxed by its height', () => {
    const rows = 2;
    const height = viewHeight(rows);
    const letterboxed = hitBox(frac(1, 12), sized(1000, height * 0.2, rows));
    const scale = 0.2;
    expect(letterboxed.width).toBeGreaterThanOrEqual(48 / scale - 0.001);
    expect(letterboxed.height).toBeGreaterThanOrEqual(48 / scale - 0.001);
    const wide = hitBox(frac(1, 12), sized(1000, height, rows));
    expect(wide.width).toBeLessThan(letterboxed.width);
  });

  it('ignores an unmeasured height', () => {
    expect(hitBox(frac(1, 12), sized(360, 0))).toEqual(hitBox(frac(1, 12), sized(360, 1000)));
  });
});

describe('count guards', () => {
  it('clamps cut and wholes to whole numbers of at least one', () => {
    const row = (extra: Partial<BarRow>): BarRow => ({ id: 'r', value: frac(1, 3), color: 'x', ...extra });
    expect(cutOf(row({}))).toBe(1);
    expect(cutOf(row({ cut: 0 }))).toBe(1);
    expect(cutOf(row({ cut: -2 }))).toBe(1);
    expect(cutOf(row({ cut: 2.9 }))).toBe(2);
    expect(cutOf(row({ cut: Number.NaN }))).toBe(1);
    expect(wholesOf(row({ wholes: 0 }))).toBe(1);
    expect(wholesOf(row({ wholes: 3.5 }))).toBe(3);
  });

  it('does not throw for a row with zero wholes', () => {
    const row: BarRow = { id: 'r', value: frac(1, 3), color: 'x', wholes: 0, cut: 0 };
    expect(dividerXs(row, 1)).toEqual(dividerXs({ ...row, wholes: 1, cut: 1 }, 1));
    expect(wholeXs(row, 1)).toEqual([]);
    expect(barUnits([row])).toBe(1);
    expect(shownValue(row)).toEqual({ n: 1, d: 3 });
  });
});

describe('visibleTranslate', () => {
  it('reads the offset out of a computed matrix', () => {
    expect(visibleTranslate('matrix(1, 0, 0, 1, 12.5, -4)')).toEqual({ x: 12.5, y: -4 });
    expect(visibleTranslate('matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,30,40,0,1)')).toEqual({ x: 30, y: 40 });
  });

  it('gives null when there is nothing to read', () => {
    expect(visibleTranslate('none')).toBeNull();
    expect(visibleTranslate('')).toBeNull();
  });
});

describe('notePlacement', () => {
  const NOTE = 'lebih panjang!';

  it('puts the note after a short piece', () => {
    const position = piecePosition(ROWS, 'a', { pieceOf: 'a', onto: 'b' });
    const placed = notePlacement(position, pieceWidth(frac(1, 3)), NOTE);
    expect(placed.anchor).toBe('start');
    expect(placed.x).toBe(position.x + pieceWidth(frac(1, 3)) + 18);
  });

  it('tucks the note inside a long piece so it stays clear of the label column', () => {
    for (const value of [frac(11, 12), frac(1, 1), frac(2, 2)]) {
      const rows: BarRow[] = [{ id: 'a', value, color: 'x' }, ROWS[1]];
      const position = piecePosition(rows, 'a', { pieceOf: 'a', onto: 'b' });
      const placed = notePlacement(position, pieceWidth(value), NOTE);
      expect(placed.anchor).toBe('end');
      expect(placed.x).toBeLessThanOrEqual(BAR.labelX);
      expect(placed.y).toBeGreaterThan(position.y);
      expect(placed.y).toBeLessThan(position.y + BAR.rowHeight + 20);
    }
  });
});

describe('re-cut and wholes', () => {
  const third: BarRow = { id: 'a', value: frac(1, 3), color: 'x' };

  it('shows the re-cut form', () => {
    expect(shownValue({ ...third, cut: 2 })).toEqual({ n: 2, d: 6 });
    expect(shownValue(third)).toEqual({ n: 1, d: 3 });
  });

  it('draws a divider between every small part', () => {
    expect(dividerXs(third, 1)).toHaveLength(2);
    expect(dividerXs({ ...third, cut: 2 }, 1)).toHaveLength(5);
    expect(dividerXs({ ...third, cut: 2 }, 1)[0]).toBeCloseTo(BAR.width / 6, 3);
  });

  it('keeps one unit the same length when a row spans two wholes', () => {
    const two: BarRow = { id: 'r', value: frac(5, 4), color: 'x', wholes: 2 };
    expect(barUnits([third, two])).toBe(2);
    expect(unitWidth(2)).toBe(BAR.width / 2);
    expect(pieceWidth(frac(1, 2), 2)).toBe(BAR.width / 4);
    expect(wholeXs(two, 2)).toEqual([BAR.width / 2]);
    expect(dividerXs(two, 2)).toHaveLength(6);
    expect(dividerXs(two, 2)).not.toContain(BAR.width / 2);
  });

  it('marks the small parts inside the coloured piece', () => {
    expect(pieceDividerXs({ ...third, cut: 3 }, 1)).toHaveLength(2);
    expect(pieceDividerXs(third, 1)).toEqual([]);
  });
});

describe('maxCut', () => {
  it('keeps every whole at 24 parts or fewer', () => {
    expect(MAX_PARTS).toBe(24);
    expect(maxCut(2)).toBe(6);
    expect(maxCut(4)).toBe(6);
    expect(maxCut(5)).toBe(4);
    expect(maxCut(8)).toBe(3);
  });
});

describe('labelMetrics', () => {
  it('keeps the base size when the bar is wide', () => {
    expect(labelMetrics(1000)).toEqual({ fontSize: 36, gapAbove: 8, gapBelow: 34, half: 24 });
    expect(labelMetrics(1819).fontSize).toBe(36);
    expect(labelMetrics(0).fontSize).toBe(36);
  });

  it('grows so the rendered label is at least 18 px on a phone', () => {
    const phone = labelMetrics(332);
    expect((phone.fontSize * 332) / BAR.viewWidth).toBeGreaterThanOrEqual(18);
    expect(phone.gapBelow).toBeGreaterThan(34);
    expect(phone.half).toBeGreaterThan(24);
  });

  it('stays inside the label column on very narrow bars', () => {
    const tiny = labelMetrics(100);
    expect(tiny.fontSize).toBeLessThanOrEqual(64);
    expect(BAR.labelX + tiny.half).toBeLessThanOrEqual(BAR.viewWidth);
  });
});
