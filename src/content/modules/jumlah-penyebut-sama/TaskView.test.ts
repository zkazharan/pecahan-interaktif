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

  it.each([add, sub])('compares the chosen card with a hidden-label goal on $kind with diff', (task) => {
    const wrongId = task.cards.find((card) => card.id !== task.correctId)!.id;
    const answer = { ...emptyAnswer(task), placement: { pilihan: wrongId } };
    const plain = render(TaskView, { props: { task, answer, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(plain.container.querySelector('[data-testid="diff"]')).toBeNull();
    plain.unmount();
    const { container } = render(TaskView, { props: { task, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector(`[data-task-kind="${task.kind}"]`)).toHaveAttribute('data-diff', 'true');
    expect(container.querySelector('[data-testid="diff"] [data-testid="diff-bars"]')).not.toBeNull();
    expect(container.querySelector('[data-row="goal"]')).not.toBeNull();
    expect(container.querySelector('[data-row="goal"] .label')).toBeNull();
    expect(container.querySelector('[data-row="mine"] .label')).not.toBeNull();
  });
});
