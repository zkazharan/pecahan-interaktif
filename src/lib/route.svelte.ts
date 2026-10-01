import { formatHash, parseHash, type Route } from './router';

let current = $state<Route>(parseHash(typeof location === 'undefined' ? '' : location.hash));

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    current = parseHash(location.hash);
  });
}

export const router = {
  get route(): Route {
    return current;
  },
  go(route: Route): void {
    location.hash = formatHash(route);
  },
  replaceParams(params: Record<string, string>): void {
    if (current.name !== 'module') return;
    const next: Route = { ...current, params };
    history.replaceState(history.state, '', formatHash(next));
    current = next;
  },
};
