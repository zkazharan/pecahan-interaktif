import type { Action } from 'svelte/action';
import type { DragController } from './controller';

export type DraggableParams = {
  controller: DragController;
  id: string;
  label: string;
  disabled?: boolean;
};

export type DropTargetParams = {
  controller: DragController;
  id: string;
  label: string;
  accepts?: (itemId: string) => boolean;
};

export const draggable: Action<HTMLElement | SVGElement, DraggableParams> = (node, initial) => {
  let params = initial;
  let unregister = register(params);

  function register(p: DraggableParams): () => void {
    node.setAttribute('tabindex', p.disabled ? '-1' : '0');
    node.setAttribute('role', 'button');
    node.setAttribute('aria-roledescription', 'benda yang bisa dipindah');
    node.setAttribute('aria-label', p.label);
    node.setAttribute('aria-disabled', p.disabled ? 'true' : 'false');
    node.style.touchAction = 'none';
    return p.controller.registerItem({ id: p.id, el: node, label: p.label });
  }

  function onPointerDown(event: PointerEvent): void {
    if (params.disabled || event.button > 0) return;
    if (!params.controller.start(params.id, event)) return;
    try {
      node.setPointerCapture(event.pointerId);
    } catch {
      params.controller.cancelItem(params.id);
      return;
    }
    event.preventDefault();
  }

  const onPointerMove = (event: PointerEvent) => params.controller.move(event);
  const onPointerUp = (event: PointerEvent) => params.controller.end(event);
  const onPointerCancel = (event: PointerEvent) => params.controller.cancelPointer(event);

  const onBlur = () => params.controller.cancelItem(params.id);
  const onLostPointerCapture = () => params.controller.cancelItem(params.id);

  function onKeyDown(event: KeyboardEvent): void {
    if (params.disabled) return;
    if (params.controller.keyDown(params.id, event.key)) event.preventDefault();
  }

  node.addEventListener('pointerdown', onPointerDown as EventListener);
  node.addEventListener('pointermove', onPointerMove as EventListener);
  node.addEventListener('pointerup', onPointerUp as EventListener);
  node.addEventListener('pointercancel', onPointerCancel as EventListener);
  node.addEventListener('keydown', onKeyDown as EventListener);
  node.addEventListener('blur', onBlur);
  node.addEventListener('lostpointercapture', onLostPointerCapture);

  return {
    update(next) {
      unregister();
      params = next;
      unregister = register(next);
    },
    destroy() {
      params.controller.cancelItem(params.id);
      unregister();
      node.removeEventListener('pointerdown', onPointerDown as EventListener);
      node.removeEventListener('pointermove', onPointerMove as EventListener);
      node.removeEventListener('pointerup', onPointerUp as EventListener);
      node.removeEventListener('pointercancel', onPointerCancel as EventListener);
      node.removeEventListener('keydown', onKeyDown as EventListener);
      node.removeEventListener('blur', onBlur);
      node.removeEventListener('lostpointercapture', onLostPointerCapture);
    },
  };
};

export const dropTarget: Action<Element, DropTargetParams> = (node, initial) => {
  const register = (p: DropTargetParams) =>
    p.controller.registerTarget({ id: p.id, el: node, label: p.label, accepts: p.accepts ?? (() => true) });
  let unregister = register(initial);
  return {
    update(next) {
      unregister();
      unregister = register(next);
    },
    destroy() {
      unregister();
    },
  };
};
