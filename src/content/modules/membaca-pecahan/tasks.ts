import { equivalent, frac, type Fraction } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { emptyPlacement, type Card, type Placement } from '../../../manipulatives/cardSlots';
import { tickFor, tickId, tickIds } from '../../../manipulatives/numberLine';
import type { CheckResult } from '../../types';

export type ShadeTask = { kind: 'shade'; target: Fraction };
export type LineTask = { kind: 'line'; card: Card; perUnit: number };
export type ReadTask = { kind: 'read'; shaded: Fraction; cards: Card[]; correctId: string };
export type MembacaTask = ShadeTask | LineTask | ReadTask;
export type MembacaAnswer = { shaded: boolean[]; placement: Placement };

export const CONCLUSION =
  'Penyebut menunjukkan banyak potong yang sama besar. Pembilang menunjukkan banyak potong yang diambil.';

function proper(rng: Rng, dMin: number, dMax: number, nMin = 1): Fraction {
  const d = rng.int(dMin, dMax);
  return frac(rng.int(nMin, d - 1), d);
}

function lineTask(value: Fraction): LineTask {
  return { kind: 'line', card: { id: 'c0', value }, perUnit: value.d };
}

function readTask(rng: Rng): ReadTask {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const d = rng.int(3, 10);
    const n = rng.int(1, d - 1);
    if (2 * n === d || d - n < 2) continue;
    const values = [frac(n, d), frac(d - n, d), frac(n, d - n)];
    if (values.some((a, i) => values.some((b, j) => i < j && equivalent(a, b)))) continue;
    const shuffled = rng.shuffle(values.map((value, i) => ({ id: i === 0 ? 'right' : `x${i}`, value })));
    return {
      kind: 'read',
      shaded: frac(n, d),
      correctId: `c${shuffled.findIndex((card) => card.id === 'right')}`,
      cards: shuffled.map((card, i) => ({ ...card, id: `c${i}` })),
    };
  }
  throw new Error('could not generate a reading task');
}

export function generateTasks(rng: Rng): MembacaTask[] {
  return [
    { kind: 'shade', target: proper(rng, 2, 8) },
    { kind: 'shade', target: proper(rng, 3, 12) },
    lineTask(proper(rng, 2, 8)),
    lineTask(proper(rng, 3, 12, 2)),
    readTask(rng),
  ];
}

export function emptyAnswer(task: MembacaTask): MembacaAnswer {
  if (task.kind === 'shade') return { shaded: new Array<boolean>(task.target.d).fill(false), placement: {} };
  if (task.kind === 'line') return { shaded: [], placement: emptyPlacement(tickIds(1, task.perUnit)) };
  return { shaded: [], placement: emptyPlacement(['pilihan']) };
}

export function shadeDiff(target: Fraction, shaded: readonly boolean[]): boolean[] {
  const count = shaded.filter(Boolean).length;
  const out = shaded.map(() => false);
  if (count < target.n) {
    let need = target.n - count;
    shaded.forEach((on, i) => {
      if (!on && need > 0) {
        out[i] = true;
        need -= 1;
      }
    });
  } else if (count > target.n) {
    let extra = count - target.n;
    for (let i = shaded.length - 1; i >= 0 && extra > 0; i--) {
      if (shaded[i]) {
        out[i] = true;
        extra -= 1;
      }
    }
  }
  return out;
}

export function isComplete(task: MembacaTask, answer: MembacaAnswer): boolean {
  if (task.kind === 'shade') return answer.shaded.some(Boolean);
  if (task.kind === 'line') return Object.values(answer.placement).includes(task.card.id);
  return answer.placement.pilihan != null;
}

export function solution(task: MembacaTask): MembacaAnswer {
  if (task.kind === 'shade') {
    return { shaded: Array.from({ length: task.target.d }, (_, i) => i < task.target.n), placement: {} };
  }
  if (task.kind === 'line') {
    const at = tickId(tickFor(task.card.value, task.perUnit));
    return { shaded: [], placement: { ...emptyPlacement(tickIds(1, task.perUnit)), [at]: task.card.id } };
  }
  return { shaded: [], placement: { pilihan: task.correctId } };
}

export function checkTask(task: MembacaTask, answer: MembacaAnswer): CheckResult {
  if (task.kind === 'shade') {
    const count = answer.shaded.filter(Boolean).length;
    return count === task.target.n
      ? { correct: true, hint: '' }
      : { correct: false, hint: `Pembilangnya ${task.target.n}, jadi arsir ${task.target.n} potong.` };
  }
  if (task.kind === 'line') {
    const { n, d } = task.card.value;
    const correct = answer.placement[tickId(tickFor(task.card.value, task.perUnit))] === task.card.id;
    return correct
      ? { correct, hint: '' }
      : { correct, hint: `Bagi garis 0 sampai 1 jadi ${d} bagian, lalu hitung ${n} langkah dari 0.` };
  }
  const correct = answer.placement.pilihan === task.correctId;
  return correct ? { correct, hint: '' } : { correct, hint: 'Penyebut = semua potong. Pembilang = potong yang diarsir.' };
}
