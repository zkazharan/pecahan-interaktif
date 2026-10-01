import { CATALOG, type CatalogEntry } from './catalog';
import { membagiAdil } from './modules/membagi-adil';
import { membacaPecahan } from './modules/membaca-pecahan';
import { membandingkan } from './modules/membandingkan';
import { senilai } from './modules/senilai';
import { pecahanCampuran } from './modules/pecahan-campuran';
import { jumlahPenyebutSama } from './modules/jumlah-penyebut-sama';
import type { ModuleDef } from './types';

export const MODULES: Readonly<Record<string, ModuleDef>> = {
  [membagiAdil.slug]: membagiAdil,
  [membacaPecahan.slug]: membacaPecahan,
  [membandingkan.slug]: membandingkan,
  [senilai.slug]: senilai,
  [pecahanCampuran.slug]: pecahanCampuran,
  [jumlahPenyebutSama.slug]: jumlahPenyebutSama,
};

export function findModule(slug: string): ModuleDef | undefined {
  return Object.hasOwn(MODULES, slug) ? MODULES[slug] : undefined;
}

export function nextReadyModule(slug: string): CatalogEntry | undefined {
  const index = CATALOG.findIndex((entry) => entry.slug === slug);
  return CATALOG.slice(index + 1).find((entry) => findModule(entry.slug) !== undefined);
}
