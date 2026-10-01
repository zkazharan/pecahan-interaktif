import { afterEach, describe, expect, it } from 'vitest';
import { announce, ensureAnnouncer } from './announce';

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
    announce('Diangkat');
    expect(region()).toHaveTextContent('Diangkat');
  });

  it('clears and rewrites an identical message so it is read again', async () => {
    announce('Diangkat');
    announce('Diangkat');
    expect(region()).toBeEmptyDOMElement();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(region()).toHaveTextContent('Diangkat');
  });

  it('drops a pending rewrite when a different message arrives', async () => {
    announce('Diangkat');
    announce('Diangkat');
    announce('Dilepas');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(region()).toHaveTextContent('Dilepas');
  });
});

function region(): HTMLElement {
  return document.querySelector('[data-testid="announcer"]') as HTMLElement;
}
