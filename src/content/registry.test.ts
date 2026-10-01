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
  it('has membagi-adil ready', () => {
    expect(findModule('membagi-adil')?.slug).toBe('membagi-adil');
  });

  it('has membandingkan ready', () => {
    expect(findModule('membandingkan')?.slug).toBe('membandingkan');
  });

  it('has membaca-pecahan ready', () => {
    expect(findModule('membaca-pecahan')?.slug).toBe('membaca-pecahan');
  });

  it('has pecahan-campuran ready', () => {
    expect(findModule('pecahan-campuran')?.slug).toBe('pecahan-campuran');
  });

  it('has senilai ready', () => {
    expect(findModule('senilai')?.slug).toBe('senilai');
    expect(nextReadyModule('membandingkan')?.slug).toBe('senilai');
  });

  it('points each module to the next ready one', () => {
    expect(nextReadyModule('membagi-adil')?.slug).toBe('membaca-pecahan');
    expect(nextReadyModule('membaca-pecahan')?.slug).toBe('membandingkan');
    expect(nextReadyModule('membandingkan')?.slug).toBe('senilai');
    expect(nextReadyModule('senilai')?.slug).toBe('pecahan-campuran');
  });
});
