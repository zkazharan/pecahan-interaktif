import { describe, expect, it } from 'vitest';
import { createRng } from '../../../lib/random';
import { isEqualCut } from '../../../manipulatives/circle';
import {
  CUT_MAX,
  CUT_MIN,
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  type MembagiAdilAnswer,
  type MembagiAdilTask,
} from './tasks';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1);

function allAnswers(task: MembagiAdilTask): MembagiAdilAnswer[] {
  if (task.kind === 'sort') {
    return [
      { placement: { adil: task.card.id, tidak: null }, cuts: 1 },
      { placement: { adil: null, tidak: task.card.id }, cuts: 1 },
    ];
  }
  if (task.kind === 'cut') {
    return Array.from({ length: CUT_MAX - CUT_MIN + 1 }, (_, i) => ({ placement: {}, cuts: CUT_MIN + i }));
  }
  return task.cards.map((card) => ({ placement: { pilihan: card.id }, cuts: 1 }));
}

describe('generateTasks', () => {
  it('makes sort, sort, cut, cut, pick with one fair and one unfair sort', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const tasks = generateTasks(createRng(seed));
      const kinds = tasks.map((t) => t.kind).join(',');
      if (kinds !== 'sort,sort,cut,cut,pick') problems.push(`${seed}: ${kinds}`);
      const [a, b, c, d] = tasks;
      if (a.kind === 'sort' && b.kind === 'sort' && a.fair === b.fair) problems.push(`${seed}: same fairness`);
      for (const t of [a, b]) {
        if (t.kind !== 'sort' || t.card.face?.kind !== 'shape') continue;
        if (isEqualCut(t.card.face.slices) !== t.fair) problems.push(`${seed}: fairness mismatch`);
      }
      if (c.kind === 'cut' && d.kind === 'cut') {
        if (c.target === d.target || [c.target, d.target].some((x) => x < 2 || x > 12)) problems.push(`${seed}: cut targets ${c.target},${d.target}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('builds a pick task with exactly one fair card of the right size', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const pick = generateTasks(createRng(seed))[4];
      if (pick.kind !== 'pick') continue;
      const matches = pick.cards.filter((card) => {
        const face = card.face;
        return face?.kind === 'shape' && isEqualCut(face.slices) && face.slices.length === pick.target && face.shaded.filter(Boolean).length === 1;
      });
      if (pick.cards.length !== 3 || matches.length !== 1 || matches[0].id !== pick.correctId) problems.push(`${seed}`);
      if (new Set(pick.cards.map((c) => c.id)).size !== 3) problems.push(`${seed}: ids`);
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

  it('gives a hint that says whether there are too few or too many cuts', () => {
    const task: MembagiAdilTask = { kind: 'cut', target: 4 };
    expect(checkTask(task, { placement: {}, cuts: 3 }).hint).toBe('Masih kurang. Ada 4 anak, jadi perlu 4 potong.');
    expect(checkTask(task, { placement: {}, cuts: 6 }).hint).toBe('Kebanyakan. Ada 4 anak, jadi cukup 4 potong.');
  });
});

describe('isComplete and emptyAnswer', () => {
  it('needs a placed card or more than one cut', () => {
    const [sort, , cut, , pick] = generateTasks(createRng(3));
    expect(isComplete(sort, emptyAnswer(sort))).toBe(false);
    expect(isComplete(cut, emptyAnswer(cut))).toBe(false);
    expect(emptyAnswer(cut).cuts).toBe(1);
    expect(isComplete(cut, { placement: {}, cuts: 2 })).toBe(true);
    expect(isComplete(pick, emptyAnswer(pick))).toBe(false);
    for (const task of [sort, cut, pick]) expect(isComplete(task, solution(task))).toBe(true);
  });
});
