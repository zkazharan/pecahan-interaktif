let region: HTMLElement | null = null;

export function announce(message: string): void {
  if (typeof document === 'undefined') return;
  if (!region || !region.isConnected) {
    region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('data-testid', 'announcer');
    region.className = 'sr-only';
    document.body.append(region);
  }
  region.textContent = message;
}
