import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../../../lib/random';
import TaskView from './TaskView.svelte';
import { emptyAnswer, generateTasks, type CampuranTask } from './tasks';

const group: CampuranTask = { kind: 'group', value: { n: 5, d: 4 } };
const [, line, mixed] = generateTasks(createRng(4));

describe('pecahan-campuran TaskView', () => {
  it('moves a piece from the tray to a plate', async () => {
    const onanswer = vi.fn();
    const { container } = render(TaskView, { props: { task: group, answer: emptyAnswer(group), onanswer, feedback: 'none' } });
    const root = container.querySelector('[data-task-kind="group"]')!;
    expect(root.getAttribute('data-n')).toBe('5');
    expect(root.getAttribute('data-d')).toBe('4');
    const [piece] = screen.getAllByRole('button', { name: 'Potongan seperempat' });
    await fireEvent.keyDown(piece, { key: ' ' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(onanswer).toHaveBeenCalledWith({ plates: { plates: [1, 0], tray: 4 }, placement: {} });
  });

  it('shows a 0 to 3 line for line tasks', () => {
    const { container } = render(TaskView, { props: { task: line, answer: emptyAnswer(line), onanswer: vi.fn(), feedback: 'none' } });
    expect([...container.querySelectorAll('text.unit')].map((t) => t.textContent)).toEqual(['0', '1', '2', '3']);
  });

  it('offers three mixed-number cards', () => {
    const { container } = render(TaskView, { props: { task: mixed, answer: emptyAnswer(mixed), onanswer: vi.fn(), feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="mixed"]')).toHaveAttribute('data-correct', mixed.kind === 'mixed' ? mixed.correctId : '');
    expect(container.querySelectorAll('[data-card]')).toHaveLength(3);
  });
});
