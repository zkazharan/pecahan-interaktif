import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../../../lib/random';
import TaskView from './TaskView.svelte';
import { emptyAnswer, generateTasks, type MembagiAdilTask } from './tasks';

const [sort, , cut, , pick] = generateTasks(createRng(11)) as MembagiAdilTask[];

describe('membagi-adil TaskView', () => {
  it('sorts the martabak card into a slot', async () => {
    const onanswer = vi.fn();
    const { container } = render(TaskView, { props: { task: sort, answer: emptyAnswer(sort), onanswer, feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="sort"]')).not.toBeNull();
    const card = container.querySelector<HTMLElement>('[data-card]')!;
    await fireEvent.keyDown(card, { key: ' ' });
    await fireEvent.keyDown(card, { key: ' ' });
    expect(onanswer).toHaveBeenCalledWith({ placement: { adil: 'c0', tidak: null }, cuts: 1 });
  });

  it('cuts with the stepper and shows the new cut', async () => {
    const onanswer = vi.fn();
    const { container, rerender } = render(TaskView, { props: { task: cut, answer: emptyAnswer(cut), onanswer, feedback: 'none' } });
    await userEvent.click(screen.getByRole('button', { name: 'Tambah jumlah potong' }));
    expect(onanswer).toHaveBeenCalledWith({ placement: {}, cuts: 2 });
    await rerender({ answer: { placement: {}, cuts: 4 } });
    expect(container.querySelectorAll('[data-slice]')).toHaveLength(4);
  });

  it('locks the stepper once settled', () => {
    render(TaskView, { props: { task: cut, answer: { placement: {}, cuts: 3 }, onanswer: vi.fn(), feedback: 'correct' } });
    expect(screen.getByRole('button', { name: 'Tambah jumlah potong' })).toBeDisabled();
  });

  it('asks for the unit fraction in stacked form and exposes the answer hook', () => {
    const { container } = render(TaskView, { props: { task: pick, answer: emptyAnswer(pick), onanswer: vi.fn(), feedback: 'none' } });
    const root = container.querySelector('[data-task-kind="pick"]')!;
    expect(root.getAttribute('data-correct')).toBe(pick.kind === 'pick' ? pick.correctId : '');
    expect(screen.getAllByRole('button', { name: /^Kartu martabak/ })).toHaveLength(3);
  });
});
