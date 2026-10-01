import { describe, expect, it, vi } from 'vitest';
import { createCardDrop } from './cardDrop';
import { emptyPlacement } from './cardSlots';

describe('createCardDrop', () => {
  it('reports the placement when a card is dropped on a slot with the keyboard', () => {
    const onplace = vi.fn();
    const placement = emptyPlacement(['a', 'b']);
    const controller = createCardDrop({ getPlacement: () => placement, onplace, getRoot: () => undefined });
    const el = document.createElement('div');
    controller.registerItem({ id: 'c0', el, label: 'Kartu' });
    controller.registerTarget({ id: 'a', el: document.createElement('div'), label: 'slot a', accepts: () => true });
    controller.registerTarget({ id: 'b', el: document.createElement('div'), label: 'slot b', accepts: () => true });
    controller.keyDown('c0', ' ');
    controller.keyDown('c0', 'ArrowRight');
    controller.keyDown('c0', ' ');
    expect(onplace).toHaveBeenCalledWith({ a: null, b: 'c0' });
  });
});
