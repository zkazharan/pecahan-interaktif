import { describe, expect, it } from 'vitest';
import { equivalent, frac } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import { emptyPlacement } from '../../../manipulatives/cardSlots';
import { tickIds } from '../../../manipulatives/numberLine';
import {
  checkTask,
  emptyAnswer,
  generateTasks,
  isComplete,
  solution,
  type MembacaAnswer,
  type MembacaTask,
} from './tasks';

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1);

function allAnswers(task: MembacaTask): MembacaAnswer[] {
  if (task.kind === 'shade') {
    return Array.from({ length: task.target.d + 1 }, (_, k) => ({
      shaded: Array.from({ length: task.target.d }, (_, i) => i < k),
      placement: {},
    }));
  }
  if (task.kind === 'line') {
    const ids = tickIds(1, task.perUnit);
    return ids.map((id) => ({ shaded: [], placement: { ...emptyPlacement(ids), [id]: task.card.id } }));
  }
  return task.cards.map((card) => ({ shaded: [], placement: { pilihan: card.id } }));
}

describe('generateTasks', () => {
  it('makes shade, shade, line, line, read within the planned ranges', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const tasks = generateTasks(createRng(seed));
      const kinds = tasks.map((t) => t.kind).join(',');
      if (kinds !== 'shade,shade,line,line,read') problems.push(`${seed}: ${kinds}`);
      const [s1, s2, l1, l2, r] = tasks;
      if (s1.kind === 'shade' && (s1.target.d < 2 || s1.target.d > 8 || s1.target.n < 1 || s1.target.n >= s1.target.d)) problems.push(`${seed}: s1`);
      if (s2.kind === 'shade' && (s2.target.d < 3 || s2.target.d > 12 || s2.target.n < 1 || s2.target.n >= s2.target.d)) problems.push(`${seed}: s2`);
      if (l1.kind === 'line' && (l1.perUnit !== l1.card.value.d || l1.card.value.d > 8)) problems.push(`${seed}: l1`);
      if (l2.kind === 'line' && (l2.perUnit !== l2.card.value.d || l2.card.value.n < 2 || l2.card.value.d > 12)) problems.push(`${seed}: l2`);
      if (r.kind === 'read') {
        const values = r.cards.map((c) => c.value);
        const distinct = values.every((a, i) => values.every((b, j) => i === j || !equivalent(a, b)));
        const right = r.cards.find((c) => c.id === r.correctId);
        if (!distinct || r.cards.length !== 3 || !right || !equivalent(right.value, r.shaded) || 2 * r.shaded.n === r.shaded.d) problems.push(`${seed}: read`);
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

  it('counts shaded slices in any order', () => {
    const task: MembacaTask = { kind: 'shade', target: frac(2, 5) };
    expect(checkTask(task, { shaded: [false, true, false, false, true], placement: {} }).correct).toBe(true);
    expect(checkTask(task, { shaded: [true, true, true, false, false], placement: {} })).toEqual({
      correct: false,
      hint: 'Pembilangnya 2, jadi arsir 2 potong.',
    });
  });
});

describe('isComplete', () => {
  it('treats no shading at all as not finished', () => {
    const task: MembacaTask = { kind: 'shade', target: frac(1, 3) };
    expect(emptyAnswer(task)).toEqual({ shaded: [false, false, false], placement: {} });
    expect(isComplete(task, emptyAnswer(task))).toBe(false);
    expect(isComplete(task, { shaded: [false, true, false], placement: {} })).toBe(true);
  });

  it('needs the card on the line or in the slot', () => {
    const [, , line, , read] = generateTasks(createRng(5));
    expect(isComplete(line, emptyAnswer(line))).toBe(false);
    expect(isComplete(read, emptyAnswer(read))).toBe(false);
    expect(isComplete(line, solution(line))).toBe(true);
    expect(isComplete(read, solution(read))).toBe(true);
  });
});
