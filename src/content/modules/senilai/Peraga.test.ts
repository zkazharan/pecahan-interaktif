import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../../../lib/fraction';
import Peraga from './Peraga.svelte';

function setup(f = frac(1, 2)) {
  const onparams = vi.fn();
  const view = render(Peraga, { props: { params: { f }, onparams } });
  return { onparams, view, user: userEvent.setup() };
}

const next = () => screen.getByRole('button', { name: 'Lanjut →' });
const lowerLabel = (container: HTMLElement) =>
  container.querySelector('[data-row="ulang"] .label')?.textContent?.replace(/\s/g, '');

describe('senilai Peraga', () => {
  it('re-cuts the lower bar to 2/4 and then 3/6', async () => {
    const { view, user } = setup();
    expect(lowerLabel(view.container)).toBe('12');
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(lowerLabel(view.container)).toBe('24');
    expect(screen.getByText('panjangnya tetap sama!')).toBeInTheDocument();
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(lowerLabel(view.container)).toBe('36');
    await user.click(next());
    expect(screen.getAllByRole('img', { name: 'tiga perenam' }).length).toBeGreaterThan(0);
  });

  it('never re-cuts past 24 parts', async () => {
    const { view, user } = setup(frac(3, 8));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Tambah potong ulang' }));
    expect(screen.getByRole('button', { name: 'Tambah potong ulang' })).toBeDisabled();
    expect(lowerLabel(view.container)).toBe('924');
  });

  it('clamps the re-cut when the fraction changes', async () => {
    const { view, user } = setup(frac(1, 2));
    for (let i = 0; i < 5; i++) await user.click(screen.getByRole('button', { name: 'Tambah potong ulang' }));
    await view.rerender({ params: { f: frac(1, 8) } });
    expect(lowerLabel(view.container)).toBe('324');
  });

  it('reports a new fraction', async () => {
    const { onparams, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Tambah penyebut Pecahan' }));
    expect(onparams).toHaveBeenCalledWith({ f: { n: 1, d: 3 } });
  });
});
