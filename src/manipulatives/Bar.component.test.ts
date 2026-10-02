import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { frac } from '../lib/fraction';
import Bar from './Bar.svelte';
import { BAR, rowY, type BarRow, type Stacking } from './bar';
import { withAnnouncer } from '../test-utils/announcer';

withAnnouncer();

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

  it('re-cuts a row and relabels it', () => {
    const { container } = render(Bar, { props: { rows: [{ ...ROWS[0], cut: 2 }], stacking: null } });
    expect(container.querySelectorAll('[data-row="a"] .divider')).toHaveLength(5);
    expect(container.querySelector('[data-row="a"] .label')?.textContent?.replace(/\s/g, '')).toBe('26');
    expect(screen.getByRole('button', { name: 'Potongan dua perenam' })).toBeInTheDocument();
  });

  it('draws a two-whole row twice as long as a one-whole row', () => {
    const rows: BarRow[] = [ROWS[0], { id: 'r', value: frac(5, 4), color: 'var(--frac-3)', wholes: 2 }];
    const { container } = render(Bar, { props: { rows, stacking: null } });
    const widthOf = (id: string) => Number(container.querySelector(`[data-testid="bar-target-${id}"]`)?.getAttribute('width'));
    expect(widthOf('r')).toBeCloseTo(BAR.width, 3);
    expect(widthOf('a')).toBeCloseTo(BAR.width / 2, 3);
    expect(container.querySelectorAll('[data-row-lines="r"] .whole-line')).toHaveLength(1);
  });

  it('draws whole lines above the piece so its fill cannot cover them', () => {
    const rows: BarRow[] = [{ id: 'r', value: frac(5, 4), color: 'var(--frac-3)', wholes: 2 }];
    const { container } = render(Bar, { props: { rows, stacking: null } });
    const piece = container.querySelector('[data-piece="r"]')!;
    const line = container.querySelector('.whole-line')!;
    expect(piece.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it('announces how the stacked piece compares after a drop', async () => {
    render(Bar, { props: { rows: ROWS, stacking: null, draggable: true, onstack: vi.fn() } });
    const piece = screen.getByRole('button', { name: 'Potongan sepertiga' });
    await fireEvent.keyDown(piece, { key: ' ' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Potongan sepertiga ditaruh di atas pita seperempat, lebih panjang.');
  });

  it('announces a shorter piece too', async () => {
    const onstack = vi.fn();
    render(Bar, { props: { rows: ROWS, stacking: null, draggable: true, onstack } });
    const piece = screen.getByRole('button', { name: 'Potongan seperempat' });
    await fireEvent.keyDown(piece, { key: ' ' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Potongan seperempat ditaruh di atas pita sepertiga, lebih pendek.');
  });

  it('can send a stacked piece home', async () => {
    const onstack = vi.fn();
    render(Bar, { props: { rows: ROWS, stacking: { pieceOf: 'a', onto: 'b' }, draggable: true, onstack } });
    const piece = screen.getByRole('button', { name: 'Potongan sepertiga' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Sekarang di pita sepertiga');
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(onstack).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('announcer')).toHaveTextContent('Potongan sepertiga ditaruh di pita sepertiga.');
  });

  it('shows a ghost where the stacked piece came from and the note', () => {
    const { container } = render(Bar, {
      props: { rows: ROWS, stacking: { pieceOf: 'a', onto: 'b' }, note: 'lebih panjang!' },
    });
    expect(container.querySelector('[data-row="a"] [data-ghost]')).not.toBeNull();
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
  });

  it('keeps the note inside the viewBox when the stacked piece is a whole', () => {
    const rows: BarRow[] = [
      { id: 'a', value: frac(1, 1), color: 'var(--frac-1)' },
      { id: 'b', value: frac(1, 2), color: 'var(--frac-2)' },
    ];
    render(Bar, { props: { rows, stacking: { pieceOf: 'a', onto: 'b' }, note: 'lebih panjang!' } });
    const note = screen.getByText('lebih panjang!');
    expect(note).toHaveAttribute('text-anchor', 'end');
    expect(Number(note.getAttribute('x'))).toBeLessThanOrEqual(BAR.labelX);
  });

  it('keeps pieces out of the tab order when not draggable', () => {
    render(Bar, { props: { rows: ROWS, stacking: null } });
    expect(screen.getByRole('button', { name: 'Potongan sepertiga' })).toHaveAttribute('tabindex', '-1');
  });

  it('paints the stacked piece last so it stays on top', () => {
    const a = render(Bar, { props: { rows: ROWS, stacking: { pieceOf: 'a', onto: 'b' } } });
    expect([...a.container.querySelectorAll('.piece')].at(-1)).toHaveAttribute('data-piece', 'a');
    a.unmount();
    const b = render(Bar, { props: { rows: ROWS, stacking: { pieceOf: 'b', onto: 'a' } } });
    expect([...b.container.querySelectorAll('.piece')].at(-1)).toHaveAttribute('data-piece', 'b');
  });

  it('keeps focus on the piece after a keyboard drop reorders it', async () => {
    const { rerender, container } = render(Bar, {
      props: {
        rows: ROWS,
        stacking: null,
        draggable: true,
        onstack: (stacking: Stacking) => {
          void rerender({ stacking });
        },
      },
    });
    const piece = screen.getByRole('button', { name: 'Potongan sepertiga' });
    piece.focus();
    await fireEvent.keyDown(piece, { key: ' ' });
    await fireEvent.keyDown(piece, { key: ' ' });
    await tick();
    await tick();
    expect([...container.querySelectorAll('.piece')].at(-1)).toHaveAttribute('data-piece', 'a');
    expect(document.activeElement).toBe(container.querySelector('[data-piece="a"]'));
  });

  describe('programmatic stacking animation', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    function reducedMotion(matches: boolean) {
      vi.stubGlobal('matchMedia', () => ({ matches }));
    }

    it('animates a piece from home to the stacked spot', async () => {
      reducedMotion(false);
      const animate = vi.spyOn(Element.prototype, 'animate');
      const { rerender, container } = render(Bar, { props: { rows: ROWS, stacking: null } });
      expect(animate).not.toHaveBeenCalled();
      await rerender({ stacking: { pieceOf: 'a', onto: 'b' } });
      await tick();
      const calls = animate.mock.calls.filter((_, i) => animate.mock.contexts[i] === container.querySelector('[data-piece-pos="a"]'));
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual([
        { transform: `translate(${BAR.x0}px, ${rowY(0)}px)` },
        { transform: `translate(${BAR.x0 + 8}px, ${rowY(1) - 18}px)` },
      ]);
      expect(calls[0][1]).toMatchObject({ duration: 250 });
    });

    it('does not animate after a keyboard drop', async () => {
      reducedMotion(false);
      const animate = vi.spyOn(Element.prototype, 'animate');
      const { rerender } = render(Bar, {
        props: {
          rows: ROWS,
          stacking: null,
          draggable: true,
          onstack: (stacking: Stacking) => {
            void rerender({ stacking });
          },
        },
      });
      const piece = screen.getByRole('button', { name: 'Potongan sepertiga' });
      await fireEvent.keyDown(piece, { key: ' ' });
      await fireEvent.keyDown(piece, { key: ' ' });
      await tick();
      await tick();
      expect(animate).not.toHaveBeenCalled();
    });

    function running(pieceId: string, container: HTMLElement) {
      const el = container.querySelector(`[data-piece-pos="${pieceId}"]`) as Element & { getAnimations?: () => Animation[] };
      const cancel = vi.fn();
      el.getAnimations = () => [{ cancel } as unknown as Animation];
      return { el, cancel };
    }

    it('starts an interrupted move from where the piece is visible', async () => {
      reducedMotion(false);
      const { rerender, container } = render(Bar, { props: { rows: ROWS, stacking: { pieceOf: 'a', onto: 'b' } } });
      const animate = vi.spyOn(Element.prototype, 'animate');
      const { cancel } = running('a', container);
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({ transform: 'matrix(1, 0, 0, 1, 77, 88)' } as CSSStyleDeclaration);
      await rerender({ stacking: null });
      await tick();
      const piece = container.querySelector('[data-piece-pos="a"]');
      const calls = animate.mock.calls.filter((_, i) => animate.mock.contexts[i] === piece);
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual([
        { transform: 'translate(77px, 88px)' },
        { transform: `translate(${BAR.x0}px, ${rowY(0)}px)` },
      ]);
      expect(cancel).toHaveBeenCalled();
    });

    it('falls back to the last position when nothing is running', async () => {
      reducedMotion(false);
      const { rerender, container } = render(Bar, { props: { rows: ROWS, stacking: { pieceOf: 'a', onto: 'b' } } });
      const animate = vi.spyOn(Element.prototype, 'animate');
      await rerender({ stacking: null });
      await tick();
      const piece = container.querySelector('[data-piece-pos="a"]');
      const calls = animate.mock.calls.filter((_, i) => animate.mock.contexts[i] === piece);
      expect(calls[0][0]).toEqual([
        { transform: `translate(${BAR.x0 + 8}px, ${rowY(1) - 18}px)` },
        { transform: `translate(${BAR.x0}px, ${rowY(0)}px)` },
      ]);
    });

    it('forgets rows that are gone', async () => {
      reducedMotion(false);
      const { rerender, container } = render(Bar, { props: { rows: ROWS, stacking: null } });
      await rerender({ rows: [ROWS[1]] });
      await tick();
      const animate = vi.spyOn(Element.prototype, 'animate');
      await rerender({ rows: ROWS, stacking: { pieceOf: 'a', onto: 'b' } });
      await tick();
      const piece = container.querySelector('[data-piece-pos="a"]');
      expect(animate.mock.calls.filter((_, i) => animate.mock.contexts[i] === piece)).toHaveLength(0);
    });

    it('does not animate under reduced motion', async () => {
      reducedMotion(true);
      const animate = vi.spyOn(Element.prototype, 'animate');
      const { rerender } = render(Bar, { props: { rows: ROWS, stacking: null } });
      await rerender({ stacking: { pieceOf: 'a', onto: 'b' } });
      await tick();
      expect(animate).not.toHaveBeenCalled();
    });
  });

  it('does not fade dividers in on the first mount', () => {
    const { container } = render(Bar, { props: { rows: ROWS, stacking: null } });
    expect(container.querySelectorAll('.divider').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.divider.fade')).toHaveLength(0);
  });

  it('fades in only the dividers added when the cut changes', async () => {
    const { container, rerender } = render(Bar, { props: { rows: [{ ...ROWS[0], cut: 1 }], stacking: null } });
    await rerender({ rows: [{ ...ROWS[0], cut: 2 }] });
    await tick();
    const row = container.querySelectorAll('[data-row="a"] .divider');
    const fading = container.querySelectorAll('[data-row="a"] .divider.fade');
    expect(row).toHaveLength(5);
    expect(fading).toHaveLength(3);
  });

  it('does not throw for a row with zero wholes', () => {
    const rows: BarRow[] = [{ id: 'a', value: frac(1, 3), color: 'x', wholes: 0 }];
    expect(() => render(Bar, { props: { rows, stacking: null } })).not.toThrow();
  });

  it('hides the label of a row with hideLabel', () => {
    const { container } = render(Bar, {
      props: { rows: [{ id: 'a', value: frac(1, 3), color: 'red', hideLabel: true }], stacking: null },
    });
    expect(container.querySelector('[data-row="a"] .label')).toBeNull();
  });
});
