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
    expect(countDistractors(12, 3, 1)).toEqual([8, 12]);
    expect(countDistractors(8, 2, 1)).toEqual([8, 1]);
    for (let bags = 2; bags <= 6; bags++) {
      for (let per = 2; per <= Math.min(4, Math.floor(24 / bags)); per++) {
        for (let take = 1; take < bags; take++) expect(countDistractors(bags * per, bags, take)).toHaveLength(2);
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
