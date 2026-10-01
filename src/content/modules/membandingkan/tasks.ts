import { compare, equivalent, frac, lcm, type Fraction } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { emptyPlacement, type Card, type Placement, type Slot } from '../../../manipulatives/cardSlots';
import { tickFor, tickId, tickIds } from '../../../manipulatives/numberLine';
import type { CheckResult } from '../../types';
import { range } from '../common';

export type CompareTask = { kind: 'compare'; cards: Card[] };
export type OrderTask = { kind: 'order'; cards: Card[] };
export type LineTask = { kind: 'line'; cards: Card[]; perUnit: number };
export type MembandingkanTask = CompareTask | OrderTask | LineTask;

export const COMPARE_SLOTS: Slot[] = [{ id: 'besar', label: 'Yang lebih besar' }];

export const ORDER_SLOTS: Slot[] = [
  { id: 's1', label: 'Paling kecil' },
  { id: 's2', label: 'Tengah' },
  { id: 's3', label: 'Paling besar' },
];

export const CONCLUSION = 'Kalau pembilangnya sama, penyebut yang lebih besar berarti potongannya lebih kecil.';

export function slotsFor(task: CompareTask | OrderTask): Slot[] {
  return task.kind === 'compare' ? COMPARE_SLOTS : ORDER_SLOTS;
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

function lineTask(rng: Rng): LineTask {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const d1 = rng.int(2, 6);
    const d2 = rng.int(2, 6);
    const perUnit = lcm(d1, d2);
    if (d1 === d2 || perUnit > 12) continue;
    const a = frac(rng.int(1, d1 - 1), d1);
    const b = frac(rng.int(1, d2 - 1), d2);
    if (equivalent(a, b)) continue;
    return { kind: 'line', cards: toCards([a, b]), perUnit };
  }
  throw new Error('could not generate a number line task');
}

function lineSolution(task: LineTask): Placement {
  const placement: Record<string, string | null> = { ...emptyPlacement(tickIds(1, task.perUnit)) };
  for (const card of task.cards) placement[tickId(tickFor(card.value, task.perUnit))] = card.id;
  return placement;
}

export function generateTasks(rng: Rng): MembandingkanTask[] {
  return [
    { kind: 'compare', cards: toCards(unitFractions(rng, 2)) },
    { kind: 'order', cards: toCards(unitFractions(rng, 3)) },
    { kind: 'compare', cards: toCards(nonUnitFractions(rng, 2)) },
    { kind: 'order', cards: toCards(nonUnitFractions(rng, 3)) },
    lineTask(rng),
  ];
}

export function emptyAnswer(task: MembandingkanTask): Placement {
  if (task.kind === 'line') return emptyPlacement(tickIds(1, task.perUnit));
  return emptyPlacement(slotsFor(task).map((slot) => slot.id));
}

export function isComplete(task: MembandingkanTask, answer: Placement): boolean {
  if (task.kind === 'line') return task.cards.every((card) => Object.values(answer).includes(card.id));
  return slotsFor(task).every((slot) => answer[slot.id] != null);
}

export function solution(task: MembandingkanTask): Placement {
  if (task.kind === 'line') return lineSolution(task);
  const sorted = [...task.cards].sort((x, y) => compare(x.value, y.value));
  if (task.kind === 'compare') return { besar: sorted[sorted.length - 1].id };
  return { s1: sorted[0].id, s2: sorted[1].id, s3: sorted[2].id };
}

export function checkTask(task: MembandingkanTask, answer: Placement): CheckResult {
  if (task.kind === 'line') {
    const correct = task.cards.every((card) => answer[tickId(tickFor(card.value, task.perUnit))] === card.id);
    if (correct) return { correct, hint: '' };
    return { correct, hint: 'Lihat tanda berwarna: setiap kartu punya garis pembaginya sendiri.' };
  }
  const expected = solution(task);
  const correct = slotsFor(task).every((slot) => answer[slot.id] === expected[slot.id]);
  if (correct) return { correct: true, hint: '' };
  return {
    correct: false,
    hint:
      task.kind === 'compare'
        ? 'Lihat pitanya. Mana yang lebih panjang?'
        : 'Bandingkan dua-dua dulu. Buka pitanya kalau bingung.',
  };
}

export function orderDiff(task: OrderTask, answer: Placement): { left: string; right: string } | null {
  const ids = ['s1', 's2', 's3'].map((slot) => answer[slot]);
  const value = (id: string | null) => task.cards.find((card) => card.id === id)?.value;
  for (let i = 0; i < ids.length - 1; i++) {
    const a = value(ids[i]);
    const b = value(ids[i + 1]);
    if (a && b && compare(a, b) > 0) return { left: ids[i]!, right: ids[i + 1]! };
  }
  return null;
}
