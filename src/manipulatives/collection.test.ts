import { describe, expect, it } from 'vitest';
import {
  MARBLE_TRAY,
  bagId,
  bagMarbleId,
  canMoveMarble,
  dealAll,
  isFairShare,
  marbleSource,
  moveMarble,
  startCollection,
  takenCount,
  trayMarbleId,
} from './collection';

describe('collection', () => {
  it('starts with every marble in the tray', () => {
    expect(startCollection(12, 3)).toEqual({ bags: [0, 0, 0], tray: 12 });
  });

  it('rejects invalid sizes', () => {
    expect(() => startCollection(25, 3)).toThrow(RangeError);
    expect(() => startCollection(12, 7)).toThrow(RangeError);
    expect(() => startCollection(12, 0)).toThrow(RangeError);
    expect(() => startCollection(-1, 2)).toThrow(RangeError);
  });

  it('knows where a dragged marble comes from', () => {
    expect(marbleSource(trayMarbleId(4))).toBe(MARBLE_TRAY);
    expect(marbleSource(bagMarbleId(2))).toBe(bagId(2));
  });

  it('moves one marble at a time with no bag limit', () => {
    let state = startCollection(3, 2);
    state = moveMarble(state, MARBLE_TRAY, bagId(0));
    state = moveMarble(state, MARBLE_TRAY, bagId(0));
    state = moveMarble(state, MARBLE_TRAY, bagId(0));
    expect(state).toEqual({ bags: [3, 0], tray: 0 });
    state = moveMarble(state, bagId(0), bagId(1));
    expect(state).toEqual({ bags: [2, 1], tray: 0 });
    state = moveMarble(state, bagId(1), MARBLE_TRAY);
    expect(state).toEqual({ bags: [2, 0], tray: 1 });
  });

  it('refuses moves from empty places, to the same place or to unknown bags', () => {
    const state = startCollection(2, 2);
    expect(canMoveMarble(state, bagId(0), bagId(1))).toBe(false);
    expect(canMoveMarble(state, MARBLE_TRAY, MARBLE_TRAY)).toBe(false);
    expect(canMoveMarble(state, MARBLE_TRAY, bagId(5))).toBe(false);
    expect(moveMarble(state, bagId(0), bagId(1))).toBe(state);
  });

  it('deals every marble evenly', () => {
    expect(dealAll(12, 3)).toEqual({ bags: [4, 4, 4], tray: 0 });
    expect(() => dealAll(10, 3)).toThrow(RangeError);
  });

  it('calls a share fair only when the tray is empty and bags match', () => {
    expect(isFairShare({ bags: [4, 4, 4], tray: 0 })).toBe(true);
    expect(isFairShare({ bags: [5, 4, 3], tray: 0 })).toBe(false);
    expect(isFairShare({ bags: [3, 3, 3], tray: 3 })).toBe(false);
  });

  it('counts taken bags', () => {
    expect(takenCount([true, false, true])).toBe(2);
  });
});
