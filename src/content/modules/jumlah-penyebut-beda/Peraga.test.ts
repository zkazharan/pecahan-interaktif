import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../../../lib/fraction';
import Peraga from './Peraga.svelte';

function setup(a = frac(1, 2), b = frac(1, 3)) {
  const onparams = vi.fn();
  const view = render(Peraga, { props: { params: { a, b }, onparams } });
  return { onparams, view, user: userEvent.setup() };
}

const next = () => screen.getByRole('button', { name: 'Lanjut →' });
const label = (container: HTMLElement, id: string) =>
  container.querySelector(`[data-row="${id}"] .label`)?.textContent?.replace(/\s/g, '');

describe('jumlah-penyebut-beda Peraga', () => {
  it('re-cuts both bars to sixths and shows the sum', async () => {
    const { view, user } = setup();
    expect(label(view.container, 'a')).toBe('12');
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(label(view.container, 'a')).toBe('36');
    expect(label(view.container, 'b')).toBe('26');
    expect(screen.getByText('sama besar!')).toBeInTheDocument();
    await user.click(next());
    await user.click(next());
    expect(label(view.container, 'hasil')).toBe('56');
    expect(screen.getAllByRole('img', { name: 'lima perenam' }).length).toBeGreaterThan(0);
  });

  it('draws a two-whole result when the sum is more than one', async () => {
    const { view, user } = setup(frac(3, 4), frac(2, 3));
    for (let i = 0; i < 3; i++) await user.click(next());
    expect(label(view.container, 'hasil')).toBe('1712');
    expect(view.container.querySelectorAll('[data-row="hasil"] .whole-line')).toHaveLength(1);
  });

  it('ignores a fraction whose common denominator would pass 24', async () => {
    const { onparams, user } = setup(frac(1, 5), frac(1, 5));
    await user.click(screen.getByRole('button', { name: 'Tambah penyebut Pecahan kedua' }));
    expect(onparams).not.toHaveBeenCalled();
  });

  it('uses the new targets after the fraction changes on step 2', async () => {
    const { view, user } = setup();
    await user.click(next());
    await user.click(next());
    await view.rerender({ params: { a: frac(1, 4), b: frac(1, 6) } });
    expect(label(view.container, 'a')).toBe('312');
    expect(label(view.container, 'b')).toBe('212');
  });
});
