import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../../../lib/fraction';
import Peraga from './Peraga.svelte';

function setup(f = frac(5, 4)) {
  const onparams = vi.fn();
  const view = render(Peraga, { props: { params: { f }, onparams } });
  return { onparams, view, user: userEvent.setup() };
}

const next = () => screen.getByRole('button', { name: 'Lanjut →' });
const trayCount = () => screen.getByTestId('tray').querySelectorAll('[data-tray-piece]').length;

describe('pecahan-campuran Peraga', () => {
  it('groups five quarters into one whole and one quarter', async () => {
    const { user } = setup();
    expect(trayCount()).toBe(5);
    expect(screen.getByTestId('plate-1')).toBeInTheDocument();
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(trayCount()).toBe(0);
    expect(screen.getByTestId('plate-0').querySelectorAll('[data-plate-piece]')).toHaveLength(4);
    await user.click(next());
    expect(screen.getByText(/1 piring penuh/)).toBeInTheDocument();
    await user.click(next());
    expect(screen.getAllByRole('img', { name: 'satu seperempat' }).length).toBeGreaterThan(0);
    expect(document.querySelector('.pin [data-card="f"]')).not.toBeNull();
  });

  it('fills the plates when jumping ahead', async () => {
    const { user } = setup();
    await user.click(next());
    await user.click(next());
    expect(trayCount()).toBe(0);
  });

  it('restarts the plates when the fraction changes', async () => {
    const { view, user } = setup();
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    await view.rerender({ params: { f: frac(7, 3) } });
    expect(trayCount()).toBe(7);
    expect(screen.getByTestId('plate-2')).toBeInTheDocument();
  });

  it('keeps the numerator above the denominator', async () => {
    const { onparams, user } = setup();
    expect(screen.getByRole('button', { name: 'Kurangi pembilang Pecahan' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Tambah penyebut Pecahan' }));
    expect(onparams).toHaveBeenCalledWith({ f: { n: 6, d: 5 } });
  });
});
