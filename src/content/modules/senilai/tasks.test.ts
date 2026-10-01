import { describe, expect, it } from 'vitest';
import { equivalent, gcd, sameForm, simplify } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import { maxCut } from '../../../manipulatives/bar';
import type { Placement } from '../../../manipulatives/cardSlots';
import {
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  wrongPairSlots,
  type SenilaiAnswer,
  type SenilaiTask,
} from './tasks';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1);

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

function allAnswers(task: SenilaiTask): SenilaiAnswer[] {
  if (task.kind === 'recut') {
    return Array.from({ length: maxCut(task.base.d) }, (_, i) => ({ cuts: i + 1, placement: {} }));
  }
  if (task.kind === 'pair') {
    return permutations(task.cards.map((c) => c.id)).map((ids) => ({
      cuts: 1,
      placement: Object.fromEntries(task.slots.map((slot, i) => [slot.id, ids[i]])) as Placement,
    }));
  }
  return task.cards.map((card) => ({ cuts: 1, placement: { pilihan: card.id } }));
}

describe('generateTasks', () => {
  it('makes recut, pair, simplify, recut, simplify within the planned ranges', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const tasks = generateTasks(createRng(seed));
      const kinds = tasks.map((t) => t.kind).join(',');
      if (kinds !== 'recut,pair,simplify,recut,simplify') problems.push(`${seed}: ${kinds}`);
      for (const task of tasks) {
        if (task.kind === 'recut') {
          const { base, k, target } = task;
          if (gcd(base.n, base.d) !== 1 || base.d > 6 || k < 2 || base.d * k > 12 || target.n !== base.n * k || target.d !== base.d * k) problems.push(`${seed}: recut`);
        }
        if (task.kind === 'pair') {
          const values = task.slots.map((s) => s.value!);
          const distinct = values.every((a, i) => values.every((b, j) => i === j || !equivalent(a, b)));
          const formsOk = task.cards.every((c) => values.some((v) => equivalent(v, c.value) && !sameForm(v, c.value)));
          if (!distinct || !formsOk || task.slots.length !== 3 || task.cards.length !== 3) problems.push(`${seed}: pair`);
        }
        if (task.kind === 'simplify') {
          const right = task.cards.find((c) => c.id === task.correctId);
          const others = task.cards.filter((c) => c.id !== task.correctId);
          if (!right || !sameForm(right.value, simplify(task.value)) || sameForm(task.value, simplify(task.value))) problems.push(`${seed}: simplify`);
          if (others.some((c) => equivalent(c.value, task.value))) problems.push(`${seed}: simplify distractor`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('is deterministic for a seed', () => {
    expect(generateTasks(createRng(42))).toEqual(generateTasks(createRng(42)));
  });
});

describe('checkTask', () => {
  it('accepts exactly one answer per task, and it is the solution', () => {
    const problems: string[] = [];
    for (const seed of SEEDS.slice(0, 200)) {
      for (const task of generateTasks(createRng(seed))) {
        const correct = allAnswers(task).filter((answer) => checkTask(task, answer).correct);
        if (correct.length !== 1 || JSON.stringify(correct[0]) !== JSON.stringify(solution(task))) problems.push(`${seed}: ${task.kind}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('rejects any card that is not the simplest form in the simplify task', () => {
    const task = generateTasks(createRng(3))[2];
    if (task.kind !== 'simplify') throw new Error('expected simplify');
    const wrong = task.cards.find((c) => c.id !== task.correctId)!;
    expect(checkTask(task, { cuts: 1, placement: { pilihan: wrong.id } })).toEqual({
      correct: false,
      hint: 'Bagi pembilang dan penyebut dengan angka yang sama.',
    });
  });
});

describe('isComplete', () => {
  it('needs a re-cut, every pair slot, or a chosen card', () => {
    const [recut, pair, simple] = generateTasks(createRng(8));
    expect(isComplete(recut, emptyAnswer(recut))).toBe(false);
    expect(isComplete(recut, { cuts: 2, placement: {} })).toBe(true);
    expect(isComplete(pair, emptyAnswer(pair))).toBe(false);
    expect(isComplete(simple, emptyAnswer(simple))).toBe(false);
    for (const task of [recut, pair, simple]) expect(isComplete(task, solution(task))).toBe(true);
  });
});

describe('wrongPairSlots', () => {
  it('flags the two slots whose cards were swapped, and none when correct', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const task = generateTasks(createRng(seed))[1];
      if (task.kind !== 'pair') throw new Error('expected pair');
      expect(wrongPairSlots(task, task.solution)).toEqual([]);
      const swapped = { ...task.solution, s0: task.solution.s1, s1: task.solution.s0 };
      expect(wrongPairSlots(task, swapped)).toEqual(['s0', 's1']);
    }
  });

  it('flags empty slots', () => {
    const task = generateTasks(createRng(3))[1];
    if (task.kind !== 'pair') throw new Error('expected pair');
    expect(wrongPairSlots(task, { s0: null, s1: null, s2: null })).toEqual(['s0', 's1', 's2']);
  });
});
