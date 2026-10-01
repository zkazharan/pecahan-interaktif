import { frac, type Fraction } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { emptyPlacement, type Card, type Placement } from '../../../manipulatives/cardSlots';
import { fillGreedy, startPlates, type PlatesState } from '../../../manipulatives/plates';
import type { CheckResult } from '../../types';

export type AddTask = { kind: 'add'; d: number; a: number; b: number; cards: Card[]; correctId: string };
export type SubTask = { kind: 'sub'; d: number; a: number; b: number; cards: Card[]; correctId: string };
export type SamaTask = AddTask | SubTask;
export type SamaAnswer = { plates: PlatesState; placement: Placement };

export const CONCLUSION = 'Kalau penyebutnya sama, cukup jumlahkan atau kurangkan pembilangnya. Penyebutnya tetap.';

function withCards<T extends { kind: 'add' | 'sub' }>(rng: Rng, base: T, values: [Fraction, Fraction, Fraction]): T & { cards: Card[]; correctId: string } {
  const shuffled = rng.shuffle(values.map((value, i) => ({ id: i === 0 ? 'right' : `x${i}`, value })));
  return {
    ...base,
    correctId: `c${shuffled.findIndex((card) => card.id === 'right')}`,
    cards: shuffled.map((card, i) => ({ ...card, id: `c${i}` })),
  };
}

function addTask(rng: Rng, crossesWhole: boolean): AddTask {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const d = rng.int(3, 8);
    const a = rng.int(1, d - 1);
    const b = rng.int(1, d - 1);
    const sum = a + b;
    if (sum === d || sum > d !== crossesWhole) continue;
    return withCards(rng, { kind: 'add' as const, d, a, b }, [frac(sum, d), frac(sum, 2 * d), frac(sum + 1, d)]);
  }
  throw new Error('could not generate an addition task');
}

function subTask(rng: Rng): SubTask {
  const d = rng.int(3, 10);
  const a = rng.int(2, d);
  const b = rng.int(1, a - 1);
  return withCards(rng, { kind: 'sub' as const, d, a, b }, [frac(a - b, d), frac(a + b, d), frac(a - b + 1, d)]);
}

export function generateTasks(rng: Rng): SamaTask[] {
  return [addTask(rng, false), addTask(rng, false), subTask(rng), addTask(rng, true), subTask(rng)];
}

export function emptyAnswer(task: SamaTask): SamaAnswer {
  const placement = emptyPlacement(['pilihan']);
  if (task.kind === 'add') return { plates: startPlates(task.a + task.b, Math.ceil((task.a + task.b) / task.d)), placement };
  return { plates: { plates: [task.a], tray: 0 }, placement };
}

export function isComplete(_task: SamaTask, answer: SamaAnswer): boolean {
  return answer.placement.pilihan != null;
}

export function solution(task: SamaTask): SamaAnswer {
  const placement = { pilihan: task.correctId };
  if (task.kind === 'add') {
    const total = task.a + task.b;
    return { plates: fillGreedy(total, Math.ceil(total / task.d), task.d), placement };
  }
  return { plates: { plates: [task.a - task.b], tray: task.b }, placement };
}

export function checkTask(task: SamaTask, answer: SamaAnswer): CheckResult {
  if (answer.placement.pilihan === task.correctId) return { correct: true, hint: '' };
  return {
    correct: false,
    hint:
      task.kind === 'add'
        ? `Penyebutnya tetap ${task.d}. Hitung semua potongnya.`
        : `Ambil ${task.b} potong dari loyang, lalu hitung sisanya.`,
  };
}
