import { describe, expect, it } from 'vitest';
import { equivalent, frac, lcm } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import { emptyPlacement, type Placement } from '../../../manipulatives/cardSlots';
import { tickIds } from '../../../manipulatives/numberLine';
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
  if (task.kind === 'order') return permutations(ids).map(([s1, s2, s3]) => ({ s1, s2, s3 }));
  const ticks = tickIds(1, task.perUnit);
  const out: Placement[] = [];
  for (const a of ticks) {
    for (const b of ticks) if (a !== b) out.push({ ...emptyPlacement(ticks), [a]: ids[0], [b]: ids[1] });
  }
  return out;
}

describe('generateTasks', () => {
  it('always makes compare, order, compare, order, line', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const tasks = generateTasks(createRng(seed));
      const shape = tasks.map((t) => `${t.kind}${t.cards.length}`).join(',');
      if (shape !== 'compare2,order3,compare2,order3,line2') problems.push(`${seed}: ${shape}`);
    }
    expect(problems).toEqual([]);
  });

  it('keeps every fraction proper and distinct, with the planned numerators', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      generateTasks(createRng(seed)).forEach((task, index) => {
        const values = task.cards.map((c) => c.value);
        for (const v of values) {
          if (v.d < 2 || v.d > 12 || v.n < 1 || v.n >= v.d) problems.push(`${seed}/${index}: ${v.n}/${v.d}`);
          if (index < 2 && v.n !== 1) problems.push(`${seed}/${index}: unit`);
          if ((index === 2 || index === 3) && v.n < 2) problems.push(`${seed}/${index}: non-unit`);
        }
        if (values.some((a, i) => values.some((b, j) => i < j && equivalent(a, b)))) problems.push(`${seed}/${index}: equal values`);
        if (new Set(task.cards.map((c) => c.id)).size !== task.cards.length) problems.push(`${seed}/${index}: ids`);
      });
    }
    expect(problems).toEqual([]);
  });

  it('divides the line by the lcm of two different small denominators', () => {
    const problems: string[] = [];
    for (const seed of SEEDS) {
      const line = generateTasks(createRng(seed))[4];
      if (line.kind !== 'line') continue;
      const [a, b] = line.cards.map((c) => c.value);
      if (a.d === b.d || a.d > 6 || b.d > 6 || line.perUnit !== lcm(a.d, b.d) || line.perUnit > 12) problems.push(`${seed}`);
    }
    expect(problems).toEqual([]);
  });

  it('is deterministic for a seed', () => {
    expect(generateTasks(createRng(42))).toEqual(generateTasks(createRng(42)));
  });
});

describe('checkTask', () => {
  it('accepts exactly one arrangement, and it is the solution', () => {
    const problems: string[] = [];
    for (const seed of SEEDS.slice(0, 200)) {
      for (const task of generateTasks(createRng(seed))) {
        const correct = allAnswers(task).filter((answer) => checkTask(task, answer).correct);
        if (correct.length !== 1 || JSON.stringify(correct[0]) !== JSON.stringify(solution(task))) problems.push(`${seed}: ${task.kind}`);
      }
    }
    expect(problems).toEqual([]);
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

  it('gives the line hint with the number of small parts', () => {
    const task: MembandingkanTask = {
      kind: 'line',
      perUnit: 12,
      cards: [
        { id: 'c0', value: frac(1, 3) },
        { id: 'c1', value: frac(1, 4) },
      ],
    };
    const swapped = { ...emptyPlacement(tickIds(1, 12)), t3: 'c0', t4: 'c1' };
    expect(checkTask(task, swapped)).toEqual({
      correct: false,
      hint: 'Bagi garis jadi 12 bagian kecil, lalu hitung langkah untuk setiap kartu.',
    });
  });
});

describe('isComplete and emptyAnswer', () => {
  it('needs every slot filled', () => {
    const task = generateTasks(createRng(9))[1];
    if (task.kind === 'line') throw new Error('expected an order task');
    const empty = emptyAnswer(task);
    expect(Object.keys(empty)).toEqual(slotsFor(task).map((s) => s.id));
    expect(isComplete(task, empty)).toBe(false);
    expect(isComplete(task, { ...empty, s1: 'c0', s2: 'c1' })).toBe(false);
    expect(isComplete(task, solution(task))).toBe(true);
  });

  it('needs both cards on the line', () => {
    const task = generateTasks(createRng(9))[4];
    if (task.kind !== 'line') throw new Error('expected a line task');
    const empty = emptyAnswer(task);
    expect(Object.keys(empty)).toEqual(tickIds(1, task.perUnit));
    expect(isComplete(task, { ...empty, t0: 'c0' })).toBe(false);
    expect(isComplete(task, solution(task))).toBe(true);
  });
});
