import { render, screen } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import App from './App.svelte';

it('renders the app title', () => {
  render(App);
  expect(screen.getByRole('heading', { name: 'Pecahan Interaktif' })).toBeInTheDocument();
});
