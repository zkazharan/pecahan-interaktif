import { CATALOG, type CatalogEntry } from './catalog';
import { membandingkan } from './modules/membandingkan';
import type { ModuleDef } from './types';

export const MODULES: Readonly<Record<string, ModuleDef>> = {
  [membandingkan.slug]: membandingkan,
};

export function findModule(slug: string): ModuleDef | undefined {
  return Object.hasOwn(MODULES, slug) ? MODULES[slug] : undefined;
}

export function nextReadyModule(slug: string): CatalogEntry | undefined {
  const index = CATALOG.findIndex((entry) => entry.slug === slug);
  return CATALOG.slice(index + 1).find((entry) => findModule(entry.slug) !== undefined);
}
