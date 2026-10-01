import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Plates from './Plates.svelte';

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
    const [piece] = screen.getAllByRole('button', { name: 'Potongan seperempat di piring 1' });
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

  it('locks every piece when told to', () => {
    render(Plates, { props: { capacity: 2, state: { plates: [1], tray: 1 }, onmove: vi.fn(), locked: true } });
    for (const piece of screen.getAllByRole('button')) expect(piece).toHaveAttribute('aria-disabled', 'true');
  });
});
