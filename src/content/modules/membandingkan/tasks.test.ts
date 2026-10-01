import { describe, expect, it } from 'vitest';
import { equivalent, frac } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import type { Placement } from '../../../manipulatives/cardSlots';
import {
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  slotsFor,
  solution,
  type MembandingkanTask,
} from './tasks';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1);

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

function allAnswers(task: MembandingkanTask): Placement[] {
  const ids = task.cards.map((c) => c.id);
  if (task.kind === 'compare') return ids.map((id) => ({ besar: id }));
  return permutations(ids).map(([s1, s2, s3]) => ({ s1, s2, s3 }));
}

describe('generateTasks', () => {
  it('always makes 5 tasks in the planned order', () => {
    for (const seed of SEEDS) {
      const tasks = generateTasks(createRng(seed));
      expect(tasks.map((t) => t.kind)).toEqual(['compare', 'order', 'compare', 'order', 'order']);
      expect(tasks.map((t) => t.cards.length)).toEqual([2, 3, 2, 3, 3]);
    }
  });

  it('keeps every fraction proper, within /2–/12, and distinct in value', () => {
    for (const seed of SEEDS) {
      generateTasks(createRng(seed)).forEach((task, index) => {
        const values = task.cards.map((c) => c.value);
        for (const v of values) {
          expect(v.d).toBeGreaterThanOrEqual(2);
          expect(v.d).toBeLessThanOrEqual(12);
          expect(v.n).toBeGreaterThanOrEqual(1);
          expect(v.n).toBeLessThan(v.d);
          if (index < 2) expect(v.n).toBe(1);
          else expect(v.n).toBeGreaterThanOrEqual(2);
        }
        for (let i = 0; i < values.length; i++) {
          for (let j = i + 1; j < values.length; j++) expect(equivalent(values[i], values[j])).toBe(false);
        }
        expect(new Set(task.cards.map((c) => c.id)).size).toBe(task.cards.length);
      });
    }
  });

  it('is deterministic for a seed', () => {
    expect(generateTasks(createRng(42))).toEqual(generateTasks(createRng(42)));
  });
});

describe('checkTask', () => {
  it('accepts exactly one arrangement, and it is the solution', () => {
    for (const seed of SEEDS.slice(0, 200)) {
      for (const task of generateTasks(createRng(seed))) {
        const correct = allAnswers(task).filter((answer) => checkTask(task, answer).correct);
        expect(correct).toEqual([solution(task)]);
      }
    }
  });

  it('rejects the classic 1/4 > 1/3 mistake with a stacking hint', () => {
    const task: MembandingkanTask = {
      kind: 'compare',
      cards: [
        { id: 'c0', value: frac(1, 3) },
        { id: 'c1', value: frac(1, 4) },
      ],
    };
    const result = checkTask(task, { besar: 'c1' });
    expect(result.correct).toBe(false);
    expect(result.hint).toBe('Coba tumpuk pitanya. Mana yang lebih panjang?');
    expect(checkTask(task, { besar: 'c0' })).toEqual({ correct: true, hint: '' });
  });

  it('gives the ordering hint for order tasks', () => {
    const task = generateTasks(createRng(5))[1];
    const wrong = allAnswers(task).find((answer) => !checkTask(task, answer).correct)!;
    expect(checkTask(task, wrong).hint).toBe('Bandingkan dua-dua dulu. Buka pitanya kalau bingung.');
  });
});

describe('isComplete and emptyAnswer', () => {
  it('needs every slot filled', () => {
    const task = generateTasks(createRng(9))[1];
    const empty = emptyAnswer(task);
    expect(Object.keys(empty)).toEqual(slotsFor(task).map((s) => s.id));
    expect(isComplete(task, empty)).toBe(false);
    expect(isComplete(task, { ...empty, s1: 'c0', s2: 'c1' })).toBe(false);
    expect(isComplete(task, solution(task))).toBe(true);
  });
});
