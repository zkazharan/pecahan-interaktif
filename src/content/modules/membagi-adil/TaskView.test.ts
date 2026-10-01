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

  it('draws equal-cut guides on the cut task while the wrong answer is on screen', () => {
    const task = { kind: 'cut' as const, target: 5 };
    const { container } = render(TaskView, { props: { task, answer: { placement: {}, cuts: 3 }, onanswer: () => {}, feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-task-kind="cut"]')).toHaveAttribute('data-diff', 'true');
    expect(container.querySelectorAll('[data-guide]')).toHaveLength(5);
  });

  it('draws nothing extra without diff', () => {
    const task = { kind: 'cut' as const, target: 5 };
    const { container } = render(TaskView, { props: { task, answer: { placement: {}, cuts: 3 }, onanswer: () => {}, feedback: 'wrong' } });
    expect(container.querySelectorAll('[data-guide]')).toHaveLength(0);
    expect(container.querySelector('[data-diff]')).toBeNull();
    expect(container.querySelector('[data-testid="diff"]')).toBeNull();
  });

  it('draws guides over the sort card while the wrong answer is on screen', () => {
    const slices = sort.kind === 'sort' && sort.card.face?.kind === 'shape' ? sort.card.face.slices.length : 0;
    const { container } = render(TaskView, { props: { task: sort, answer: emptyAnswer(sort), onanswer: () => {}, feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-task-kind="sort"]')).toHaveAttribute('data-diff', 'true');
    expect(container.querySelectorAll('[data-testid="diff"] [data-guide]')).toHaveLength(slices);
    expect(container.querySelector('[data-testid="diff"]')).toHaveTextContent('Garis merah: kalau dipotong sama besar');
  });

  it('draws the chosen pick card with guides for the target', () => {
    const task = pick as Extract<MembagiAdilTask, { kind: 'pick' }>;
    const wrong = task.cards.find((card) => card.id !== task.correctId)!;
    const { container } = render(TaskView, { props: { task, answer: { placement: { pilihan: wrong.id }, cuts: 1 }, onanswer: () => {}, feedback: 'wrong', diff: true } });
    expect(container.querySelectorAll('[data-testid="diff"] [data-guide]')).toHaveLength(task.target);
    const caption = container.querySelector('[data-testid="diff"] .caption')!;
    expect(caption).toHaveTextContent(`Pilihanmu. Garis merah: kalau dipotong ${task.target} sama besar.`);
    expect(caption).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no pick caption without diff', () => {
    const task = pick as Extract<MembagiAdilTask, { kind: 'pick' }>;
    const { container } = render(TaskView, { props: { task, answer: { placement: { pilihan: task.correctId }, cuts: 1 }, onanswer: () => {}, feedback: 'none' } });
    expect(container.querySelector('.caption')).toBeNull();
  });

  it('draws no pick difference when no card is chosen', () => {
    const { container } = render(TaskView, { props: { task: pick, answer: emptyAnswer(pick), onanswer: () => {}, feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-testid="diff"]')).toBeNull();
  });
});
