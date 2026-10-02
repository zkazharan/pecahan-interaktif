import { createRawSnippet } from 'svelte';
import { act, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PeragaFrame from './PeragaFrame.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));
const controls = createRawSnippet(() => ({ render: () => '<button type="button">Tambah contoh</button>' }));
const actions = createRawSnippet(() => ({ render: () => '<button type="button">Potong contoh</button>' }));

function setup(wide: boolean, withControls = true) {
  let listener: (() => void) | null = null;
  const query = {
    matches: wide,
    addEventListener: (_type: string, fn: () => void) => {
      listener = fn;
    },
    removeEventListener: () => {
      listener = null;
    },
  };
  vi.stubGlobal('matchMedia', () => query);
  render(PeragaFrame, {
    props: { step: 0, total: 3, onstep: () => {}, caption: text('Keterangan'), stage: text('Panggung'), controls: withControls ? controls : undefined, actions, onshow: () => {} },
  });
  return {
    cross: async (nextWide: boolean) => {
      query.matches = nextWide;
      await act(() => listener?.());
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('PeragaFrame controls strip', () => {
  it('folds the controls into a closed Ubah angka disclosure on phones', () => {
    setup(false);
    const details = screen.getByText('Ubah angka').closest('details')!;
    expect(details).not.toHaveAttribute('open');
    expect(within(details).getByText('Tambah contoh')).toBeInTheDocument();
  });

  it('keeps Tunjukkan and the step buttons outside the disclosure', () => {
    setup(false);
    const details = screen.getByText('Ubah angka').closest('details')!;
    for (const name of ['Tunjukkan', 'Lanjut →', '← Sebelumnya']) {
      expect(details).not.toContainElement(screen.getByRole('button', { name }));
    }
  });

  it('opens the disclosure when the summary is clicked', async () => {
    setup(false);
    const details = screen.getByText('Ubah angka').closest('details')!;
    screen.getByText('Ubah angka').click();
    expect(details).toHaveAttribute('open');
  });

  it('starts open on wide screens', () => {
    setup(true);
    expect(screen.getByText('Ubah angka').closest('details')).toHaveAttribute('open');
  });

  it('keeps the step actions outside the disclosure', () => {
    setup(false);
    const details = screen.getByText('Ubah angka').closest('details')!;
    expect(details).not.toContainElement(screen.getByRole('button', { name: 'Potong contoh' }));
  });

  it('opens when the screen grows past 600px and closes when it shrinks again', async () => {
    const { cross } = setup(false);
    const details = screen.getByText('Ubah angka').closest('details')!;
    expect(details).not.toHaveAttribute('open');
    await cross(true);
    expect(details).toHaveAttribute('open');
    await cross(false);
    expect(details).not.toHaveAttribute('open');
  });

  it('renders no disclosure when there are no controls', () => {
    setup(false, false);
    expect(screen.queryByText('Ubah angka')).toBeNull();
  });
});
