import { CATALOG, type CatalogEntry } from './catalog';
import { membagiAdil } from './modules/membagi-adil';
import { membacaPecahan } from './modules/membaca-pecahan';
import { membandingkan } from './modules/membandingkan';
import { pecahanCampuran } from './modules/pecahan-campuran';
import type { ModuleDef } from './types';

export const MODULES: Readonly<Record<string, ModuleDef>> = {
  [membagiAdil.slug]: membagiAdil,
  [membacaPecahan.slug]: membacaPecahan,
  [membandingkan.slug]: membandingkan,
  [pecahanCampuran.slug]: pecahanCampuran,
};

export function findModule(slug: string): ModuleDef | undefined {
  return Object.hasOwn(MODULES, slug) ? MODULES[slug] : undefined;
}

export function nextReadyModule(slug: string): CatalogEntry | undefined {
  const index = CATALOG.findIndex((entry) => entry.slug === slug);
  return CATALOG.slice(index + 1).find((entry) => findModule(entry.slug) !== undefined);
}
