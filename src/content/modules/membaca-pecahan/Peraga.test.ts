import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../../../lib/fraction';
import Peraga from './Peraga.svelte';

function setup(f = frac(3, 4)) {
  const onparams = vi.fn();
  const view = render(Peraga, { props: { params: { f }, onparams } });
  return { onparams, view, user: userEvent.setup() };
}

const next = () => screen.getByRole('button', { name: 'Lanjut →' });

describe('membaca-pecahan Peraga', () => {
  it('shades by tapping and by Tunjukkan', async () => {
    const { user } = setup();
    expect(screen.getByText(/penyebut/)).toBeInTheDocument();
    await user.click(next());
    const first = screen.getByRole('button', { name: 'Potongan 1' });
    await user.click(first);
    expect(first).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(screen.getAllByRole('button', { name: /^Potongan \d+$/ }).filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(3);
    await user.click(next());
    expect(screen.getAllByRole('img', { name: 'tiga perempat' }).length).toBeGreaterThan(0);
  });

  it('places the card on the line with Tunjukkan', async () => {
    const { view, user } = setup();
    for (let i = 0; i < 3; i++) await user.click(next());
    expect(screen.getByTestId('line-pile').querySelector('[data-card="f"]')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(view.container.querySelector('.pin [data-card="f"]')).not.toBeNull();
  });

  it('survives a new fraction mid-way', async () => {
    const { view, user } = setup();
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    await view.rerender({ params: { f: frac(1, 2) } });
    expect(screen.getAllByRole('button', { name: /^Potongan \d+$/ })).toHaveLength(2);
    await user.click(next());
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    await view.rerender({ params: { f: frac(1, 3) } });
    expect(view.container.querySelectorAll('[data-tick]')).toHaveLength(4);
  });

  it('reports stepper changes as new params', async () => {
    const { onparams, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Tambah penyebut Pecahan' }));
    expect(onparams).toHaveBeenCalledWith({ f: { n: 3, d: 5 } });
  });
});
