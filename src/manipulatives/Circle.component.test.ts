import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Circle from './Circle.svelte';
import { equalSlices } from './circle';

describe('Circle', () => {
  it('draws one path per slice and names the whole', () => {
    const { container } = render(Circle, { props: { slices: equalSlices(5), label: 'Martabak dipotong 5' } });
    expect(screen.getByRole('group', { name: 'Martabak dipotong 5' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slice]')).toHaveLength(5);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
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

  it('hides itself from assistive tech when decorative', () => {
    const { container } = render(Circle, { props: { slices: equalSlices(2), label: 'Martabak', decorative: true } });
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('group')).toBeNull();
  });
});
