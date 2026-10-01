import { describe, expect, it } from 'vitest';
import { READ_DEFAULTS, formatReadParams, parseReadParams } from './params';

describe('parseReadParams', () => {
  it('defaults to three quarters', () => {
    expect(parseReadParams({})).toEqual(READ_DEFAULTS);
    expect(READ_DEFAULTS).toEqual({ f: { n: 3, d: 4 } });
  });

  it('reads valid fractions and rejects the rest', () => {
    expect(parseReadParams({ f: '5/8' })).toEqual({ f: { n: 5, d: 8 } });
    for (const bad of ['5/3', '0/4', '1/13', '1/1', 'abc', '3/0', '']) expect(parseReadParams({ f: bad })).toEqual(READ_DEFAULTS);
  });

  it('round-trips', () => {
    expect(formatReadParams({ f: { n: 2, d: 5 } })).toEqual({ f: '2/5' });
  });
});
