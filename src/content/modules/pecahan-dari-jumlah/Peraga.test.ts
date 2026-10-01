import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Peraga from './Peraga.svelte';

function setup(params = { n: 12, k: 3, take: 2 }) {
  const onparams = vi.fn();
  const view = render(Peraga, { props: { params, onparams } });
  return { onparams, view, user: userEvent.setup() };
}

const next = () => screen.getByRole('button', { name: 'Lanjut →' });
const trayCount = () => document.querySelectorAll('[data-tray-marble]').length;
const bagMarbles = (i: number) => screen.getByTestId(`bag-${i}`).querySelectorAll('[data-marble]').length;

describe('pecahan-dari-jumlah Peraga', () => {
  it('starts with every marble in the tray', () => {
    setup();
    expect(trayCount()).toBe(12);
    expect(bagMarbles(0)).toBe(0);
    expect(screen.getByText(/Ada 12 kelereng dan 3 kantong/)).toBeInTheDocument();
  });

  it('shares the marbles evenly on Tunjukkan in step 1', async () => {
    const { user } = setup();
    await user.click(next());
    expect(trayCount()).toBe(12);
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(trayCount()).toBe(0);
    for (let i = 0; i < 3; i++) expect(bagMarbles(i)).toBe(4);
  });

  it('shows the count in every bag in step 2', async () => {
    const { user } = setup();
    await user.click(next());
    await user.click(next());
    const counts = Array.from(document.querySelectorAll('[data-bag-count]')).map((el) => el.textContent);
    expect(counts).toEqual(['4', '4', '4']);
    expect(screen.queryByRole('button', { name: 'Tunjukkan' })).toBeNull();
  });

  it('marks the first take bags in step 3', async () => {
    const { user } = setup({ n: 24, k: 6, take: 5 });
    await user.click(next());
    await user.click(next());
    await user.click(next());
    expect(document.querySelectorAll('.bag.taken')).toHaveLength(5);
    expect(document.querySelector('[data-testid="bag-5"]')).not.toHaveClass('taken');
    expect(screen.getByText(/Ambil 5 kantong/)).toBeInTheDocument();
  });

  it('puts every marble back in the tray when the numbers change after Tunjukkan', async () => {
    const { view, user } = setup();
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    await view.rerender({ params: { n: 24, k: 6, take: 2 } });
    expect(trayCount()).toBe(24);
    expect(screen.getByTestId('bag-5')).toBeInTheDocument();
    expect(bagMarbles(0)).toBe(0);
  });

  it('puts the marbles back when changing step and coming back', async () => {
    const { user } = setup();
    await user.click(next());
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    await user.click(next());
    await user.click(screen.getByRole('button', { name: /Sebelumnya/ }));
    expect(trayCount()).toBe(12);
  });

  it('steps the total by one bag', async () => {
    const { onparams, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Tambah banyak kelereng' }));
    expect(onparams).toHaveBeenCalledWith({ n: 15, k: 3, take: 2 });
  });

  it('changes the bag count and the take', async () => {
    const { onparams, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Tambah banyak kantong' }));
    expect(onparams).toHaveBeenCalledWith({ n: 12, k: 4, take: 2 });
    await user.click(screen.getByRole('button', { name: 'Tambah kantong diambil' }));
    expect(onparams).toHaveBeenCalledWith({ n: 12, k: 3, take: 3 });
  });
});
