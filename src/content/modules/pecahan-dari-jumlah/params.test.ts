import { describe, expect, it } from 'vitest';
import { SHARE_DEFAULTS, formatShareParams, maxTotal, parseShareParams, stepTotal, withBags } from './params';

describe('pecahan-dari-jumlah params', () => {
  it('reads valid params', () => {
    expect(parseShareParams({ n: '18', k: '6', take: '5' })).toEqual({ n: 18, k: 6, take: 5 });
  });

  it('falls back to defaults on anything invalid', () => {
    expect(parseShareParams({})).toEqual(SHARE_DEFAULTS);
    expect(parseShareParams({ n: '13', k: '3', take: '1' })).toEqual(SHARE_DEFAULTS);
    expect(parseShareParams({ n: '12', k: '3', take: '4' })).toEqual(SHARE_DEFAULTS);
    expect(parseShareParams({ n: '14', k: '7', take: '1' })).toEqual(SHARE_DEFAULTS);
    expect(parseShareParams({ n: '30', k: '3', take: '1' })).toEqual(SHARE_DEFAULTS);
    expect(parseShareParams({ n: '12', k: '3', take: '0' })).toEqual(SHARE_DEFAULTS);
  });

  it('round-trips through the URL', () => {
    const params = { n: 20, k: 4, take: 3 };
    expect(parseShareParams(formatShareParams(params))).toEqual(params);
  });

  it('keeps the largest total within 24', () => {
    expect(maxTotal(5)).toBe(20);
    expect(maxTotal(6)).toBe(24);
  });

  it('snaps the total to the new bag count and clamps take', () => {
    expect(withBags({ n: 12, k: 3, take: 3 }, 5)).toEqual({ n: 10, k: 5, take: 3 });
    expect(withBags({ n: 24, k: 6, take: 6 }, 5)).toEqual({ n: 20, k: 5, take: 5 });
    expect(withBags({ n: 4, k: 2, take: 2 }, 6)).toEqual({ n: 6, k: 6, take: 2 });
  });

  it('steps the total by whole bags', () => {
    expect(stepTotal({ n: 12, k: 3, take: 2 }, 13).n).toBe(15);
    expect(stepTotal({ n: 12, k: 3, take: 2 }, 11).n).toBe(9);
    expect(stepTotal({ n: 24, k: 3, take: 2 }, 25).n).toBe(24);
    expect(stepTotal({ n: 3, k: 3, take: 2 }, 2).n).toBe(3);
  });
});
