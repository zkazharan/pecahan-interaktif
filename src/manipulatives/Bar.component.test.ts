import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../lib/fraction';
import Bar from './Bar.svelte';
import type { BarRow } from './bar';

const ROWS: BarRow[] = [
  { id: 'a', value: frac(1, 3), color: 'var(--frac-1)' },
  { id: 'b', value: frac(1, 4), color: 'var(--frac-2)' },
];

describe('Bar', () => {
  it('draws one divider per cut', () => {
    const { container } = render(Bar, { props: { rows: ROWS, stacking: null } });
    expect(container.querySelectorAll('[data-row="a"] .divider')).toHaveLength(2);
    expect(container.querySelectorAll('[data-row="b"] .divider')).toHaveLength(3);
  });

  it('stacks a piece onto the other bar with the keyboard', async () => {
    const onstack = vi.fn();
    render(Bar, { props: { rows: ROWS, stacking: null, draggable: true, onstack } });
    const piece = screen.getByRole('button', { name: 'Potongan sepertiga' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('pita seperempat');
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(onstack).toHaveBeenCalledWith({ pieceOf: 'a', onto: 'b' });
  });

  it('can send a stacked piece home', async () => {
    const onstack = vi.fn();
    render(Bar, { props: { rows: ROWS, stacking: { pieceOf: 'a', onto: 'b' }, draggable: true, onstack } });
    const piece = screen.getByRole('button', { name: 'Potongan sepertiga' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Sekarang di pita sepertiga');
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(onstack).toHaveBeenCalledWith(null);
  });

  it('shows a ghost where the stacked piece came from and the note', () => {
    const { container } = render(Bar, {
      props: { rows: ROWS, stacking: { pieceOf: 'a', onto: 'b' }, note: 'lebih panjang!' },
    });
    expect(container.querySelector('[data-row="a"] [data-ghost]')).not.toBeNull();
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
  });

  it('keeps pieces out of the tab order when not draggable', () => {
    render(Bar, { props: { rows: ROWS, stacking: null } });
    expect(screen.getByRole('button', { name: 'Potongan sepertiga' })).toHaveAttribute('tabindex', '-1');
  });
});
