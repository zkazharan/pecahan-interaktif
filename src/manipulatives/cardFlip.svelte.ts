import { tick } from 'svelte';
import { measure, playFlip } from './flip';
import type { Placement } from './cardSlots';

export function useCardFlip(getRoot: () => HTMLElement | undefined, getPlacement: () => Placement): { markUserDrop: () => void } {
  let userDrop = false;
  let before = new Map<string, DOMRect>();

  $effect.pre(() => {
    void getPlacement();
    before = userDrop ? new Map() : measure(getRoot(), 'data-card');
  });

  $effect(() => {
    void getPlacement();
    playFlip(getRoot(), 'data-card', before);
    before = new Map();
  });

  return {
    markUserDrop: () => {
      userDrop = true;
      tick().then(() => (userDrop = false));
    },
  };
}
