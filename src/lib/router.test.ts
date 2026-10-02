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

  it('splits path from query on the first question mark only', () => {
    expect(parseHash('#/a/peraga?x=1?y')).toMatchObject({ slug: 'a', tab: 'peraga', params: { x: '1?y' } });
  });

  it('keeps a __proto__ key as plain data', () => {
    const route = parseHash('#/a/peraga?__proto__=1&b=2');
    if (route.name !== 'module') throw new Error('expected module route');
    expect(Object.getPrototypeOf(route.params)).toBeNull();
    expect(Object.keys(route.params)).toEqual(['__proto__', 'b']);
    expect(route.params['__proto__']).toBe('1');
    expect(({} as Record<string, unknown>).b).toBeUndefined();
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

  it('throws RangeError for a slug that does not match the slug pattern', () => {
    for (const slug of ['Bad Slug', '', 'a/b', '../x', 'A']) {
      expect(() => formatHash({ name: 'module', slug, tab: 'peraga', params: {} })).toThrow(RangeError);
    }
  });

  it('round-trips through parseHash', () => {
    const hash = '#/membandingkan/peraga?a=2/5&b=3/7';
    expect(formatHash(parseHash(hash))).toBe(hash);
  });
});
