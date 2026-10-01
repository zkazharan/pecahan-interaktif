import { describe, expect, it } from 'vitest';
import { equivalent, frac } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import { totalPieces } from '../../../manipulatives/plates';
import { checkTask, emptyAnswer, generateTasks, isComplete, solution, type SamaTask } from './tasks';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1);

describe('generateTasks', () => {
  it('makes add, add, sub, add, sub within the planned ranges', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const tasks = generateTasks(createRng(seed));
      const kinds = tasks.map((t) => t.kind).join(',');
      if (kinds !== 'add,add,sub,add,sub') problems.push(`${seed}: ${kinds}`);
      tasks.forEach((t, i) => {
        if (t.kind === 'add') {
          const crosses = t.a + t.b > t.d;
          if (t.d < 3 || t.d > 8 || t.a < 1 || t.b < 1 || t.a >= t.d || t.b >= t.d || crosses !== (i === 3) || t.a + t.b === t.d) problems.push(`${seed}/${i}: add`);
        } else if (t.d < 3 || t.d > 10 || t.a < 2 || t.a > t.d || t.b < 1 || t.b >= t.a) {
          problems.push(`${seed}/${i}: sub`);
        }
        const values = t.cards.map((c) => c.value);
        const distinct = values.every((x, a) => values.every((y, b) => a === b || !equivalent(x, y)));
        const right = t.cards.find((c) => c.id === t.correctId);
        const expected = frac(t.kind === 'add' ? t.a + t.b : t.a - t.b, t.d);
        if (!distinct || t.cards.length !== 3 || !right || !equivalent(right.value, expected)) problems.push(`${seed}/${i}: cards`);
      });
    }
    expect(problems).toEqual([]);
  });

  it('is deterministic for a seed', () => {
    expect(generateTasks(createRng(42))).toEqual(generateTasks(createRng(42)));
  });
});

describe('checkTask', () => {
  it('accepts exactly the right card', () => {
    const problems: string[] = [];
    for (const seed of SEEDS.slice(0, 200)) {
      for (const task of generateTasks(createRng(seed))) {
        const correct = task.cards.filter((c) => checkTask(task, { ...emptyAnswer(task), placement: { pilihan: c.id } }).correct);
        if (correct.length !== 1 || correct[0].id !== solution(task).placement.pilihan) problems.push(`${seed}: ${task.kind}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('hints that the denominator stays the same', () => {
    const task: SamaTask = {
      kind: 'add',
      d: 5,
      a: 1,
      b: 2,
      cards: [
        { id: 'c0', value: frac(3, 5) },
        { id: 'c1', value: frac(3, 10) },
        { id: 'c2', value: frac(4, 5) },
      ],
      correctId: 'c0',
    };
    expect(checkTask(task, { ...emptyAnswer(task), placement: { pilihan: 'c1' } })).toEqual({
      correct: false,
      hint: 'Penyebutnya tetap 5. Hitung semua potongnya.',
    });
  });
});

describe('emptyAnswer, solution and isComplete', () => {
  it('starts with the pieces ready and finishes when a card is placed', () => {
    const [add, , sub] = generateTasks(createRng(6));
    if (add.kind !== 'add' || sub.kind !== 'sub') throw new Error('unexpected kinds');
    expect(emptyAnswer(add).plates.tray).toBe(add.a + add.b);
    expect(emptyAnswer(sub).plates).toEqual({ plates: [sub.a], tray: 0 });
    expect(solution(sub).plates).toEqual({ plates: [sub.a - sub.b], tray: sub.b });
    expect(totalPieces(solution(add).plates)).toBe(add.a + add.b);
    expect(solution(add).plates.tray).toBe(0);
    expect(isComplete(add, emptyAnswer(add))).toBe(false);
    expect(isComplete(add, solution(add))).toBe(true);
  });
});
