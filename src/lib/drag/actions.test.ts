import { describe, expect, it } from 'vitest';
import { DragController } from './controller';
import { draggable } from './actions';

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
});
