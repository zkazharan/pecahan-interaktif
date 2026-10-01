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
  it('has pecahan-dari-jumlah ready', () => {
    expect(findModule('pecahan-dari-jumlah')?.slug).toBe('pecahan-dari-jumlah');
    expect(nextReadyModule('jumlah-penyebut-beda')?.slug).toBe('pecahan-dari-jumlah');
  });

  it('has a module for every catalog slug', () => {
    expect(CATALOG.every((entry) => findModule(entry.slug) !== undefined)).toBe(true);
  });

  it('has jumlah-penyebut-beda ready', () => {
    expect(findModule('jumlah-penyebut-beda')?.slug).toBe('jumlah-penyebut-beda');
    expect(nextReadyModule('jumlah-penyebut-sama')?.slug).toBe('jumlah-penyebut-beda');
  });

  it('has jumlah-penyebut-sama ready', () => {
    expect(findModule('jumlah-penyebut-sama')?.slug).toBe('jumlah-penyebut-sama');
    expect(nextReadyModule('pecahan-campuran')?.slug).toBe('jumlah-penyebut-sama');
  });

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

describe('graded answers', () => {
  it('grades only the placed card in jumlah-penyebut-sama', () => {
    const graded = findModule('jumlah-penyebut-sama')!.latihan.graded!;
    const placement = { pilihan: 'c1' };
    expect(graded({ plates: { plates: [3], tray: 0 }, placement })).toEqual(graded({ plates: { plates: [1], tray: 2 }, placement }));
  });

  it('grades only the placed card in jumlah-penyebut-beda', () => {
    const graded = findModule('jumlah-penyebut-beda')!.latihan.graded!;
    const placement = { pilihan: 'c1' };
    expect(graded({ cuts: [2, 3], placement })).toEqual(graded({ cuts: [4, 6], placement }));
  });
});
