import { afterEach, describe, expect, it } from 'vitest';
import { announce, clearAnnouncer, ensureAnnouncer } from './announce';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('announce', () => {
  it('creates the live region before the first message', () => {
    const created = ensureAnnouncer();
    expect(created).toBe(region());
    expect(created).toHaveAttribute('aria-live', 'polite');
    expect(created).toBeEmptyDOMElement();
  });

  it('reuses one region', () => {
    ensureAnnouncer();
    ensureAnnouncer();
    expect(document.querySelectorAll('[data-testid="announcer"]')).toHaveLength(1);
  });

  it('writes a new message immediately', () => {
    ensureAnnouncer();
    announce('Diangkat');
    expect(region()).toHaveTextContent('Diangkat');
  });

  it('changes the text for an identical message so it is read again', () => {
    ensureAnnouncer();
    announce('Diangkat');
    announce('Diangkat');
    expect(region().textContent).not.toBe('Diangkat');
    expect(region().textContent).toBe('Diangkat' + String.fromCharCode(160));
    announce('Diangkat');
    expect(region().textContent).toBe('Diangkat');
    expect(region()).toHaveTextContent('Diangkat');
  });

  it('keeps a message that creates the region', async () => {
    announce('Pertama');
    expect(region()).toBeEmptyDOMElement();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(region()).toHaveTextContent('Pertama');
  });

  it('keeps the latest message when two arrive before the new region settles', async () => {
    announce('Satu');
    announce('Dua');
    expect(region()).toBeEmptyDOMElement();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(region()).toHaveTextContent('Dua');
  });

  it('empties the region on clearAnnouncer and drops a pending write', async () => {
    announce('Pertama');
    clearAnnouncer();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(region()).toBeEmptyDOMElement();
    announce('Kedua');
    expect(region()).toHaveTextContent('Kedua');
    clearAnnouncer();
    expect(region()).toBeEmptyDOMElement();
  });

  it('does not create a region when clearing without one', () => {
    clearAnnouncer();
    expect(document.querySelector('[data-testid="announcer"]')).toBeNull();
  });

  it('drops a pending write when a different message arrives', async () => {
    announce('Pertama');
    announce('Dilepas');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(region()).toHaveTextContent('Dilepas');
  });
});

function region(): HTMLElement {
  return document.querySelector('[data-testid="announcer"]') as HTMLElement;
}
