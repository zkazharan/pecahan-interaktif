import { describe, expect, it } from 'vitest';
import { DragController } from './controller';
import { draggable, dropTarget } from './actions';

function mount(setPointerCapture: (id: number) => void) {
  const controller = new DragController({
    onDrop: () => {},
    reducedMotion: () => true,
    rectOf: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  });
  const node = document.createElement('div');
  node.setPointerCapture = setPointerCapture;
  document.body.append(node);
  const action = draggable(node, { controller, id: 'piece', label: 'Potongan' });
  return { controller, node, action };
}

function pointerEvent(type: string, init: { pointerId?: number; clientX?: number; clientY?: number } = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerId: 1, clientX: 0, clientY: 0, button: 0, ...init });
  return event;
}

describe('draggable action', () => {
  it('does not wedge the controller when pointer capture throws', () => {
    const { controller, node } = mount(() => {
      throw new Error('no capture');
    });
    node.dispatchEvent(pointerEvent('pointerdown'));
    expect(controller.isDragging()).toBe(false);
  });

  it('cancels an active drag when destroyed', () => {
    const { controller, node, action } = mount(() => {});
    node.dispatchEvent(pointerEvent('pointerdown'));
    expect(controller.isDragging()).toBe(true);
    action?.destroy?.();
    expect(controller.isDragging()).toBe(false);
  });

  it('cancels a keyboard drag on blur', () => {
    const { controller, node } = mount(() => {});
    controller.registerTarget({ id: 't', el: document.createElement('div'), label: 'T', accepts: () => true });
    node.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(controller.isDragging()).toBe(true);
    node.dispatchEvent(new Event('blur'));
    expect(controller.isDragging()).toBe(false);
  });

  it('cancels a pointer drag when capture is lost, and ignores the event after a normal drop', () => {
    const { controller, node } = mount(() => {});
    node.dispatchEvent(pointerEvent('pointerdown'));
    node.dispatchEvent(pointerEvent('lostpointercapture'));
    expect(controller.isDragging()).toBe(false);

    node.dispatchEvent(pointerEvent('pointerdown'));
    node.dispatchEvent(pointerEvent('pointerup'));
    expect(controller.isDragging()).toBe(false);
    node.dispatchEvent(pointerEvent('lostpointercapture'));
    expect(controller.isDragging()).toBe(false);
  });

  it('ignores repeated Space and Enter keydowns', () => {
    const { controller, node } = mount(() => {});
    controller.registerTarget({ id: 't', el: document.createElement('div'), label: 'T', accepts: () => true });
    const press = (key: string, repeat: boolean) => {
      const event = new KeyboardEvent('keydown', { key, repeat, bubbles: true, cancelable: true });
      node.dispatchEvent(event);
      return event;
    };
    expect(press(' ', true).defaultPrevented).toBe(true);
    expect(controller.isDragging()).toBe(false);
    press(' ', false);
    expect(controller.isDragging()).toBe(true);
    press('Enter', true);
    expect(controller.isDragging()).toBe(true);
    press('Enter', false);
    expect(controller.isDragging()).toBe(false);
  });

  it('cancels the drag when update swaps the id mid-drag', () => {
    const { controller, node, action } = mount(() => {});
    node.dispatchEvent(pointerEvent('pointerdown'));
    expect(controller.isDragging()).toBe(true);
    action?.update?.({ controller, id: 'other', label: 'Lain' });
    expect(controller.isDragging()).toBe(false);
    expect(node.hasAttribute('data-dragging')).toBe(false);
  });

  it('keeps the drag when update keeps the same id', () => {
    const { controller, node, action } = mount(() => {});
    node.dispatchEvent(pointerEvent('pointerdown'));
    action?.update?.({ controller, id: 'piece', label: 'Potongan baru' });
    expect(controller.isDragging()).toBe(true);
    controller.cancelItem('piece');
  });

  it('prevents default and focuses the item on a mouse pointerdown', () => {
    const { controller, node } = mount(() => {});
    const event = pointerEvent('pointerdown', { pointerType: 'mouse' } as never);
    node.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(node);
    controller.cancelItem('piece');
  });

  it('does not move focus when the pointerdown is rejected', () => {
    const { node } = mount(() => {
      throw new Error('no capture');
    });
    node.dispatchEvent(pointerEvent('pointerdown', { pointerType: 'mouse' } as never));
    expect(document.activeElement).not.toBe(node);
  });
});

describe('dropTarget action', () => {
  function targets() {
    const controller = new DragController({ onDrop: () => {}, announce: () => {} });
    const make = (id: string) => {
      const el = document.createElement('div');
      const action = dropTarget(el, { controller, id, label: id });
      return { el, action };
    };
    const first = make('first');
    const second = make('second');
    const item = document.createElement('div');
    controller.registerItem({ id: 'x', el: item, label: 'x' });
    return { controller, first, second };
  }

  it('keeps its keyboard position when update re-registers it', () => {
    const { controller, first, second } = targets();
    first.action?.update?.({ controller, id: 'first', label: 'Satu baru' });
    controller.keyDown('x', ' ');
    expect(first.el.hasAttribute('data-drop-hover')).toBe(true);
    expect(second.el.hasAttribute('data-drop-hover')).toBe(false);
    controller.cancelItem('x');
  });

  it('moves to the new id on update and forgets the old one', () => {
    const { controller, first, second } = targets();
    first.action?.update?.({ controller, id: 'renamed', label: 'Baru' });
    controller.keyDown('x', ' ');
    expect(second.el.hasAttribute('data-drop-hover')).toBe(true);
    controller.keyDown('x', 'ArrowRight');
    expect(first.el.hasAttribute('data-drop-hover')).toBe(true);
    controller.keyDown('x', 'ArrowRight');
    expect(second.el.hasAttribute('data-drop-hover')).toBe(true);
    controller.cancelItem('x');
  });
});
