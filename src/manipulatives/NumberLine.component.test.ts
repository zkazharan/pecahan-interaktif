import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { frac } from '../lib/fraction';
import NumberLine from './NumberLine.svelte';
import { emptyPlacement, type Card, type Placement } from './cardSlots';
import { tickIds } from './numberLine';

const CARDS: Card[] = [
  { id: 'c0', value: frac(1, 4) },
  { id: 'c1', value: frac(2, 4) },
];

describe('NumberLine', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('labels the whole numbers under the main ticks', () => {
    const { container } = render(NumberLine, {
      props: { max: 3, perUnit: 2, cards: [], placement: emptyPlacement(tickIds(3, 2)), onplace: vi.fn() },
    });
    expect([...container.querySelectorAll('.unit')].map((t) => t.textContent)).toEqual(['0', '1', '2', '3']);
    expect(container.querySelectorAll('[data-tick]')).toHaveLength(7);
  });

  it('draws an extra tick set for each division above or below the axis', () => {
    const marks = [
      { perUnit: 3, color: 'var(--frac-1)', side: 'above' as const },
      { perUnit: 4, color: 'var(--frac-2)', side: 'below' as const },
    ];
    const { container } = render(NumberLine, {
      props: { max: 1, perUnit: 12, cards: [], placement: emptyPlacement(tickIds(1, 12)), onplace: vi.fn(), marks },
    });
    const above = container.querySelectorAll('line.mark[data-side="above"]');
    const below = container.querySelectorAll('line.mark[data-side="below"]');
    expect(above).toHaveLength(4);
    expect(below).toHaveLength(5);
    expect(above[0].getAttribute('style')).toContain('var(--frac-1)');
    expect(below[0].getAttribute('style')).toContain('var(--frac-2)');
    expect(container.querySelector('line.mark')?.closest('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('[data-tick]')).toHaveLength(13);
  });

  it('draws no extra ticks without marks', () => {
    const { container } = render(NumberLine, {
      props: { max: 1, perUnit: 4, cards: [], placement: emptyPlacement(tickIds(1, 4)), onplace: vi.fn() },
    });
    expect(container.querySelectorAll('line.mark')).toHaveLength(0);
  });

  it('colours the top of a card with its accent', () => {
    const cards: Card[] = [{ id: 'c0', value: frac(1, 4), accent: 'var(--frac-2)' }];
    const { container } = render(NumberLine, {
      props: { max: 1, perUnit: 4, cards, placement: emptyPlacement(tickIds(1, 4)), onplace: vi.fn() },
    });
    const card = container.querySelector('[data-card="c0"]')!;
    expect(card).toHaveClass('accented');
    expect(card.getAttribute('style')).toContain('var(--frac-2)');
  });

  it('hides the empty pile when locked and shows it otherwise', () => {
    const props = { max: 1, perUnit: 4, cards: [CARDS[0]], placement: { ...emptyPlacement(tickIds(1, 4)), t1: 'c0' }, onplace: vi.fn() };
    const locked = render(NumberLine, { props: { ...props, locked: true } });
    expect(locked.queryByTestId('line-pile')).toBeNull();
    locked.unmount();
    const open = render(NumberLine, { props });
    expect(open.getByTestId('line-pile')).toBeInTheDocument();
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

  it('anchors the first and last targets inward at half a division', () => {
    const { container } = render(NumberLine, {
      props: { max: 1, perUnit: 4, cards: [], placement: emptyPlacement(tickIds(1, 4)), onplace: vi.fn() },
    });
    const target = (id: string) => container.querySelector<HTMLElement>(`[data-tick="${id}"]`)!;
    expect(target('t0').dataset.edge).toBe('start');
    expect(target('t4').dataset.edge).toBe('end');
    expect(target('t2').dataset.edge).toBeUndefined();
    expect(target('t0').style.width).toBe('11.25%');
    expect(target('t4').style.width).toBe('11.25%');
    expect(target('t2').style.width).toBe('22.5%');
  });

  describe('card slide', () => {
    function stubRects(): void {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        const onLine = this.closest('.pin') !== null;
        return { left: onLine ? 200 : 0, top: onLine ? 0 : 300, width: 64, height: 80, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
      });
    }

    const slides = (animate: { mock: { calls: unknown[][] } }) =>
      animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('translate')).length;

    it('slides a card placed by the program', async () => {
      const animate = vi.spyOn(Element.prototype, 'animate');
      stubRects();
      const empty = emptyPlacement(tickIds(1, 4));
      const view = render(NumberLine, { props: { max: 1, perUnit: 4, cards: CARDS, placement: empty, onplace: vi.fn() } });
      await view.rerender({ placement: { ...empty, t1: 'c0' } });
      expect(slides(animate)).toBe(1);
    });

    it('does not slide a card the learner dropped', async () => {
      const animate = vi.spyOn(Element.prototype, 'animate');
      stubRects();
      let rerenderWith: (placement: Placement) => Promise<void> = async () => {};
      const view = render(NumberLine, {
        props: { max: 1, perUnit: 4, cards: CARDS, placement: emptyPlacement(tickIds(1, 4)), onplace: (p: Placement) => rerenderWith(p) },
      });
      rerenderWith = (placement) => view.rerender({ placement });
      const card = screen.getByRole('button', { name: 'Kartu seperempat' });
      await fireEvent.keyDown(card, { key: ' ' });
      await fireEvent.keyDown(card, { key: ' ' });
      await tick();
      expect(document.querySelectorAll('.pin [data-card]')).toHaveLength(1);
      expect(slides(animate)).toBe(0);
    });
  });
});
