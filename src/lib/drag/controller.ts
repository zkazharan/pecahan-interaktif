import { prefersReducedMotion } from '../motion';

export type Point = { pointerId: number; clientX: number; clientY: number };
export type Rect = { left: number; top: number; width: number; height: number };
export type DragItem = { id: string; el: Element; label: string };
export type DropTarget = { id: string; el: Element; label: string; accepts: (itemId: string) => boolean };
export type DropEvent = { itemId: string; targetId: string };

export type DragControllerOptions = {
  onDrop: (event: DropEvent) => void;
  announce?: (message: string) => void;
  snapRadius?: number;
  rectOf?: (el: Element) => Rect;
  reducedMotion?: () => boolean;
};

type PointerDrag = {
  kind: 'pointer';
  itemId: string;
  pointerId: number;
  startX: number;
  startY: number;
  hoverId: string | null;
};

type KeyboardDrag = { kind: 'keyboard'; itemId: string; hoverId: string | null };

type ActiveDrag = PointerDrag | KeyboardDrag;

const PICK_KEYS = new Set([' ', 'Enter']);
const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

let owner: DragController | null = null;

export class DragController {
  private readonly items = new Map<string, DragItem>();
  private readonly targets = new Map<string, DropTarget>();
  private active: ActiveDrag | null = null;
  private readonly snapRadius: number;
  private readonly rectOf: (el: Element) => Rect;
  private readonly say: (message: string) => void;
  private readonly reducedMotion: () => boolean;

  constructor(private readonly options: DragControllerOptions) {
    this.snapRadius = options.snapRadius ?? 48;
    this.rectOf = options.rectOf ?? ((el) => el.getBoundingClientRect());
    this.say = options.announce ?? (() => {});
    this.reducedMotion = options.reducedMotion ?? prefersReducedMotion;
  }

  registerItem(item: DragItem): () => void {
    this.items.set(item.id, item);
    return () => {
      if (this.items.get(item.id) === item) this.items.delete(item.id);
    };
  }

  registerTarget(target: DropTarget): () => void {
    this.targets.set(target.id, target);
    return () => {
      if (this.targets.get(target.id) === target) this.targets.delete(target.id);
    };
  }

  isDragging(): boolean {
    return this.active !== null;
  }

  start(itemId: string, point: Point): boolean {
    const item = this.items.get(itemId);
    if (this.active || !item || !this.canStart()) return false;
    owner = this;
    this.active = {
      kind: 'pointer',
      itemId,
      pointerId: point.pointerId,
      startX: point.clientX,
      startY: point.clientY,
      hoverId: null,
    };
    item.el.setAttribute('data-dragging', '');
    return true;
  }

  move(point: Point): void {
    const drag = this.pointerDrag(point);
    if (!drag) return;
    const item = this.items.get(drag.itemId);
    if (!item) return;
    setOffset(item.el, point.clientX - drag.startX, point.clientY - drag.startY, false);
    this.setHover(drag, this.targetNear(drag.itemId, point));
  }

  end(point: Point): void {
    const drag = this.pointerDrag(point);
    if (!drag) return;
    this.finish(drag, this.targetNear(drag.itemId, point));
  }

  cancelPointer(point: Point): void {
    const drag = this.pointerDrag(point);
    if (!drag) return;
    this.finish(drag, null);
  }

  cancelItem(itemId: string): void {
    const drag = this.active;
    if (!drag || drag.itemId !== itemId) return;
    this.finish(drag, null);
  }

  keyDown(itemId: string, key: string, repeat = false): boolean {
    if (repeat && PICK_KEYS.has(key)) return true;
    const drag = this.active;
    if (!drag) return this.pickUp(itemId, key);
    if (drag.kind !== 'keyboard' || drag.itemId !== itemId) return false;
    if (key === 'Escape') {
      this.finish(drag, null);
      this.say('Batal.');
      return true;
    }
    if (PICK_KEYS.has(key)) {
      this.finish(drag, drag.hoverId);
      return true;
    }
    const step = NEXT_KEYS.has(key) ? 1 : PREV_KEYS.has(key) ? -1 : 0;
    if (step === 0) return false;
    const options = this.acceptingTargets(itemId);
    if (options.length === 0) return true;
    const index = options.findIndex((target) => target.id === drag.hoverId);
    const next = index < 0 ? options[0] : options[(index + step + options.length) % options.length];
    this.setHover(drag, next.id);
    this.say(next.label);
    return true;
  }

  private pickUp(itemId: string, key: string): boolean {
    const item = this.items.get(itemId);
    if (!PICK_KEYS.has(key) || !item || !this.canStart()) return false;
    const options = this.acceptingTargets(itemId);
    if (options.length === 0) {
      this.say(`Tidak ada tempat untuk ${item.label}.`);
      return true;
    }
    const drag: KeyboardDrag = { kind: 'keyboard', itemId, hoverId: null };
    owner = this;
    this.active = drag;
    item.el.setAttribute('data-dragging', '');
    this.setHover(drag, options[0].id);
    this.say(`Diangkat: ${item.label}. Pilih tempat dengan tombol panah, lalu tekan Spasi. Sekarang di ${options[0].label}.`);
    return true;
  }

