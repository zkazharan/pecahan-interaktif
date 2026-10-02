import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../../../lib/fraction';
import Peraga from './Peraga.svelte';

function setup(a = frac(1, 3), b = frac(1, 4)) {
  const onparams = vi.fn();
  render(Peraga, { props: { params: { a, b }, onparams } });
  return { onparams, user: userEvent.setup() };
}

describe('membandingkan Peraga', () => {
  it('walks through the four steps', async () => {
    const { user } = setup();
    expect(screen.getByText(/Panjang pita utuhnya sama/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tunjukkan' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    await user.click(screen.getByRole('button', { name: 'Tunjukkan' }));
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(screen.getByText(/lebih panjang\?/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(screen.getByText(/lebih besar dari/)).toBeInTheDocument();
  });

  it('stacks automatically when jumping to the question step', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(screen.getByText('lebih panjang!')).toBeInTheDocument();
  });

  it('unstacks when going back to the first step', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    await user.click(screen.getByRole('button', { name: '← Sebelumnya' }));
    await user.click(screen.getByRole('button', { name: '← Sebelumnya' }));
    expect(screen.queryByText('lebih panjang!')).toBeNull();
  });

  it('says sama dengan for equal values', async () => {
    const { user } = setup(frac(1, 2), frac(2, 4));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(screen.getByText(/sama dengan/)).toBeInTheDocument();
    expect(screen.getByText('pas sama!')).toBeInTheDocument();
  });

  it('reports stepper changes as new params', async () => {
    const { onparams, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Tambah penyebut Pecahan A' }));
    expect(onparams).toHaveBeenCalledWith({ a: { n: 1, d: 4 }, b: { n: 1, d: 4 } });
  });
});

describe('membandingkan Peraga dragging', () => {
  const draggable = () => screen.getAllByRole('button', { name: /^Potongan / }).map((piece) => piece.getAttribute('aria-disabled') === 'false');

  it('lets the teacher drag the pieces only while the caption asks for stacking', async () => {
    const { user } = setup();
    const next = () => screen.getByRole('button', { name: 'Lanjut →' });
    expect(draggable()).toEqual([false, false]);
    await user.click(next());
    expect(draggable()).toEqual([true, true]);
    await user.click(next());
    expect(draggable()).toEqual([true, true]);
    await user.click(next());
    expect(screen.getByText(/lebih besar dari/)).toBeInTheDocument();
    expect(draggable()).toEqual([false, false]);
  });
});
