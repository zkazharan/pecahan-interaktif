import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Collection from './Collection.svelte';
import { bagId, type CollectionState } from './collection';

describe('Collection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows each bag with its marbles and the tray', () => {
    render(Collection, { props: { state: { bags: [2, 0, 1], tray: 3 }, onmove: () => {} } });
    expect(screen.getByTestId(bagId(0)).querySelectorAll('[data-marble]')).toHaveLength(2);
    expect(screen.getByTestId(bagId(2)).querySelectorAll('[data-marble]')).toHaveLength(1);
    expect(screen.getByTestId('marble-tray').querySelectorAll('[data-tray-marble]')).toHaveLength(3);
  });

  it('marks taken bags with the taken class in both modes', () => {
    const view = render(Collection, { props: { state: { bags: [1, 1, 1], tray: 0 }, onmove: () => {}, locked: true, taken: [true, false, true] } });
    expect(view.container.querySelectorAll('.bag.taken')).toHaveLength(2);
    view.unmount();
    const { container } = render(Collection, { props: { state: { bags: [1, 1, 1], tray: 0 }, onmove: () => {}, locked: true, taken: [true, false, false], ontake: () => {} } });
    expect(container.querySelectorAll('button.bag.taken')).toHaveLength(1);
  });

  it('moves a tray marble into the first bag with the keyboard', async () => {
    const onmove = vi.fn();
    render(Collection, { props: { state: { bags: [0, 0], tray: 2 }, onmove } });
    const [marble] = screen.getAllByRole('button', { name: 'Kelereng' });
    await fireEvent.keyDown(marble, { key: ' ' });
    expect(screen.getByTestId('announcer')).toHaveTextContent('Sekarang di kantong 1');
    await fireEvent.keyDown(marble, { key: ' ' });
    expect(onmove).toHaveBeenCalledWith({ bags: [1, 0], tray: 1 });
  });

  it('sends a bag marble back to the tray', async () => {
    const onmove = vi.fn();
    render(Collection, { props: { state: { bags: [2, 0], tray: 0 }, onmove } });
    const handles = screen.getAllByRole('button', { name: 'Kelereng di kantong 1' });
    expect(handles).toHaveLength(1);
    await fireEvent.keyDown(handles[0], { key: ' ' });
    await fireEvent.keyDown(handles[0], { key: 'ArrowRight' });
    await fireEvent.keyDown(handles[0], { key: ' ' });
    expect(onmove).toHaveBeenCalledWith({ bags: [1, 0], tray: 1 });
  });

  it('does not offer a handle on an empty bag', () => {
    render(Collection, { props: { state: { bags: [0, 1], tray: 0 }, onmove: () => {} } });
    expect(screen.queryByRole('button', { name: 'Kelereng di kantong 1' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Kelereng di kantong 2' })).toBeInTheDocument();
  });

  it('keeps focus on the bag handle after a drop onto a bag', async () => {
    const onmove = vi.fn((next: CollectionState) => void rerender({ state: next }));
    const { rerender } = render(Collection, { props: { state: { bags: [0, 0], tray: 2 }, onmove } });
    const [marble] = screen.getAllByRole('button', { name: 'Kelereng' });
    marble.focus();
    await fireEvent.keyDown(marble, { key: ' ' });
    await fireEvent.keyDown(marble, { key: ' ' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Kelereng di kantong 1' })).toHaveFocus());
  });

  it('keeps focus on the last tray marble after a drop onto the tray', async () => {
    const onmove = vi.fn((next: CollectionState) => void rerender({ state: next }));
    const { rerender } = render(Collection, { props: { state: { bags: [1, 0], tray: 1 }, onmove } });
    const handle = screen.getByRole('button', { name: 'Kelereng di kantong 1' });
    handle.focus();
    await fireEvent.keyDown(handle, { key: ' ' });
    await fireEvent.keyDown(handle, { key: 'ArrowRight' });
    await fireEvent.keyDown(handle, { key: ' ' });
    await waitFor(() => {
      const marbles = screen.getAllByRole('button', { name: 'Kelereng' });
      expect(marbles).toHaveLength(2);
      expect(marbles[1]).toHaveFocus();
    });
  });

  it('toggles bags in take mode', async () => {
    const ontake = vi.fn();
    render(Collection, { props: { state: { bags: [3, 3, 3], tray: 0 }, onmove: () => {}, locked: true, taken: [false, true, false], ontake } });
    const second = screen.getByRole('button', { name: 'Kantong 2' });
    expect(second).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveClass('taken');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Kantong 1' }));
    expect(ontake).toHaveBeenCalledWith(0);
  });

  it('offers no drag handles in take mode', () => {
    render(Collection, { props: { state: { bags: [3, 3], tray: 0 }, onmove: () => {}, taken: [false, false], ontake: () => {} } });
    expect(screen.queryByRole('button', { name: /Kelereng di kantong/ })).toBeNull();
  });

  it('highlights taken bags without take mode', () => {
    render(Collection, { props: { state: { bags: [3, 3], tray: 0 }, onmove: () => {}, locked: true, taken: [true, false] } });
    expect(screen.getByTestId(bagId(0))).toHaveClass('taken');
    expect(screen.getByTestId(bagId(1))).not.toHaveClass('taken');
    expect(screen.queryByRole('button', { name: /Kantong/ })).toBeNull();
  });

  it('shows counts when asked', () => {
    render(Collection, { props: { state: { bags: [5, 3], tray: 0 }, onmove: () => {}, counts: true } });
    expect(Array.from(document.querySelectorAll('[data-bag-count]')).map((el) => el.textContent)).toEqual(['5', '3']);
  });

  it('hides counts by default', () => {
    render(Collection, { props: { state: { bags: [5, 3], tray: 0 }, onmove: () => {} } });
    expect(document.querySelectorAll('[data-bag-count]')).toHaveLength(0);
  });

  it('hides an empty tray when locked', () => {
    render(Collection, { props: { state: { bags: [2, 2], tray: 0 }, onmove: () => {}, locked: true } });
    expect(screen.queryByTestId('marble-tray')).toBeNull();
  });

  it('keeps an empty tray when not locked', () => {
    render(Collection, { props: { state: { bags: [2, 2], tray: 0 }, onmove: () => {} } });
    expect(screen.getByTestId('marble-tray')).toBeInTheDocument();
  });

  it('locks tray marbles and offers no bag handles when told to', () => {
    render(Collection, { props: { state: { bags: [1], tray: 1 }, onmove: vi.fn(), locked: true } });
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: /Kelereng di kantong/ })).toBeNull();
  });

  it('records where the bag handle was grabbed for the drag marble', async () => {
    render(Collection, { props: { state: { bags: [2], tray: 0 }, onmove: vi.fn() } });
    const handle = screen.getByRole('button', { name: 'Kelereng di kantong 1' });
    await fireEvent(handle, new MouseEvent('pointerdown', { clientX: 30, clientY: 40, bubbles: true }));
    expect(handle.style.getPropertyValue('--gx')).toBe('30px');
    expect(handle.style.getPropertyValue('--gy')).toBe('40px');
    await fireEvent(handle, new MouseEvent('pointerup', { clientX: 30, clientY: 40, bubbles: true }));
    expect(handle.style.getPropertyValue('--gx')).toBe('');
  });

  it('pops in marbles the program puts in a bag', async () => {
    const animate = vi.spyOn(Element.prototype, 'animate');
    const view = render(Collection, { props: { state: { bags: [0, 0], tray: 5 }, onmove: vi.fn() } });
    await view.rerender({ state: { bags: [3, 2], tray: 0 } });
    expect(animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('scale(0.6)'))).toHaveLength(5);
  });

  it('does not pop a marble the learner dragged', async () => {
    const animate = vi.spyOn(Element.prototype, 'animate');
    let rerenderWith: (state: CollectionState) => Promise<void> = async () => {};
    const view = render(Collection, {
      props: { state: { bags: [0], tray: 2 }, onmove: (s: CollectionState) => rerenderWith({ bags: [...s.bags], tray: s.tray }) },
    });
    rerenderWith = (state) => view.rerender({ state });
    const [marble] = screen.getAllByRole('button', { name: 'Kelereng' });
    await fireEvent.keyDown(marble, { key: ' ' });
    await fireEvent.keyDown(marble, { key: ' ' });
    expect(animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('scale(0.6)'))).toHaveLength(0);
  });
});
