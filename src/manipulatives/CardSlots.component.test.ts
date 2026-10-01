import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../lib/fraction';
import CardSlots from './CardSlots.svelte';
import { emptyPlacement, type Card, type Slot } from './cardSlots';

const CARDS: Card[] = [
  { id: 'c0', value: frac(1, 2) },
  { id: 'c1', value: frac(1, 3) },
  { id: 'c2', value: frac(1, 5) },
];
const SLOTS: Slot[] = [
  { id: 's1', label: 'Paling kecil' },
  { id: 's2', label: 'Tengah' },
  { id: 's3', label: 'Paling besar' },
];

describe('CardSlots', () => {
  it('places a card with the keyboard', async () => {
    const onplace = vi.fn();
    render(CardSlots, { props: { cards: CARDS, slots: SLOTS, placement: emptyPlacement(['s1', 's2', 's3']), onplace } });
    const card = screen.getByRole('button', { name: 'Kartu seperlima' });
    await fireEvent.keyDown(card, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Diangkat: Kartu seperlima');
    await fireEvent.keyDown(card, { key: ' ' });
    expect(onplace).toHaveBeenCalledWith({ s1: 'c2', s2: null, s3: null });
  });

  it('renders placed cards inside their slot', () => {
    render(CardSlots, { props: { cards: CARDS, slots: SLOTS, placement: { s1: 'c2', s2: null, s3: null }, onplace: vi.fn() } });
    const slot = screen.getByTestId('slot-s1');
    expect(slot.querySelector('[data-card="c2"]')).not.toBeNull();
    expect(screen.getByTestId('pile').querySelectorAll('[data-card]')).toHaveLength(2);
  });

  it('locks cards when told to', async () => {
    const onplace = vi.fn();
    render(CardSlots, { props: { cards: CARDS, slots: SLOTS, placement: emptyPlacement(['s1', 's2', 's3']), onplace, locked: true } });
    const card = screen.getByRole('button', { name: 'Kartu setengah' });
    expect(card).toHaveAttribute('aria-disabled', 'true');
    await fireEvent.keyDown(card, { key: ' ' });
    await fireEvent.keyDown(card, { key: ' ' });
    expect(onplace).not.toHaveBeenCalled();
  });
});
