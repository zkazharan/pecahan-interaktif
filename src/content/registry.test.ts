import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { findModule, nextReadyModule } from './registry';

describe('catalog', () => {
  it('lists 8 modules numbered 1–8 with unique slugs', () => {
    expect(CATALOG.map((e) => e.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(CATALOG.map((e) => e.slug)).size).toBe(8);
  });
});

describe('findModule', () => {
  it('returns undefined for unknown slugs, including object prototype names', () => {
    expect(findModule('tidak-ada')).toBeUndefined();
    expect(findModule('constructor')).toBeUndefined();
    expect(findModule('tostring')).toBeUndefined();
  });
});

describe('nextReadyModule', () => {
  it('has nothing after the last module', () => {
    expect(nextReadyModule('pecahan-dari-jumlah')).toBeUndefined();
  });
});

describe('registered modules', () => {
  it('has membandingkan ready', () => {
    expect(findModule('membandingkan')?.slug).toBe('membandingkan');
  });

  it('points earlier modules to membandingkan as the next ready one', () => {
    expect(nextReadyModule('membagi-adil')?.slug).toBe('membandingkan');
  });
});
