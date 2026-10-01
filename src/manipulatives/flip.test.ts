import { afterEach, describe, expect, it, vi } from 'vitest';
import { MOVE_MS, measure, playFlip, popIn } from './flip';

function rect(left: number, top: number): DOMRect {
  return { left, top, width: 10, height: 10, right: left + 10, bottom: top + 10, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

function setup(): { root: HTMLElement; a: HTMLElement; b: HTMLElement } {
  const root = document.createElement('div');
  const a = document.createElement('div');
  const b = document.createElement('div');
  a.setAttribute('data-card', 'a');
  b.setAttribute('data-card', 'b');
  root.append(a, b);
  return { root, a, b };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('measure', () => {
  it('records a rect per keyed element', () => {
    const { root, a, b } = setup();
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(rect(0, 0));
    vi.spyOn(b, 'getBoundingClientRect').mockReturnValue(rect(50, 0));
    const rects = measure(root, 'data-card');
    expect(rects.get('a')?.left).toBe(0);
    expect(rects.get('b')?.left).toBe(50);
    expect(measure(undefined, 'data-card').size).toBe(0);
  });
});

describe('playFlip', () => {
  it('animates only elements that moved, from old to new place', () => {
    const { root, a, b } = setup();
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(rect(100, 20));
    vi.spyOn(b, 'getBoundingClientRect').mockReturnValue(rect(50, 0));
    const animateA = vi.spyOn(a, 'animate');
    const animateB = vi.spyOn(b, 'animate');
    const played = playFlip(root, 'data-card', new Map([['a', rect(0, 0)], ['b', rect(50, 0)]]));
    expect(played).toBe(1);
    expect(animateB).not.toHaveBeenCalled();
    const [frames, options] = animateA.mock.calls[0];
    expect(JSON.stringify(frames)).toContain('translate(-100px, -20px)');
    expect((options as KeyframeAnimationOptions).duration).toBe(MOVE_MS);
  });

  it('does nothing under reduced motion', () => {
    const { root, a } = setup();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    vi.spyOn(a, 'getBoundingClientRect').mockReturnValue(rect(100, 0));
    const animate = vi.spyOn(a, 'animate');
    expect(playFlip(root, 'data-card', new Map([['a', rect(0, 0)]]))).toBe(0);
    expect(animate).not.toHaveBeenCalled();
  });
});

describe('popIn', () => {
  it('pops every element in, unless motion is reduced', () => {
    const { a, b } = setup();
    const animate = vi.spyOn(Element.prototype, 'animate');
    expect(popIn([a, b])).toBe(2);
    expect(JSON.stringify(animate.mock.calls[0][0])).toContain('scale(0.6)');
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(popIn([a])).toBe(0);
  });
});
