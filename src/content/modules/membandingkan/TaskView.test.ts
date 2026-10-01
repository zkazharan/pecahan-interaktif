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

  it('opens and stacks the bars after a wrong answer', () => {
    render(TaskView, { props: { task: COMPARE, answer: { besar: 'c1' }, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(screen.getByRole('group', { name: 'Pita pecahan' })).toBeInTheDocument();
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
  });

  it('locks the cards once the task is settled', () => {
    render(TaskView, { props: { task: COMPARE, answer: { besar: 'c0' }, onanswer: vi.fn(), feedback: 'correct' } });
    expect(screen.getByRole('button', { name: 'Kartu sepertiga' })).toHaveAttribute('aria-disabled', 'true');
  });
});
