import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { frac } from '../lib/fraction';
import DiffBars from './DiffBars.svelte';

function labels(container: HTMLElement, rowId: string): string[] {
  return Array.from(container.querySelectorAll(`[data-row="${rowId}"] .label text`)).map((t) => t.textContent ?? '');
}

describe('DiffBars', () => {
  it('stacks mine on the goal and says which is longer', () => {
    const { container } = render(DiffBars, { props: { goal: frac(1, 2), mine: frac(2, 3) } });
    expect(container.querySelector('.note')?.textContent).toBe('lebih panjang!');
    expect(labels(container, 'goal')).toEqual(['1', '2']);
    expect(labels(container, 'mine')).toEqual(['2', '3']);
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
});
