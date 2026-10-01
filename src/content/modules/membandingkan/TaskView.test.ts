import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../../../lib/fraction';
import TaskView from './TaskView.svelte';
import type { MembandingkanTask } from './tasks';

const COMPARE: MembandingkanTask = {
  kind: 'compare',
  cards: [
    { id: 'c0', value: frac(1, 3) },
    { id: 'c1', value: frac(1, 4) },
  ],
};

describe('membandingkan TaskView', () => {
  it('asks the compare question and hides the bars until asked', async () => {
    render(TaskView, { props: { task: COMPARE, answer: { besar: null }, onanswer: vi.fn(), feedback: 'none' } });
    expect(screen.getByText('lebih besar')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Pita pecahan' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'bingung? buka pitanya ↓' }));
    expect(screen.getByRole('group', { name: 'Pita pecahan' })).toBeInTheDocument();
  });

  it('opens and stacks the bars after a wrong answer', () => {
    render(TaskView, { props: { task: COMPARE, answer: { besar: 'c1' }, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(screen.getByRole('group', { name: 'Pita pecahan' })).toBeInTheDocument();
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
  });

  it('keeps the bars open and stacks the larger piece when the solution is shown', () => {
    const task: MembandingkanTask = {
      kind: 'compare',
      cards: [
        { id: 'c0', value: frac(1, 4) },
        { id: 'c1', value: frac(1, 3) },
      ],
    };
    render(TaskView, { props: { task, answer: { besar: 'c1' }, onanswer: vi.fn(), feedback: 'shown' } });
    expect(screen.getByRole('group', { name: 'Pita pecahan' })).toBeInTheDocument();
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
  });

  it('lets the learner un-stack while the answer is wrong', async () => {
    render(TaskView, { props: { task: COMPARE, answer: { besar: 'c1' }, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
    const piece = screen.getByRole('button', { name: 'Potongan sepertiga' });
    await fireEvent.keyDown(piece, { key: ' ' });
    await fireEvent.keyDown(piece, { key: ' ' });
    await tick();
    expect(screen.queryByText('lebih panjang!')).toBeNull();
  });

  it('locks the cards once the task is settled', () => {
    render(TaskView, { props: { task: COMPARE, answer: { besar: 'c0' }, onanswer: vi.fn(), feedback: 'correct' } });
    expect(screen.getByRole('button', { name: 'Kartu sepertiga' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows a number line for line tasks', () => {
    const task: MembandingkanTask = {
      kind: 'line',
      perUnit: 12,
      cards: [
        { id: 'c0', value: frac(1, 3) },
        { id: 'c1', value: frac(1, 4) },
      ],
    };
    const { container } = render(TaskView, {
      props: { task, answer: Object.fromEntries(Array.from({ length: 13 }, (_, k) => [`t${k}`, null])), onanswer: vi.fn(), feedback: 'none' },
    });
    const root = container.querySelector('[data-task-kind="line"]')!;
    expect(root.getAttribute('data-per-unit')).toBe('12');
    expect(container.querySelectorAll('[data-tick]')).toHaveLength(13);
    expect(screen.getByTestId('line-pile').querySelectorAll('[data-card]')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'bingung? buka pitanya ↓' })).toBeInTheDocument();
  });

  it('marks compare tasks for the e2e helper', () => {
    const { container } = render(TaskView, { props: { task: COMPARE, answer: { besar: null }, onanswer: vi.fn(), feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="compare"]')).not.toBeNull();
  });
});
