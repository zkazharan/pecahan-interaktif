import { render, screen, waitFor } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import App from './App.svelte';
import { announce, ensureAnnouncer } from './lib/drag/announce';

it('shows the module list on the root route', () => {
  window.location.hash = '#/';
  render(App);
  expect(screen.getByRole('heading', { level: 1, name: 'Pecahan' })).toBeInTheDocument();
});

it('empties the announcer when the tab changes', async () => {
  window.location.hash = '#/membagi-adil';
  render(App);
  const region = ensureAnnouncer()!;
  announce('Diangkat: Potongan.');
  expect(region).toHaveTextContent('Diangkat: Potongan.');
  window.location.hash = '#/membagi-adil/latihan';
  await waitFor(() => expect(screen.getByRole('link', { name: 'Latihan' })).toHaveAttribute('aria-current', 'page'));
  expect(region).toBeEmptyDOMElement();
});
