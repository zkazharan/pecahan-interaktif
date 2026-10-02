let region: HTMLElement | null = null;
let pending = 0;
let settling = false;

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

const SPACER = String.fromCharCode(160);

export function clearAnnouncer(): void {
  if (pending) cancelFrame(pending);
  pending = 0;
  settling = false;
  if (region) region.textContent = '';
}

export function announce(message: string): void {
  const fresh = settling || !region || !region.isConnected;
  const el = ensureAnnouncer();
  if (!el) return;
  if (pending) cancelFrame(pending);
  pending = 0;
  if (fresh) {
    settling = true;
    pending = nextFrame(() => {
      pending = 0;
      settling = false;
      el.textContent = message;
    });
    return;
  }
  const current = el.textContent ?? '';
  const repeated = current.endsWith(SPACER) ? current.slice(0, -1) === message : current === message;
  el.textContent = repeated && !current.endsWith(SPACER) ? message + SPACER : message;
}
