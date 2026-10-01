import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../../../lib/random';
import TaskView from './TaskView.svelte';
import { emptyAnswer, generateTasks, targetCuts } from './tasks';

const [task] = generateTasks(createRng(17));

describe('jumlah-penyebut-beda TaskView', () => {
  it('re-cuts each bar with its own stepper and exposes the hooks', async () => {
    const onanswer = vi.fn();
    const { container } = render(TaskView, { props: { task, answer: emptyAnswer(task), onanswer, feedback: 'none' } });
    const root = container.querySelector('[data-task-kind="add-recut"]')!;
    expect(root.getAttribute('data-cuts')).toBe(targetCuts(task).join(','));
    expect(root.getAttribute('data-correct')).toBe(task.correctId);
    await userEvent.click(screen.getByRole('button', { name: 'Tambah potong ulang pita pertama' }));
    expect(onanswer).toHaveBeenCalledWith({ ...emptyAnswer(task), cuts: [2, 1] });
    await userEvent.click(screen.getByRole('button', { name: 'Tambah potong ulang pita kedua' }));
    expect(onanswer).toHaveBeenLastCalledWith({ ...emptyAnswer(task), cuts: [1, 2] });
  });

  it('says when the parts are equal', () => {
    render(TaskView, { props: { task, answer: { ...emptyAnswer(task), cuts: targetCuts(task) }, onanswer: vi.fn(), feedback: 'none' } });
    expect(screen.getByText('sama besar!')).toBeInTheDocument();
  });
});
