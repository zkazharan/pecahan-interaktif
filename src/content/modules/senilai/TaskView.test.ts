import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../../../lib/random';
import TaskView from './TaskView.svelte';
import { emptyAnswer, generateTasks } from './tasks';

const [recut, pair, simple] = generateTasks(createRng(12));

describe('senilai TaskView', () => {
  it('re-cuts the bar with the stepper', async () => {
    const onanswer = vi.fn();
    const { container } = render(TaskView, { props: { task: recut, answer: emptyAnswer(recut), onanswer, feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="recut"]')).toHaveAttribute('data-k', recut.kind === 'recut' ? String(recut.k) : '');
    await userEvent.click(screen.getByRole('button', { name: 'Tambah potong ulang' }));
    expect(onanswer).toHaveBeenCalledWith({ cuts: 2, placement: {} });
  });

  it('labels pair slots with stacked fractions and exposes the solution', () => {
    const { container } = render(TaskView, { props: { task: pair, answer: emptyAnswer(pair), onanswer: vi.fn(), feedback: 'none' } });
    const root = container.querySelector('[data-task-kind="pair"]')!;
    expect(JSON.parse(root.getAttribute('data-solution')!)).toEqual(pair.kind === 'pair' ? pair.solution : {});
    expect(container.querySelectorAll('.slot [role="img"]')).toHaveLength(3);
  });

  it('offers three cards for simplify', () => {
    const { container } = render(TaskView, { props: { task: simple, answer: emptyAnswer(simple), onanswer: vi.fn(), feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="simplify"]')).toHaveAttribute('data-correct', simple.kind === 'simplify' ? simple.correctId : '');
    expect(container.querySelectorAll('[data-card]')).toHaveLength(3);
  });

  it('draws the target bar under the learner bar on a wrong re-cut with diff', () => {
    const answer = { cuts: 2, placement: {} };
    const plain = render(TaskView, { props: { task: recut, answer, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(plain.container.querySelector('[data-testid="diff"]')).toBeNull();
    expect(plain.container.querySelector('[data-diff]')).toBeNull();
    plain.unmount();
    const { container } = render(TaskView, { props: { task: recut, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-task-kind="recut"]')).toHaveAttribute('data-diff', 'true');
    expect(container.querySelector('[data-testid="diff"] [data-row="target"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="diff"] [data-row="base"]')).not.toBeNull();
  });

  it('flags the wrong pair slots and compares each of them with diff', () => {
    if (pair.kind !== 'pair') throw new Error('expected pair');
    const swapped = { ...pair.solution, s0: pair.solution.s1, s1: pair.solution.s0 };
    const plain = render(TaskView, { props: { task: pair, answer: { cuts: 1, placement: swapped }, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(plain.container.querySelectorAll('[data-flagged]')).toHaveLength(0);
    expect(plain.container.querySelector('[data-testid="diff"]')).toBeNull();
    plain.unmount();
    const { container } = render(TaskView, {
      props: { task: pair, answer: { cuts: 1, placement: swapped }, onanswer: vi.fn(), feedback: 'wrong', diff: true },
    });
    expect(container.querySelectorAll('[data-flagged]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="diff"] [data-testid="diff-bars"]')).toHaveLength(2);
  });

  it('draws a comparison for every wrong filled slot, at most three', () => {
    if (pair.kind !== 'pair') throw new Error('expected pair');
    const ids = pair.slots.map((slot) => slot.id);
    const rotated = Object.fromEntries(ids.map((id, i) => [id, pair.solution[ids[(i + 1) % ids.length]]]));
    const { container } = render(TaskView, {
      props: { task: pair, answer: { cuts: 1, placement: rotated }, onanswer: vi.fn(), feedback: 'wrong', diff: true },
    });
    expect(container.querySelectorAll('[data-testid="diff-bars"]')).toHaveLength(Math.min(3, ids.length));
  });

  it('skips empty wrong slots', () => {
    if (pair.kind !== 'pair') throw new Error('expected pair');
    const [first] = pair.slots;
    const { container } = render(TaskView, {
      props: { task: pair, answer: { cuts: 1, placement: { [first.id]: pair.solution[pair.slots[1].id] } }, onanswer: vi.fn(), feedback: 'wrong', diff: true },
    });
    expect(container.querySelectorAll('[data-testid="diff-bars"]')).toHaveLength(1);
  });

  it('compares the chosen card with the target on simplify with diff', () => {
    if (simple.kind !== 'simplify') throw new Error('expected simplify');
    const wrongId = simple.cards.find((card) => card.id !== simple.correctId)!.id;
    const answer = { cuts: 1, placement: { pilihan: wrongId } };
    const plain = render(TaskView, { props: { task: simple, answer, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(plain.container.querySelector('[data-testid="diff"]')).toBeNull();
    plain.unmount();
    const { container } = render(TaskView, { props: { task: simple, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-task-kind="simplify"]')).toHaveAttribute('data-diff', 'true');
    expect(container.querySelector('[data-testid="diff"] [data-testid="diff-bars"]')).not.toBeNull();
  });
});
