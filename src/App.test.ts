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

it('wraps the tab content in main on both tabs', async () => {
  window.location.hash = '#/membagi-adil/peraga';
  render(App);
  await waitFor(() => expect(screen.getByRole('link', { name: 'Peraga' })).toHaveAttribute('aria-current', 'page'));
  const main = screen.getByRole('main');
  expect(main).toContainElement(screen.getByRole('button', { name: 'Lanjut →' }));
  expect(main).not.toContainElement(screen.getByRole('navigation', { name: 'Bagian modul' }));
  window.location.hash = '#/membagi-adil/latihan';
  await waitFor(() => expect(screen.getByText('Soal 1 dari 5')).toBeInTheDocument());
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(screen.getByRole('main')).toContainElement(screen.getByText('Soal 1 dari 5'));
});
