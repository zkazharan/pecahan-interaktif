import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Peraga from './Peraga.svelte';

function setup(params = { d: 5, a: 2, b: 1 }) {
  const onparams = vi.fn();
  const view = render(Peraga, { props: { params, onparams } });
  return { onparams, view, user: userEvent.setup() };
}

const next = () => screen.getByRole('button', { name: 'Lanjut →' });
const tray = () => screen.getByTestId('tray').querySelectorAll('[data-tray-piece]').length;

describe('jumlah-penyebut-sama Peraga', () => {
  it('adds in the loyang and takes back out', async () => {
    const { user } = setup();
    expect(screen.getAllByRole('group', { name: /^Martabak/ })).toHaveLength(2);
    await user.click(next());
    expect(tray()).toBe(3);
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(tray()).toBe(0);
    await user.click(next());
    expect(screen.getAllByRole('img', { name: 'tiga perlima' }).length).toBeGreaterThan(0);
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(tray()).toBe(1);
    expect(screen.getByTestId('plate-0').querySelectorAll('[data-plate-piece]')).toHaveLength(2);
  });

  it('restarts the loyang when the numbers change', async () => {
    const { view, user } = setup();
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    await view.rerender({ params: { d: 4, a: 3, b: 3 } });
    expect(tray()).toBe(6);
    expect(screen.getByTestId('plate-1')).toBeInTheDocument();
  });

  it('keeps both parts within a smaller denominator', async () => {
    const { onparams, user } = setup({ d: 5, a: 5, b: 4 });
    await user.click(screen.getByRole('button', { name: 'Kurangi penyebut' }));
    expect(onparams).toHaveBeenCalledWith({ d: 4, a: 4, b: 4 });
  });
});
