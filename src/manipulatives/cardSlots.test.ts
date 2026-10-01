import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/random';
import { PILE, emptyPlacement, pileCards, placeCard, slotOf } from './cardSlots';

const SLOTS = ['s1', 's2', 's3'];
const CARDS = ['c0', 'c1', 'c2'];

describe('placeCard', () => {
  it('moves a pile card into an empty slot', () => {
    const p = placeCard(emptyPlacement(SLOTS), 'c0', 's1');
    expect(p).toEqual({ s1: 'c0', s2: null, s3: null });
    expect(pileCards(CARDS, p)).toEqual(['c1', 'c2']);
  });

  it('sends the old card back to the pile when a pile card takes its slot', () => {
    const p = placeCard(placeCard(emptyPlacement(SLOTS), 'c0', 's1'), 'c1', 's1');
    expect(p.s1).toBe('c1');
    expect(pileCards(CARDS, p)).toEqual(['c0', 'c2']);
  });

  it('swaps two cards that are both in slots', () => {
    let p = placeCard(emptyPlacement(SLOTS), 'c0', 's1');
    p = placeCard(p, 'c1', 's2');
    p = placeCard(p, 'c0', 's2');
    expect(p).toEqual({ s1: 'c1', s2: 'c0', s3: null });
  });

  it('moves a slotted card into an empty slot', () => {
    const p = placeCard(placeCard(emptyPlacement(SLOTS), 'c0', 's1'), 'c0', 's3');
    expect(p).toEqual({ s1: null, s2: null, s3: 'c0' });
  });

  it('returns a card to the pile', () => {
    const p = placeCard(placeCard(emptyPlacement(SLOTS), 'c0', 's1'), 'c0', PILE);
    expect(p).toEqual(emptyPlacement(SLOTS));
  });

  it('leaves a drop on the same slot unchanged', () => {
    const p = placeCard(emptyPlacement(SLOTS), 'c0', 's1');
    expect(placeCard(p, 'c0', 's1')).toEqual(p);
  });

  it('rejects unknown slots', () => {
    expect(() => placeCard(emptyPlacement(SLOTS), 'c0', 'nope')).toThrow(RangeError);
  });

  it('never loses or duplicates a card over many random moves', () => {
    const rng = createRng(2026);
    let p = emptyPlacement(SLOTS);
    for (let i = 0; i < 2000; i++) {
      p = placeCard(p, rng.pick(CARDS), rng.pick([...SLOTS, PILE]));
      const placed = Object.values(p).filter((v): v is string => v !== null);
      expect(new Set(placed).size).toBe(placed.length);
      expect([...placed, ...pileCards(CARDS, p)].sort()).toEqual(CARDS);
    }
  });
});

describe('slotOf', () => {
  it('finds the slot holding a card', () => {
    const p = placeCard(emptyPlacement(SLOTS), 'c2', 's2');
    expect(slotOf(p, 'c2')).toBe('s2');
    expect(slotOf(p, 'c0')).toBeNull();
  });
});
