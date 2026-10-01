import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { frac } from '../lib/fraction';
import CardSlots from './CardSlots.svelte';
import { emptyPlacement, type Card, type Placement, type Slot } from './cardSlots';

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

  it('renders mixed and shape faces with their own names', () => {
    const cards: Card[] = [
      { id: 'm', value: frac(5, 4), face: { kind: 'mixed' } },
      { id: 's', value: frac(1, 3), face: { kind: 'shape', slices: [1 / 3, 1 / 3, 1 / 3], shaded: [true, false, false], description: 'martabak dipotong 3 sama besar, 1 diarsir' } },
    ];
    const { container } = render(CardSlots, { props: { cards, slots: [{ id: 'pilihan', label: 'Pilihanmu' }], placement: { pilihan: null }, onplace: vi.fn() } });
    expect(screen.getByRole('button', { name: 'Kartu satu seperempat' })).toBeInTheDocument();
    const shape = screen.getByRole('button', { name: 'Kartu martabak dipotong 3 sama besar, 1 diarsir' });
    expect(shape.querySelectorAll('[data-slice]')).toHaveLength(3);
    expect(container.querySelector('[data-card="m"]')).toHaveAttribute('data-value', '5/4');
    expect(container.querySelector('[data-card="s"]')).toHaveClass('shape');
    expect(container.querySelector('[data-card="s"] svg')).toHaveClass('fill');
    expect(container.querySelector('[data-card="m"]')).not.toHaveClass('shape');
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

  it('keeps keyboard focus on a card after it moves to another block', async () => {
    let rerenderWith: (placement: Placement) => Promise<void> = async () => {};
    const view = render(CardSlots, {
      props: {
        cards: CARDS,
        slots: SLOTS,
        placement: emptyPlacement(['s1', 's2', 's3']),
        onplace: (placement: Placement) => rerenderWith(placement),
      },
    });
    rerenderWith = (placement) => view.rerender({ placement });
    const card = screen.getByRole('button', { name: 'Kartu seperlima' });
    card.focus();
    await fireEvent.keyDown(card, { key: ' ' });
    await fireEvent.keyDown(card, { key: ' ' });
    await tick();
    await tick();
    expect(screen.getByTestId('slot-s1').querySelector('[data-card="c2"]')).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Kartu seperlima' }));
  });

  describe('solution reveal', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    function stubRects(): void {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        const inSlot = this.closest('.slot') !== null;
        return { left: inSlot ? 0 : 300, top: 0, width: 80, height: 96, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) };
      });
    }

    it('slides the cards into their slots when a locked placement changes', async () => {
      stubRects();
      const animate = vi.spyOn(Element.prototype, 'animate');
      const view = render(CardSlots, {
        props: { cards: CARDS, slots: SLOTS, placement: emptyPlacement(['s1', 's2', 's3']), onplace: vi.fn(), locked: false },
      });
      await view.rerender({ placement: { s1: 'c2', s2: null, s3: null }, locked: true });
      const calls = animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('translate'));
      expect(calls).toHaveLength(1);
      const options = calls[0][1] as KeyframeAnimationOptions;
      expect(options.duration).toBeLessThanOrEqual(250);
    });

    it('does not animate a card the learner dropped', async () => {
      stubRects();
      const animate = vi.spyOn(Element.prototype, 'animate');
      let rerenderWith: (placement: Placement) => Promise<void> = async () => {};
      const view = render(CardSlots, {
        props: { cards: CARDS, slots: SLOTS, placement: emptyPlacement(['s1', 's2', 's3']), onplace: (p: Placement) => rerenderWith(p) },
      });
      rerenderWith = (placement) => view.rerender({ placement });
      const card = screen.getByRole('button', { name: 'Kartu seperlima' });
      await fireEvent.keyDown(card, { key: ' ' });
      await fireEvent.keyDown(card, { key: ' ' });
      await tick();
      expect(animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('translate'))).toHaveLength(0);
    });

    it('animates a placement set by the program even when unlocked', async () => {
      stubRects();
      const animate = vi.spyOn(Element.prototype, 'animate');
      const view = render(CardSlots, {
        props: { cards: CARDS, slots: SLOTS, placement: emptyPlacement(['s1', 's2', 's3']), onplace: vi.fn() },
      });
      await view.rerender({ placement: { s1: 'c2', s2: null, s3: null } });
      expect(animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('translate'))).toHaveLength(1);
    });

    it('skips the slide under reduced motion', async () => {
      stubRects();
      vi.stubGlobal('matchMedia', () => ({ matches: true }));
      const animate = vi.spyOn(Element.prototype, 'animate');
      const view = render(CardSlots, {
        props: { cards: CARDS, slots: SLOTS, placement: emptyPlacement(['s1', 's2', 's3']), onplace: vi.fn(), locked: false },
      });
      await view.rerender({ placement: { s1: 'c2', s2: null, s3: null }, locked: true });
      expect(animate).not.toHaveBeenCalled();
    });
  });
});
