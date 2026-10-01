import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MODULES } from '../content/registry';
import { createProgressStore } from '../lib/progress';
import Home from './Home.svelte';

describe('Home', () => {
  it('lists all 8 modules and marks the unfinished ones', () => {
    render(Home, { props: { store: createProgressStore(null) } });
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(screen.queryAllByText('sedang disiapkan')).toHaveLength(8 - Object.keys(MODULES).length);
  });

  it('shows a stamp for a finished module and clears it after confirming', async () => {
    const store = createProgressStore(null);
    store.record('membandingkan', 5);
    const user = userEvent.setup();
    render(Home, { props: { store } });
    expect(screen.getByRole('img', { name: 'Stempel: Hebat!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hapus semua stempel' }));
    await user.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.getByRole('img', { name: 'Stempel: Hebat!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hapus semua stempel' }));
    await user.click(screen.getByRole('button', { name: 'Ya, hapus' }));
    expect(screen.queryByRole('img', { name: 'Stempel: Hebat!' })).toBeNull();
    expect(store.all()).toEqual({});
  });

  it('hides the clear button when there are no stamps', () => {
    render(Home, { props: { store: createProgressStore(null) } });
    expect(screen.queryByRole('button', { name: 'Hapus semua stempel' })).toBeNull();
  });
});
