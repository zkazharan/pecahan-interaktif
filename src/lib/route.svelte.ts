import { formatHash, parseHash, type Route } from './router';

type PeragaMemory = Record<string, Record<string, string>>;

function remembered(memory: PeragaMemory, route: Route): PeragaMemory {
  return route.name === 'module' && route.tab === 'peraga' ? { ...memory, [route.slug]: route.params } : memory;
}

const initial = parseHash(typeof location === 'undefined' ? '' : location.hash);
let current = $state<Route>(initial);
let lastPeraga = $state<PeragaMemory>(remembered({}, initial));

function setRoute(route: Route): void {
  current = route;
  lastPeraga = remembered(lastPeraga, route);
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => setRoute(parseHash(location.hash)));
}

function replace(route: Route): void {
  history.replaceState(history.state, '', formatHash(route));
  setRoute(route);
}

export const router = {
  get route(): Route {
    return current;
  },
  go(route: Route): void {
    location.hash = formatHash(route);
  },
  replace,
  replaceParams(params: Record<string, string>): void {
    if (current.name !== 'module') return;
    replace({ ...current, params });
  },
  peragaHref(slug: string): string {
    return formatHash({ name: 'module', slug, tab: 'peraga', params: lastPeraga[slug] ?? {} });
  },
};
