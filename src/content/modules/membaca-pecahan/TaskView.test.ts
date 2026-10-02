import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../../../lib/fraction';
import { createRng } from '../../../lib/random';
import TaskView from './TaskView.svelte';
import { emptyAnswer, generateTasks, shadeDiff, type MembacaTask } from './tasks';

const shade: MembacaTask = { kind: 'shade', target: frac(2, 5) };
const [, , line, , read] = generateTasks(createRng(7));

function marked(container: HTMLElement, attribute: string): number[] {
  const wedges = [...container.querySelectorAll('[data-slice]')].map((el) => el.getAttribute('d'));
  return [...container.querySelectorAll(`[${attribute}]`)].map((el) => wedges.indexOf(el.getAttribute('d')));
}

const outlinedSlices = (container: HTMLElement) => marked(container, 'data-outlined');
const crossedSlices = (container: HTMLElement) => marked(container, 'data-crossed');

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

  it('outlines the missing slices on a shade task', () => {
    const task: MembacaTask = { kind: 'shade', target: frac(3, 6) };
    const { container } = render(TaskView, { props: { task, answer: { shaded: [false, false, false, false, true, false], placement: {} }, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-task-kind="shade"]')).toHaveAttribute('data-diff', 'true');
    expect(outlinedSlices(container)).toEqual([0, 1]);
    expect(crossedSlices(container)).toEqual([]);
  });

  it('crosses the extra slices instead of outlining them on a shade task', () => {
    const task: MembacaTask = { kind: 'shade', target: frac(1, 4) };
    const { container } = render(TaskView, { props: { task, answer: { shaded: [true, true, true, false], placement: {} }, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(crossedSlices(container)).toEqual([1, 2]);
    expect(outlinedSlices(container)).toEqual([]);
  });

  it('outlines nothing without diff', () => {
    const task: MembacaTask = { kind: 'shade', target: frac(3, 6) };
    const { container } = render(TaskView, { props: { task, answer: { shaded: [false, false, false, false, true, false], placement: {} }, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(container.querySelectorAll('[data-outlined]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-crossed]')).toHaveLength(0);
    expect(container.querySelector('[data-diff]')).toBeNull();
  });

  it('shows the placed value on the line while the wrong answer is on screen', () => {
    const task: MembacaTask = { kind: 'line', card: { id: 'c0', value: frac(3, 4) }, perUnit: 4 };
    const answer = { shaded: [], placement: { ...emptyAnswer(task).placement, t2: 'c0' } };
    const { container } = render(TaskView, { props: { task, answer, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-placed-value="2/4"]')).not.toBeNull();
  });

  it('hides the placed value without diff', () => {
    const task: MembacaTask = { kind: 'line', card: { id: 'c0', value: frac(3, 4) }, perUnit: 4 };
    const answer = { shaded: [], placement: { ...emptyAnswer(task).placement, t2: 'c0' } };
    const { container } = render(TaskView, { props: { task, answer, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(container.querySelector('[data-placed-value]')).toBeNull();
  });

  it('draws the chosen read card as fraction circles', () => {
    const task: MembacaTask = {
      kind: 'read',
      shaded: frac(1, 3),
      correctId: 'c0',
      cards: [
        { id: 'c0', value: frac(1, 3) },
        { id: 'c1', value: frac(3, 2) },
        { id: 'c2', value: frac(2, 3) },
      ],
    };
    const { container } = render(TaskView, { props: { task, answer: { shaded: [], placement: { pilihan: 'c1' } }, onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelectorAll('[data-testid="diff"] [data-testid="fraction-circles"] svg')).toHaveLength(2);
    const caption = container.querySelector('[data-testid="diff"] .caption')!;
    expect(caption).toHaveTextContent('Kartu pilihanmu');
    expect(caption).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no read caption without diff', () => {
    const { container } = render(TaskView, { props: { task: read, answer: { shaded: [], placement: { pilihan: 'c0' } }, onanswer: vi.fn(), feedback: 'wrong' } });
    expect(container.querySelector('.caption')).toBeNull();
  });

  it('draws no read difference when no card is chosen', () => {
    const { container } = render(TaskView, { props: { task: read, answer: emptyAnswer(read), onanswer: vi.fn(), feedback: 'wrong', diff: true } });
    expect(container.querySelector('[data-testid="diff"]')).toBeNull();
  });
});

describe('shadeDiff', () => {
  it('marks the first unshaded slices as missing when too few are shaded', () => {
    expect(shadeDiff(frac(3, 6), [false, false, false, false, true, false])).toEqual({
      missing: [true, true, false, false, false, false],
      extra: [false, false, false, false, false, false],
    });
  });

  it('marks the last shaded slices as extra when too many are shaded', () => {
    expect(shadeDiff(frac(1, 4), [true, true, true, false])).toEqual({
      missing: [false, false, false, false],
      extra: [false, true, true, false],
    });
  });

  it('marks nothing when the count is right', () => {
    expect(shadeDiff(frac(2, 4), [true, false, true, false])).toEqual({
      missing: [false, false, false, false],
      extra: [false, false, false, false],
    });
  });
});
