import { describe, expect, it } from 'vitest';
import { FAIR_DEFAULTS, formatFairParams, parseFairParams } from './params';

describe('parseFairParams', () => {
  it('defaults to three children', () => {
    expect(parseFairParams({})).toEqual(FAIR_DEFAULTS);
    expect(FAIR_DEFAULTS).toEqual({ n: 3 });
  });

  it('reads a valid count and rejects the rest', () => {
    expect(parseFairParams({ n: '7' })).toEqual({ n: 7 });
    for (const bad of ['0', '1', '13', '99', 'abc', '2.5', '']) expect(parseFairParams({ n: bad })).toEqual({ n: 3 });
  });

  it('round-trips', () => {
    expect(formatFairParams({ n: 5 })).toEqual({ n: '5' });
    expect(parseFairParams(formatFairParams({ n: 5 }))).toEqual({ n: 5 });
  });
});
