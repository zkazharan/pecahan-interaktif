import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import TaskView from './TaskView.svelte';
import { emptyAnswer, generateTasks, type MembacaTask } from './tasks';

const shade: MembacaTask = { kind: 'shade', target: frac(2, 5) };
const [, , line, , read] = generateTasks(createRng(7));

describe('membaca-pecahan TaskView', () => {
  it('toggles a slice in the answer', async () => {
    const onanswer = vi.fn();
    const { container } = render(TaskView, { props: { task: shade, answer: emptyAnswer(shade), onanswer, feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="shade"]')).toHaveAttribute('data-target', '2/5');
    await fireEvent.click(screen.getByRole('button', { name: 'Potongan 3' }));
    expect(onanswer).toHaveBeenCalledWith({ shaded: [false, false, true, false, false], placement: {} });
  });

  it('stops shading once settled', () => {
    render(TaskView, { props: { task: shade, answer: { shaded: [true, true, false, false, false], placement: {} }, onanswer: vi.fn(), feedback: 'correct' } });
    expect(screen.queryAllByRole('button', { name: /^Potongan/ })).toHaveLength(0);
  });

  it('shows a number line for line tasks', () => {
    const { container } = render(TaskView, { props: { task: line, answer: emptyAnswer(line), onanswer: vi.fn(), feedback: 'none' } });
    const perUnit = line.kind === 'line' ? line.perUnit : 0;
    expect(container.querySelector('[data-task-kind="line"]')).toHaveAttribute('data-per-unit', String(perUnit));
    expect(container.querySelectorAll('[data-tick]')).toHaveLength(perUnit + 1);
  });

  it('shows the shaded martabak and three cards for read tasks', () => {
    const { container } = render(TaskView, { props: { task: read, answer: emptyAnswer(read), onanswer: vi.fn(), feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="read"]')).toHaveAttribute('data-correct', read.kind === 'read' ? read.correctId : '');
    expect(container.querySelectorAll('[data-card]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slice]').length).toBeGreaterThan(0);
  });
});
