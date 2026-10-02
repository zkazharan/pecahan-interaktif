import { render, screen } from '@testing-library/svelte';
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

  it('drops the toggle once the answer is correct', () => {
    render(TaskView, { props: { task: COMPARE, answer: { besar: 'c0' }, onanswer: vi.fn(), feedback: 'correct' } });
    expect(screen.queryByRole('button', { name: 'bingung? buka pitanya ↓' })).toBeNull();
  });

  it('opens the bars after a wrong answer but only stacks them with diff', () => {
    const { container } = render(TaskView, { props: { task: COMPARE, answer: { besar: 'c1' }, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(screen.getByRole('group', { name: 'Pita pecahan' })).toBeInTheDocument();
    expect(screen.queryByText('lebih pendek!')).toBeNull();
    expect(container.querySelector('[data-testid="diff"]')).toBeNull();
    expect(container.querySelector('[data-diff]')).toBeNull();
  });

  it('stacks the chosen card onto the other one with diff', () => {
    const { container } = render(TaskView, { props: { task: COMPARE, answer: { besar: 'c1' }, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-task-kind="compare"]')).toHaveAttribute('data-diff', 'true');
    expect(screen.getByText('lebih pendek!')).toBeInTheDocument();
    expect(container.querySelector('[data-row="c1"] [data-ghost]')).not.toBeNull();
    expect(container.querySelector('[data-row="c0"] [data-ghost]')).toBeNull();
  });

  it('freezes the stacking while the difference is on screen', () => {
    render(TaskView, { props: { task: COMPARE, answer: { besar: 'c1' }, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(screen.getByRole('button', { name: 'Potongan seperempat' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('flags the first out-of-order pair and stacks the left one onto the right one', () => {
    const task: MembandingkanTask = {
      kind: 'order',
      cards: [
        { id: 'c0', value: frac(1, 2) },
        { id: 'c1', value: frac(1, 3) },
        { id: 'c2', value: frac(1, 4) },
      ],
    };
    const { container } = render(TaskView, {
      props: { task, answer: { s1: 'c0', s2: 'c2', s3: 'c1' }, onanswer: vi.fn(), feedback: 'wrong', diff: true },
    });
    expect(container.querySelectorAll('[data-flagged]')).toHaveLength(2);
    expect(container.querySelector('[data-testid="slot-s1"]')).toHaveAttribute('data-flagged');
    expect(container.querySelector('[data-testid="slot-s2"]')).toHaveAttribute('data-flagged');
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
    expect(container.querySelector('[data-row="c0"] [data-ghost]')).not.toBeNull();
  });

  it('flags nothing on the order task without diff', () => {
    const task: MembandingkanTask = {
      kind: 'order',
      cards: [
        { id: 'c0', value: frac(1, 2) },
        { id: 'c1', value: frac(1, 3) },
        { id: 'c2', value: frac(1, 4) },
      ],
    };
    const { container } = render(TaskView, {
      props: { task, answer: { s1: 'c0', s2: 'c2', s3: 'c1' }, onanswer: vi.fn(), feedback: 'wrong' },
    });
    expect(container.querySelectorAll('[data-flagged]')).toHaveLength(0);
    expect(container.querySelector('[data-diff]')).toBeNull();
  });

  it('prints the position values on the number line only with diff', () => {
    const task: MembandingkanTask = {
      kind: 'line',
      perUnit: 12,
      cards: [
        { id: 'c0', value: frac(1, 3) },
        { id: 'c1', value: frac(1, 4) },
      ],
    };
    const answer = { ...Object.fromEntries(Array.from({ length: 13 }, (_, k) => [`t${k}`, null])), t6: 'c0', t2: 'c1' };
    const plain = render(TaskView, { props: { task, answer, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(plain.container.querySelectorAll('[data-placed-value]')).toHaveLength(0);
    plain.unmount();
    const { container } = render(TaskView, { props: { task, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-task-kind="line"]')).toHaveAttribute('data-diff', 'true');
    expect(container.querySelectorAll('[data-placed-value]').length).toBeGreaterThan(0);
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

  it('marks each card with its own division in its own colour', () => {
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
    const above = container.querySelectorAll('line.mark[data-side="above"]');
    const below = container.querySelectorAll('line.mark[data-side="below"]');
    expect(above).toHaveLength(4);
    expect(below).toHaveLength(5);
    expect(above[0].getAttribute('style')).toContain('var(--frac-1)');
    expect(below[0].getAttribute('style')).toContain('var(--frac-2)');
    expect(container.querySelector('[data-card="c0"]')!.getAttribute('style')).toContain('var(--frac-1)');
    expect(container.querySelector('[data-card="c1"]')!.getAttribute('style')).toContain('var(--frac-2)');
  });

  it('marks compare tasks for the e2e helper', () => {
    const { container } = render(TaskView, { props: { task: COMPARE, answer: { besar: null }, onanswer: vi.fn(), feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="compare"]')).not.toBeNull();
  });
});
