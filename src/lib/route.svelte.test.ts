import { describe, expect, it } from 'vitest';
import { router } from './route.svelte';

function navigate(hash: string): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener('hashchange', () => resolve(), { once: true });
    location.hash = hash;
  });
}

describe('router', () => {
  it('remembers the last Peraga params for a module', async () => {
    expect(router.peragaHref('membandingkan')).toBe('#/membandingkan/peraga');
    await navigate('#/membandingkan/peraga?a=2/5&b=3/7');
    await navigate('#/membandingkan/latihan');
    expect(router.peragaHref('membandingkan')).toBe('#/membandingkan/peraga?a=2/5&b=3/7');
    expect(router.peragaHref('senilai')).toBe('#/senilai/peraga');
  });

  it('follows params written back with replaceParams', async () => {
    await navigate('#/membandingkan/peraga?a=2/5&b=3/7');
    router.replaceParams({ a: '2/6', b: '3/7' });
    expect(router.peragaHref('membandingkan')).toBe('#/membandingkan/peraga?a=2/6&b=3/7');
  });

  it('replaces the current entry instead of pushing one', async () => {
    await navigate('#/membandingkan/peraga');
    const length = history.length;
    router.replace({ name: 'home' });
    expect(history.length).toBe(length);
    expect(location.hash).toBe('#/');
    expect(router.route).toEqual({ name: 'home' });
  });
});
