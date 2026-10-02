import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Circle from './Circle.svelte';
import { equalSlices } from './circle';

describe('Circle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('draws one path per slice and names the whole', () => {
    const { container } = render(Circle, { props: { slices: equalSlices(5), label: 'Martabak dipotong 5' } });
    expect(screen.getByRole('group', { name: 'Martabak dipotong 5' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slice]')).toHaveLength(5);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('can follow the width of its container', () => {
    const { container } = render(Circle, { props: { slices: equalSlices(3), label: 'Martabak', size: 'fill' } });
    expect(container.querySelector('svg')).toHaveClass('fill');
  });

  it('turns slices into toggle buttons when shading is allowed', async () => {
    const onshade = vi.fn();
    render(Circle, { props: { slices: equalSlices(4), shaded: [true, false, false, false], onshade, label: 'Martabak' } });
    const first = screen.getByRole('button', { name: 'Potongan 1' });
    const second = screen.getByRole('button', { name: 'Potongan 2' });
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(second);
    expect(onshade).toHaveBeenLastCalledWith(1);
    await fireEvent.keyDown(first, { key: 'Enter' });
    expect(onshade).toHaveBeenLastCalledWith(0);
    await fireEvent.keyDown(first, { key: ' ' });
    expect(onshade).toHaveBeenCalledTimes(3);
    await fireEvent.keyDown(first, { key: 'a' });
    expect(onshade).toHaveBeenCalledTimes(3);
  });

  it('draws the focus ring as its own layer above every slice', async () => {
    const { container } = render(Circle, { props: { slices: equalSlices(4), shaded: [], onshade: vi.fn(), label: 'Martabak' } });
    expect(container.querySelector('[data-focus-ring]')).toBeNull();
    const second = screen.getByRole('button', { name: 'Potongan 2' });
    second.focus();
    await tick();
    const ring = container.querySelector('[data-focus-ring]')!;
    expect(ring).not.toBeNull();
    expect(ring.getAttribute('d')).toBe(second.getAttribute('d'));
    const children = [...container.querySelectorAll('svg > *')];
    const lastSlice = container.querySelector('[data-slice="3"]')!;
    expect(children.indexOf(ring)).toBeGreaterThan(children.indexOf(lastSlice));
    second.blur();
    await tick();
    expect(container.querySelector('[data-focus-ring]')).toBeNull();
  });

  it('hides itself from assistive tech when decorative', () => {
    const { container } = render(Circle, { props: { slices: equalSlices(2), label: 'Martabak', decorative: true } });
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('pulses when the number of slices changes, but not on first render', async () => {
    const animate = vi.spyOn(Element.prototype, 'animate');
    const view = render(Circle, { props: { slices: equalSlices(1), label: 'Martabak' } });
    expect(animate).not.toHaveBeenCalled();
    await view.rerender({ slices: equalSlices(3) });
    expect(JSON.stringify(animate.mock.calls[0][0])).toContain('scale(0.94)');
  });

  it('does not pulse under reduced motion', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const animate = vi.spyOn(Element.prototype, 'animate');
    const view = render(Circle, { props: { slices: equalSlices(1), label: 'Martabak' } });
    await view.rerender({ slices: equalSlices(3) });
    expect(animate).not.toHaveBeenCalled();
  });

  it('draws one dashed guide per equal cut', () => {
    const { container } = render(Circle, { props: { slices: equalSlices(3), label: 'm', guides: 5 } });
    expect(container.querySelectorAll('[data-guide]')).toHaveLength(5);
  });

  it('outlines the marked slices on top of the slices', () => {
    const { container } = render(Circle, { props: { slices: equalSlices(4), label: 'm', outlined: [false, true, true, false] } });
    const outlined = container.querySelectorAll('[data-outlined]');
    expect(outlined).toHaveLength(2);
    const lastSlice = container.querySelectorAll('[data-slice]')[3];
    expect(lastSlice.compareDocumentPosition(outlined[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('hatches crossed slices and leaves the others plain', () => {
    const { container } = render(Circle, {
      props: { slices: equalSlices(4), shaded: [true, true, true, false], crossed: [false, true, true, false], label: 'Martabak' },
    });
    const crossed = [...container.querySelectorAll('[data-crossed]')];
    const wedges = [...container.querySelectorAll('[data-slice]')].map((el) => el.getAttribute('d'));
    expect(crossed.map((el) => wedges.indexOf(el.getAttribute('d')))).toEqual([1, 2]);
    expect(container.querySelector('[data-outlined]')).toBeNull();
  });

  it('draws no hatching by default', () => {
    const { container } = render(Circle, { props: { slices: equalSlices(4), shaded: [true, true, false, false], label: 'Martabak' } });
    expect(container.querySelector('[data-crossed]')).toBeNull();
  });

  it('gives every circle its own hatch pattern', () => {
    const a = render(Circle, { props: { slices: equalSlices(2), crossed: [true, false], label: 'a' } });
    const b = render(Circle, { props: { slices: equalSlices(2), crossed: [true, false], label: 'b' } });
    const idA = a.container.querySelector('pattern')!.id;
    const idB = b.container.querySelector('pattern')!.id;
    expect(idA).not.toBe(idB);
    expect(a.container.querySelector('[data-crossed]')!.getAttribute('fill')).toBe(`url(#${idA})`);
  });
});
