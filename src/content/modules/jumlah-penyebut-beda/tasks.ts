import { compare, equivalent, frac, lcm, type Fraction } from '../../../lib/fraction';
import type { Rng } from '../../../lib/random';
import { emptyPlacement, type Card, type Placement } from '../../../manipulatives/cardSlots';
import type { CheckResult } from '../../types';

export type BedaTask = {
  kind: 'add-recut' | 'sub-recut';
  a: Fraction;
  b: Fraction;
  common: number;
  cards: Card[];
  correctId: string;
};
export type BedaAnswer = { cuts: [number, number]; placement: Placement };

export const CONCLUSION =
  'Kalau penyebutnya beda, potong ulang dulu sampai potongannya sama besar, baru jumlahkan atau kurangkan.';

export function targetCuts(task: Pick<BedaTask, 'a' | 'b' | 'common'>): [number, number] {
  return [task.common / task.a.d, task.common / task.b.d];
}

function pickDistractors(right: Fraction, candidates: (Fraction | null)[]): Fraction[] {
  const chosen: Fraction[] = [];
  for (const candidate of candidates) {
    if (!candidate || candidate.n < 1 || candidate.d < 1) continue;
    if (equivalent(candidate, right) || chosen.some((c) => equivalent(c, candidate))) continue;
    chosen.push(candidate);
    if (chosen.length === 2) break;
  }
  return chosen;
}

function bedaTask(rng: Rng, kind: BedaTask['kind']): BedaTask {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const d1 = rng.int(2, 6);
    const d2 = rng.int(2, 6);
    const common = lcm(d1, d2);
    if (d1 === d2 || common > 12) continue;
    let a = frac(rng.int(1, d1 - 1), d1);
    let b = frac(rng.int(1, d2 - 1), d2);
    if (equivalent(a, b)) continue;
    if (kind === 'sub-recut' && compare(a, b) < 0) [a, b] = [b, a];
    const [ka, kb] = targetCuts({ a, b, common });
    const n = kind === 'add-recut' ? a.n * ka + b.n * kb : a.n * ka - b.n * kb;
    const right = frac(n, common);
    const distractors = pickDistractors(
      right,
      kind === 'add-recut'
        ? [frac(a.n + b.n, a.d + b.d), frac(a.n + b.n, common), frac(n + 1, common)]
        : [
            a.n > b.n && a.d > b.d ? frac(a.n - b.n, a.d - b.d) : null,
            frac(a.n * ka + b.n * kb, common),
            frac(n + 1, common),
          ],
    );
    if (distractors.length < 2) continue;
    const shuffled = rng.shuffle([{ id: 'right', value: right }, ...distractors.map((value, i) => ({ id: `x${i}`, value }))]);
    return {
      kind,
      a,
      b,
      common,
      correctId: `c${shuffled.findIndex((card) => card.id === 'right')}`,
      cards: shuffled.map((card, i) => ({ ...card, id: `c${i}` })),
    };
  }
  throw new Error('could not generate a different-denominator task');
}

export function generateTasks(rng: Rng): BedaTask[] {
  return [
    bedaTask(rng, 'add-recut'),
    bedaTask(rng, 'add-recut'),
    bedaTask(rng, 'sub-recut'),
    bedaTask(rng, 'add-recut'),
    bedaTask(rng, 'sub-recut'),
  ];
}

export function emptyAnswer(_task: BedaTask): BedaAnswer {
  return { cuts: [1, 1], placement: emptyPlacement(['pilihan']) };
}

export function isComplete(task: BedaTask, answer: BedaAnswer): boolean {
  return task.a.d * answer.cuts[0] === task.b.d * answer.cuts[1] && answer.placement.pilihan != null;
}

export function solution(task: BedaTask): BedaAnswer {
  return { cuts: targetCuts(task), placement: { pilihan: task.correctId } };
}

export function checkTask(task: BedaTask, answer: BedaAnswer): CheckResult {
  if (answer.placement.pilihan === task.correctId) return { correct: true, hint: '' };
  return {
    correct: false,
    hint:
      task.kind === 'add-recut'
        ? 'Potongannya sudah sama besar. Jumlahkan pembilangnya saja.'
        : 'Potongannya sudah sama besar. Kurangkan pembilangnya saja.',
  };
}
