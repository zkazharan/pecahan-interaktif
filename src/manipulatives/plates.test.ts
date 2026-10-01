import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/random';
import {
  TRAY,
  canMove,
  fillGreedy,
  fullPlates,
  movePiece,
  plateId,
  plateItemId,
  sourceOf,
  startPlates,
  totalPieces,
  trayItemId,
} from './plates';

describe('startPlates', () => {
  it('puts every piece on the tray', () => {
    expect(startPlates(5, 2)).toEqual({ plates: [0, 0], tray: 5 });
  });

  it('rejects negative or fractional counts', () => {
    expect(() => startPlates(-1, 2)).toThrow(RangeError);
    expect(() => startPlates(3, 0)).toThrow(RangeError);
    expect(() => startPlates(2.5, 1)).toThrow(RangeError);
  });
});

describe('movePiece', () => {
  const start = startPlates(5, 2);

  it('moves pieces from the tray to a plate and back', () => {
    const one = movePiece(start, TRAY, plateId(0), 4);
    expect(one).toEqual({ plates: [1, 0], tray: 4 });
    expect(movePiece(one, plateId(0), TRAY, 4)).toEqual(start);
  });

  it('moves pieces between plates', () => {
    const one = movePiece(start, TRAY, plateId(0), 4);
    expect(movePiece(one, plateId(0), plateId(1), 4)).toEqual({ plates: [0, 1], tray: 4 });
  });

  it('refuses a full plate, an empty source, the same place and unknown places', () => {
    const full = { plates: [4, 0], tray: 1 };
    expect(movePiece(full, TRAY, plateId(0), 4)).toBe(full);
    expect(canMove(full, TRAY, plateId(0), 4)).toBe(false);
    expect(movePiece(full, plateId(1), TRAY, 4)).toBe(full);
    expect(movePiece(full, TRAY, TRAY, 4)).toBe(full);
    expect(movePiece(full, TRAY, plateId(7), 4)).toBe(full);
    expect(movePiece(full, 'nope', plateId(1), 4)).toBe(full);
  });

  it('never loses a piece or overfills a plate over many random moves', () => {
    const rng = createRng(2026);
    const places = [TRAY, plateId(0), plateId(1), plateId(2)];
    let state = startPlates(9, 3);
    const problems: string[] = [];
    for (let i = 0; i < 5000; i++) {
      state = movePiece(state, rng.pick(places), rng.pick(places), 4);
      if (totalPieces(state) !== 9 || state.plates.some((c) => c < 0 || c > 4) || state.tray < 0) problems.push(JSON.stringify(state));
    }
    expect(problems).toEqual([]);
  });
});

describe('helpers', () => {
  it('counts full plates', () => {
    expect(fullPlates({ plates: [4, 1, 4], tray: 0 }, 4)).toBe(2);
  });

  it('fills plates one at a time', () => {
    expect(fillGreedy(5, 2, 4)).toEqual({ plates: [4, 1], tray: 0 });
    expect(fillGreedy(5, 1, 4)).toEqual({ plates: [4], tray: 1 });
    expect(fillGreedy(8, 2, 4)).toEqual({ plates: [4, 4], tray: 0 });
  });

  it('knows where a dragged piece came from', () => {
    expect(sourceOf(trayItemId(3))).toBe(TRAY);
    expect(sourceOf(plateItemId(1, 2))).toBe(plateId(1));
  });
});
