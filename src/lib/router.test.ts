import { describe, expect, it } from 'vitest';
import { formatHash, parseHash } from './router';

describe('parseHash', () => {
  it('treats empty and root hashes as home', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#')).toEqual({ name: 'home' });
    expect(parseHash('#/')).toEqual({ name: 'home' });
  });

  it('reads slug, tab and params', () => {
    expect(parseHash('#/membandingkan/latihan')).toEqual({
      name: 'module',
      slug: 'membandingkan',
      tab: 'latihan',
      params: {},
    });
    expect(parseHash('#/membandingkan/peraga?a=2/5&b=3/7')).toEqual({
      name: 'module',
      slug: 'membandingkan',
      tab: 'peraga',
      params: { a: '2/5', b: '3/7' },
    });
  });

  it('defaults a missing or unknown tab to peraga', () => {
    expect(parseHash('#/membandingkan')).toMatchObject({ tab: 'peraga' });
    expect(parseHash('#/membandingkan/apa')).toMatchObject({ tab: 'peraga' });
  });

  it('sends malformed slugs home', () => {
    expect(parseHash('#/Bad Slug/peraga')).toEqual({ name: 'home' });
    expect(parseHash('#/../peraga')).toEqual({ name: 'home' });
  });
});

describe('formatHash', () => {
  it('keeps slashes in fraction params readable', () => {
    expect(formatHash({ name: 'module', slug: 'membandingkan', tab: 'peraga', params: { a: '2/5', b: '3/7' } })).toBe(
      '#/membandingkan/peraga?a=2/5&b=3/7',
    );
  });

  it('omits the query when there are no params', () => {
    expect(formatHash({ name: 'module', slug: 'membandingkan', tab: 'latihan', params: {} })).toBe('#/membandingkan/latihan');
    expect(formatHash({ name: 'home' })).toBe('#/');
  });

  it('round-trips through parseHash', () => {
    const hash = '#/membandingkan/peraga?a=2/5&b=3/7';
    expect(formatHash(parseHash(hash))).toBe(hash);
  });
});
