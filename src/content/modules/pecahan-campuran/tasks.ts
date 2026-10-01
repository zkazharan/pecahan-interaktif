import { frac, toMixed, type Fraction } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { emptyPlacement, type Card, type Placement } from '../../../manipulatives/cardSlots';
import { tickId, tickIds } from '../../../manipulatives/numberLine';
import { fillGreedy, fullPlates, startPlates, type PlatesState } from '../../../manipulatives/plates';
import type { CheckResult } from '../../types';
import { plateCountFor } from './params';

export type GroupTask = { kind: 'group'; value: Fraction };
export type LineTask = { kind: 'line'; card: Card; max: number; perUnit: number };
export type MixedTask = { kind: 'mixed'; value: Fraction; cards: Card[]; correctId: string };
export type CampuranTask = GroupTask | LineTask | MixedTask;
export type CampuranAnswer = { plates: PlatesState; placement: Placement };

export const NO_PLATES: PlatesState = { plates: [], tray: 0 };

export const CONCLUSION =
  'Pecahan yang pembilangnya lebih besar dari penyebut bisa ditulis sebagai bilangan utuh dan sisa pecahan.';

function improper(rng: Rng, dMin: number, dMax: number, wholes: number): Fraction {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const d = rng.int(dMin, dMax);
    const n = rng.int(d + 1, wholes * d - 1);
    if (n % d !== 0) return frac(n, d);
  }
  throw new Error('could not generate an improper fraction');
}

function mixedCard(id: string, whole: number, rest: Fraction): Card {
  return { id, value: frac(whole * rest.d + rest.n, rest.d), face: { kind: 'mixed' } };
}

function mixedTask(value: Fraction, rng: Rng): MixedTask {
  const { whole, rest } = toMixed(value);
  const flipped = rest.d - rest.n === rest.n ? frac(rest.n, rest.d + 1) : frac(rest.d - rest.n, rest.d);
  const shuffled = rng.shuffle([
    mixedCard('right', whole, rest),
    mixedCard('whole', whole === 1 ? 2 : 1, rest),
    mixedCard('flip', whole, flipped),
  ]);
  return {
    kind: 'mixed',
    value,
    correctId: `c${shuffled.findIndex((card) => card.id === 'right')}`,
    cards: shuffled.map((card, i) => ({ ...card, id: `c${i}` })),
  };
}

export function generateTasks(rng: Rng): CampuranTask[] {
  const lineValue = improper(rng, 2, 4, 3);
  return [
    { kind: 'group', value: improper(rng, 2, 6, 2) },
    { kind: 'line', card: { id: 'c0', value: lineValue }, max: 3, perUnit: lineValue.d },
    mixedTask(improper(rng, 2, 6, 3), rng),
    { kind: 'group', value: improper(rng, 3, 6, 3) },
    mixedTask(improper(rng, 2, 8, 3), rng),
  ];
}

export function emptyAnswer(task: CampuranTask): CampuranAnswer {
  if (task.kind === 'group') return { plates: startPlates(task.value.n, plateCountFor(task.value)), placement: {} };
  if (task.kind === 'line') return { plates: NO_PLATES, placement: emptyPlacement(tickIds(task.max, task.perUnit)) };
  return { plates: NO_PLATES, placement: emptyPlacement(['pilihan']) };
}

export function isComplete(task: CampuranTask, answer: CampuranAnswer): boolean {
  if (task.kind === 'group') return answer.plates.tray === 0;
  if (task.kind === 'line') return Object.values(answer.placement).includes(task.card.id);
  return answer.placement.pilihan != null;
}

export function solution(task: CampuranTask): CampuranAnswer {
  if (task.kind === 'group') {
    return { plates: fillGreedy(task.value.n, plateCountFor(task.value), task.value.d), placement: {} };
  }
  if (task.kind === 'line') {
    return {
      plates: NO_PLATES,
      placement: { ...emptyPlacement(tickIds(task.max, task.perUnit)), [tickId(task.card.value.n)]: task.card.id },
    };
  }
  return { plates: NO_PLATES, placement: { pilihan: task.correctId } };
}

export function checkTask(task: CampuranTask, answer: CampuranAnswer): CheckResult {
  if (task.kind === 'group') {
    const { n, d } = task.value;
    const correct = answer.plates.tray === 0 && fullPlates(answer.plates, d) === Math.floor(n / d);
    return correct ? { correct, hint: '' } : { correct, hint: 'Penuhi satu piring dulu sebelum pindah ke piring berikutnya.' };
  }
  if (task.kind === 'line') {
    const { n, d } = task.card.value;
    const correct = answer.placement[tickId(n)] === task.card.id;
    return correct ? { correct, hint: '' } : { correct, hint: `Setiap angka utuh dibagi ${d}. Hitung ${n} langkah dari 0.` };
  }
  const correct = answer.placement.pilihan === task.correctId;
  return correct ? { correct, hint: '' } : { correct, hint: 'Hitung piring yang penuh, lalu sisa potongannya.' };
}