  private finish(drag: ActiveDrag, targetId: string | null): void {
    const item = this.items.get(drag.itemId);
    const found = targetId === null ? null : (this.targets.get(targetId) ?? null);
    const target = found && found.accepts(drag.itemId) ? found : null;
    this.setHover(drag, null);
    this.active = null;
    if (owner === this) owner = null;
    if (item) {
      item.el.removeAttribute('data-dragging');
      setOffset(item.el, 0, 0, target === null && drag.kind === 'pointer' && !this.reducedMotion());
    }
    if (!target) {
      if (targetId !== null && drag.kind === 'keyboard') this.say('Batal.');
      return;
    }
    this.options.onDrop({ itemId: drag.itemId, targetId: target.id });
    if (item) this.say(`${item.label} ditaruh di ${target.label}.`);
  }

  private canStart(): boolean {
    return owner === null || owner === this;
  }

  private pointerDrag(point: Point): PointerDrag | null {
    const drag = this.active;
    return drag && drag.kind === 'pointer' && drag.pointerId === point.pointerId ? drag : null;
  }

  private acceptingTargets(itemId: string): DropTarget[] {
    return [...this.targets.values()].filter((target) => target.accepts(itemId)).sort(byDocumentOrder);
  }

  private targetNear(itemId: string, point: Point): string | null {
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const target of this.acceptingTargets(itemId)) {
      const distance = distanceToRect(point.clientX, point.clientY, this.rectOf(target.el));
      if (distance < bestDistance) {
        best = target.id;
        bestDistance = distance;
      }
    }
    return bestDistance <= this.snapRadius ? best : null;
  }

  private setHover(drag: ActiveDrag, id: string | null): void {
    if (drag.hoverId === id) return;
    if (drag.hoverId) this.targets.get(drag.hoverId)?.el.removeAttribute('data-drop-hover');
    drag.hoverId = id;
    if (id) this.targets.get(id)?.el.setAttribute('data-drop-hover', '');
  }
}

function distanceToRect(x: number, y: number, rect: Rect): number {
  const dx = Math.max(rect.left - x, 0, x - (rect.left + rect.width));
  const dy = Math.max(rect.top - y, 0, y - (rect.top + rect.height));
  return Math.hypot(dx, dy);
}

function byDocumentOrder(a: DropTarget, b: DropTarget): number {
  const position = a.el.compareDocumentPosition(b.el);
  if (position & Node.DOCUMENT_POSITION_DISCONNECTED) return 0;
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

const RETURN_MS = 200;
const cancelCleanup = new WeakMap<Element, () => void>();

function parentScale(el: Element): { x: number; y: number } {
  if (!(el instanceof SVGElement)) return { x: 1, y: 1 };
  for (let node = el.parentNode; node; node = node.parentNode) {
    const owner = node as Partial<SVGGraphicsElement>;
    if (typeof owner.getScreenCTM !== 'function') continue;
    const matrix = owner.getScreenCTM();
    return matrix && matrix.a !== 0 && matrix.d !== 0 ? { x: matrix.a, y: matrix.d } : { x: 1, y: 1 };
  }
  return { x: 1, y: 1 };
}

function clearInline(style: CSSStyleDeclaration): void {
  style.removeProperty('transition');
  style.removeProperty('transform');
}

function scheduleCleanup(el: Element, style: CSSStyleDeclaration): void {
  const stop = () => {
    clearTimeout(timer);
    el.removeEventListener('transitionend', onEnd);
    cancelCleanup.delete(el);
  };
  const finish = () => {
    stop();
    if (!el.hasAttribute('data-dragging')) clearInline(style);
  };
  const onEnd = (event: Event) => {
    if (event.target === el) finish();
  };
  const timer = setTimeout(finish, RETURN_MS + 100);
  el.addEventListener('transitionend', onEnd);
  cancelCleanup.set(el, stop);
}

function setOffset(el: Element, dx: number, dy: number, animate: boolean): void {
  const style = (el as HTMLElement | SVGElement).style;
  if (!style) return;
  cancelCleanup.get(el)?.();
  if (dx === 0 && dy === 0 && !animate) {
    clearInline(style);
    return;
  }
  const scale = parentScale(el);
  const x = dx / scale.x;
  const y = dy / scale.y;
  style.transition = animate ? `transform ${RETURN_MS}ms ease-out` : 'none';
  style.transform = x === 0 && y === 0 ? '' : `translate(${x}px, ${y}px)`;
  if (animate) scheduleCleanup(el, style);
}
