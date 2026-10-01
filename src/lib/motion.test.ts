import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion } from './motion';

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('follows the reduced motion media query', () => {
    const matchMedia = vi.fn((query: string) => ({ matches: query.includes('reduce') }));
    vi.stubGlobal('matchMedia', matchMedia);
    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(prefersReducedMotion()).toBe(false);
  });
});
