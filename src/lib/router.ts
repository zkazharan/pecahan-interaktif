export type Tab = 'peraga' | 'latihan';

export type Route =
  | { name: 'home' }
  | { name: 'module'; slug: string; tab: Tab; params: Record<string, string> };

const SLUG = /^[a-z0-9-]+$/;

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const split = raw.indexOf('?');
  const path = split === -1 ? raw : raw.slice(0, split);
  const query = split === -1 ? '' : raw.slice(split + 1);
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0 || !SLUG.test(parts[0])) return { name: 'home' };
  const tab: Tab = parts[1] === 'latihan' ? 'latihan' : 'peraga';
  const params: Record<string, string> = Object.create(null);
  for (const [key, value] of new URLSearchParams(query)) params[key] = value;
  return { name: 'module', slug: parts[0], tab, params };
}

function encodeValue(value: string): string {
  return encodeURIComponent(value).replace(/%2F/gi, '/');
}

export function formatHash(route: Route): string {
  if (route.name === 'home') return '#/';
  if (!SLUG.test(route.slug)) throw new RangeError(`invalid slug: ${route.slug}`);
  const query = Object.entries(route.params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeValue(value)}`)
    .join('&');
  return `#/${route.slug}/${route.tab}${query ? `?${query}` : ''}`;
}
