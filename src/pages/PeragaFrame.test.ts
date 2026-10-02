import { createRawSnippet } from 'svelte';
import { render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PeragaFrame from './PeragaFrame.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));
const controls = createRawSnippet(() => ({ render: () => '<button type="button">Tambah contoh</button>' }));

function setup(wide: boolean, withControls = true) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('min-width') ? wide : false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  render(PeragaFrame, {
    props: { step: 0, total: 3, onstep: () => {}, caption: text('Keterangan'), stage: text('Panggung'), controls: withControls ? controls : undefined, onshow: () => {} },
  });
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

  it('renders no disclosure when there are no controls', () => {
    setup(false, false);
    expect(screen.queryByText('Ubah angka')).toBeNull();
  });
});
