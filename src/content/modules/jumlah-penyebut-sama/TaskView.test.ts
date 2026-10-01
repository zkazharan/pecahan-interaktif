import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../../../lib/random';
import TaskView from './TaskView.svelte';
import { emptyAnswer, generateTasks } from './tasks';

const [add, , sub] = generateTasks(createRng(21));

describe('jumlah-penyebut-sama TaskView', () => {
  it('gives the loyang as an aid and grades the card', async () => {
    const onanswer = vi.fn();
    const { container } = render(TaskView, { props: { task: add, answer: emptyAnswer(add), onanswer, feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="add"]')).toHaveAttribute('data-correct', add.correctId);
    expect(screen.getByTestId('tray').querySelectorAll('[data-tray-piece]')).toHaveLength(add.kind === 'add' ? add.a + add.b : 0);
    const card = container.querySelector<HTMLElement>(`[data-card="${add.correctId}"]`)!;
    await fireEvent.keyDown(card, { key: ' ' });
    await fireEvent.keyDown(card, { key: ' ' });
    expect(onanswer).toHaveBeenCalledWith({ ...emptyAnswer(add), placement: { pilihan: add.correctId } });
  });

  it('starts subtraction with the pieces on the loyang', () => {
    const { container } = render(TaskView, { props: { task: sub, answer: emptyAnswer(sub), onanswer: vi.fn(), feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="sub"]')).not.toBeNull();
    expect(screen.getByTestId('plate-0').querySelectorAll('[data-plate-piece]')).toHaveLength(sub.a);
  });
});
