import { describe, expect, it } from 'vitest';
import { EQUIV_DEFAULTS, formatEquivParams, parseEquivParams } from './params';

describe('parseEquivParams', () => {
  it('defaults to one half', () => {
    expect(parseEquivParams({})).toEqual(EQUIV_DEFAULTS);
    expect(EQUIV_DEFAULTS).toEqual({ f: { n: 1, d: 2 } });
  });

  it('accepts proper fractions up to eighths and rejects the rest', () => {
    expect(parseEquivParams({ f: '3/8' })).toEqual({ f: { n: 3, d: 8 } });
    for (const bad of ['1/9', '3/3', '0/4', '5/4', 'abc', '']) expect(parseEquivParams({ f: bad })).toEqual(EQUIV_DEFAULTS);
  });

  it('round-trips', () => {
    expect(formatEquivParams({ f: { n: 2, d: 3 } })).toEqual({ f: '2/3' });
  });
});
