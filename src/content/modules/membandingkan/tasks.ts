import { compare, equivalent, frac, type Fraction } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { emptyPlacement, type Card, type Placement, type Slot } from '../../../manipulatives/cardSlots';
import type { CheckResult } from '../../types';

export type CompareTask = { kind: 'compare'; cards: Card[] };
export type OrderTask = { kind: 'order'; cards: Card[] };
export type MembandingkanTask = CompareTask | OrderTask;

export const COMPARE_SLOTS: Slot[] = [{ id: 'besar', label: 'Yang lebih besar' }];

export const ORDER_SLOTS: Slot[] = [
  { id: 's1', label: 'Paling kecil' },
  { id: 's2', label: 'Tengah' },
  { id: 's3', label: 'Paling besar' },
];

export const CONCLUSION = 'Kalau pembilangnya sama, penyebut yang lebih besar berarti potongannya lebih kecil.';

export function slotsFor(task: MembandingkanTask): Slot[] {
  return task.kind === 'compare' ? COMPARE_SLOTS : ORDER_SLOTS;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function unitFractions(rng: Rng, count: number): Fraction[] {
  return rng
    .shuffle(range(2, 12))
    .slice(0, count)
    .map((d) => frac(1, d));
}

function nonUnitFractions(rng: Rng, count: number): Fraction[] {
  const picked: Fraction[] = [];
  for (let attempt = 0; picked.length < count; attempt++) {
    if (attempt > 1000) throw new Error('could not generate distinct fractions');
    const d = rng.int(3, 12);
    const candidate = frac(rng.int(2, d - 1), d);
    if (!picked.some((f) => equivalent(f, candidate))) picked.push(candidate);
  }
  return picked;
}

function toCards(values: Fraction[]): Card[] {
  return values.map((value, i) => ({ id: `c${i}`, value }));
}

export function generateTasks(rng: Rng): MembandingkanTask[] {
  return [
    { kind: 'compare', cards: toCards(unitFractions(rng, 2)) },
    { kind: 'order', cards: toCards(unitFractions(rng, 3)) },
    { kind: 'compare', cards: toCards(nonUnitFractions(rng, 2)) },
    { kind: 'order', cards: toCards(nonUnitFractions(rng, 3)) },
    { kind: 'order', cards: toCards(nonUnitFractions(rng, 3)) },
  ];
}

export function emptyAnswer(task: MembandingkanTask): Placement {
  return emptyPlacement(slotsFor(task).map((slot) => slot.id));
}

export function isComplete(task: MembandingkanTask, answer: Placement): boolean {
  return slotsFor(task).every((slot) => answer[slot.id] != null);
}

export function solution(task: MembandingkanTask): Placement {
  const sorted = [...task.cards].sort((x, y) => compare(x.value, y.value));
  if (task.kind === 'compare') return { besar: sorted[sorted.length - 1].id };
  return { s1: sorted[0].id, s2: sorted[1].id, s3: sorted[2].id };
}

export function checkTask(task: MembandingkanTask, answer: Placement): CheckResult {
  const expected = solution(task);
  const correct = slotsFor(task).every((slot) => answer[slot.id] === expected[slot.id]);
  if (correct) return { correct: true, hint: '' };
  return {
    correct: false,
    hint:
      task.kind === 'compare'
        ? 'Coba tumpuk pitanya. Mana yang lebih panjang?'
        : 'Bandingkan dua-dua dulu. Buka pitanya kalau bingung.',
  };
}
