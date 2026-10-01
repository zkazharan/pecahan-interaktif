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
});
