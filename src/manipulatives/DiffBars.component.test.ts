import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { frac } from '../lib/fraction';
import DiffBars from './DiffBars.svelte';

function labels(container: HTMLElement, rowId: string): string[] {
  return Array.from(container.querySelectorAll(`[data-row="${rowId}"] .label text`)).map((t) => t.textContent ?? '');
}

describe('DiffBars', () => {
  it('keeps each piece in its own captioned row and says how mine compares', () => {
    const { container } = render(DiffBars, { props: { goal: frac(1, 2), mine: frac(2, 3) } });
    expect(container.querySelector('[data-ghost]')).toBeNull();
    const rowTop = (id: string) => Number(container.querySelector(`[data-row="${id}"] rect.whole`)!.getAttribute('y'));
    const pieceTop = (id: string) => Number(/translate\([^,]+,\s*([-\d.]+)px\)/.exec((container.querySelector(`[data-piece-pos="${id}"]`) as SVGElement).style.transform)![1]);
    expect(pieceTop('mine')).toBe(rowTop('mine'));
    expect(pieceTop('goal')).toBe(rowTop('goal'));
    expect(container.querySelector('.note')?.textContent).toBe('lebih panjang!');
    expect(labels(container, 'goal')).toEqual(['1', '2']);
    expect(labels(container, 'mine')).toEqual(['2', '3']);
  });

  it('marks where the goal ends across both rows', () => {
    const { container } = render(DiffBars, { props: { goal: frac(1, 2), mine: frac(1, 4) } });
    const guide = container.querySelector('[data-compare-guide]')!;
    const goalPiece = container.querySelector('[data-piece="goal"] rect:not(.hit)')!;
    const goalRow = container.querySelector('[data-row="goal"] rect.whole')!;
    const mineRow = container.querySelector('[data-row="mine"] rect.whole')!;
    expect(Number(guide.getAttribute('x1'))).toBe(Number(goalRow.getAttribute('x')) + Number(goalPiece.getAttribute('width')));
    expect(Number(guide.getAttribute('y1'))).toBeLessThanOrEqual(Number(goalRow.getAttribute('y')));
    expect(Number(guide.getAttribute('y2'))).toBeGreaterThanOrEqual(Number(mineRow.getAttribute('y')) + Number(mineRow.getAttribute('height')));
    expect(container.querySelector('.note')?.textContent).toBe('lebih pendek!');
  });

  it('hides the goal label when asked', () => {
    const { container } = render(DiffBars, { props: { goal: frac(7, 5), mine: frac(7, 10), hideGoal: true } });
    expect(labels(container, 'goal')).toEqual([]);
    expect(labels(container, 'mine')).toEqual(['7', '10']);
    expect(container.querySelector('.note')?.textContent).toBe('lebih pendek!');
  });

  it('keeps one whole the same length on both rows when a value passes one', () => {
    const { container } = render(DiffBars, { props: { goal: frac(3, 2), mine: frac(1, 2) } });
    const wholes = container.querySelectorAll('[data-row] rect.whole');
    expect(wholes[0].getAttribute('width')).toBe(wholes[1].getAttribute('width'));
  });

  it('captions the rows and hides the captions from assistive tech', () => {
    const { container } = render(DiffBars, { props: { goal: frac(1, 2), mine: frac(2, 3) } });
    const goal = container.querySelector('[data-row="goal"] .caption')!;
    const mine = container.querySelector('[data-row="mine"] .caption')!;
    expect(goal).toHaveTextContent('Tujuan');
    expect(mine).toHaveTextContent('Pilihanmu');
    expect(goal).toHaveAttribute('aria-hidden', 'true');
    expect(mine).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the goal caption without any number when the goal is hidden', () => {
    const { container } = render(DiffBars, { props: { goal: frac(7, 5), mine: frac(7, 10), hideGoal: true } });
    expect(container.querySelector('[data-row="goal"] .caption')!.textContent).toBe('Tujuan');
    expect(labels(container, 'goal')).toEqual([]);
  });
});
