import { equivalent, frac, gcd, type Fraction } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { spokenFraction } from '../../../lib/spoken';
import { emptyPlacement, type Card, type Placement, type Slot } from '../../../manipulatives/cardSlots';
import type { CheckResult } from '../../types';

export type RecutTask = { kind: 'recut'; base: Fraction; k: number; target: Fraction };
export type PairTask = { kind: 'pair'; slots: Slot[]; cards: Card[]; solution: Placement };
export type SimplifyTask = { kind: 'simplify'; value: Fraction; cards: Card[]; correctId: string };
export type SenilaiTask = RecutTask | PairTask | SimplifyTask;
export type SenilaiAnswer = { cuts: number; placement: Placement };

export const CONCLUSION = 'Memotong ulang mengubah angkanya, tapi nilai pecahannya tetap sama.';

function simplest(rng: Rng, dMin: number, dMax: number): Fraction {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const d = rng.int(dMin, dMax);
    const n = rng.int(1, d - 1);
    if (gcd(n, d) === 1) return frac(n, d);
  }
  throw new Error('could not generate a simplest fraction');
}

function recutTask(rng: Rng): RecutTask {
  const base = simplest(rng, 2, 6);
  const k = rng.int(2, Math.floor(12 / base.d));
  return { kind: 'recut', base, k, target: frac(base.n * k, base.d * k) };
}

function pairTask(rng: Rng): PairTask {
  const bases: Fraction[] = [];
  for (let attempt = 0; bases.length < 3; attempt++) {
    if (attempt > 1000) throw new Error('could not generate pair bases');
    const candidate = simplest(rng, 2, 4);
    if (!bases.some((b) => equivalent(b, candidate))) bases.push(candidate);
  }
  const slots: Slot[] = bases.map((value, i) => ({ id: `s${i}`, label: `sama dengan ${spokenFraction(value)}`, value }));
  const forms = bases.map((b) => {
    const k = rng.int(2, 3);
    return frac(b.n * k, b.d * k);
  });
  const order = rng.shuffle([0, 1, 2]);
  const cards: Card[] = order.map((source, i) => ({ id: `c${i}`, value: forms[source] }));
  const solution: Placement = Object.fromEntries(slots.map((slot, source) => [slot.id, `c${order.indexOf(source)}`]));
  return { kind: 'pair', slots, cards, solution };
}

function simplifyTask(rng: Rng): SimplifyTask {
  const s = simplest(rng, 2, 6);
  const k = rng.int(2, 3);
  const value = frac(s.n * k, s.d * k);
  const shuffled = rng.shuffle([
    { id: 'right', value: frac(s.n, s.d) },
    { id: 'top', value: frac(s.n, s.d * k) },
    { id: 'bottom', value: frac(s.n * k, s.d) },
  ]);
  return {
    kind: 'simplify',
    value,
    correctId: `c${shuffled.findIndex((card) => card.id === 'right')}`,
    cards: shuffled.map((card, i) => ({ ...card, id: `c${i}` })),
  };
}

export function generateTasks(rng: Rng): SenilaiTask[] {
  return [recutTask(rng), pairTask(rng), simplifyTask(rng), recutTask(rng), simplifyTask(rng)];
}

export function emptyAnswer(task: SenilaiTask): SenilaiAnswer {
  if (task.kind === 'pair') return { cuts: 1, placement: emptyPlacement(task.slots.map((slot) => slot.id)) };
  if (task.kind === 'simplify') return { cuts: 1, placement: emptyPlacement(['pilihan']) };
  return { cuts: 1, placement: {} };
}

export function isComplete(task: SenilaiTask, answer: SenilaiAnswer): boolean {
  if (task.kind === 'pair') return task.slots.every((slot) => answer.placement[slot.id] != null);
  if (task.kind === 'simplify') return answer.placement.pilihan != null;
  return answer.cuts > 1;
}

export function solution(task: SenilaiTask): SenilaiAnswer {
  if (task.kind === 'pair') return { cuts: 1, placement: task.solution };
  if (task.kind === 'simplify') return { cuts: 1, placement: { pilihan: task.correctId } };
  return { cuts: task.k, placement: {} };
}

export function checkTask(task: SenilaiTask, answer: SenilaiAnswer): CheckResult {
  if (task.kind === 'recut') {
    return answer.cuts === task.k
      ? { correct: true, hint: '' }
      : { correct: false, hint: `Pita harus terbagi jadi ${task.target.d} bagian kecil.` };
  }
  if (task.kind === 'pair') {
    const correct = task.slots.every((slot) => {
      const card = task.cards.find((c) => c.id === answer.placement[slot.id]);
      return card !== undefined && slot.value !== undefined && equivalent(card.value, slot.value);
    });
    return correct ? { correct, hint: '' } : { correct, hint: 'Cari kartu yang nilainya sama, walaupun angkanya beda.' };
  }
  const correct = answer.placement.pilihan === task.correctId;
  return correct ? { correct, hint: '' } : { correct, hint: 'Bagi pembilang dan penyebut dengan angka yang sama.' };
}
