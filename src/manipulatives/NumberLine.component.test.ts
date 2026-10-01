import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../lib/fraction';
import NumberLine from './NumberLine.svelte';
import { emptyPlacement, type Card } from './cardSlots';
import { tickIds } from './numberLine';

const CARDS: Card[] = [
  { id: 'c0', value: frac(1, 4) },
  { id: 'c1', value: frac(2, 4) },
];

describe('NumberLine', () => {
  it('labels the whole numbers under the main ticks', () => {
    const { container } = render(NumberLine, {
      props: { max: 3, perUnit: 2, cards: [], placement: emptyPlacement(tickIds(3, 2)), onplace: vi.fn() },
    });
    expect([...container.querySelectorAll('text.unit')].map((t) => t.textContent)).toEqual(['0', '1', '2', '3']);
    expect(container.querySelectorAll('[data-tick]')).toHaveLength(7);
  });

  it('places a card on a tick with the keyboard', async () => {
    const onplace = vi.fn();
    render(NumberLine, { props: { max: 1, perUnit: 4, cards: CARDS, placement: emptyPlacement(tickIds(1, 4)), onplace } });
    const card = screen.getByRole('button', { name: 'Kartu seperempat' });
    await fireEvent.keyDown(card, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Sekarang di tanda ke-0 dari 4');
    await fireEvent.keyDown(card, { key: 'ArrowRight' });
    await fireEvent.keyDown(card, { key: ' ' });
    expect(onplace).toHaveBeenCalledWith({ ...emptyPlacement(tickIds(1, 4)), t1: 'c0' });
  });

  it('swaps a card onto an occupied tick and sends the old one back', async () => {
    const onplace = vi.fn();
    const placement = { ...emptyPlacement(tickIds(1, 4)), t1: 'c0' };
    render(NumberLine, { props: { max: 1, perUnit: 4, cards: CARDS, placement, onplace } });
    const card = screen.getByRole('button', { name: 'Kartu dua perempat' });
    await fireEvent.keyDown(card, { key: ' ' });
    await fireEvent.keyDown(card, { key: 'ArrowRight' });
    await fireEvent.keyDown(card, { key: ' ' });
    expect(onplace).toHaveBeenCalledWith({ ...emptyPlacement(tickIds(1, 4)), t1: 'c1' });
  });

  it('puts neighbouring cards on different rows', () => {
    const placement = { ...emptyPlacement(tickIds(1, 8)), t1: 'c0', t2: 'c1' };
    const { container } = render(NumberLine, { props: { max: 1, perUnit: 8, cards: CARDS, placement, onplace: vi.fn() } });
    const pins = [...container.querySelectorAll('.pin')];
    expect(pins).toHaveLength(2);
    expect(pins.filter((pin) => pin.classList.contains('high'))).toHaveLength(1);
    expect(screen.getByTestId('line-pile').querySelectorAll('[data-card]')).toHaveLength(0);
  });
});
