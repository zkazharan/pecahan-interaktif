import { render, screen } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import App from './App.svelte';

it('shows the module list on the root route', () => {
  window.location.hash = '#/';
  render(App);
  expect(screen.getByRole('heading', { level: 1, name: 'Pecahan' })).toBeInTheDocument();
});
