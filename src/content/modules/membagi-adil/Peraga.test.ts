import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Peraga from './Peraga.svelte';

function setup(n = 3) {
  const onparams = vi.fn();
  const view = render(Peraga, { props: { params: { n }, onparams } });
  return { onparams, view, user: userEvent.setup() };
}

const slices = () => document.querySelectorAll('[data-slice]').length;

describe('membagi-adil Peraga', () => {
  it('walks from a whole martabak to one third', async () => {
    const { user } = setup();
    expect(screen.getByText(/mau dibagi untuk/)).toBeInTheDocument();
    expect(slices()).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(screen.getByText('tidak sama besar!')).toBeInTheDocument();
    expect(slices()).toBe(3);
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(slices()).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Tambah jumlah potong' }));
    expect(slices()).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(slices()).toBe(3);
    expect(screen.getByText('sama besar, adil!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(screen.getByRole('img', { name: 'sepertiga' })).toBeInTheDocument();
  });

  it('reports a new number of children', async () => {
    const { onparams, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Tambah jumlah anak' }));
    expect(onparams).toHaveBeenCalledWith({ n: 4 });
  });

  it('follows a new number of children on the last step', async () => {
    const { view, user } = setup();
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    await view.rerender({ params: { n: 5 } });
    expect(slices()).toBe(5);
    expect(screen.getByRole('img', { name: 'seperlima' })).toBeInTheDocument();
  });
});
