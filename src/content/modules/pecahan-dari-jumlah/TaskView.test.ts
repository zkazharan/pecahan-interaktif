import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import TaskView from './TaskView.svelte';
import { emptyAnswer, type CountTask, type SplitTask, type TakeTask } from './tasks';

const split: SplitTask = { kind: 'split', total: 12, bags: 3 };
const take: TakeTask = { kind: 'take', total: 12, bags: 4, take: 3 };
const count: CountTask = {
  kind: 'count',
  total: 12,
  bags: 4,
  take: 3,
  cards: [
    { id: 'c0', value: { n: 9, d: 1 }, face: { kind: 'mixed' } },
    { id: 'c1', value: { n: 3, d: 1 }, face: { kind: 'mixed' } },
  ],
  correctId: 'c0',
};

const counts = (c: HTMLElement) => c.querySelectorAll('[data-bag-count]');

describe('pecahan-dari-jumlah TaskView', () => {
  it('asks to share the marbles and shows counts only with diff', () => {
    const plain = render(TaskView, { props: { task: split, answer: emptyAnswer(split), onanswer: vi.fn(), feedback: 'none' } });
    expect(plain.container.querySelector('[data-task-kind="split"]')).toHaveAttribute('data-total', '12');
    expect(plain.container.querySelector('[data-task-kind="split"]')).toHaveAttribute('data-bags', '3');
    expect(screen.getByText(/Bagikan 12 kelereng ke 3 kantong sama banyak/)).toBeInTheDocument();
    expect(counts(plain.container)).toHaveLength(0);
    plain.unmount();
    const { container } = render(TaskView, {
      props: { task: split, answer: { ...emptyAnswer(split), collection: { bags: [5, 3, 4], tray: 0 } }, onanswer: vi.fn(), feedback: 'wrong', diff: true },
    });
    expect(container.querySelector('[data-task-kind="split"]')).toHaveAttribute('data-diff', 'true');
    expect(Array.from(counts(container)).map((el) => el.textContent)).toEqual(['5', '3', '4']);
  });

  it('toggles a bag when tapped in the take task', async () => {
    const onanswer = vi.fn();
    const { container } = render(TaskView, { props: { task: take, answer: emptyAnswer(take), onanswer, feedback: 'none' } });
    expect(container.querySelector('[data-task-kind="take"]')).toHaveAttribute('data-take', '3');
    expect(screen.getByText('Ketuk kantong untuk mengambilnya.')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Kantong 2' }));
    expect(onanswer).toHaveBeenCalledWith({ ...emptyAnswer(take), taken: [false, true, false, false] });
  });

  it('shows what was taken as a fraction on diff in the take task', () => {
    const answer = { ...emptyAnswer(take), taken: [true, true, false, false] };
    const plain = render(TaskView, { props: { task: take, answer, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(plain.container.querySelector('[data-testid="diff"]')).toBeNull();
    plain.unmount();
    const { container } = render(TaskView, { props: { task: take, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    const diff = container.querySelector('[data-testid="diff"]')!;
    expect(diff.textContent).toContain('Yang kamu ambil');
    expect(diff.querySelector('[role="img"]')).toHaveAttribute('aria-label', 'dua perempat');
  });

  it('does not let the learner tap bags once locked', () => {
    render(TaskView, { props: { task: take, answer: emptyAnswer(take), onanswer: vi.fn(), feedback: 'correct' } });
    expect(screen.queryByRole('button', { name: /^Kantong/ })).toBeNull();
  });

  it('marks the taken bags and shows the counts on diff in the count task', () => {
    const plain = render(TaskView, { props: { task: count, answer: emptyAnswer(count), onanswer: vi.fn(), feedback: 'none' } });
    expect(plain.container.querySelector('[data-task-kind="count"]')).toHaveAttribute('data-correct', 'c0');
    expect(plain.container.querySelectorAll('.bag.taken')).toHaveLength(0);
    expect(counts(plain.container)).toHaveLength(0);
    plain.unmount();
    const { container } = render(TaskView, { props: { task: count, answer: emptyAnswer(count), onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-task-kind="count"]')).toHaveAttribute('data-diff', 'true');
    expect(container.querySelectorAll('.bag.taken')).toHaveLength(3);
    expect(Array.from(counts(container)).map((el) => el.textContent)).toEqual(['3', '3', '3', '3']);
  });

  it('shows the aid when the answer is revealed', () => {
    const { container } = render(TaskView, { props: { task: count, answer: emptyAnswer(count), onanswer: vi.fn(), feedback: 'shown' } });
    expect(container.querySelectorAll('.bag.taken')).toHaveLength(3);
  });
});
