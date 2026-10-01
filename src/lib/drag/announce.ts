let region: HTMLElement | null = null;
let pending = 0;

export function ensureAnnouncer(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (!region || !region.isConnected) {
    region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('data-testid', 'announcer');
    region.className = 'sr-only';
    document.body.append(region);
  }
  return region;
}

function nextFrame(callback: () => void): number {
  return typeof requestAnimationFrame === 'function' ? requestAnimationFrame(callback) : window.setTimeout(callback, 16);
}

function cancelFrame(handle: number): void {
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(handle);
  else clearTimeout(handle);
}

export function announce(message: string): void {
  const el = ensureAnnouncer();
  if (!el) return;
  if (pending) cancelFrame(pending);
  pending = 0;
  if (el.textContent !== message) {
    el.textContent = message;
    return;
  }
  el.textContent = '';
  pending = nextFrame(() => {
    pending = 0;
    el.textContent = message;
  });
}
