import { frac } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { emptyPlacement, type Card, type Placement } from '../../../manipulatives/cardSlots';
import { dealAll, isFairShare, startCollection, takenCount, type CollectionState } from '../../../manipulatives/collection';
import type { CheckResult } from '../../types';

export type SplitTask = { kind: 'split'; total: number; bags: number };
export type TakeTask = { kind: 'take'; total: number; bags: number; take: number };
export type CountTask = { kind: 'count'; total: number; bags: number; take: number; cards: Card[]; correctId: string };
export type ShareTask = SplitTask | TakeTask | CountTask;
export type ShareAnswer = { collection: CollectionState; taken: boolean[]; placement: Placement };

export const CONCLUSION = 'Bagi dulu jumlahnya sama banyak sesuai penyebut, lalu ambil sebanyak pembilang.';

type Share = { total: number; bags: number; take: number };

function numberCard(id: string, value: number): Card {
  return { id, value: frac(value, 1), face: { kind: 'mixed' } };
}

function splitTask(rng: Rng, bags: number): SplitTask {
  return { kind: 'split', bags, total: bags * rng.int(2, 4) };
}

function share(rng: Rng): Share {
  const bags = rng.int(2, 6);
  const per = rng.int(2, Math.min(4, Math.floor(24 / bags)));
  return { bags, total: bags * per, take: rng.int(1, bags - 1) };
}

export function countDistractors(total: number, bags: number, take: number): number[] {
  const per = total / bags;
  const correct = take * per;
  const out: number[] = [];
  for (const value of [per, total - correct, total, correct + per, take]) {
    if (value > 0 && value !== correct && !out.includes(value)) out.push(value);
  }
  return out.slice(0, 2);
}

function countTask(rng: Rng, base: Share): CountTask {
  const correct = (base.take * base.total) / base.bags;
  const shuffled = rng.shuffle([
    numberCard('right', correct),
    ...countDistractors(base.total, base.bags, base.take).map((value, i) => numberCard(`x${i}`, value)),
  ]);
  return {
    kind: 'count',
    ...base,
    correctId: `c${shuffled.findIndex((card) => card.id === 'right')}`,
    cards: shuffled.map((card, i) => ({ ...card, id: `c${i}` })),
  };
}

export function generateTasks(rng: Rng): ShareTask[] {
  const firstBags = rng.int(2, 4);
  const secondBags = 2 + ((firstBags - 2 + rng.int(1, 2)) % 3);
  const takeShare = share(rng);
  return [
    splitTask(rng, firstBags),
    { kind: 'take', ...takeShare },
    countTask(rng, share(rng)),
    splitTask(rng, secondBags),
    countTask(rng, share(rng)),
  ];
}

export function emptyAnswer(task: ShareTask): ShareAnswer {
  if (task.kind === 'split') return { collection: startCollection(task.total, task.bags), taken: [], placement: {} };
  if (task.kind === 'take') return { collection: dealAll(task.total, task.bags), taken: new Array<boolean>(task.bags).fill(false), placement: {} };
  return { collection: dealAll(task.total, task.bags), taken: [], placement: emptyPlacement(['pilihan']) };
}

export function isComplete(task: ShareTask, answer: ShareAnswer): boolean {
  if (task.kind === 'split') return answer.collection.tray === 0;
  if (task.kind === 'take') return takenCount(answer.taken) > 0;
  return answer.placement.pilihan != null;
}

export function solution(task: ShareTask): ShareAnswer {
  const empty = emptyAnswer(task);
  if (task.kind === 'split') return { ...empty, collection: dealAll(task.total, task.bags) };
  if (task.kind === 'take') return { ...empty, taken: empty.taken.map((_, i) => i < task.take) };
  return { ...empty, placement: { pilihan: task.correctId } };
}

export function checkTask(task: ShareTask, answer: ShareAnswer): CheckResult {
  if (task.kind === 'split') {
    return isFairShare(answer.collection) ? { correct: true, hint: '' } : { correct: false, hint: 'Setiap kantong harus berisi sama banyak.' };
  }
  if (task.kind === 'take') {
    return takenCount(answer.taken) === task.take
      ? { correct: true, hint: '' }
      : { correct: false, hint: 'Penyebut = banyak kantong. Pembilang = kantong yang diambil.' };
  }
  return answer.placement.pilihan === task.correctId
    ? { correct: true, hint: '' }
    : { correct: false, hint: 'Hitung kelereng di kantong yang diambil saja.' };
}
