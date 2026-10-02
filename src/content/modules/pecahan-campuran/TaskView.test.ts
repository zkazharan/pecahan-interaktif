import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../../../lib/random';
import TaskView from './TaskView.svelte';
import { emptyAnswer, generateTasks, groupDiff, type CampuranTask } from './tasks';

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
    expect([...container.querySelectorAll('.unit')].map((t) => t.textContent)).toEqual(['0', '1', '2', '3']);
  });

  it('offers three mixed-number cards', () => {
    const { container } = render(TaskView, { props: { task: mixed, answer: emptyAnswer(mixed), onanswer: vi.fn(), feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="mixed"]')).toHaveAttribute('data-correct', mixed.kind === 'mixed' ? mixed.correctId : '');
    expect(container.querySelectorAll('[data-card]')).toHaveLength(3);
  });

  describe('mixed aid', () => {
    const task = (): Extract<CampuranTask, { kind: 'mixed' }> => {
      if (mixed.kind !== 'mixed') throw new Error('expected a mixed task');
      return mixed;
    };
    const show = (feedback: 'none' | 'wrong' | 'shown' | 'correct') =>
      render(TaskView, { props: { task: mixed, answer: emptyAnswer(mixed), onanswer: vi.fn(), feedback } });

    it('hides the plates behind a toggle at first', () => {
      const { container } = show('none');
      expect(screen.getByRole('button', { name: 'bingung? lihat piringnya ↓' })).toBeInTheDocument();
      expect(container.querySelector('[data-plate-piece]')).toBeNull();
    });

    it('opens the plates on toggle and shows the full plates', async () => {
      const { container } = show('none');
      await fireEvent.click(screen.getByRole('button', { name: 'bingung? lihat piringnya ↓' }));
      const { n, d } = task().value;
      const plates = [...container.querySelectorAll('[data-container^="plate-"]')];
      expect(plates).toHaveLength(Math.ceil(n / d));
      const full = plates.filter((plate) => plate.querySelectorAll('[data-plate-piece]').length === d);
      expect(full).toHaveLength(Math.floor(n / d));
      expect(screen.queryByRole('button', { name: 'bingung? lihat piringnya ↓' })).toBeNull();
    });

    it('drops the toggle once the answer is correct', () => {
      show('correct');
      expect(screen.queryByRole('button', { name: 'bingung? lihat piringnya ↓' })).toBeNull();
    });

    it('shows the locked aid without an empty tray', () => {
      const { container } = show('shown');
      expect(container.querySelector('[data-testid="tray"]')).toBeNull();
    });

    it.each(['wrong', 'shown'] as const)('opens by itself on %s feedback', (feedback) => {
      const { container } = show(feedback);
      expect(container.querySelector('[data-plate-piece]')).not.toBeNull();
    });
  });

  describe('diff', () => {
    it('flags the plates that groupDiff flags on a wrong group answer', () => {
      const answer = { plates: { plates: [3, 4], tray: 0 }, placement: {} };
      const plain = render(TaskView, { props: { task: group, answer, onanswer: vi.fn(), feedback: 'wrong' } });
      expect(plain.container.querySelectorAll('[data-flagged]')).toHaveLength(0);
      expect(plain.container.querySelector('[data-diff]')).toBeNull();
      plain.unmount();
      const { container } = render(TaskView, { props: { task: group, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
      expect(container.querySelector('[data-task-kind="group"]')).toHaveAttribute('data-diff', 'true');
      const expected = groupDiff(group.kind === 'group' ? group.value : { n: 0, d: 1 }, answer.plates);
      expect(container.querySelectorAll('[data-flagged]')).toHaveLength(expected.filter(Boolean).length);
      expect(container.querySelectorAll('[data-flagged]')).toHaveLength(1);
    });

    it('prints the placed value on the number line', () => {
      if (line.kind !== 'line') throw new Error('expected a line task');
      const answer = { ...emptyAnswer(line), placement: { ...emptyAnswer(line).placement, t0: line.card.id } };
      const plain = render(TaskView, { props: { task: line, answer, onanswer: vi.fn(), feedback: 'wrong' } });
      expect(plain.container.querySelector('[data-placed-value]')).toBeNull();
      plain.unmount();
      const { container } = render(TaskView, { props: { task: line, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
      expect(container.querySelector('[data-placed-value]')).not.toBeNull();
    });

    it('compares the chosen card with the goal on mixed tasks', () => {
      if (mixed.kind !== 'mixed') throw new Error('expected a mixed task');
      const wrongId = mixed.cards.find((card) => card.id !== mixed.correctId)!.id;
      const answer = { ...emptyAnswer(mixed), placement: { pilihan: wrongId } };
      const plain = render(TaskView, { props: { task: mixed, answer, onanswer: vi.fn(), feedback: 'wrong' } });
      expect(plain.container.querySelector('[data-testid="diff"]')).toBeNull();
      plain.unmount();
      const { container } = render(TaskView, { props: { task: mixed, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
      expect(container.querySelector('[data-testid="diff"] [data-testid="diff-bars"]')).not.toBeNull();
      expect(container.querySelector('[data-row="goal"] .label')).not.toBeNull();
    });
  });
});
