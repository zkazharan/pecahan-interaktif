import '@testing-library/jest-dom/vitest';

if (typeof Element.prototype.animate !== 'function') {
  Element.prototype.animate = function animate(): Animation {
    const animation = {
      currentTime: 0,
      playState: 'finished',
      onfinish: null as ((this: Animation, ev: AnimationPlaybackEvent) => unknown) | null,
      finished: Promise.resolve(),
      cancel() {},
      finish() {},
      play() {},
      pause() {},
      addEventListener() {},
      removeEventListener() {},
    };
    setTimeout(() => animation.onfinish?.call(animation as unknown as Animation, {} as AnimationPlaybackEvent), 0);
    return animation as unknown as Animation;
  };
}

if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
