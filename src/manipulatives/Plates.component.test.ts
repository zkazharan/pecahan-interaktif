import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Plates from './Plates.svelte';
import type { PlatesState } from './plates';

describe('Plates', () => {
  it('moves a tray piece onto the first plate with the keyboard', async () => {
    const onmove = vi.fn();
    render(Plates, { props: { capacity: 4, state: { plates: [0, 0], tray: 5 }, onmove } });
    const [piece] = screen.getAllByRole('button', { name: 'Potongan seperempat' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Sekarang di piring 1');
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(onmove).toHaveBeenCalledWith({ plates: [1, 0], tray: 4 });
  });

  it('skips a full plate', async () => {
    const onmove = vi.fn();
    render(Plates, { props: { capacity: 4, state: { plates: [4, 0], tray: 1 }, onmove } });
    const [piece] = screen.getAllByRole('button', { name: 'Potongan seperempat' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Sekarang di piring 2');
  });

  it('sends a plate piece back to the tray', async () => {
    const onmove = vi.fn();
    render(Plates, { props: { capacity: 4, state: { plates: [2, 0], tray: 0 }, onmove } });
    const handles = screen.getAllByRole('button', { name: 'Potongan seperempat di piring 1' });
    expect(handles).toHaveLength(1);
    const [piece] = handles;
    await fireEvent.keyDown(piece, { key: ' ' });
    await fireEvent.keyDown(piece, { key: 'ArrowRight' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(onmove).toHaveBeenCalledWith({ plates: [1, 0], tray: 1 });
  });

  it('draws each plate with its pieces', () => {
    render(Plates, { props: { capacity: 3, state: { plates: [3, 1], tray: 2 }, onmove: vi.fn() } });
    expect(screen.getByTestId('plate-0').querySelectorAll('[data-plate-piece]')).toHaveLength(3);
    expect(screen.getByTestId('plate-1').querySelectorAll('[data-plate-piece]')).toHaveLength(1);
    expect(screen.getByTestId('tray').querySelectorAll('[data-tray-piece]')).toHaveLength(2);
  });

  it('renders only as many wedges as the capacity allows', () => {
    render(Plates, { props: { capacity: 4, state: { plates: [5, 2], tray: 0 }, onmove: vi.fn() } });
    expect(screen.getByTestId('plate-0').querySelectorAll('[data-plate-piece]')).toHaveLength(4);
    expect(screen.getByTestId('plate-1').querySelectorAll('[data-plate-piece]')).toHaveLength(2);
  });

  it('keeps focus on the plate handle after a drop onto a plate', async () => {
    const onmove = vi.fn((next: PlatesState) => void rerender({ state: next }));
    const { rerender } = render(Plates, { props: { capacity: 4, state: { plates: [0, 0], tray: 2 }, onmove } });
    const [piece] = screen.getAllByRole('button', { name: 'Potongan seperempat' });
    piece.focus();
    await fireEvent.keyDown(piece, { key: ' ' });
    await fireEvent.keyDown(piece, { key: ' ' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Potongan seperempat di piring 1' })).toHaveFocus());
  });

  it('keeps focus on the last tray piece after a drop onto the tray', async () => {
    const onmove = vi.fn((next: PlatesState) => void rerender({ state: next }));
    const { rerender } = render(Plates, { props: { capacity: 4, state: { plates: [1, 0], tray: 1 }, onmove } });
    const handle = screen.getByRole('button', { name: 'Potongan seperempat di piring 1' });
    handle.focus();
    await fireEvent.keyDown(handle, { key: ' ' });
    await fireEvent.keyDown(handle, { key: 'ArrowRight' });
    await fireEvent.keyDown(handle, { key: ' ' });
    await waitFor(() => {
      const pieces = screen.getAllByRole('button', { name: 'Potongan seperempat' });
      expect(pieces).toHaveLength(2);
      expect(pieces[1]).toHaveFocus();
    });
  });

  it('locks every piece when told to', () => {
    render(Plates, { props: { capacity: 2, state: { plates: [1], tray: 1 }, onmove: vi.fn(), locked: true } });
    for (const piece of screen.getAllByRole('button')) expect(piece).toHaveAttribute('aria-disabled', 'true');
  });

  it('pops in pieces the program puts on a plate', async () => {
    const animate = vi.spyOn(Element.prototype, 'animate');
    const view = render(Plates, { props: { capacity: 4, state: { plates: [0, 0], tray: 5 }, onmove: vi.fn() } });
    await view.rerender({ state: { plates: [4, 1], tray: 0 } });
    expect(animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('scale(0.6)'))).toHaveLength(5);
    vi.restoreAllMocks();
  });

  it('does not pop a piece the learner dragged', async () => {
    const animate = vi.spyOn(Element.prototype, 'animate');
    let rerenderWith: (state: { plates: number[]; tray: number }) => Promise<void> = async () => {};
    const view = render(Plates, {
      props: { capacity: 4, state: { plates: [0], tray: 2 }, onmove: (s: { plates: readonly number[]; tray: number }) => rerenderWith({ plates: [...s.plates], tray: s.tray }) },
    });
    rerenderWith = (state) => view.rerender({ state });
    const [piece] = screen.getAllByRole('button', { name: 'Potongan seperempat' });
    await fireEvent.keyDown(piece, { key: ' ' });
    await fireEvent.keyDown(piece, { key: ' ' });
    expect(animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('scale(0.6)'))).toHaveLength(0);
    vi.restoreAllMocks();
  });
});
