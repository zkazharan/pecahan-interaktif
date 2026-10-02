import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { frac } from '../lib/fraction';
import type { FractionLimits } from '../lib/limits';
import FractionStepper from './FractionStepper.svelte';
import FractionText from './FractionText.svelte';
import Stamp from './Stamp.svelte';
import StepNav from './StepNav.svelte';
import TaskChecks from './TaskChecks.svelte';

const LIMITS: FractionLimits = { dMin: 1, dMax: 12, nMin: 1, nMax: (d) => d };

describe('FractionText', () => {
  it('shows numerator over denominator and reads it aloud', () => {
    render(FractionText, { props: { value: frac(2, 5) } });
    const el = screen.getByRole('img', { name: 'dua perlima' });
    expect(el).toHaveTextContent(/^2\s*5$/);
  });
});

describe('StepNav', () => {
  it('disables Sebelumnya on the first step and reports progress', async () => {
    const onstep = vi.fn();
    render(StepNav, { props: { step: 0, total: 4, onstep } });
    expect(screen.getByRole('button', { name: '← Sebelumnya' })).toBeDisabled();
    expect(screen.getByRole('list', { name: 'Langkah 1 dari 4' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(onstep).toHaveBeenCalledWith(1);
  });

  it('disables Lanjut on the last step', () => {
    render(StepNav, { props: { step: 3, total: 4, onstep: vi.fn() } });
    expect(screen.getByRole('button', { name: 'Lanjut →' })).toBeDisabled();
  });

  it('disables Lanjut when step is past the last one', () => {
    render(StepNav, { props: { step: 7, total: 4, onstep: vi.fn() } });
    expect(screen.getByRole('button', { name: 'Lanjut →' })).toBeDisabled();
  });

  it('disables Sebelumnya when step is below the first one', () => {
    render(StepNav, { props: { step: -2, total: 4, onstep: vi.fn() } });
    expect(screen.getByRole('button', { name: '← Sebelumnya' })).toBeDisabled();
  });

  it('disables both buttons when there are no steps', () => {
    render(StepNav, { props: { step: 0, total: 0, onstep: vi.fn() } });
    expect(screen.getByRole('button', { name: 'Lanjut →' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '← Sebelumnya' })).toBeDisabled();
  });
});

describe('FractionStepper', () => {
  function setup(value = frac(1, 3)) {
    const onchange = vi.fn();
    render(FractionStepper, { props: { label: 'Pecahan A', value, limits: LIMITS, onchange } });
    return { onchange };
  }

  it('steps the denominator', async () => {
    const { onchange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Tambah penyebut Pecahan A' }));
    expect(onchange).toHaveBeenCalledWith({ n: 1, d: 4 });
  });

  it('disables buttons at the limits', () => {
    setup(frac(1, 1));
    expect(screen.getByRole('button', { name: 'Kurangi penyebut Pecahan A' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Kurangi pembilang Pecahan A' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tambah pembilang Pecahan A' })).toBeDisabled();
  });

  it('pulls the numerator down when the denominator shrinks below it', async () => {
    const { onchange } = setup(frac(4, 4));
    await userEvent.click(screen.getByRole('button', { name: 'Kurangi penyebut Pecahan A' }));
    expect(onchange).toHaveBeenCalledWith({ n: 3, d: 3 });
  });

  it('accepts a typed value inside the limits', async () => {
    const { onchange } = setup();
    const input = screen.getByLabelText('Penyebut Pecahan A');
    await userEvent.clear(input);
    await userEvent.type(input, '6');
    await fireEvent.change(input);
    expect(onchange).toHaveBeenCalledWith({ n: 1, d: 6 });
  });

  it('respects a numerator floor that follows the denominator', async () => {
    const onchange = vi.fn();
    const improper: FractionLimits = { dMin: 2, dMax: 8, nMin: (d) => d + 1, nMax: (d) => 3 * d };
    render(FractionStepper, { props: { label: 'Pecahan', value: frac(5, 4), limits: improper, onchange } });
    expect(screen.getByRole('button', { name: 'Kurangi pembilang Pecahan' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Tambah penyebut Pecahan' }));
    expect(onchange).toHaveBeenCalledWith({ n: 6, d: 5 });
  });

  it('reverts typed values that are broken or out of range', async () => {
    const { onchange } = setup();
    const input = screen.getByLabelText('Penyebut Pecahan A') as HTMLInputElement;
    for (const typed of ['13', 'abc', '0', '2.5']) {
      await userEvent.clear(input);
      if (typed) await userEvent.type(input, typed);
      await fireEvent.change(input);
      expect(input.value).toBe('3');
    }
    await userEvent.clear(input);
    await fireEvent.change(input);
    expect(input.value).toBe('3');
    expect(onchange).not.toHaveBeenCalled();
  });
});

describe('TaskChecks', () => {
  it('labels each task by its outcome', () => {
    render(TaskChecks, { props: { outcomes: ['first-try', 'shown'], total: 5 } });
    expect(screen.getByLabelText('Soal 1: benar')).toHaveTextContent('✓');
    expect(screen.getByLabelText('Soal 2: dibantu')).toHaveTextContent('✓');
    expect(screen.getByLabelText('Soal 3: belum')).toHaveTextContent('○');
  });
});

describe('Stamp', () => {
  it('describes itself for screen readers', () => {
    render(Stamp, { props: { text: 'Bagus!', score: 80, caption: 'MODUL 3 SELESAI' } });
    expect(screen.getByRole('img', { name: 'Stempel Bagus! Nilai 80. MODUL 3 SELESAI' })).toBeInTheDocument();
  });
});
