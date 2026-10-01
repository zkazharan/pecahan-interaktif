import { prefersReducedMotion } from '../lib/motion';

export const MOVE_MS = 250;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export function measure(root: ParentNode | undefined, attr: string): Map<string, DOMRect> {
  const rects = new Map<string, DOMRect>();
  if (!root) return rects;
  for (const el of root.querySelectorAll(`[${attr}]`)) rects.set(el.getAttribute(attr) ?? '', el.getBoundingClientRect());
  return rects;
}

export function playFlip(root: ParentNode | undefined, attr: string, before: ReadonlyMap<string, DOMRect>): number {
  if (!root || before.size === 0 || prefersReducedMotion()) return 0;
  let played = 0;
  for (const el of root.querySelectorAll<HTMLElement>(`[${attr}]`)) {
    const from = before.get(el.getAttribute(attr) ?? '');
    if (!from) continue;
    const to = el.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
      duration: MOVE_MS,
      easing: EASE,
    });
    played += 1;
  }
  return played;
}

export function popIn(elements: Iterable<Element>): number {
  if (prefersReducedMotion()) return 0;
  let played = 0;
  for (const el of elements) {
    el.animate([{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], {
      duration: 200,
      easing: 'ease-out',
    });
    played += 1;
  }
  return played;
}
