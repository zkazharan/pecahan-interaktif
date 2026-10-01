import { frac } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { emptyPlacement, type Card, type Placement, type Slot } from '../../../manipulatives/cardSlots';
import { equalSlices, unequalSlices } from '../../../manipulatives/circle';
import type { CheckResult } from '../../types';

export type SortTask = { kind: 'sort'; card: Card; fair: boolean };
export type CutTask = { kind: 'cut'; target: number };
export type PickTask = { kind: 'pick'; target: number; cards: Card[]; correctId: string };
export type MembagiAdilTask = SortTask | CutTask | PickTask;
export type MembagiAdilAnswer = { placement: Placement; cuts: number };

export const SORT_SLOTS: Slot[] = [
  { id: 'adil', label: 'Dibagi adil' },
  { id: 'tidak', label: 'Tidak adil' },
];

export const CUT_MIN = 1;
export const CUT_MAX = 12;

export const CONCLUSION = 'Pecahan hanya berlaku kalau potongannya sama besar.';

function shapeCard(id: string, slices: number[], shadedCount: number, fair: boolean): Card {
  const count = slices.length;
  const cut = fair ? `martabak dipotong ${count} sama besar` : `martabak dipotong ${count} tidak sama besar`;
  return {
    id,
    value: frac(shadedCount, count),
    face: {
      kind: 'shape',
      slices,
      shaded: slices.map((_, i) => i < shadedCount),
      description: shadedCount > 0 ? `${cut}, ${shadedCount} diarsir` : cut,
    },
  };
}

function sortTask(rng: Rng, fair: boolean): SortTask {
  const count = rng.int(2, 8);
  return { kind: 'sort', fair, card: shapeCard('c0', fair ? equalSlices(count) : unequalSlices(rng, count), 0, fair) };
}

function distractorCut(rng: Rng, target: number): number[] {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const slices = unequalSlices(rng, target);
    if (Math.abs(slices[0] - 1 / target) >= 0.3 / target) return slices;
  }
  throw new Error('could not generate a distinct unequal cut');
}

function pickTask(rng: Rng): PickTask {
  const target = rng.int(3, 8);
  const other = target + (rng.int(0, 1) === 0 ? -1 : 1);
  const shuffled = rng.shuffle([
    shapeCard('right', equalSlices(target), 1, true),
    shapeCard('count', equalSlices(other), 1, true),
    shapeCard('unequal', distractorCut(rng, target), 1, false),
  ]);
  const correctId = `c${shuffled.findIndex((card) => card.id === 'right')}`;
  return { kind: 'pick', target, correctId, cards: shuffled.map((card, i) => ({ ...card, id: `c${i}` })) };
}

export function generateTasks(rng: Rng): MembagiAdilTask[] {
  const firstFair = rng.int(0, 1) === 1;
  const cutA = rng.int(2, 12);
  const cutB = 2 + ((cutA - 2 + rng.int(1, 10)) % 11);
  return [
    sortTask(rng, firstFair),
    sortTask(rng, !firstFair),
    { kind: 'cut', target: cutA },
    { kind: 'cut', target: cutB },
    pickTask(rng),
  ];
}

export function emptyAnswer(task: MembagiAdilTask): MembagiAdilAnswer {
  if (task.kind === 'sort') return { placement: emptyPlacement(SORT_SLOTS.map((slot) => slot.id)), cuts: 1 };
  if (task.kind === 'pick') return { placement: emptyPlacement(['pilihan']), cuts: 1 };
  return { placement: {}, cuts: 1 };
}

export function isComplete(task: MembagiAdilTask, answer: MembagiAdilAnswer): boolean {
  if (task.kind === 'sort') return answer.placement.adil != null || answer.placement.tidak != null;
  if (task.kind === 'pick') return answer.placement.pilihan != null;
  return answer.cuts > 1;
}

export function solution(task: MembagiAdilTask): MembagiAdilAnswer {
  if (task.kind === 'sort') {
    return {
      placement: { adil: task.fair ? task.card.id : null, tidak: task.fair ? null : task.card.id },
      cuts: 1,
    };
  }
  if (task.kind === 'pick') return { placement: { pilihan: task.correctId }, cuts: 1 };
  return { placement: {}, cuts: task.target };
}

export function checkTask(task: MembagiAdilTask, answer: MembagiAdilAnswer): CheckResult {
  if (task.kind === 'sort') {
    const correct = answer.placement[task.fair ? 'adil' : 'tidak'] === task.card.id;
    return correct ? { correct, hint: '' } : { correct, hint: 'Lihat lagi, apakah semua potongannya sama besar?' };
  }
  if (task.kind === 'pick') {
    const correct = answer.placement.pilihan === task.correctId;
    return correct ? { correct, hint: '' } : { correct, hint: 'Cari yang potongannya sama besar dan jumlah potongnya pas.' };
  }
  if (answer.cuts === task.target) return { correct: true, hint: '' };
  return {
    correct: false,
    hint:
      answer.cuts < task.target
        ? `Masih kurang. Ada ${task.target} anak, jadi perlu ${task.target} potong.`
        : `Kebanyakan. Ada ${task.target} anak, jadi cukup ${task.target} potong.`,
  };
}
