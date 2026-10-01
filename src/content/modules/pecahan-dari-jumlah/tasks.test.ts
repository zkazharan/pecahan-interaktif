import { describe, expect, it } from 'vitest';
import { createRng } from '../../../lib/random';
import { dealAll, startCollection } from '../../../manipulatives/collection';
import { checkTask, countDistractors, emptyAnswer, generateTasks, isComplete, solution, type ShareTask } from './tasks';

describe('pecahan-dari-jumlah tasks', () => {
  it('builds five valid tasks for 1000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const tasks = generateTasks(createRng(seed));
      expect(tasks.map((t) => t.kind)).toEqual(['split', 'take', 'count', 'split', 'count']);
      expect(tasks[0].kind === 'split' && tasks[3].kind === 'split' && tasks[0].bags !== tasks[3].bags).toBe(true);
      const shares = [tasks[1], tasks[2], tasks[4]].map((t) => (t.kind === 'split' ? '' : `${t.total}-${t.bags}-${t.take}`));
      expect(new Set(shares).size).toBe(3);
      for (const task of tasks) {
        expect(task.total).toBeLessThanOrEqual(24);
        expect(task.total % task.bags).toBe(0);
        expect(task.bags).toBeGreaterThanOrEqual(2);
        expect(task.bags).toBeLessThanOrEqual(6);
        if (task.kind === 'split') expect(task.total).toBeLessThanOrEqual(16);
        if (task.kind !== 'split') {
          expect(task.take).toBeGreaterThanOrEqual(1);
          expect(task.take).toBeLessThan(task.bags);
        }
        if (task.kind === 'count') {
          const values = task.cards.map((c) => c.value.n);
          expect(new Set(values).size).toBe(3);
          expect(task.cards.every((c) => c.value.d === 1 && c.value.n > 0)).toBe(true);
          expect(task.cards.find((c) => c.id === task.correctId)!.value.n).toBe((task.take * task.total) / task.bags);
        }
      }
    }
  });

  it('accepts exactly one answer: the solution', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const task of generateTasks(createRng(seed))) {
        expect(checkTask(task, solution(task)).correct).toBe(true);
        if (task.kind === 'count') {
          const right = task.cards.filter((card) => checkTask(task, { ...emptyAnswer(task), placement: { pilihan: card.id } }).correct);
          expect(right.map((c) => c.id)).toEqual([task.correctId]);
        }
      }
    }
  });

  it('always offers two different wrong counts', () => {
    expect(countDistractors(12, 3, 1)).toEqual([1, 8]);
    expect(countDistractors(8, 2, 1)).toEqual([1, 8]);
    for (let bags = 2; bags <= 6; bags++) {
      for (let per = 2; per <= Math.min(4, Math.floor(24 / bags)); per++) {
        for (let take = 1; take < bags; take++) expect(countDistractors(bags * per, bags, take)).toHaveLength(2);
      }
    }
  });

  it('always offers the numerator and avoids the whole total when possible', () => {
    for (let bags = 2; bags <= 6; bags++) {
      for (let per = 2; per <= Math.min(4, Math.floor(24 / bags)); per++) {
        for (let take = 1; take < bags; take++) {
          const total = bags * per;
          const correct = take * per;
          const out = countDistractors(total, bags, take);
          expect(out).toContain(take);
          const others = [per, total - correct, correct + per].filter((v, i, all) => v > 0 && v !== correct && v !== take && v !== total && all.indexOf(v) === i);
          if (others.length >= 1) expect(out).not.toContain(total);
        }
      }
    }
  });

  it('needs every marble dealt before checking a split', () => {
    const task: ShareTask = { kind: 'split', total: 6, bags: 3 };
    expect(isComplete(task, emptyAnswer(task))).toBe(false);
    expect(isComplete(task, { ...emptyAnswer(task), collection: { bags: [4, 1, 1], tray: 0 } })).toBe(true);
    expect(checkTask(task, { ...emptyAnswer(task), collection: { bags: [4, 1, 1], tray: 0 } })).toEqual({
      correct: false,
      hint: 'Setiap kantong harus berisi sama banyak.',
    });
    expect(checkTask(task, { ...emptyAnswer(task), collection: dealAll(6, 3) }).correct).toBe(true);
  });

  it('hints at the one-bag count when a count task is wrong', () => {
    const task = generateTasks(createRng(1))[2];
    if (task.kind !== 'count') throw new Error('expected count task');
    const wrong = task.cards.find((c) => c.id !== task.correctId)!;
    expect(checkTask(task, { ...emptyAnswer(task), placement: { pilihan: wrong.id } })).toEqual({
      correct: false,
      hint: 'Cari isi satu kantong dulu, lalu ambil sebanyak pembilang.',
    });
  });

  it('checks how many bags are taken', () => {
    const task: ShareTask = { kind: 'take', total: 12, bags: 4, take: 3 };
    expect(emptyAnswer(task).collection).toEqual(dealAll(12, 4));
    expect(isComplete(task, emptyAnswer(task))).toBe(false);
    expect(checkTask(task, { ...emptyAnswer(task), taken: [true, true, false, false] })).toEqual({
      correct: false,
      hint: 'Penyebut = banyak kantong. Pembilang = kantong yang diambil.',
    });
    expect(checkTask(task, { ...emptyAnswer(task), taken: [false, true, true, true] }).correct).toBe(true);
  });

  it('starts a split with all marbles in the tray', () => {
    const task: ShareTask = { kind: 'split', total: 8, bags: 2 };
    expect(emptyAnswer(task).collection).toEqual(startCollection(8, 2));
  });
});
