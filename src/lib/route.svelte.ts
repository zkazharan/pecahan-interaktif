import { formatHash, parseHash, type Route } from './router';

let current = $state<Route>(parseHash(typeof location === 'undefined' ? '' : location.hash));
let lastPeraga = $state<Record<string, Record<string, string>>>({});

function remember(route: Route): void {
  if (route.name === 'module' && route.tab === 'peraga') lastPeraga = { ...lastPeraga, [route.slug]: route.params };
}

function setRoute(route: Route): void {
  current = route;
  remember(route);
}

remember(current);

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
