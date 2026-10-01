import { tick } from 'svelte';
import { announce } from '../lib/drag/announce';
import { DragController } from '../lib/drag/controller';
import { placeCard, type Placement } from './cardSlots';

type CardDropOptions = {
  getPlacement: () => Placement;
  onplace: (placement: Placement) => void;
  getRoot: () => HTMLElement | undefined;
  onUserDrop?: () => void;
};

export function createCardDrop({ getPlacement, onplace, getRoot, onUserDrop }: CardDropOptions): DragController {
  return new DragController({
    announce,
    onDrop: ({ itemId, targetId }) => {
      onUserDrop?.();
      const hadFocus = document.activeElement?.closest('[data-card]')?.getAttribute('data-card') === itemId;
      onplace(placeCard(getPlacement(), itemId, targetId));
      if (hadFocus) {
        tick().then(() => {
          const el = getRoot()?.querySelector<HTMLElement>(`[data-card="${itemId}"]`);
          if (el && document.activeElement !== el) el.focus();
        });
      }
    },
  });
}
