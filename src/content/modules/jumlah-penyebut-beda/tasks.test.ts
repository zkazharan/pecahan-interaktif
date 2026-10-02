import { describe, expect, it } from 'vitest';
import { compare, equivalent, frac, lcm } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import { checkTask, emptyAnswer, generateTasks, isComplete, solution, targetCuts, type BedaTask } from './tasks';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1);

describe('generateTasks', () => {
  it('makes the planned order with valid pairs and cards', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const tasks = generateTasks(createRng(seed));
      const kinds = tasks.map((t) => t.kind).join(',');
      if (kinds !== 'add-recut,add-recut,sub-recut,add-recut,sub-recut') problems.push(`${seed}: ${kinds}`);
      for (const t of tasks) {
        const { a, b, common } = t;
        if (a.d === b.d || a.d > 6 || b.d > 6 || a.n >= a.d || b.n >= b.d || equivalent(a, b)) problems.push(`${seed}: pair`);
        if (common !== lcm(a.d, b.d) || common > 12) problems.push(`${seed}: common`);
        if (t.kind === 'sub-recut' && compare(a, b) <= 0) problems.push(`${seed}: order`);
        const [ka, kb] = targetCuts(t);
        const n = t.kind === 'add-recut' ? a.n * ka + b.n * kb : a.n * ka - b.n * kb;
        const right = t.cards.find((c) => c.id === t.correctId);
        const values = t.cards.map((c) => c.value);
        const distinct = values.every((x, i) => values.every((y, j) => i === j || !equivalent(x, y)));
        if (!right || right.value.n !== n || right.value.d !== common || !distinct || t.cards.length !== 3) problems.push(`${seed}: cards`);
        if (values.some((v) => v.n < 1 || v.d < 1)) problems.push(`${seed}: invalid card`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('is deterministic for a seed', () => {
    expect(generateTasks(createRng(42))).toEqual(generateTasks(createRng(42)));
  });
});

describe('checkTask and isComplete', () => {
  it('accepts exactly the right card', () => {
    const problems: string[] = [];
    for (const seed of SEEDS.slice(0, 200)) {
      for (const task of generateTasks(createRng(seed))) {
        const correct = task.cards.filter((c) => checkTask(task, { cuts: targetCuts(task), placement: { pilihan: c.id } }).correct);
        if (correct.length !== 1 || correct[0].id !== task.correctId) problems.push(`${seed}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('is only complete once both bars are cut into equal parts and a card is placed', () => {
    const task: BedaTask = {
      kind: 'add-recut',
      a: frac(1, 2),
      b: frac(1, 3),
      common: 6,
      cards: [
        { id: 'c0', value: frac(5, 6) },
        { id: 'c1', value: frac(2, 5) },
        { id: 'c2', value: frac(2, 6) },
      ],
      correctId: 'c0',
    };
    expect(isComplete(task, emptyAnswer(task))).toBe(false);
    expect(isComplete(task, { cuts: [3, 2], placement: { pilihan: null } })).toBe(false);
    expect(isComplete(task, { cuts: [2, 2], placement: { pilihan: 'c0' } })).toBe(false);
    expect(isComplete(task, { cuts: [3, 2], placement: { pilihan: 'c0' } })).toBe(true);
    expect(isComplete(task, { cuts: [6, 4], placement: { pilihan: 'c0' } })).toBe(true);
    expect(solution(task)).toEqual({ cuts: [3, 2], placement: { pilihan: 'c0' } });
    expect(checkTask(task, { cuts: [3, 2], placement: { pilihan: 'c1' } })).toEqual({
      correct: false,
      hint: 'Potongannya sudah sama besar. Jumlahkan pembilangnya saja.',
    });
  });

  it('is not complete while either piece count is below 1', () => {
    const task = generateTasks(createRng(1))[0];
    const placement = { pilihan: 'c0' };
    expect(isComplete(task, { cuts: [0, 0], placement })).toBe(false);
    expect(isComplete(task, { cuts: [0, 1], placement })).toBe(false);
    expect(isComplete(task, { cuts: [1, 0], placement })).toBe(false);
    expect(isComplete(task, { cuts: [-3, -2], placement })).toBe(false);
  });

  it('hints at subtracting numerators for a subtraction task', () => {
    const task: BedaTask = {
      kind: 'sub-recut',
      a: frac(2, 3),
      b: frac(1, 2),
      common: 6,
      cards: [
        { id: 'c0', value: frac(1, 6) },
        { id: 'c1', value: frac(1, 1) },
        { id: 'c2', value: frac(2, 6) },
      ],
      correctId: 'c0',
    };
    expect(checkTask(task, { cuts: [2, 3], placement: { pilihan: 'c1' } })).toEqual({
      correct: false,
      hint: 'Potongannya sudah sama besar. Kurangkan pembilangnya saja.',
    });
  });
});
