import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../lib/fraction';
import CountStepper from './CountStepper.svelte';
import MixedText from './MixedText.svelte';

describe('MixedText', () => {
  it('shows the whole part and the stacked rest', () => {
    render(MixedText, { props: { whole: 1, rest: frac(3, 4) } });
    expect(screen.getByRole('img', { name: 'satu tiga perempat' })).toHaveTextContent(/^1\s*3\s*4$/);
  });

  it('shows only the whole part when the rest is zero', () => {
    render(MixedText, { props: { whole: 2, rest: frac(0, 4) } });
    expect(screen.getByRole('img', { name: 'dua' })).toHaveTextContent(/^2$/);
  });
});

describe('CountStepper', () => {
  it('steps up and down within its range', async () => {
    const onchange = vi.fn();
    render(CountStepper, { props: { label: 'Jumlah potong', value: 3, min: 1, max: 12, onchange } });
    expect(screen.getByRole('status')).toHaveTextContent('3');
    await userEvent.click(screen.getByRole('button', { name: 'Tambah jumlah potong' }));
    expect(onchange).toHaveBeenLastCalledWith(4);
    await userEvent.click(screen.getByRole('button', { name: 'Kurangi jumlah potong' }));
    expect(onchange).toHaveBeenLastCalledWith(2);
  });

  it('names the group once and hides the visual label from assistive tech', () => {
    render(CountStepper, { props: { label: 'Jumlah potong', value: 3, min: 1, max: 12, onchange: vi.fn() } });
    expect(screen.getByRole('group', { name: 'Jumlah potong' })).toBeInTheDocument();
    expect(screen.getByText('Jumlah potong')).toHaveAttribute('aria-hidden', 'true');
  });

  it('disables buttons at the limits and when disabled', () => {
    const { unmount } = render(CountStepper, { props: { label: 'Jumlah potong', value: 1, min: 1, max: 1, onchange: vi.fn() } });
    expect(screen.getByRole('button', { name: 'Kurangi jumlah potong' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tambah jumlah potong' })).toBeDisabled();
    unmount();
    render(CountStepper, { props: { label: 'Jumlah potong', value: 5, min: 1, max: 12, onchange: vi.fn(), disabled: true } });
    expect(screen.getByRole('button', { name: 'Tambah jumlah potong' })).toBeDisabled();
  });
});
