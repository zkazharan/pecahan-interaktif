import { describe, expect, it } from 'vitest';
import { equivalent, toMixed } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import { emptyPlacement } from '../../../manipulatives/cardSlots';
import { tickIds } from '../../../manipulatives/numberLine';
import {
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  type CampuranAnswer,
  type CampuranTask,
} from './tasks';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1);

function distributions(plateCount: number, capacity: number, pieces: number): number[][] {
  if (plateCount === 0) return [[]];
  const out: number[][] = [];
  for (let c = 0; c <= Math.min(capacity, pieces); c++) {
    for (const rest of distributions(plateCount - 1, capacity, pieces - c)) out.push([c, ...rest]);
  }
  return out;
}

describe('generateTasks', () => {
  it('makes group, line, mixed, group, mixed with improper non-whole values', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const tasks = generateTasks(createRng(seed));
      const kinds = tasks.map((t) => t.kind).join(',');
      if (kinds !== 'group,line,mixed,group,mixed') problems.push(`${seed}: ${kinds}`);
      for (const task of tasks) {
        const value = task.kind === 'line' ? task.card.value : task.value;
        if (value.n <= value.d || value.n % value.d === 0 || value.n >= 3 * value.d || value.d > 8) problems.push(`${seed}: ${value.n}/${value.d}`);
      }
      const [g1, line] = tasks;
      if (g1.kind === 'group' && g1.value.n >= 2 * g1.value.d) problems.push(`${seed}: g1 needs two plates`);
      if (line.kind === 'line' && (line.max !== 3 || line.perUnit !== line.card.value.d || line.perUnit > 4)) problems.push(`${seed}: line`);
    }
    expect(problems).toEqual([]);
  });

  it('builds mixed choices with one right card and distinct values', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      for (const task of generateTasks(createRng(seed))) {
        if (task.kind !== 'mixed') continue;
        const values = task.cards.map((c) => c.value);
        const distinct = values.every((a, i) => values.every((b, j) => i === j || !equivalent(a, b)));
        const right = task.cards.find((c) => c.id === task.correctId);
        const faces = task.cards.every((c) => c.face?.kind === 'mixed');
        if (!distinct || !faces || task.cards.length !== 3 || !right || !equivalent(right.value, task.value)) problems.push(`${seed}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('is deterministic for a seed', () => {
    expect(generateTasks(createRng(42))).toEqual(generateTasks(createRng(42)));
  });
});

describe('checkTask', () => {
  it('accepts any grouping with an empty tray and the right number of full plates', () => {
    const problems: string[] = [];
    for (const seed of SEEDS.slice(0, 200)) {
      for (const task of generateTasks(createRng(seed))) {
        if (task.kind !== 'group') continue;
        const { n, d } = task.value;
        const plateCount = Math.ceil(n / d);
        for (const plates of distributions(plateCount, d, n)) {
          const tray = n - plates.reduce((a, b) => a + b, 0);
          const answer: CampuranAnswer = { plates: { plates, tray }, placement: {} };
          const expected = tray === 0 && plates.filter((c) => c === d).length === Math.floor(n / d);
          if (checkTask(task, answer).correct !== expected) problems.push(`${seed}: ${plates.join(',')}+${tray}`);
        }
        if (!checkTask(task, solution(task)).correct) problems.push(`${seed}: solution`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('accepts exactly one line placement and one mixed card', () => {
    const problems: string[] = [];
    for (const seed of SEEDS.slice(0, 200)) {
      for (const task of generateTasks(createRng(seed))) {
        let answers: CampuranAnswer[] = [];
        if (task.kind === 'line') {
          const ids = tickIds(task.max, task.perUnit);
          answers = ids.map((id) => ({ plates: { plates: [], tray: 0 }, placement: { ...emptyPlacement(ids), [id]: task.card.id } }));
        }
        if (task.kind === 'mixed') answers = task.cards.map((c) => ({ plates: { plates: [], tray: 0 }, placement: { pilihan: c.id } }));
        if (task.kind === 'group') continue;
        const correct = answers.filter((a) => checkTask(task, a).correct);
        if (correct.length !== 1 || JSON.stringify(correct[0]) !== JSON.stringify(solution(task))) problems.push(`${seed}: ${task.kind}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('hints at filling one plate before the next', () => {
    const task: CampuranTask = { kind: 'group', value: { n: 5, d: 4 } };
    expect(checkTask(task, { plates: { plates: [3, 2], tray: 0 }, placement: {} })).toEqual({
      correct: false,
      hint: 'Penuhi satu piring dulu sebelum pindah ke piring berikutnya.',
    });
  });
});

describe('emptyAnswer and isComplete', () => {
  it('starts with every piece on the tray', () => {
    const task: CampuranTask = { kind: 'group', value: { n: 7, d: 3 } };
    expect(emptyAnswer(task)).toEqual({ plates: { plates: [0, 0, 0], tray: 7 }, placement: {} });
    expect(isComplete(task, emptyAnswer(task))).toBe(false);
    expect(isComplete(task, solution(task))).toBe(true);
  });

  it('needs the card placed for line and mixed tasks', () => {
    const [, line, mixed] = generateTasks(createRng(9));
    expect(isComplete(line, emptyAnswer(line))).toBe(false);
    expect(isComplete(mixed, emptyAnswer(mixed))).toBe(false);
    expect(isComplete(line, solution(line))).toBe(true);
    expect(isComplete(mixed, solution(mixed))).toBe(true);
    expect(toMixed(mixed.kind === 'mixed' ? mixed.value : { n: 5, d: 4 }).whole).toBeGreaterThanOrEqual(1);
  });
});
